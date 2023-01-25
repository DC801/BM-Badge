/*
This class contains the MapControl class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_rom.h"
#include "mage.h"
#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_entity_type.h"
#include "mage_tileset.h"
#include "EngineROM.h"

#include <array>
#include <vector>

struct GoDirection
{
   char name[MAP_GO_DIRECTION_NAME_LENGTH]{ 0 };
   uint16_t mapLocalScriptId{ 0 };
   uint16_t padding{ 0 };
};

struct MapData
{
   MapData(uint32_t& offset, bool isEntityDebugOn=false);
   static const inline int MapNameLength = 16;
   char name[MapNameLength]{ 0 };
   uint16_t tileWidth{ 0 };
   uint16_t tileHeight{ 0 };
   uint16_t cols{ 0 };
   uint16_t rows{ 0 };
   uint16_t onLoad{ 0 };
   uint16_t onTick{ 0 };
   uint16_t onLook{ 0 };
   uint8_t playerEntityIndex{ 0 };
   std::vector<uint16_t> entityGlobalIds{};
   std::vector<uint16_t> geometryGlobalIds{};
   std::vector<uint16_t> scriptGlobalIds{};
   std::vector<GoDirection> goDirections{};
   std::vector<uint32_t> layerAddresses{};
   std::vector<MageEntity> entities{};
};

struct MageMapTile
{
   uint16_t tileId{ 0 };
   uint8_t tilesetId{ 0 };
   uint8_t flags{ 0 };
};

class MapControl
{
   friend class MageGameEngine;
   friend class MageScriptControl;
   friend class MageHexEditor;
public:
   MapControl(std::shared_ptr<FrameBuffer> frameBuffer, 
      std::shared_ptr<TileManager> tileManager) noexcept
      : frameBuffer(frameBuffer), 
      tileManager(tileManager)
   { }

   uint8_t* GetEntityDataPointer() { return (uint8_t*) currentMap->entities.data(); }
   void Load(uint16_t index, bool isCollisionDebugOn=false, bool isEntityDebugOn=false);
   void Draw(uint8_t layer, const Point& cameraPosition, bool isCollisionDebugOn=false) const;
   void DrawGeometry(const Point& cameraPosition) const;
   void DrawEntities(const Point& cameraPosition, bool isCollisionDebugOn = false) const;

   void UpdateEntities(uint32_t deltaTime);
   
   int16_t GetUsefulEntityIndexFromActionEntityId(uint8_t entityIndex, int16_t callingEntityId) const
   {
      if (entityIndex >= currentMap->entities.size())
      {
         return NO_PLAYER;
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

   std::string Name() const { return currentMap->name; }
   uint16_t TileWidth() const { return currentMap->tileWidth; }
   uint16_t TileHeight() const { return currentMap->tileHeight; }
   uint16_t Cols() const { return currentMap->cols; }
   uint16_t Rows() const { return currentMap->rows; }
   uint8_t LayerCount() const { return currentMap->layerAddresses.size(); }
   uint8_t FilteredEntityCount() const { return currentMap->entities.size(); }
   uint16_t GeometryCount() const { return currentMap->geometryGlobalIds.size(); }
   uint16_t ScriptCount() const { return currentMap->scriptGlobalIds.size(); }

   uint16_t getGlobalEntityId(uint16_t mapLocalEntityId) const
   {
      if (currentMap->entities.empty()) { return 0; }
      return currentMap->entityGlobalIds[mapLocalEntityId % currentMap->entities.size()];
   }

   uint16_t getGlobalGeometryId(uint16_t mapLocalGeometryId) const
   {
      if (currentMap->geometryGlobalIds.empty()) { return 0; }
      return currentMap->geometryGlobalIds[mapLocalGeometryId % currentMap->geometryGlobalIds.size()];
   }

   const MageEntity* getPlayerEntity() const
   {
      return getEntity(currentMap->playerEntityIndex);
   }

   MageEntity* getPlayerEntity()
   {
      if (currentMap->entities.empty())
      {
         return nullptr;
      }
      return getEntity(currentMap->playerEntityIndex);
   }

   const MageEntity* getEntity(uint16_t id) const
   {
      return &currentMap->entities[id];
   }

   MageEntity* getEntity(uint16_t id)
   {
      return &currentMap->entities[id];
   }

   uint8_t getFilteredEntityId(uint8_t mapLocalEntityId) const
   {
      if (!filteredMapLocalEntityIds) { return 0; }
      return filteredMapLocalEntityIds[mapLocalEntityId % MAX_ENTITIES_PER_MAP];
   }

   const MageEntity* getEntityByMapLocalId(uint16_t mapLocalId) const
   {
      return &currentMap->entities[mapLocalId % currentMap->entities.size()];
   }

   MageEntity* getEntityByMapLocalId(uint16_t mapLocalId)
   {
      return &currentMap->entities[mapLocalId % currentMap->entities.size()];
   }

   uint32_t LayerAddress(uint16_t layerIndex) const
   {
      if (currentMap->layerAddresses.empty()) { return 0; }

      return currentMap->layerAddresses[layerIndex % currentMap->layerAddresses.size()];
   }

   std::string getDirectionNames() const
   {
      std::string result = "";
      for (auto i = 0; i < currentMap->goDirections.size(); i++)
      {
         result += "\t";
         result += currentMap->goDirections[i].name;
      }
      return result;
   }

   uint16_t getDirectionScriptId(const std::string directionName) const
   {
      for (auto i = 0; i < currentMap->goDirections.size(); i++)
      {
         if (currentMap->goDirections[i].name == directionName)
         {
            return currentMap->goDirections[i].mapLocalScriptId;
         }
      }
      return 0;
   }

   uint8_t getPlayerEntityIndex() const { return currentMap->playerEntityIndex; }
   uint16_t GetOnLoad() const { return currentMap->onLoad; }
   uint16_t GetOnLook() const { return currentMap->onLook; }
   uint16_t GetOnTick() const { return currentMap->onTick; }
   void SetOnLoad(uint16_t loadId) { currentMap->onLoad = loadId; }
   void SetOnLook(uint16_t lookId) { currentMap->onLook = lookId; }
   void SetOnTick(uint16_t tickId) { currentMap->onTick = tickId; }


   //this is used by the loadMap action to indicate when a new map needs to be loaded.
   //when set to a value other than MAGE_NO_MAP, it will cause all scripts to stop and 
   //the new map will be loaded at the beginning of the next tick
   int32_t mapLoadId{ MAGE_NO_MAP };
private:
   std::shared_ptr<FrameBuffer> frameBuffer;
   std::shared_ptr<TileManager> tileManager;
   std::unique_ptr<MapData> currentMap;

   bool isEntityDebugOn{ false };
   //this is the hackable array of entities that are on the current map
   //the data contained within is the data that can be hacked in the hex editor.
   //std::array<MageEntity, MAX_ENTITIES_PER_MAP> entities{  };

   uint8_t filteredMapLocalEntityIds[MAX_ENTITIES_PER_MAP]{ NO_PLAYER };
   uint8_t mapLocalEntityIds[MAX_ENTITIES_PER_MAP]{ NO_PLAYER };


}; //class MapControl

#endif //_MAGE_MAP_H
