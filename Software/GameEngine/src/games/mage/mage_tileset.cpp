#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"
#include "convert_endian.h"


void TileManager::DrawTile(const RenderableData* const renderableData, int32_t x, int32_t y) const
{
   auto tileset = ROM->Get<MageTileset>(renderableData->tilesetId);
   DrawTile(tileset, renderableData->tileId, x, y, renderableData->renderFlags);
}

void TileManager::DrawTile(const MageTileset* const tileset, uint16_t tileId, int32_t x, int32_t y, uint8_t flags) const
{
   auto colorPalette = ROM->Get<MageColorPalette>(tileId);
   auto address = ROM->GetAddress<MagePixels>(tileId);
   const MagePixels* pixels;
   ROM->GetReadPointerTo<MagePixels>(pixels, address);

   const auto targetRect = Rect{ 
      Point{x,y},
      tileset->TileWidth(),
      tileset->TileHeight() 
   };
   const auto sourcePoint = Point{
      tileId % tileset->Cols() * tileset->TileWidth(),
      tileId / tileset->Cols() * tileset->TileHeight()
   };

   frameBuffer->drawChunkWithFlags(*pixels, colorPalette, targetRect, sourcePoint, tileset->ImageWidth(), flags);
}