#include "mage_tileset.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageTileset::MageTileset(std::shared_ptr<EngineROM> ROM, uint32_t& offset)
   : ROM(ROM)
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
   ROM->GetPointerTo(globalGeometryIds, offset);

   if (!Valid())
   {
      ENGINE_PANIC(
         "Invalid Tileset detected!\n"
         "	Tileset address is: %d",
         offset
      );
   }
}
