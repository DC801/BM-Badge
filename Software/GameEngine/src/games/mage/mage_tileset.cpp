#include "mage_tileset.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageTileset::MageTileset(std::shared_ptr<EngineROM> ROM, uint8_t index, uint32_t address)
   : ROM(ROM), offset(address)
{
#ifndef DC801_EMBEDDED
   ROM->Read(name, offset, TILESET_NAME_SIZE);
#else
   offset += TILESET_NAME_SIZE;
#endif

   ROM->Read(&imageId, offset);
   ROM->Read(&imageWidth, offset);
   ROM->Read(&imageHeight, offset);
   ROM->Read(&tileWidth, offset);
   ROM->Read(&tileHeight, offset);
   ROM->Read(&cols, offset);
   ROM->Read(&rows, offset);
   offset += sizeof(uint16_t); // u2 padding before the geometry IDs

   if (!Valid())
   {
      ENGINE_PANIC(
         "Invalid Tileset detected!\n"
         "	Tileset index is: %d\n"
         "	Tileset address is: %d",
         index,
         address
      );
   }
}


uint16_t MageTileset::getLocalGeometryIdByTileIndex(uint16_t tileIndex) const
{
   uint16_t globalGeometryId = 0;
   auto geometryAddress = offset + tileIndex * sizeof(globalGeometryId);
   ROM->Read(&globalGeometryId, geometryAddress);
   globalGeometryId = ROM_ENDIAN_U2_VALUE(globalGeometryId);
   return globalGeometryId;
}
