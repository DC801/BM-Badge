#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"
#include <algorithm>
#include <ranges>
#include <array>

#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#endif

void TileManager::DrawTile(uint16_t tilesetId, uint16_t tileId, const Point& tileDrawPoint, uint8_t flags) const
{
    auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
    auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tilesetId);

    // offset to the start address of the tile
    auto sourceTilePtr = ROM()->GetReadPointerByIndex<MagePixels>(tilesetId) + tileId * tileset->TileWidth * tileset->TileHeight;
    auto target = Rect{ tileDrawPoint, tileset->TileWidth, tileset->TileHeight };

    if (flags & RENDER_FLAGS_IS_GLITCHED)
    {
        target.origin.x += target.w * 0.125;
        target.w *= 0.75;
    }
    
    auto yMin = 0;
    auto yMax = target.h - 1;
    auto xMin = 0;
    auto xMax = target.w - 1;
    auto iteratorX = 1;
    auto iteratorY = 1;
    if (flags & RENDER_FLAGS_FLIP_X || flags & RENDER_FLAGS_FLIP_DIAG)
    {
       xMin = target.w - 1;
       xMax = 0;
       iteratorX = -1;
    }

    if (flags & RENDER_FLAGS_FLIP_Y || flags & RENDER_FLAGS_FLIP_DIAG)
    {
        yMin = target.h - 1;
        yMax = 0;
        iteratorY = -1;
    }

    for (auto y = yMin; y <= yMax; y += iteratorY)
    {
        for (auto x = xMin; x <= xMax; x += iteratorX)
        {
            const auto drawX = tileDrawPoint.x + x;
            const auto drawY = tileDrawPoint.y + y;
            // compute the source pixel offset from the sourceTilePtr pointer
            const auto& color = colorPalette->get(sourceTilePtr[tileset->ImageWidth * y + x]);
            if (drawX < 0 || drawX >= DrawWidth
             || drawY < 0 || drawY >= DrawHeight
             || TRANSPARENCY_COLOR == color)
            {
                continue;
            }
            frameBuffer->setPixel(drawX, drawY, (color >> 8) | (color << 8));
            // frameBuffer->(DrawWidth * drawY + drawX) = color;
        }
    }

    if (drawGeometry)
    {
        //frameBuffer->drawRect(Rect{ tileDrawPoint, tileset->TileWidth, tileset->TileHeight }, COLOR_RED);
        auto geometry = tileset->GetGeometryForTile(tileId);
        if (geometry)
        {
            auto geometryPoints = geometry->FlipByFlags(flags, tileset->TileWidth, tileset->TileHeight);
            for (auto i = 0; i < geometryPoints.size(); i++)
            {
                auto tileLinePointA = geometryPoints[i] + tileDrawPoint;
                auto tileLinePointB = geometryPoints[(i + 1) % geometryPoints.size()] + tileDrawPoint;

                frameBuffer->drawLine(tileLinePointA, tileLinePointB, COLOR_GREEN);
            }
        }
    }

}
