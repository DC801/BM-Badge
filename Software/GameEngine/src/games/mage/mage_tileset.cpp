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

    //auto target = Rect{ tileDrawPoint, tileset->TileWidth, tileset->TileHeight };

    //if (flags & RENDER_FLAGS_IS_GLITCHED)
    //{
    //    target.origin.x += target.w * 0.125;
    //    target.w *= 0.75;
    //}
    
    auto yMin = 0;
    auto yMax = tileset->ImageHeight - 1;
    auto xMin = 0;
    auto xMax = tileset->ImageWidth - 1;
    auto iteratorX = 1;
    auto iteratorY = 1;
    if (flags & RENDER_FLAGS_FLIP_X || flags & RENDER_FLAGS_FLIP_DIAG)
    {
       xMin = tileset->ImageWidth - 1;
       xMax = 0;
       iteratorX = -1;
    }

    if (flags & RENDER_FLAGS_FLIP_Y || flags & RENDER_FLAGS_FLIP_DIAG)
    {
        yMin = tileset->ImageHeight - 1;
        yMax = 0;
        iteratorY = -1;
    }

    // offset to the start address of the tile
    auto tilePtr = ROM()->GetReadPointerByIndex<MagePixels>(tilesetId) + tileId * tileset->TileWidth * tileset->TileHeight;
    auto sourceRowPtr = &tilePtr[0];

    for (auto ySource = yMin, yTarget = tileDrawPoint.y; 
        ySource != yMax; 
        ySource += iteratorY, yTarget++)
    {
        if (yTarget < 0 || yTarget >= DrawHeight)
        {
            continue;
        }

        for (auto xSource = xMin, xTarget = tileDrawPoint.x; 
            xSource != xMax;
            xSource += iteratorX, xTarget++)
        {
            const auto& sourceColorIndex = sourceRowPtr[xSource];
            const auto& color = colorPalette->get(sourceColorIndex);
            if (xTarget < 0 || xTarget >= DrawWidth || TRANSPARENCY_COLOR == color)
            {
                continue;
            }
            frameBuffer->frame[yTarget * DrawWidth + xTarget] = (color >> 8) | (color << 8);
            //frameBuffer->setPixel(xTarget, yTarget, color);
        }
        sourceRowPtr += tileset->ImageWidth;
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
