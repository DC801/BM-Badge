/*
This class contains the MageMap class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage.h"
#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_entity_type.h"
#include "mage_header.h"
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

class MageMap
{
   friend class MageGameControl;
   friend class MageScriptControl;
   friend class MageHexEditor;
public:
   MageMap(std::shared_ptr<EngineROM> ROM, 
      std::shared_ptr<FrameBuffer> frameBuffer, 
      uint32_t& address, 
      const MageHeader& mapHeader, 
      const MageHeader& geometryHeader, 
      const MageHeader& entityHeader, 
      const MageHeader& scriptHeader) noexcept
      : ROM(ROM), 
      frameBuffer(frameBuffer), 
      mapHeader(mapHeader),
      geometryHeader(geometryHeader),
      entityHeader(entityHeader), 
      scriptHeader(scriptHeader)
      {}

   //this takes map data by index and fills all the variables in the map object:
   /*void PopulateMapData(uint16_t index);*/
   void Load(uint16_t index);
   void Draw(MageGameControl* gameControl, uint8_t layer, const MageCamera& camera, bool isCollisionDebugOn=false);
   void DrawGeometry(const MageCamera& camera);
   void DrawEntities(MageGameEngine* engine);

   std::string Name() const { return std::string(name); }
   uint16_t TileWidth() const { return tileWidth; }
   uint16_t TileHeight() const { return tileHeight; }
   uint16_t Cols() const { return cols; }
   uint16_t Rows() const { return rows; }
   uint8_t LayerCount() const { return mapLayerOffsets.size(); }
   uint8_t FilteredEntityCount() const { return filteredEntityCountOnThisMap; }
   uint16_t GeometryCount() const { return geometryGlobalIds.size(); }
   uint16_t ScriptCount() const { return scriptGlobalIds.size(); }

   uint16_t getGlobalEntityId(uint16_t mapLocalEntityId) const
   {
      if (entities.empty()) { return 0; }
      return entityGlobalIds[mapLocalEntityId % entities.size()];
   }

   uint16_t getGlobalGeometryId(uint16_t mapLocalGeometryId) const
   {
      if (geometryGlobalIds.empty()) { return 0; }
      return geometryGlobalIds[mapLocalGeometryId % geometryGlobalIds.size()];
   }

   uint16_t getGlobalScriptAddress(uint16_t mapLocalScriptId) const
   {
      auto scriptId = scriptGlobalIds.empty() ? mapLocalScriptId % scriptGlobalIds.size() : 0;
      return scriptHeader.offset(scriptGlobalIds[scriptId]);
   }

   const MageEntity* getPlayerEntity() const
   {
      return &entities[playerEntityIndex];
   }

   const MageEntity* getEntity(uint16_t id) const
   {
      return &entities[id];
   }

   MageEntity* getEntity(uint16_t id)
   {
      return &entities[id];
   }

   uint8_t getFilteredEntityId(uint8_t mapLocalEntityId) const
   {
      if (!filteredMapLocalEntityIds) { return 0; }
      return filteredMapLocalEntityIds[mapLocalEntityId % MAX_ENTITIES_PER_MAP];
   }

   uint8_t getMapLocalEntityId(uint8_t filteredEntityId) const
   {
      if (filteredEntityCountOnThisMap == 0) { return 0; }
      return mapLocalEntityIds[filteredEntityId % filteredEntityCountOnThisMap];
   }

   uint32_t LayerOffset(uint16_t num) const
   {
      if (mapLayerOffsets.empty()) { return 0; }

      return mapLayerOffsets[num % mapLayerOffsets.size()];
   }

   std::string getDirectionNames() const
   {
      std::string result = "";
      for (auto i = 0; i < goDirections.size(); i++)
      {
         result += "\t";
         result += goDirections[i].name;
      }
      return result;
   }

   uint16_t getDirectionScriptId(const std::string directionName) const
   {
      for (auto i = 0; i < goDirections.size(); i++)
      {
         if (goDirections[i].name == directionName)
         {
            return goDirections[i].mapLocalScriptId;
         }
      }
      return 0;
   }

   constexpr uint8_t getPlayerEntityIndex() const { return playerEntityIndex; }
   constexpr uint16_t GetOnLoad() const { return onLoad; }
   constexpr uint16_t GetOnLook() const { return onLook; }
   constexpr uint16_t GetOnTick() const { return onTick; }
   constexpr void SetOnLook(uint16_t lookId) { onLook = lookId; }
   constexpr void SetOnTick(uint16_t tickId) { onTick = tickId; }
private:
   std::shared_ptr<EngineROM> ROM;
   std::shared_ptr<FrameBuffer> frameBuffer;
   MageHeader mapHeader;
   MageHeader geometryHeader;
   MageHeader entityHeader;
   MageHeader scriptHeader;

   bool isEntityDebugOn{ false };
   //this is the hackable array of entities that are on the current map
   //the data contained within is the data that can be hacked in the hex editor.
   std::array<MageEntity, MAX_ENTITIES_PER_MAP> entities{  };

   uint8_t filteredMapLocalEntityIds[MAX_ENTITIES_PER_MAP]{ NO_PLAYER };
   uint8_t mapLocalEntityIds[MAX_ENTITIES_PER_MAP]{ NO_PLAYER };

   static const inline int MapNameLength = 16;
   char name[MapNameLength + 1]{ 0 };
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
   std::vector<uint32_t> mapLayerOffsets{};
   uint8_t filteredEntityCountOnThisMap{ 0 };

}; //class MageMap

#endif //_MAGE_MAP_H
