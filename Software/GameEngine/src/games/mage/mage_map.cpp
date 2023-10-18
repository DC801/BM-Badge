#include "mage_map.h"
#include "EnginePanic.h"
#include <algorithm>
#include <numeric>
#include <ranges>
#include <vector>
#include "mage.h"
#include "shim_err.h"


#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#endif


void MapControl::Load(uint16_t index)
{
    currentMap = ROM()->InitializeRAMCopy<MapData>(index);
    onLoad = MageScriptState{ currentMap->onLoadScriptId, true };
    onTick = MageScriptState{ currentMap->onTickScriptId, false };

    auto player = getPlayerEntity();
    if (player.has_value())
    {
        player.value()->SetName(ROM()->GetCurrentSave().name);
    }
}

void MapControl::OnLoad(MageScriptControl* scriptControl)
{
    scriptControl->processScript(onLoad, MAGE_MAP_ENTITY, MageScriptType::ON_LOAD);
}

void MapControl::OnTick(MageScriptControl* scriptControl)
{
    //the map's onTick script will run every tick, restarting from the beginning as it completes
    onTick.scriptIsRunning = true;
    scriptControl->processScript(onTick, MAGE_MAP_ENTITY, MageScriptType::ON_TICK);
}

MapData::MapData(uint32_t& offset)
{
    auto layerCount = uint8_t{ 0 };
    ROM()->Read(name, offset, MapNameLength);
    ROM()->Read(tileWidth, offset);
    ROM()->Read(tileHeight, offset);
    ROM()->Read(cols, offset);
    ROM()->Read(rows, offset);
    ROM()->Read(onLoadScriptId, offset);
    ROM()->Read(onTickScriptId, offset);
    ROM()->Read(onLookScriptId, offset);
    ROM()->Read(layerCount, offset);
    ROM()->Read(playerEntityIndex, offset);
    ROM()->Read(entityCount, offset);
    ROM()->Read(geometryCount, offset);
    ROM()->Read(scriptCount, offset);
    ROM()->Read(goDirectionsCount, offset);

    if (entityCount > MAX_ENTITIES_PER_MAP)
    {
        ENGINE_PANIC("Error: Game is attempting to load more than %d entities on one map", MAX_ENTITIES_PER_MAP);
    }

    offset += sizeof(uint8_t); // padding for 4-byte alignment

    std::vector<uint16_t> entityGlobalIds{};
    std::vector<uint16_t> geometryGlobalIds{};
    std::vector<uint16_t> scriptGlobalIds{};
    ROM()->InitializeVectorFrom(entityGlobalIds, offset, entityCount);
    ROM()->InitializeVectorFrom(geometryGlobalIds, offset, geometryCount);
    ROM()->InitializeVectorFrom(scriptGlobalIds, offset, scriptCount);
    ROM()->InitializeVectorFrom(goDirections, offset, goDirectionsCount);

    //padding to align with uint32_t memory spacing:
    if ((entityCount + geometryCount + scriptCount) % 2)
    {
        offset += sizeof(uint16_t);
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
        auto entityAddress = ROM()->GetOffsetByIndex<MageEntityData>(entityGlobalIds[i]);
        auto entity = MageEntityData{};
        ROM()->Read(entity, entityAddress);
        entities[i] = std::move(MageEntity{ std::move(entity) });
    }

    for (auto i = 0; i < layerCount; i++)
    {
        auto layerAddress = offset + i * rows * cols * sizeof(uint8_t*);
        layers.push_back(std::span{ROM()->GetReadPointerToAddress<MageMapTile>(layerAddress), (uint16_t)(cols * rows) });
    }
}

void MapControl::DrawEntities(const EntityPoint& cameraPosition) const
{
    //sort entity indices by the entity y values:
    std::vector<size_t> entityDrawOrder(currentMap->entityCount);
    std::iota(entityDrawOrder.begin(), entityDrawOrder.end(), 0);
    auto sortByY = [&](size_t i1, size_t i2) { return currentMap->entities[i1].data.position.y < currentMap->entities[i2].data.position.y; };
    std::stable_sort(entityDrawOrder.begin(), entityDrawOrder.end(), sortByY);

    //now that we've got a sorted array with the lowest y values first,
    //iterate through it and draw the entities one by one:
    for (auto& entityIndex : entityDrawOrder)
    {
        auto& renderableData = currentMap->entities[entityIndex].renderableData;

        tileManager->DrawTile(renderableData.tilesetId, renderableData.tileId, renderableData.origin - cameraPosition, renderableData.renderFlags);
    }
}

void MapControl::DrawGeometry(const EntityPoint& camera) const
{
    bool isColliding = false;
    if (currentMap->playerEntityIndex != NO_PLAYER_INDEX)
    {
        auto playerPosition = currentMap->entities[currentMap->playerEntityIndex].renderableData.center;
        for (uint16_t i = 0; i < GeometryCount(); i++)
        {
            // auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(getGlobalGeometryId(i));
            //geometry->draw(camera.x, camera.y, isColliding ? COLOR_RED : COLOR_GREEN);
        }
    }
}

void MapControl::DrawLayer(uint8_t layer, const EntityPoint& cameraPosition) const
{
    auto& layerTiles = currentMap->layers[layer];
    for (auto mapTileRow = 0; mapTileRow < currentMap->rows; mapTileRow++)
    {
        for (auto mapTileCol = 0; mapTileCol < currentMap->cols; mapTileCol++)
        {
            auto tileIndex = mapTileCol + (mapTileRow * currentMap->cols);
            auto currentTile = &layerTiles[tileIndex];

            if (!currentTile->tileId) { continue; }

            auto tileDrawPoint = EntityPoint{ 
                (uint16_t)(currentMap->tileWidth * mapTileCol - cameraPosition.x),
                (uint16_t)(currentMap->tileHeight * mapTileRow - cameraPosition.y)
            };

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

void MapControl::Draw(const EntityPoint& cameraPosition) const
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
        entity.renderableData.currentFrameTicks += delta.TimeMs.count();
        entity.UpdateRenderableData();
    }
}

void MapControl::TryMovePlayer(ButtonState button)
{
    auto playerEntity = getPlayerEntity();
    if (playerEntity.has_value())
    {
        auto player = *playerEntity;
        auto playerVelocity = EntityPoint{ 0,0 };

        // moving when there's at least one button not being counteracted
        playerIsMoving =
            ((button.IsPressed(KeyPress::Ljoy_left) || button.IsPressed(KeyPress::Ljoy_right))
                && button.IsPressed(KeyPress::Ljoy_left) != button.IsPressed(KeyPress::Ljoy_right))
            || ((button.IsPressed(KeyPress::Ljoy_up) || button.IsPressed(KeyPress::Ljoy_down))
                && button.IsPressed(KeyPress::Ljoy_up) != button.IsPressed(KeyPress::Ljoy_down));

        if (playerIsMoving)
        {
            const auto topLeft = player->renderableData.hitBox.origin;
            const auto topRight = player->renderableData.hitBox.origin + EntityPoint{player->renderableData.hitBox.w, 0};
            const auto botLeft = player->renderableData.hitBox.origin + EntityPoint{0, player->renderableData.hitBox.h};
            const auto botRight = player->renderableData.hitBox.origin + EntityPoint{player->renderableData.hitBox.w, player->renderableData.hitBox.h};

            std::vector<EntityPoint> hitboxPointsToCheck{};

            if (button.IsPressed(KeyPress::Ljoy_left) && !button.IsPressed(KeyPress::Ljoy_right))
            {
                playerVelocity.x -= playerSpeed;
                player->data.direction = WEST;
                hitboxPointsToCheck.push_back(topLeft);
                hitboxPointsToCheck.push_back(botLeft);
                hitboxPointsToCheck.push_back(topLeft + playerVelocity);
                hitboxPointsToCheck.push_back(botLeft + playerVelocity);
            }
            else if (button.IsPressed(KeyPress::Ljoy_right) && !button.IsPressed(KeyPress::Ljoy_left))
            {
                playerVelocity.x += playerSpeed;
                player->data.direction = EAST;
                hitboxPointsToCheck.push_back(topRight);
                hitboxPointsToCheck.push_back(botRight);
                hitboxPointsToCheck.push_back(topRight + playerVelocity);
                hitboxPointsToCheck.push_back(botRight + playerVelocity);
            }

            if (button.IsPressed(KeyPress::Ljoy_up) && !button.IsPressed(KeyPress::Ljoy_down))
            {
                playerVelocity.y -= playerSpeed;
                player->data.direction = NORTH;
                hitboxPointsToCheck.push_back(topLeft);
                hitboxPointsToCheck.push_back(topRight);
                hitboxPointsToCheck.push_back(topLeft + playerVelocity);
                hitboxPointsToCheck.push_back(topRight + playerVelocity);
            }
            else if (button.IsPressed(KeyPress::Ljoy_down) && !button.IsPressed(KeyPress::Ljoy_up))
            {
                playerVelocity.y += playerSpeed;
                player->data.direction = SOUTH;
                hitboxPointsToCheck.push_back(botLeft);
                hitboxPointsToCheck.push_back(botRight);
                hitboxPointsToCheck.push_back(botLeft + playerVelocity);
                hitboxPointsToCheck.push_back(botRight + playerVelocity);
            }

            auto collides = false;
            for (auto& hitboxPoint : hitboxPointsToCheck)
            {
                const auto column = hitboxPoint.x / currentMap->tileWidth;
                const auto row = hitboxPoint.y / currentMap->tileHeight;
                const auto tileOffsetPoint = EntityPoint{
                    (uint16_t)(currentMap->tileWidth * column),
                    (uint16_t)(currentMap->tileHeight * row)
                };

                const auto tileId = column + currentMap->cols * row;
                const auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentMap->layers[0][tileId].tilesetId);
                auto geometry = tileset->GetGeometryForTile(currentMap->layers[0][tileId].tileId);

                if (geometry)
                {
                    collides = geometry->IsPointInside(hitboxPoint, tileOffsetPoint);
                    if (collides)
                    {
                        return;
                    }
                }
            }
            player->data.position += playerVelocity;
        }

    }
}