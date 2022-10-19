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

   ROM->Read(imageId, offset);
   ROM->Read(imageWidth, offset);
   ROM->Read(imageHeight, offset);
   ROM->Read(tileWidth, offset);
   ROM->Read(tileHeight, offset);
   ROM->Read(cols, offset);
   ROM->Read(rows, offset);
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

TileManager::TileManager(std::shared_ptr<FrameBuffer> frameBuffer, std::shared_ptr<EngineROM> ROM, const MageHeader& tilesetHeader, const MageHeader& colorPaletteHeader, const MageHeader& imageHeader)
   : frameBuffer(frameBuffer), ROM(ROM), tilesetHeader(tilesetHeader), colorPaletteHeader(colorPaletteHeader), imageHeader(imageHeader)
{
   for (uint32_t i = 0; i < colorPaletteHeader.count(); i++)
   {
      auto colorPaletteOffset = colorPaletteHeader.offset(i);
      colorPalettes.push_back(MageColorPalette{ ROM, colorPaletteOffset });
   }
}

void TileManager::DrawTile(const MageTileset* tileset, const MageMapTile* tile, int32_t x, int32_t y, uint8_t flags) const
{
   frameBuffer->drawChunkWithFlags(
      imageHeader.offset(tileset->ImageId()),
      getColorPalette(tileset->ImageId()),
      x, y,
      tileset->TileWidth(),
      tileset->TileHeight(),
      tile->tileId % tileset->Cols() * tileset->TileWidth(),
      tile->tileId / tileset->Cols() * tileset->TileHeight(),
      tileset->ImageWidth(),
      flags
   );
}