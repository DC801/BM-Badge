#include "mage_map.h"
#include <algorithm>
#include <numeric>
#include <optional>
#include <ranges>
#include <utility>
#include <vector>
#include "EnginePanic.h"
#include "mage_rom.h"
#include "mage_script_control.h"
#include "shim_err.h"

#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#endif

void MapControl::Load()
{
   auto offset = ROM()->GetOffsetByIndex<MapData>(mapLoadId);
   currentMap.emplace(offset);

   for (auto i = 0; i < currentMap->scriptCount; i++)
   {
      scripts.push_back(ROM()->GetReadPointerByIndex<MageScript>(currentMap->scriptGlobalIDs[i]));
   }

   for (auto i = 0; i < currentMap->entityCount; i++)
   {
      // populate the MapControl's copy of the Entity Data
      auto& entityData = Get<MageEntityData>(i);
      auto entityAddress = ROM()->GetOffsetByIndex<MageEntityData>(currentMap->entityGlobalIDs[i]);
      ROM()->Read<MageEntityData>(entityData, entityAddress);

      // fill renderable data from the entity
      Get<RenderableData>(i).UpdateFrom(entityData);
   }
   const auto onTickScript = ROM()->GetReadPointerByIndex<MageScript>(currentMap->onTickScriptId);
   onTickScriptState = MageScriptState{ currentMap->onTickScriptId, onTickScript };

   auto& player = getPlayerEntityData();
   player.SetName(ROM()->GetCurrentSave().name);
   mapLoadId = MAGE_NO_MAP;
}

void MapControl::OnTick(MageScriptControl* scriptControl)
{
   //the map's onTick script will run every tick, restarting from the beginning as it completes
   onTickScriptState.scriptIsRunning = true;
   scriptControl->processScript(onTickScriptState, MAGE_MAP_ENTITY);
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

   entityGlobalIDs = ROM()->GetViewOf<uint16_t>(offset, entityCount);
   geometryGlobalIDs = ROM()->GetViewOf<uint16_t>(offset, geometryCount);
   scriptGlobalIDs = ROM()->GetViewOf<uint16_t>(offset, scriptCount);
   goDirections = ROM()->GetViewOf<GoDirection>(offset, goDirectionsCount);

   //padding to align with uint32_t memory spacing:
   if ((entityCount + geometryCount + scriptCount) % 2)
   {
      offset += sizeof(uint16_t);
   }

   layers = MapLayers(ROM()->GetViewOf<MapTile>(offset, (uint16_t)(layerCount * rows * cols)), (uint16_t)(rows * cols));
}

void MapControl::DrawEntities() const
{
   //sort entity indices by the entity y values:
   std::vector<size_t> entityDrawOrder(currentMap->entityCount);
   std::iota(entityDrawOrder.begin(), entityDrawOrder.end(), 0);
   const auto sortByY = [&](size_t i1, size_t i2) { return Get<MageEntityData>(i1).targetPosition.y < Get<MageEntityData>(i2).targetPosition.y; };
   std::stable_sort(entityDrawOrder.begin(), entityDrawOrder.end(), sortByY);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (auto& entityIndex : entityDrawOrder)
   {
      Get<RenderableData>(entityIndex).Draw(frameBuffer);
   }
}

void MapControl::DrawLayer(uint8_t layer) const
{
   // identify start and stop tiles to draw
   const auto startTileX = std::max(0, frameBuffer->camera.Position.x / currentMap->tileWidth);
   const auto startTileY = std::max(0, frameBuffer->camera.Position.y / currentMap->tileHeight);
   const auto endTileX = std::min(int{ currentMap->cols - 1 }, startTileX + DrawWidth / currentMap->tileWidth);
   const auto endTileY = std::min(int{ currentMap->rows - 1 }, startTileY + DrawHeight / currentMap->tileHeight + 1);

   for (auto mapTileRow = startTileY; mapTileRow <= endTileY; mapTileRow++)
   {
      for (auto mapTileCol = startTileX; mapTileCol <= endTileX; mapTileCol++)
      {
         const auto tileIndex = mapTileCol + (mapTileRow * currentMap->cols);
         const auto currentTile = &currentMap->layers[layer][tileIndex];

         if (!currentTile->tileId) { continue; }

         const auto tileDrawX = uint16_t(currentMap->tileWidth * mapTileCol);
         const auto tileDrawY = uint16_t(currentMap->tileHeight * mapTileRow);

         frameBuffer->DrawTileWorldCoords(currentTile->tilesetId, currentTile->tileId - 1, tileDrawX, tileDrawY, currentTile->flags);
      }
   }
}

void MapControl::Draw() const
{
   // always draw layer 0 
   DrawLayer(0);

   //draw remaining map layers except the last one before drawing entities.
   for (uint8_t layerIndex = 1; layerIndex < LayerCount() - 1; layerIndex++)
   {
      DrawLayer(layerIndex);
   }

   DrawEntities();

   //draw the final layer above the entities only when there is more than one layer
   if (LayerCount() > 1)
   {
      DrawLayer(LayerCount() - 1);
   }

   if (frameBuffer->drawGeometry)
   {
      drawGeometry();
   }
}

void MapControl::drawGeometry() const
{
   const auto startTileX = std::max(0, frameBuffer->camera.Position.x / currentMap->tileWidth);
   const auto startTileY = std::max(0, frameBuffer->camera.Position.y / currentMap->tileHeight);
   const auto endTileX = std::min(int{ currentMap->cols - 1 }, startTileX + DrawWidth / currentMap->tileWidth + 1);
   const auto endTileY = std::min(int{ currentMap->rows - 1 }, startTileY + DrawHeight / currentMap->tileHeight + 1);

   for (auto mapTileRow = startTileY; mapTileRow <= endTileY; mapTileRow++)
   for (auto mapTileCol = startTileX; mapTileCol <= endTileX; mapTileCol++)
   for (auto layerIndex = 0; layerIndex < LayerCount(); layerIndex++)
   {
      const auto tileIndex = mapTileCol + (mapTileRow * currentMap->cols);
      const auto currentTile = &currentMap->layers[layerIndex][tileIndex];

      if (!currentTile->tileId) { continue; }

      const auto tileDrawPoint = EntityPoint{
         uint16_t(currentMap->tileWidth * mapTileCol),
         uint16_t(currentMap->tileHeight * mapTileRow)
      };

      const auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentTile->tilesetId);
      const auto geometry = tileset->GetGeometryForTile(currentTile->tileId);

      if (geometry)
      {
         const auto layerColor = layerIndex == 0 ? COLOR_CYAN
            : layerIndex == 1 ? COLOR_PINK
            : layerIndex == 2 ? COLOR_RED
            : layerIndex == 3 ? COLOR_GREEN
            : layerIndex == 4 ? COLOR_BLUE
            : COLOR_YELLOW;

         const auto geometryPoints = geometry->FlipByFlags(currentTile->flags, tileset->TileWidth, tileset->TileHeight);
         for (auto i = 0; i < geometryPoints.size(); i++)
         {
            frameBuffer->DrawLineWorldCoords(tileDrawPoint + geometryPoints[i], tileDrawPoint + geometryPoints[(i + 1) % geometryPoints.size()], layerColor);
         }
      }
   }
   for (const auto& renderableData : renderableDataArray)
   {
      frameBuffer->DrawRectWorldCoords(renderableData.hitBox, COLOR_LIGHTGREY);
   }

   frameBuffer->DrawRectWorldCoords(getPlayerInteractBox(), COLOR_ORANGE);
}

std::optional<uint16_t> MapControl::Update()
{
   auto& playerEntityData = getPlayerEntityData();
   const auto& interactBox = getPlayerInteractBox();

   const auto oldPosition = interactBox.origin;

   const auto topLeft = oldPosition;
   const auto topRight = oldPosition + EntityPoint{ interactBox.w, 0 };
   const auto botLeft = oldPosition + EntityPoint{ 0, interactBox.h };
   const auto botRight = oldPosition + EntityPoint{ interactBox.w, interactBox.h };

   std::vector<EntityPoint> hitboxPointsToCheck{};

   if (playerEntityData.direction == MageEntityAnimationDirection::WEST)
   {
      hitboxPointsToCheck.push_back(topLeft);
      hitboxPointsToCheck.push_back(botLeft);
   }
   else if (playerEntityData.direction == MageEntityAnimationDirection::EAST)
   {
      hitboxPointsToCheck.push_back(topRight);
      hitboxPointsToCheck.push_back(botRight);
   }

   if (playerEntityData.direction == MageEntityAnimationDirection::NORTH)
   {
      hitboxPointsToCheck.push_back(topLeft);
      hitboxPointsToCheck.push_back(topRight);
   }
   else if (playerEntityData.direction == MageEntityAnimationDirection::SOUTH)
   {
      hitboxPointsToCheck.push_back(botLeft);
      hitboxPointsToCheck.push_back(botRight);
   }

   for (auto& hitboxPoint : hitboxPointsToCheck)
   {
      const auto column = hitboxPoint.x / currentMap->tileWidth;
      const auto row = hitboxPoint.y / currentMap->tileHeight;
      const auto tileOffsetPoint = EntityPoint{ (uint16_t)(currentMap->tileWidth * column), (uint16_t)(currentMap->tileHeight * row) };
      const auto tileId = column + currentMap->cols * row;

      // ignore checks that are outside the bounds of the map
      if (tileId < 0 || tileId >= currentMap->layers[0].size()) { continue; }

      const auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentMap->layers[0][tileId].tilesetId);

      // check for world collision:
      const auto tileGeometryId = currentMap->layers[0][tileId].tileId;
      const auto geometry = tileset->GetGeometryForTile(tileGeometryId);
      if (geometry && geometry->IsPointInside(hitboxPoint, tileOffsetPoint))
      {
         // TODO: bring back the intersection-offset algorithm
         playerEntityData.targetPosition = oldPosition;
         break;
      }
   }

   std::optional<uint16_t> interactionId = std::nullopt;
   for (auto i = 0; i < currentMap->entityCount; i++)
   {
      const auto& entity = Get<MageEntityData>(i);
      auto& renderableData = Get<RenderableData>(i);

      renderableData.UpdateFrom(entity);

      if (entity.primaryId != playerEntityData.primaryId && getPlayerInteractBox().Overlaps(renderableData.hitBox))
      {
         interactionId.emplace(i);
      }
   }
   return interactionId;
}