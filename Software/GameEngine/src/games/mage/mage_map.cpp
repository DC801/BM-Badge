#include "mage_map.h"
#include "EnginePanic.h"
#include <algorithm>
#include <numeric>
#include <optional>
#include <ranges>
#include <utility>
#include <vector>
#include "mage.h"
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
      auto& entityData = Get<MageEntityData>(currentMap->entityGlobalIDs[i]);
      auto entityAddress = ROM()->GetOffsetByIndex<MageEntityData>(currentMap->entityGlobalIDs[i]);
      ROM()->Read<MageEntityData>(entityData, entityAddress);

      // convert entity coordinates into map coordinates (0 at bottom -> 0 at top)
      Get<MageEntityData>(i).position.y -= ROM()->GetReadPointerByIndex<MageTileset>(Get<MageEntityData>(i).primaryId)->TileHeight;

      // fill renderable data from the entity
      auto& renderableData = Get<RenderableData>(currentMap->entityGlobalIDs[i]);
      renderableData.UpdateFrom(entityData);
   }

   onTick = MageScriptState{ currentMap->onTickScriptId, false };

   auto player = getPlayerEntityData();
   if (player)
   {
      player->SetName(ROM()->GetCurrentSave().name);
   }
   mapLoadId = MAGE_NO_MAP;
}

void MapControl::OnTick(MageScriptControl* scriptControl)
{
   //the map's onTick script will run every tick, restarting from the beginning as it completes
   onTick.scriptIsRunning = true;
   scriptControl->processScript(onTick, MAGE_MAP_ENTITY);
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

   layers = MapLayers(offset, ROM()->GetViewOf<MapTile>(offset, (uint16_t)(layerCount * rows * cols)), (uint16_t)(rows * cols));
}

void MapControl::DrawEntities() const
{
   //sort entity indices by the entity y values:
   std::vector<size_t> entityDrawOrder(currentMap->entityCount);
   std::iota(entityDrawOrder.begin(), entityDrawOrder.end(), 0);
   const auto sortByY = [&](size_t i1, size_t i2) {
      const auto i1LessThani2 = Get<MageEntityData>(i1).position.y
         < Get<MageEntityData>(i2).position.y;
      return i1LessThani2;
      };
   std::stable_sort(entityDrawOrder.begin(), entityDrawOrder.end(), sortByY);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (auto& entityIndex : entityDrawOrder)
   {
      Get<RenderableData>(entityIndex).Draw(tileManager);
   }
}

void MapControl::DrawLayer(uint8_t layer) const
{
   //               map height - screen height
   // *********************************************************** 
   // *|             ____________________________              |*
   // *|                                                       |*
   // *|                                                       |*
   // *|             ____________________________screen width  |* 
   // *|             |##########################|              |*
   // *|             |##########################|              |*
   // *|             |##########################|              |* screen width + map width
   // *|             |##########################|              |* 
   // *|             |##########################|              |*
   // *|             |##########################|              |*
   // *|             ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯              |*
   // *|             screen height                             |*
   // *|                                                       |*
   // *|                                                       |*
   // *|             ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯              |*
   // ***********************************************************
   //                screen height + map height
 

   // identify start and stop tiles to draw
   auto startTileX = std::max(0, (tileManager->camera->positionX - DrawWidth) / currentMap->tileWidth);
   auto startTileY = std::max(0, (tileManager->camera->positionY - DrawHeight) / currentMap->tileHeight);

   auto endTileX = std::min(int{ currentMap->cols - 1 }, (startTileX + DrawWidth) / currentMap->tileWidth);
   auto endTileY = std::min(int{ currentMap->rows - 1 }, (startTileY + DrawHeight) / currentMap->tileHeight + 1);
   
   for (auto mapTileRow = startTileY; mapTileRow <= endTileY; mapTileRow++)
   {
      for (auto mapTileCol = startTileX; mapTileCol <= endTileX; mapTileCol++)
      {
         auto tileIndex = mapTileCol + (mapTileRow * currentMap->cols);
         auto currentTile = &currentMap->layers[layer][tileIndex];

         if (!currentTile->tileId) { continue; }

         auto tileDrawX = currentMap->tileWidth * mapTileCol;
         auto tileDrawY = currentMap->tileHeight * mapTileRow;

         tileManager->DrawTile(currentTile->tilesetId, currentTile->tileId - 1, tileDrawX, tileDrawY, currentTile->flags);
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
}

void MapControl::UpdateEntities(const DeltaState& delta)
{
   for (auto i = 0; i < currentMap->entityCount; i++)
   {
      auto& entity = Get<MageEntityData>(i);
      auto& renderableData = Get<RenderableData>(i);
      renderableData.currentFrameMs += IntegrationStepSize.count();
      renderableData.UpdateFrom(entity);
   }
}

void MageGameEngine::handleEntityInteract(const ButtonState& activatedButton)
{}

std::optional<uint16_t> MapControl::TryMovePlayer(const DeltaState& delta)
{
   // require a player on the map to move/interact
   auto playerData = getPlayerEntityData();
   if (!playerData) { return std::nullopt; }

   auto playerRenderableData = getPlayerRenderableData();

   auto interactBox = playerRenderableData->hitBox;
   auto& oldPosition = playerRenderableData->origin;
   auto& newPosition = playerData->position;
   // moving when there's at least one button not being counteracted
   const auto& topLeft = oldPosition;
   const auto topRight = oldPosition + EntityPoint{ playerRenderableData->hitBox.w, 0 };
   const auto botLeft = oldPosition + EntityPoint{ 0, playerRenderableData->hitBox.h };
   const auto botRight = oldPosition + EntityPoint{ playerRenderableData->hitBox.w, playerRenderableData->hitBox.h };

   std::vector<EntityPoint> hitboxPointsToCheck{};

   if (playerData->position.x < playerRenderableData->origin.x)
   {
      playerData->flags = WEST;
      hitboxPointsToCheck.push_back(topLeft);
      hitboxPointsToCheck.push_back(botLeft);
   }
   else if (playerData->position.x > playerRenderableData->origin.x)
   {
      playerData->flags = EAST;
      hitboxPointsToCheck.push_back(topRight);
      hitboxPointsToCheck.push_back(botRight);
   }

   if (playerData->position.y < playerRenderableData->origin.y)
   {
      playerData->flags = NORTH;
      hitboxPointsToCheck.push_back(topLeft);
      hitboxPointsToCheck.push_back(topRight);
   }
   else if (playerData->position.y > playerRenderableData->origin.y)
   {
      playerData->flags = SOUTH;
      hitboxPointsToCheck.push_back(botLeft);
      hitboxPointsToCheck.push_back(botRight);
   }

   auto collides = false;
   for (auto& hitboxPoint : hitboxPointsToCheck)
   {
      const auto column = hitboxPoint.x / currentMap->tileWidth;
      const auto row = hitboxPoint.y / currentMap->tileHeight;
      const auto tileOffsetPoint = EntityPoint{ (uint16_t)(currentMap->tileWidth * column), (uint16_t)(currentMap->tileHeight * row) };
      const auto tileId = column + currentMap->cols * row;

      if (tileId >= currentMap->layers[0].size()) { continue; }

      const auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentMap->layers[0][tileId].tilesetId);
      auto geometry = tileset->GetGeometryForTile(currentMap->layers[0][tileId].tileId);

      // TODO: interaction should be handled here
      if (geometry && geometry->IsPointInside(hitboxPoint, tileOffsetPoint))
      {
         newPosition = oldPosition;
         break;
      }
   }

   // only interact on Rjoy_up (hacking) or Rjoy_right (interacting)
   if (!delta.HackPressed() && !delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_right))
   { 
      return std::nullopt; 
   }

   const uint8_t interactLength = 32;
   auto direction = playerData->flags & RENDER_FLAGS_DIRECTION_MASK;
   if (direction == NORTH)
   {
      interactBox.origin.y -= interactLength;
      interactBox.h = interactLength;
   }
   if (direction == EAST)
   {
      interactBox.origin.x += interactBox.w;
      interactBox.w = interactLength;
   }
   if (direction == SOUTH)
   {
      interactBox.origin.y += interactBox.h;
      interactBox.h = interactLength;
   }
   if (direction == WEST)
   {
      interactBox.origin.x -= interactLength;
      interactBox.w = interactLength;
   }
   for (auto i = 0; i < currentMap->entityCount; i++)
   {
      auto& renderableData = Get<RenderableData>(i);
      renderableData.isInteracting = false;

      if (i != currentMap->playerEntityIndex)
      {
         bool colliding = renderableData.hitBox
            .Overlaps(interactBox);

         if (colliding)
         {
            playerRenderableData->isInteracting = true;
            renderableData.isInteracting = true;
            return i;
         }
      }
   }
   return std::nullopt;
}
