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


void MapControl::Load()
{
   currentMap = ROM()->InitializeRAMCopy<MapData>(mapLoadId);
   onLoad = MageScriptState{ currentMap->onLoadScriptId, true };
   onTick = MageScriptState{ currentMap->onTickScriptId, false };

   auto player = getPlayerEntity();
   if (player.has_value())
   {
      player.value()->SetName(ROM()->GetCurrentSave().name);
   }
   mapLoadId = MAGE_NO_MAP;
}

void MapControl::OnLoad(MageScriptControl* scriptControl)
{
   scriptControl->processScript(onLoad, MAGE_MAP_ENTITY);
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
      ROM()->Read(entities[i], entityAddress);
   }

   for (auto i = 0; i < layerCount; i++)
   {
      auto layerAddress = uint32_t(offset + i * rows * cols * 4);
      //const auto layerPointer = ROM()->GetSpanByIndex<MageMapTile>(layerAddress);
      const auto layerPointer = ROM()->GetReadPointerToAddress<MageMapTile>(layerAddress);
      layers.push_back(std::span{ layerPointer, (uint16_t)(cols * rows) });
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
      currentMap->entities[entityIndex].Draw(tileManager, cameraPosition);
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
}

void MapControl::UpdateEntities(const DeltaState& delta)
{
   for (auto i = 0; i < currentMap->entityCount; i++)
   {
      auto& entity = currentMap->entities[i];
      entity.renderableData.currentFrameTicks += IntegrationStepSize.count();
      entity.UpdateRenderableData();
   }
}

void MageGameEngine::handleEntityInteract(const ButtonState& activatedButton)
{
   auto hack = activatedButton.IsPressed(KeyPress::Rjoy_up);

   // only interact on Rjoy_up (hacking) or Rjoy_right (interacting)
   if (!hack && !activatedButton.IsPressed(KeyPress::Rjoy_right)) { return; }

   // require a player on the map to interact
   auto optionalPlayer = mapControl->getPlayerEntity();
   if (!optionalPlayer.has_value())
   {
      return;
   }

   auto player = optionalPlayer.value();
   auto interactBox = player->renderableData.hitBox;

   const uint8_t interactLength = 32;
   auto direction = optionalPlayer.value()->data.flags & RENDER_FLAGS_DIRECTION_MASK;
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

   for (uint8_t i = 0; i < mapControl->GetEntities().size(); i++)
   {
      // reset all interact states first
      auto targetEntity = mapControl->tryGetEntity(i);
      if (targetEntity.has_value())
      {
         auto target = targetEntity.value();
         target->renderableData.isInteracting = false;

         if (i != mapControl->getPlayerEntityIndex())
         {
            bool colliding = target->renderableData.hitBox
               .Overlaps(interactBox);

            if (colliding)
            {
               player->renderableData.isInteracting = true;
               target->renderableData.isInteracting = true;
               if (hack && playerHasHexEditorControl)
               {
                  hexEditor->disableMovementUntilRJoyUpRelease();
                  hexEditor->openToEntityByIndex(i);
               }
               else if (!hack && target->data.onInteractScriptId)
               {
                  target->OnInteract(scriptControl.get());
               }
               break;
            }
         }
      }
   }
}

void MapControl::TryMovePlayer(const DeltaState& delta)
{
   auto optionalPlayer = getPlayerEntity();
   if (!optionalPlayer.has_value()) { return; }

   auto player = optionalPlayer.value();
   auto& oldPosition = player->renderableData.origin;
   auto& newPosition = player->data.position;
   // moving when there's at least one button not being counteracted
   const auto& topLeft = oldPosition;
   const auto topRight = oldPosition + EntityPoint{ player->renderableData.hitBox.w, 0 };
   const auto botLeft = oldPosition + EntityPoint{ 0, player->renderableData.hitBox.h };
   const auto botRight = oldPosition + EntityPoint{ player->renderableData.hitBox.w, player->renderableData.hitBox.h };

   std::vector<EntityPoint> hitboxPointsToCheck{};

   if (player->data.position.x < player->renderableData.origin.x)
   {
      player->data.flags = WEST;
      hitboxPointsToCheck.push_back(topLeft);
      hitboxPointsToCheck.push_back(botLeft);
   }
   else if (player->data.position.x > player->renderableData.origin.x)
   {
      player->data.flags = EAST;
      hitboxPointsToCheck.push_back(topRight);
      hitboxPointsToCheck.push_back(botRight);
   }

   if (player->data.position.y < player->renderableData.origin.y)
   {
      player->data.flags = NORTH;
      hitboxPointsToCheck.push_back(topLeft);
      hitboxPointsToCheck.push_back(topRight);
   }
   else if (player->data.position.y > player->renderableData.origin.y)
   {
      player->data.flags = SOUTH;
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
      if (geometry)
      {
         collides = geometry->IsPointInside(hitboxPoint, tileOffsetPoint);
         if (collides)
         {
            return;
         }
      }
   }
}
