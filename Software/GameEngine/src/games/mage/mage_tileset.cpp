#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"
#include "convert_endian.h"


MageTileset::MageTileset(uint32_t& offset)
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

void TileManager::DrawTile(const RenderableData* renderableData, int32_t x, int32_t y) const
{
   const auto tileset = ROM->Get<MageTileset>(renderableData->tilesetId);
   auto tileAddress = ROM->GetAddress<MageMapTile>(tileset->ImageId()) + renderableData->tileId * sizeof(MageMapTile);
   const MageMapTile* tile;
   ROM->GetPointerTo(tile, tileAddress);
   DrawTile(tileset, tile, x, y, renderableData->renderFlags);
}

void TileManager::DrawTile(const MageTileset* tileset, const MageMapTile* tile, int32_t x, int32_t y, uint8_t flags) const
{
   //TODO FIXME:
   auto imageBase = 0;// imageHeader.offset(tileset->ImageId());

   //auto offset = colorPaletteHeader.offset(tileset->ImageId());
   const MageColorPalette* colorPalette = ROM->Get<MageColorPalette>(tileset->ImageId());
   //ROM->GetPointerTo(colorPalette, offset);

   const auto targetRect = Rect{ 
      Point{x,y},
      tileset->TileWidth(),
      tileset->TileHeight() 
   };
   const auto sourcePoint = Point{
      tile->tileId % tileset->Cols() * tileset->TileWidth(),
      tile->tileId / tileset->Cols() * tileset->TileHeight()
   };

   frameBuffer->drawChunkWithFlags(imageBase, colorPalette, targetRect, sourcePoint, tileset->ImageWidth(), flags);
}