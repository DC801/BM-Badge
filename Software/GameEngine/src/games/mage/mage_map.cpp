#include "mage_map.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "convert_endian.h"
#include "shim_err.h"

MageMap::MageMap(std::shared_ptr<EngineROM> ROM, uint32_t address)
   : ROM(ROM)
{
   uint32_t size = 0;
   uint32_t tilesPerLayer = 0;

   // Read name
   ROM->Read(
      address,
      16,
      (uint8_t*)name,
      "Failed to read Map property 'name'"
   );
   name[16] = 0; // Null terminate
   address += 16;

   //read tileWidth
   ROM->Read(
      address,
      sizeof(tileWidth),
      (uint8_t*)&tileWidth,
      "Failed to read Map property 'tileWidth'"
   );
   tileWidth = ROM_ENDIAN_U2_VALUE(tileWidth);
   address += sizeof(tileWidth);

   //read tileHeight
   ROM->Read(
      address,
      sizeof(tileHeight),
      (uint8_t*)&tileHeight,
      "Failed to read Map property 'tileHeight'"
   );
   tileHeight = ROM_ENDIAN_U2_VALUE(tileHeight);
   address += sizeof(tileHeight);

   //read cols
   ROM->Read(
      address,
      sizeof(cols),
      (uint8_t*)&cols,
      "Failed to read Map property 'cols'"
   );
   cols = ROM_ENDIAN_U2_VALUE(cols);
   address += sizeof(cols);

   //read rows
   ROM->Read(
      address,
      sizeof(rows),
      (uint8_t*)&rows,
      "Failed to read Map property 'rows'"
   );
   rows = ROM_ENDIAN_U2_VALUE(rows);
   address += sizeof(rows);
   tilesPerLayer = cols * rows;

   //read onLoad
   ROM->Read(
      address,
      sizeof(onLoad),
      (uint8_t*)&onLoad,
      "Failed to read Map property 'onLoad'"
   );
   onLoad = ROM_ENDIAN_U2_VALUE(onLoad);
   address += sizeof(onLoad);

   //read onTick
   ROM->Read(
      address,
      sizeof(onTick),
      (uint8_t*)&onTick,
      "Failed to read Map property 'onTick'"
   );
   onTick = ROM_ENDIAN_U2_VALUE(onTick);
   address += sizeof(onTick);

   //read onLook
   ROM->Read(
      address,
      sizeof(onLook),
      (uint8_t*)&onLook,
      "Failed to read Map property 'onLook'"
   );
   onLook = ROM_ENDIAN_U2_VALUE(onLook);
   address += sizeof(onLook);

   //read layerCount
   ROM->Read(
      address,
      sizeof(layerCount),
      &layerCount,
      "Failed to read Map property 'layerCount'"
   );
   address += sizeof(layerCount);

   //read playerEntityIndex
   ROM->Read(
      address,
      sizeof(playerEntityIndex),
      &playerEntityIndex,
      "Failed to read Map property 'playerEntityIndex'"
   );
   address += sizeof(playerEntityIndex);

   //read entityCount
   ROM->Read(
      address,
      sizeof(entityCount),
      (uint8_t*)&entityCount,
      "Failed to read Map property 'entityCount'"
   );
   entityCount = ROM_ENDIAN_U2_VALUE(entityCount);
   address += sizeof(entityCount);

   //read geometryCount
   ROM->Read(
      address,
      sizeof(geometryCount),
      (uint8_t*)&geometryCount,
      "Failed to read Map property 'geometryCount'"
   );
   geometryCount = ROM_ENDIAN_U2_VALUE(geometryCount);
   address += sizeof(geometryCount);

   //read scriptCount
   ROM->Read(
      address,
      sizeof(scriptCount),
      (uint8_t*)&scriptCount,
      "Failed to read Map property 'scriptCount'"
   );
   scriptCount = ROM_ENDIAN_U2_VALUE(scriptCount);
   address += sizeof(scriptCount);

   uint8_t goDirectionCount{ 0 };
   //read goDirectionCount
   ROM->Read(
      address,
      sizeof(goDirectionCount),
      (uint8_t*)&goDirectionCount,
      "Failed to read Map property 'goDirectionCount'"
   );
   address += sizeof(goDirectionCount);

   address += sizeof(uint8_t); // padding

   //read entityGlobalIds
   entityGlobalIds = std::vector<uint16_t>{ entityCount };
   size = sizeof(uint16_t) * entityCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)entityGlobalIds.data(),
      "Failed to read Map property 'entityGlobalIds'"
   );
   ROM_ENDIAN_U2_BUFFER(entityGlobalIds.data(), entityCount);
   address += size;

   //read geometryGlobalIds
   geometryGlobalIds = std::vector<uint16_t>{ geometryCount };
   size = sizeof(uint16_t) * geometryCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)geometryGlobalIds.data(),
      "Failed to read Map property 'geometryGlobalIds'"
   );
   ROM_ENDIAN_U2_BUFFER(geometryGlobalIds.data(), geometryCount);
   address += size;

   //read entityGlobalIds
   scriptGlobalIds = std::vector<uint16_t>{ scriptCount };
   size = sizeof(uint16_t) * scriptCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)scriptGlobalIds.data(),
      "Failed to read Map property 'scriptGlobalIds'"
   );
   ROM_ENDIAN_U2_BUFFER(scriptGlobalIds.data(), scriptCount);
   address += size;

   //read goDirections
   goDirections = std::vector<GoDirection>{ goDirectionCount };
   size = sizeof(GoDirection) * goDirectionCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)goDirections.data(),
      "Failed to read Map property 'goDirections'"
   );
   for (int i = 0; i < goDirectionCount; ++i)
   {
      UNUSED_RETURN_VALUE(
         ROM_ENDIAN_U2_VALUE(&goDirections[i].mapLocalScriptId)
      );

   }
   address += size;

   //padding to align with uint32_t memory spacing:
   if ((entityCount + geometryCount + scriptCount) % 2)
   {
      address += sizeof(uint16_t); // Padding
   }

   mapLayerOffsets = std::vector<uint32_t>(layerCount);

   for (uint32_t i = 0; i < layerCount; i++)
   {
      mapLayerOffsets[i] = address;
      address += tilesPerLayer * (sizeof(uint16_t) + (2 * sizeof(uint8_t)));
   }

   return;
}


uint16_t MageMap::getGlobalEntityId(uint16_t mapLocalEntityId) const
{
   if (entityGlobalIds.empty()) return 0;
   return entityGlobalIds[mapLocalEntityId % entityCount];
}

uint16_t MageMap::getGlobalGeometryId(uint16_t mapLocalGeometryId) const
{
   if (geometryGlobalIds.empty()) return 0;
   return geometryGlobalIds[mapLocalGeometryId % geometryCount];
}

uint16_t MageMap::getGlobalScriptId(uint16_t mapLocalScriptId) const
{
   if (scriptGlobalIds.empty()) return 0;
   return scriptGlobalIds[mapLocalScriptId % scriptCount];
}

std::string MageMap::getDirectionNames() const
{
   std::string result = "";
   for (auto& goDirection : goDirections)
   {
      result += "\t";
      result += goDirection.name;
   }
   return result;
}

uint16_t MageMap::getDirectionScriptId(const std::string directionName) const
{
   uint16_t result = 0;
   for (auto& direction : goDirections)
   {
      if (!strcmp(direction.name, directionName.c_str()))
      {
         result = direction.mapLocalScriptId;
         break;
      }
   }
   return result;
}

uint32_t MageMap::LayerOffset(uint16_t num) const
{
   if (mapLayerOffsets.empty()) return 0;

   if (layerCount > num)
   {
      return mapLayerOffsets[num];
   }

   return 0;
}

uint8_t MageMap::getPlayerEntityIndex()
{
   return playerEntityIndex;
}
