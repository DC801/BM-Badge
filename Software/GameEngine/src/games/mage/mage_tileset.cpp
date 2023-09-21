#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"
#include <algorithm>
#include <ranges>
#include <array>

#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#endif

void TileManager::DrawTile(uint16_t tilesetId, uint16_t tileId, const EntityPoint& tileDrawPoint, uint8_t flags) const
{
    auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
    auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tilesetId);

    auto ySourceMin = uint16_t{0};
    auto ySourceMax = uint16_t{tileset->TileHeight};
    auto xSourceMin = uint16_t{0};
    auto xSourceMax = uint16_t{tileset->TileWidth};
    auto iteratorX =  int{1};
    auto iteratorY =  int{1};

    if (flags & RENDER_FLAGS_FLIP_X || flags & RENDER_FLAGS_FLIP_DIAG)
    {
       xSourceMin = tileset->TileWidth - 1;
       xSourceMax = -1;
       iteratorX = -1;
    }

    if (flags & RENDER_FLAGS_FLIP_Y || flags & RENDER_FLAGS_FLIP_DIAG)
    {
        ySourceMin = tileset->TileHeight - 1;
        ySourceMax = -1;
        iteratorY = -1;
    }

    //auto target = Rect{ tileDrawPoint, tileset->TileWidth, tileset->TileHeight };

    //if (flags & RENDER_FLAGS_IS_GLITCHED)
    //{
    //    target.origin.x += target.w * 0.125;
    //    target.w *= 0.75;
    //}
    if (tileDrawPoint.y + tileset->TileHeight < 0 || tileDrawPoint.x + tileset->TileWidth < 0
        || tileDrawPoint.y >= DrawHeight || tileDrawPoint.x >= DrawWidth)
    {
        return;
    }

    // offset to the start address of the tile
    auto tilePtr = ROM()->GetReadPointerByIndex<MagePixels>(tilesetId) + tileId * tileset->TileWidth * tileset->TileHeight;

    for (auto yTarget = tileDrawPoint.y; 
        ySourceMin != ySourceMax;
        ySourceMin += iteratorY, yTarget++)
    {
        auto sourceRowPtr = &tilePtr[ySourceMin * tileset->TileWidth];
        
        if (yTarget < 0 || yTarget >= DrawHeight)
        {
            continue;
        }

        for (auto xSource = xSourceMin, xTarget = tileDrawPoint.x;
            xSource != xSourceMax;
            xSource += iteratorX, xTarget++)
        {
            if (xTarget < 0 || xTarget >= DrawWidth)
            {
                continue;
            }

            const auto& sourceColorIndex = sourceRowPtr[xSource];
            const auto color = colorPalette->get(sourceColorIndex);

            frameBuffer->setPixel(xTarget, yTarget, color);
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
