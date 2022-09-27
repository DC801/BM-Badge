#include "mage_tileset.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageTileset::MageTileset(std::shared_ptr<EngineROM> ROM, uint8_t index, uint32_t address)
   : ROM(ROM), offset(address)
{
#ifndef DC801_EMBEDDED
   ROM->Read(
      offset,
      16,
      (uint8_t*)name
   );
#endif

   offset += TILESET_NAME_SIZE;

   ROM->Read(
      offset,
      sizeof(imageId),
      (uint8_t*)&imageId
   );
   imageId = ROM_ENDIAN_U2_VALUE(imageId);
   offset += sizeof(imageId);

   ROM->Read(
      offset,
      sizeof(imageWidth),
      (uint8_t*)&imageWidth
   );
   imageWidth = ROM_ENDIAN_U2_VALUE(imageWidth);
   offset += sizeof(imageWidth);

   ROM->Read(
      offset,
      sizeof(imageHeight),
      (uint8_t*)&imageHeight
   );
   imageHeight = ROM_ENDIAN_U2_VALUE(imageHeight);
   offset += sizeof(imageHeight);

   ROM->Read(
      offset,
      sizeof(tileWidth),
      (uint8_t*)&tileWidth
   );
   tileWidth = ROM_ENDIAN_U2_VALUE(tileWidth);
   offset += sizeof(tileWidth);

   ROM->Read(
      offset,
      sizeof(tileHeight),
      (uint8_t*)&tileHeight
   );
   tileHeight = ROM_ENDIAN_U2_VALUE(tileHeight);
   offset += sizeof(tileHeight);

   ROM->Read(
      offset,
      sizeof(cols),
      (uint8_t*)&cols
   );
   cols = ROM_ENDIAN_U2_VALUE(cols);
   offset += sizeof(cols);

   ROM->Read(
      offset,
      sizeof(rows),
      (uint8_t*)&rows
   );
   rows = ROM_ENDIAN_U2_VALUE(rows);
   offset += sizeof(rows);

   offset += sizeof(uint16_t); // u2 padding before the geometry IDs

   if (!Valid())
   {
      char errorString[256] = "";
      sprintf(
         errorString,
         "Invalid Tileset detected!\n"
         "	Tileset index is: %d\n"
         "	Tileset address is: %d",
         index,
         address
      );
      ENGINE_PANIC(errorString);
   }
}


uint16_t MageTileset::getLocalGeometryIdByTileIndex(uint16_t tileIndex) const
{
   uint16_t globalGeometryId = 0;
   ROM->Read(
      offset + tileIndex * sizeof(globalGeometryId),
      sizeof(globalGeometryId),
      (uint8_t*)&globalGeometryId
   );
   globalGeometryId = ROM_ENDIAN_U2_VALUE(globalGeometryId);
   return globalGeometryId;
}
