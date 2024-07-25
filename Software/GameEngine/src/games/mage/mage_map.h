/*
This class contains the MapControl class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include <array>
#include <functional>
#include <optional>
#include <span>
#include <tuple>
#include <utility>
#include <vector>

#include "FrameBuffer.h"
#include "EngineROM.h"
#include "mage_defines.h"
#include "mage_entity.h"
#include "mage_rom.h"
#include "mage_script_actions.h"
#include "mage_script_state.h"
#include "mage_script_control.h"
#include "shim_timer.h"

struct GoDirection
{
   const char name[MapGoDirectionNameLength]{ 0 };
   const uint16_t mapLocalScriptId{ 0 };
   const uint16_t padding{ 0 };
};

struct MapTile
{
   const uint16_t tileId{ 0 };
   const uint8_t tilesetId{ 0 };
   const uint8_t flags{ 0 };
};

struct MapLayers
{
   MapLayers() noexcept = default;
   //MapLayers(MapLayers& layers) noexcept = default;
   MapLayers(std::span<const MapTile>&& tiles, uint16_t layerSize) noexcept
      : tiles(std::move(tiles)),
      layerSize(layerSize)
   {}

   constexpr std::span<const MapTile> operator[](uint8_t i) const { return tiles.subspan(i * layerSize, layerSize); }

   std::span<const MapTile> tiles{};
   uint16_t layerSize{ 0 };

   constexpr auto size() const
   {
      return 1 + tiles.size() / layerSize;
   }

   auto begin() const
   {
      return (*this)[0];
   }

   auto end() const
   {
      return (*this)[size() - 1];
   }
};

struct MapData
{
   MapData(uint32_t& offset);
   static const inline int MapNameLength = 16;
   char name[MapNameLength]{ 0 };
   uint16_t tileWidth{ 0 };
   uint16_t tileHeight{ 0 };
   uint16_t cols{ 0 };
   uint16_t rows{ 0 };
   uint16_t onLoadScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t onLookScriptId{ 0 };
   uint8_t playerEntityIndex{ 0 };
   uint16_t entityCount{ 0 };
   uint16_t geometryCount{ 0 };
   uint16_t scriptCount{ 0 };
   uint8_t goDirectionsCount{ 0 };

   std::span<const uint16_t> entityGlobalIDs;
   std::span<const uint16_t> geometryGlobalIDs;
   std::span<const uint16_t> scriptGlobalIDs;
   std::span<const GoDirection> goDirections;
   MapLayers layers;
};

class MapControl
{
   friend class MageGameEngine;
   friend class MageScriptControl;
   friend class MageHexEditor;
public:  
   MapControl(std::shared_ptr<FrameBuffer> frameBuffer, int32_t initialMapId) noexcept
      : frameBuffer(frameBuffer), mapLoadId(initialMapId)
   {}

   inline uint8_t* GetEntityDataPointer() { return reinterpret_cast<uint8_t*>(entityDataArray.data()); }
   void Load();
   void DrawLayer(uint8_t layer) const;
   void DrawEntities() const;
   std::optional<uint16_t> Update();

   constexpr int16_t GetUsefulEntityIndexFromActionEntityId(uint8_t entityIndex, int16_t callingEntityId) const
   {
      if (entityIndex >= currentMap->entityCount && entityIndex != MAGE_MAP_ENTITY)
      {
         return NO_PLAYER_INDEX;
      }

      switch (entityIndex)
      {
      default:
      case MAGE_MAP_ENTITY:
         return entityIndex;

      case MAGE_ENTITY_SELF:
         return callingEntityId;

      case MAGE_ENTITY_PLAYER:
         return currentMap->playerEntityIndex;
      }
   }

   void Draw() const;

   [[nodiscard("This should always be part of a check that leads to map reload")]]
   inline bool ShouldReload() const { return mapLoadId != MAGE_NO_MAP; }
   inline std::string Name() const { return currentMap->name; }
   inline uint16_t TileWidth() const { return currentMap->tileWidth; }
   inline uint16_t TileHeight() const { return currentMap->tileHeight; }
   inline uint16_t Cols() const { return currentMap->cols; }
   inline uint16_t Rows() const { return currentMap->rows; }
   inline uint8_t LayerCount() const { return currentMap->layers.tiles.size() / currentMap->layers.layerSize; }
   inline uint8_t FilteredEntityCount() const { return currentMap->entityCount; }
   inline uint16_t GeometryCount() const { return currentMap->geometryCount; }
   inline uint16_t ScriptCount() const { return scripts.size(); }

   const MageGeometry* GetGeometry(uint16_t mapLocalGeometryId) const
   {
      if (currentMap->geometryCount == 0)
      {
         return nullptr;
      }
      return ROM()->GetReadPointerByIndex<MageGeometry>(currentMap->geometryGlobalIDs[mapLocalGeometryId % currentMap->geometryCount]);
   }

   inline EntityRect getPlayerInteractBox() const
   {
      const auto playerRenderableData = getPlayerRenderableData();
      static const uint16_t interactLength = playerRenderableData->hitBox.h / 2 + playerRenderableData->hitBox.w / 2;
      const auto direction = static_cast<MageEntityAnimationDirection>(getPlayerEntityData()->flags & RENDER_FLAGS_ENTITY_DIRECTION_MASK);
      return EntityRect{
            {
               uint16_t{
                  playerRenderableData->hitBox.origin.x
                  - playerRenderableData->hitBox.w / 2
                  - (direction == MageEntityAnimationDirection::WEST ? interactLength : 0u)
                  + (direction == MageEntityAnimationDirection::EAST ? interactLength : 0u)
               },
               uint16_t{
                  playerRenderableData->hitBox.origin.y
                  //- playerRenderableData->hitBox.h / 2
                  - (direction == MageEntityAnimationDirection::NORTH ? interactLength : 0u)
                  + (direction == MageEntityAnimationDirection::SOUTH ? interactLength : 0u)
               }
         },
         uint16_t(playerRenderableData->hitBox.w * 2),
         uint16_t(playerRenderableData->hitBox.h * 2)
      };
   }

   inline MageEntityData* getPlayerEntityData()
   {
      if (!currentMap
         || currentMap->playerEntityIndex == NO_PLAYER_INDEX
         || currentMap->playerEntityIndex >= currentMap->entityCount)
      {
         return nullptr;
      }
      return &Get<MageEntityData>(currentMap->playerEntityIndex);
   }

   inline RenderableData* getPlayerRenderableData()
   {
      if (!currentMap
         || currentMap->playerEntityIndex == NO_PLAYER_INDEX
         || currentMap->playerEntityIndex >= currentMap->entityCount)
      {
         return nullptr;
      }
      return &Get<RenderableData>(currentMap->playerEntityIndex);
   }

   inline const RenderableData& getRenderableDataByMapLocalId(uint16_t mapLocalId) const
   {
      return Get<RenderableData>(mapLocalId % currentMap->entityCount);
   }

   inline RenderableData& getRenderableDataByMapLocalId(uint16_t mapLocalId)
   {
      return Get<RenderableData>(mapLocalId % currentMap->entityCount);
   }

   std::string getDirectionNames() const
   {
      std::string result = "";
      for (auto& dir : currentMap->goDirections)
      {
         result += "\t";
         result += dir.name;
      }
      return result;
   }

   uint16_t getDirectionScriptId(const std::string directionName) const
   {
      for (auto& dir : currentMap->goDirections)
      {
         if (directionName == dir.name)
         {
            return dir.mapLocalScriptId;
         }
      }
      return 0;
   }

   inline uint8_t getPlayerEntityIndex() const { return currentMap->playerEntityIndex; }

   //this is used by the loadMap action to indicate when a new map needs to be loaded.
   //when set to a value other than MAGE_NO_MAP, it will cause all scripts to stop and 
   //the new map will be loaded at the beginning of the next tick
   int32_t mapLoadId{ MAGE_NO_MAP };

   template <typename T>
   constexpr T& Get(auto i)
   {
      return std::get<std::array<T, MAX_ENTITIES_PER_MAP>&>(entities)[i % currentMap->entityCount];
   }

   template <typename T>
   constexpr const T& Get(auto i) const
   {
      return std::get<std::array<T, MAX_ENTITIES_PER_MAP>&>(entities)[i % currentMap->entityCount];
   }

   template <typename T>
   std::span<T> GetAll()
   {
      return std::span<T>(std::get<std::array<T, MAX_ENTITIES_PER_MAP>&>(entities));
   }

   std::span<MageEntityData> GetEntities()
   {
      return entityDataArray;
   }

   void SetOnTick(uint16_t scriptId)
   {
      auto onTickScript = ROM()->GetReadPointerByIndex<MageScript>(scriptId);
      onTickScriptState = MageScriptState{ scriptId, onTickScript };
   }

   constexpr const MageScript* GetScript(uint16_t scriptIndex) const
   {
      if (scriptIndex > currentMap->scriptCount)
      {
         return nullptr;
      }
      return scripts[scriptIndex];
   }

   void OnTick(MageScriptControl* scriptControl);
   MageScriptState onLoadScriptState;
   MageScriptState onTickScriptState;

private:
      inline const RenderableData* getPlayerRenderableData() const
   {
      if (!currentMap
         || currentMap->playerEntityIndex == NO_PLAYER_INDEX
         || currentMap->playerEntityIndex >= currentMap->entityCount)
      {
         return nullptr;
      }
      return &Get<RenderableData>(currentMap->playerEntityIndex);
   }

   inline const MageEntityData* getPlayerEntityData() const
   {
      if (!currentMap
         || currentMap->playerEntityIndex == NO_PLAYER_INDEX
         || currentMap->playerEntityIndex >= currentMap->entityCount)
      {
         return nullptr;
      }
      return &Get<MageEntityData>(currentMap->playerEntityIndex);
   }

   using EntityDataArray = std::array<MageEntityData, MAX_ENTITIES_PER_MAP>;
   using RenderableDataArray = std::array<RenderableData, MAX_ENTITIES_PER_MAP>;
   using OnTickArray = std::array<OnTickScript, MAX_ENTITIES_PER_MAP>;
   using OnInteractArray = std::array<OnInteractScript, MAX_ENTITIES_PER_MAP>;
   using OnLookArray = std::array<OnLookScript, MAX_ENTITIES_PER_MAP>;
   using EntityData = std::tuple<EntityDataArray&, RenderableDataArray&, OnTickArray&, OnInteractArray&, OnLookArray&>;

   std::shared_ptr<FrameBuffer> frameBuffer;

   std::optional<const MapData> currentMap;
   EntityDataArray entityDataArray{};
   RenderableDataArray renderableDataArray{};
   OnTickArray onTickScriptsArray;
   OnInteractArray onInteractScriptsArray{};
   OnLookArray onLookScriptsArray{};

   EntityData entities{ entityDataArray, renderableDataArray, onTickScriptsArray, onInteractScriptsArray, onLookScriptsArray };

   std::vector<const MageScript*> scripts{};
   bool playerIsMoving{ false };

}; //class MapControl

#endif //_MAGE_MAP_H
