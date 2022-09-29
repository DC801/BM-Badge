/*
This class contains the MageMap class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_defines.h"
#include "mage_entity_type.h"
#include "EngineROM.h"

#include <array>
#include <vector>

class MageMap
{
   friend class MageGameControl;
   friend class MageScriptControl;
   friend class MageHexEditor;
public:
   MageMap(std::shared_ptr<EngineROM> ROM, uint32_t& address, MageHeader mapHeader, MageHeader entityHeader) noexcept
      : ROM(ROM), mapHeader(std::move(mapHeader)), entityHeader(std::move(entityHeader))
      {}

   //this takes map data by index and fills all the variables in the map object:
   /*void PopulateMapData(uint16_t index);*/
   void LoadMap(uint16_t index);
   void DrawEntities(MageGameEngine* engine);

   std::string Name() const { return std::string(name); }
   constexpr uint16_t TileWidth() const { return tileWidth; }
   constexpr uint16_t TileHeight() const { return tileHeight; }
   constexpr uint16_t Cols() const { return cols; }
   constexpr uint16_t Rows() const { return rows; }
   constexpr uint8_t LayerCount() const { return layerCount; }
   constexpr uint8_t FilteredEntityCount() const { return filteredEntityCountOnThisMap; }
   constexpr uint16_t GeometryCount() const { return geometryCount; }
   constexpr uint16_t ScriptCount() const { return scriptCount; }



   uint16_t getGlobalEntityId(uint16_t mapLocalEntityId) const
   {
      if (entityGlobalIds.empty()) return 0;
      return entityGlobalIds[mapLocalEntityId % entityGlobalIds.size()];
   }

   uint16_t getGlobalGeometryId(uint16_t mapLocalGeometryId) const
   {
      if (geometryGlobalIds.empty()) return 0;
      return geometryGlobalIds[mapLocalGeometryId % geometryGlobalIds.size()];
   }

   uint16_t getGlobalScriptAddress(uint16_t mapLocalScriptId) const
   {
      if (scriptGlobalIds.empty()) { return 0; }
      return scriptGlobalIds[mapLocalScriptId % scriptGlobalIds.size()];
   }

   uint8_t getFilteredEntityId(uint8_t mapLocalEntityId) const
   {
      if (entityCount == 0) { return 0; }
      return filteredMapLocalEntityIds[mapLocalEntityId % entityCount];
   }

   uint8_t getMapLocalEntityId(uint8_t filteredEntityId) const
   {
      if (filteredEntityCountOnThisMap == 0) { return 0; }
      return mapLocalEntityIds[filteredEntityId % filteredEntityCountOnThisMap];
   }

   uint32_t LayerOffset(uint16_t num) const
   {
      if (mapLayerOffsets.empty() || num >= layerCount) { return 0; }

      return mapLayerOffsets[num];
   }

   std::string getDirectionNames() const
   {
      std::string result = "";
      for (auto& goDirection : goDirections)
      {
         result += "\t";
         result += goDirection.name;
      }
      return result;
   }

   uint16_t getDirectionScriptId(const std::string directionName) const
   {
      uint16_t result = 0;
      for (auto& direction : goDirections)
      {
         if (direction.name == directionName)
         {
            result = direction.mapLocalScriptId;
            break;
         }
      }
      return result;
   }

   constexpr uint8_t getPlayerEntityIndex() const { return playerEntityIndex; }
   constexpr uint16_t GetOnLoad() const { return onLoad; }
   constexpr uint16_t GetOnLook() const { return onLook; }
   constexpr uint16_t GetOnTick() const { return onTick; }
   constexpr void SetOnLook(uint16_t lookId) { onLook = lookId; }
   constexpr void SetOnTick(uint16_t tickId) { onTick = tickId; }
private:
   std::shared_ptr<EngineROM> ROM;
   MageHeader mapHeader;
   MageHeader entityHeader;

   bool isEntityDebugOn{ false };
   //this is the hackable array of entities that are on the current map
   //the data contained within is the data that can be hacked in the hex editor.
   std::array<MageEntity, MAX_ENTITIES_PER_MAP> entities{  };

   struct GoDirection
   {
      const char name[MAP_GO_DIRECTION_NAME_LENGTH]{ 0 };
      uint16_t mapLocalScriptId{ 0 };
      uint16_t padding{ 0 };
   };

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
   uint8_t layerCount{ 0 };
   uint8_t playerEntityIndex{ 0 };
   uint16_t entityCount{ 0 };
   uint16_t geometryCount{ 0 };
   uint16_t scriptCount{ 0 };
   std::vector<uint16_t> entityGlobalIds;
   std::vector<uint16_t> geometryGlobalIds;
   std::vector<uint16_t> scriptGlobalIds;
   std::vector<GoDirection> goDirections;
   std::vector<uint32_t> mapLayerOffsets;
   uint8_t filteredEntityCountOnThisMap{ 0 };

}; //class MageMap

#endif //_MAGE_MAP_H
