#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"
#include "convert_endian.h"

void TileManager::DrawTile(const RenderableData& renderableData, uint16_t x, uint16_t y) const
{
   auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(renderableData.tilesetId);
   DrawTile(tileset, renderableData.tileId, x, y, renderableData.renderFlags);
}

void TileManager::DrawTile(const MageTileset* const tileset, uint16_t tileId, uint16_t x, uint16_t y, uint8_t flags) const
{
   auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tileId);
   auto pixels = ROM()->GetReadPointerByIndex<MagePixels>(tileset->ImageId);

   const auto targetRect = Rect{ 
      Point{x,y},
      tileset->TileWidth,
      tileset->TileHeight 
   };
   const auto sourcePoint = Point{
      uint16_t(tileId % tileset->Cols * tileset->TileWidth),
      uint16_t(tileId / tileset->Cols * tileset->TileHeight)
   };

   frameBuffer->drawChunkWithFlags(pixels, colorPalette, targetRect, sourcePoint, tileset->ImageWidth, flags);
}