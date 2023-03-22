#include "mage_tileset.h"
#include "mage_portrait.h"
#include "EnginePanic.h"
#include "convert_endian.h"

void TileManager::DrawTile(const RenderableData& renderableData, const Point& cameraPosition, uint16_t geometryId) const
{
    auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(renderableData.tilesetId);
    auto tileDrawPoint = renderableData.origin - cameraPosition;
    DrawTile(renderableData.tilesetId, renderableData.tileId, tileDrawPoint, renderableData.renderFlags);

    if (drawGeometry)
    {
        //frameBuffer->drawRect(Rect{ renderableData.hitBox.origin - cameraPosition, renderableData.hitBox.w, renderableData.hitBox.h }, COLOR_ORANGE);

        if (geometryId)
        {
            auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(geometryId);

            auto geometryPoints = geometry->FlipByFlags(renderableData.renderFlags, tileset->TileWidth, tileset->TileHeight);
            for (auto i = 0; i < geometryPoints.size(); i++)
            {
                auto tileLinePointA = geometryPoints[i] - cameraPosition;
                auto tileLinePointB = geometryPoints[(i + 1) % geometryPoints.size()] - cameraPosition;

                frameBuffer->drawLine(tileLinePointA, tileLinePointB, COLOR_GREEN);
            }
        }
    }
}

void TileManager::DrawTile(uint16_t tilesetId, uint16_t tileId, const Point& tileDrawPoint, uint8_t flags) const
{
    auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
    auto pixels = ROM()->GetReadPointerByIndex<MagePixels>(tilesetId);
    auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tilesetId);

    pixels += tileId * tileset->TileWidth * tileset->TileHeight;

    frameBuffer->drawChunkWithFlags(pixels, colorPalette, Rect{ tileDrawPoint, tileset->TileWidth, tileset->TileHeight }, tileset->ImageWidth, flags);

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
