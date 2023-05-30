#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"


void TileManager::DrawTile(uint16_t tilesetId, uint16_t tileId, const Point& tileDrawPoint, uint8_t flags) const
{
    auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
    auto pixels = ROM()->GetReadPointerByIndex<MagePixels>(tilesetId);
    auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tilesetId);

    pixels += tileId * tileset->TileWidth * tileset->TileHeight;
    auto target = Rect{ tileDrawPoint, tileset->TileWidth, tileset->TileHeight };

    if (flags & RENDER_FLAGS_IS_GLITCHED)
    {
        target.origin.x += target.w * 0.125;
        target.w *= 0.75;
    }

    // skip any chunks that aren't drawn to the frame buffer
    if (target.origin.x + target.w < 0 || target.origin.x >= DrawWidth
        || target.origin.y + target.h < 0 || target.origin.y >= DrawHeight)
    {
        return;
    }

    auto rowIterator = tileset->ImageWidth;
    auto colIterator = 1;
    auto rowStart = 0;
    auto rowEnd = tileset->ImageHeight - 1;
    auto colStart = 0;
    auto colEnd = tileset->ImageWidth - 1;

    auto rowIndexAdjustment = 0;
    auto colIndexAdjustment = 0;

    if (flags & RENDER_FLAGS_FLIP_X)
    {
        colIterator = -1;
        colStart = tileset->ImageWidth;
        colEnd = 0;
        colIndexAdjustment = -1;
    }
    if (flags & RENDER_FLAGS_FLIP_Y)
    {
        rowIterator = -tileset->ImageWidth;
        rowStart = tileset->ImageHeight;
        rowEnd = 0;
        rowIndexAdjustment = -1;
    }
    
    for (auto row = rowStart; row != rowEnd; row += rowIterator)
    {
        for (auto col = colStart; col != colEnd; col += colIterator)
        {
            const auto rowIndex = row + rowIndexAdjustment;
            const auto colIndex = col + colIndexAdjustment;
            // compute the source pixel offset from the pixels pointer
            const auto pixelIndex = rowIndex * tileset->ImageWidth + colIndex;
            const auto targetFrameBufferIndex = (target.origin.y + rowIndex) * DrawWidth + (target.origin.x + colIndex);
            const auto& color = colorPalette->get(pixels[pixelIndex]);
            frameBuffer->setPixel(targetFrameBufferIndex, color);
        }
    }

    // // draw to the target pixel by pixel, read from the source based on flags:
    // for (auto row = 0; row < target.h && row < DrawHeight; row++)
    // {
    //     // for a flip in the x-axis, get the last indexable column of the source
    //     auto pixelRow = (flags & RENDER_FLAGS_FLIP_X) ? tileset->ImageWidth - row - 1 : row;

    //     for (auto col = 0; col < target.w && col < DrawWidth; col++)
    //     {
    //         // for a flip in the y-axis, get the last indexable row of the source
    //         auto pixelCol = (flags & RENDER_FLAGS_FLIP_Y) ? tileset->ImageWidth - col - 1 : col;

    //         // compute the source pixel offset from the pixels pointer
    //         auto pixelIndex = (pixelRow * tileset->ImageWidth) + pixelCol;

    //         // use the pixels pointer to get the color from the palette
    //         const auto& color = (*colorPalette)[pixels[pixelIndex]];
    //         frameBuffer->drawPixel(target.origin.x + col, target.origin.y + row, color);
    //     }
    // }
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
