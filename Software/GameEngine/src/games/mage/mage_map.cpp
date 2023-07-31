#include "mage_map.h"
#include "EnginePanic.h"
#include <algorithm>
#include <numeric>
#include <vector>
#include "mage.h"
#include "shim_err.h"


#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#endif


void MapControl::Load(uint16_t index)
{
    currentMap = ROM()->InitializeRAMCopy<MapData>(index);
}

MapData::MapData(uint32_t& address)
{
    auto layerCount = uint8_t{ 0 };
    ROM()->Read(name, address, MapNameLength);
    ROM()->Read(tileWidth, address);
    ROM()->Read(tileHeight, address);
    ROM()->Read(cols, address);
    ROM()->Read(rows, address);
    ROM()->Read(onLoad, address);
    ROM()->Read(onTick, address);
    ROM()->Read(onLook, address);
    ROM()->Read(layerCount, address);
    ROM()->Read(playerEntityIndex, address);
    ROM()->Read(entityCount, address);
    ROM()->Read(geometryCount, address);
    ROM()->Read(scriptCount, address);
    ROM()->Read(goDirectionsCount, address);

    if (entityCount > MAX_ENTITIES_PER_MAP)
    {
        ENGINE_PANIC("Error: Game is attempting to load more than %d entities on one map", MAX_ENTITIES_PER_MAP);
    }

    address += sizeof(uint8_t); // padding for 4-byte alignment

    std::vector<uint16_t> entityGlobalIds{};
    std::vector<uint16_t> geometryGlobalIds{};
    std::vector<uint16_t> scriptGlobalIds{};
    ROM()->InitializeVectorFrom(entityGlobalIds, address, entityCount);
    ROM()->InitializeVectorFrom(geometryGlobalIds, address, geometryCount);
    ROM()->InitializeVectorFrom(scriptGlobalIds, address, scriptCount);
    ROM()->InitializeVectorFrom(goDirections, address, goDirectionsCount);


    //padding to align with uint32_t memory spacing:
    if ((entityCount + geometryCount + scriptCount) % 2)
    {
        address += sizeof(uint16_t);
    }

    for (auto i = 0; i < geometryCount; i++)
    {
        geometries.push_back(ROM()->GetReadPointerByIndex<MageGeometry>(geometryGlobalIds[i]));
    }

    for (auto i = 0; i < scriptCount; i++)
    {
        scripts.push_back(ROM()->GetReadPointerByIndex<MageScript>(scriptGlobalIds[i]));
    }

    for (auto i = 0; i < entityCount; i++)
    {
        auto entityAddress = ROM()->GetAddress<MageEntity>(entityGlobalIds[i]);
        ROM()->Read(entities[i], entityAddress);
    }

    for (auto i = 0; i < layerCount; i++)
    {
        auto layerAddress = address + i * rows * cols * sizeof(uint8_t*);
        layers.push_back(ROM()->GetReadPointerToAddress<MageMapTile>(layerAddress));
    }
}

void MapControl::DrawEntities(const Point& cameraPosition) const
{
    //sort entity indices by the entity y values:
    static std::vector<size_t> entityDrawOrder(currentMap->entityCount);
    std::iota(entityDrawOrder.begin(), entityDrawOrder.end(), 0);
    auto sortByY = [&](size_t i1, size_t i2) { return currentMap->entities[i1].y < currentMap->entities[i2].y; };
    std::stable_sort(entityDrawOrder.begin(), entityDrawOrder.end(), sortByY);

    //now that we've got a sorted array with the lowest y values first,
    //iterate through it and draw the entities one by one:
    for (auto& entityIndex : entityDrawOrder)
    {
        tileManager->DrawTile(currentMap->entityRenderableData[entityIndex], cameraPosition);
    }
}

void MapControl::DrawGeometry(const Point& camera) const
{
    bool isColliding = false;
    if (currentMap->playerEntityIndex != NO_PLAYER_INDEX)
    {
        auto playerPosition = currentMap->entityRenderableData[currentMap->playerEntityIndex].center;
        for (uint16_t i = 0; i < GeometryCount(); i++)
        {
            // auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(getGlobalGeometryId(i));
            // isColliding = geometry->isPointInGeometry(playerPosition);
            //geometry->draw(camera.x, camera.y, isColliding ? COLOR_RED : COLOR_GREEN);
        }
    }
}

void MapControl::DrawLayer(uint8_t layer, const Point& cameraPosition) const
{
    auto layerTiles = currentMap->layers[layer];
    for (auto mapTileRow = 0; mapTileRow < currentMap->rows; mapTileRow++)
    {
        for (auto mapTileCol = 0; mapTileCol < currentMap->cols; mapTileCol++)
        {
            auto tileIndex = mapTileCol + (mapTileRow * currentMap->cols);
            auto currentTile = &layerTiles[tileIndex];

            if (!currentTile->tileId) { continue; }

            auto tileDrawPoint = Point{ currentMap->tileWidth * mapTileCol, currentMap->tileHeight * mapTileRow } - cameraPosition;

            // don't draw tiles that are entirely outside the screen bounds
            if (tileDrawPoint.x + currentMap->tileWidth < 0 || tileDrawPoint.x >= DrawWidth
                || tileDrawPoint.y + currentMap->tileHeight < 0 || tileDrawPoint.y >= DrawHeight)
            {
                continue;
            }

            tileManager->DrawTile(currentTile->tilesetId, currentTile->tileId - 1, tileDrawPoint, currentTile->flags);
        }
    }
}

void MapControl::Draw(const Point& cameraPosition) const
{
    // always draw layer 0 
    DrawLayer(0, cameraPosition);

    //draw remaining map layers except the last one before drawing entities.
    for (uint8_t layerIndex = 1; layerIndex < LayerCount() - 1; layerIndex++)
    {
        DrawLayer(layerIndex, cameraPosition);
    }

    DrawEntities(cameraPosition);

    //draw the final layer above the entities only when there is more than one layer
    if (LayerCount() > 1)
    {
        DrawLayer(LayerCount() - 1, cameraPosition);
    }

    // we can fit up to 254 bytes in a single transfer window, each color is 2 bytes
    // if (tileset->ImageWidth * target.h * sizeof(uint16_t) <= 254)
    // {
    //    std::array<uint16_t, 254 / sizeof(uint16_t)> tileBuffer{0};
    //    for (auto i = 0; i < tileBuffer.size(); i++)
    //    {
    //       auto& color = colorPalette->get(sourceTilePtr[i]);
    //       if (color != TRANSPARENCY_COLOR)
    //       {
    //          tileBuffer[i] = color;
    //       }
    //    }

    // }
}

void MapControl::UpdateEntities(const DeltaState& delta)
{
    for (auto i = 0; i < currentMap->entityCount; i++)
    {
        auto& entity = currentMap->entities[i];
        auto& renderableData = currentMap->entityRenderableData[i];
        entity.updateRenderableData(renderableData, delta.TimeMs.count());
    }
}

void MapControl::TryMovePlayer(ButtonState button)
{
    auto& playerRenderableData = getPlayerEntityRenderableData();
    auto playerEntity = getPlayerEntity();
    if (playerEntity.has_value())
    {
        auto player = *playerEntity;
        auto playerVelocity = Point{ 0,0 };

        // moving when there's at least one button not being counteracted
        playerIsMoving = (
            (button.IsPressed(KeyPress::Ljoy_left) || button.IsPressed(KeyPress::Ljoy_right))
            && button.IsPressed(KeyPress::Ljoy_left) != button.IsPressed(KeyPress::Ljoy_right))
            || ((button.IsPressed(KeyPress::Ljoy_up) || button.IsPressed(KeyPress::Ljoy_down))
                && button.IsPressed(KeyPress::Ljoy_up) != button.IsPressed(KeyPress::Ljoy_down));

        if (playerIsMoving)
        {
            if (button.IsPressed(KeyPress::Ljoy_left))
            {
                playerVelocity.x -= playerSpeed;
                player->direction = WEST;
            }
            else if (button.IsPressed(KeyPress::Ljoy_right))
            {
                playerVelocity.x += playerSpeed;
                player->direction = EAST;
            }

            if (button.IsPressed(KeyPress::Ljoy_up))
            {
                playerVelocity.y -= playerSpeed;
                player->direction = NORTH;
            }
            else if (button.IsPressed(KeyPress::Ljoy_down))
            {
                playerVelocity.y += playerSpeed;
                player->direction = SOUTH;
            }

            Point preMovePoints[] = {
                playerRenderableData.hitBox.origin,
                playerRenderableData.hitBox.origin + Point{playerRenderableData.hitBox.w, 0},
                playerRenderableData.hitBox.origin + Point{0, playerRenderableData.hitBox.h},
                playerRenderableData.hitBox.origin + Point{playerRenderableData.hitBox.w, playerRenderableData.hitBox.h}
            };

            Point postMovePoints[] = {
                preMovePoints[0],
                preMovePoints[1],
                preMovePoints[2],
                preMovePoints[3]
            };

            auto getTileId = [&](const Point& p) { return p.x / currentMap->tileWidth + currentMap->cols * p.y / currentMap->tileHeight; };
            int preMoveTileIds[] = {
                getTileId(preMovePoints[0]),
                getTileId(preMovePoints[1]),
                getTileId(preMovePoints[2]),
                getTileId(preMovePoints[3])
            };
            int postMoveTileIds[] = {
                getTileId(postMovePoints[0]),
                getTileId(postMovePoints[1]),
                getTileId(postMovePoints[2]),
                getTileId(postMovePoints[3])
            };

            const MageMapTile* preMoveTiles[] = {
                &currentMap->layers[0][preMoveTileIds[0]],
                &currentMap->layers[0][preMoveTileIds[1]],
                &currentMap->layers[0][preMoveTileIds[2]],
                &currentMap->layers[0][preMoveTileIds[3]]
            };
            const MageMapTile* postMoveTiles[] = {
                &currentMap->layers[0][postMoveTileIds[0]],
                &currentMap->layers[0][postMoveTileIds[1]],
                &currentMap->layers[0][postMoveTileIds[2]],
                &currentMap->layers[0][postMoveTileIds[3]]
            };

            auto getGeometry = [&](const MageMapTile* tile) {
                auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tile->tilesetId);
                return tileset->GetGeometryForTile(tile->tileId);
            };

            auto preMoveGeometries = {
                getGeometry(preMoveTiles[0]),
                getGeometry(preMoveTiles[1]),
                getGeometry(preMoveTiles[2]),
                getGeometry(preMoveTiles[3])
            }; 
            auto postMoveGeometries = {
                getGeometry(postMoveTiles[0]),
                getGeometry(postMoveTiles[1]),
                getGeometry(postMoveTiles[2]),
                getGeometry(postMoveTiles[3])
            };
            // # cols is screenwidth/tilewidth
            // # rows is screenheight/tileheight
            // auto curCol = x / currentMap->tileWidth;
            // auto curRow = y / currentMap->tileHeight;
            // 
            player->x += playerVelocity.x;
            player->y += playerVelocity.y;
        }

    }
}