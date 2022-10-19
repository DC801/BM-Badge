#include "mage_map.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "shim_err.h"
#include <algorithm>
#include "mage.h"

void MageMap::Load(uint16_t index)
{
   auto address = mapHeader.offset(index);
   auto layerCount = uint8_t{ 0 };
   auto entityCount = uint16_t{ 0 };
   auto geometryCount = uint16_t{ 0 };
   auto scriptCount = uint16_t{ 0 };
   auto goDirectionsCount = uint8_t{ 0 };
   auto mapLayerOffsetsCount = uint16_t{ 0 };

   ROM->Read(name, address, MapNameLength);
   ROM->Read(tileWidth, address);
   ROM->Read(tileHeight, address);
   ROM->Read(cols, address);
   ROM->Read(rows, address);
   ROM->Read(onLoad, address);
   ROM->Read(onTick, address);
   ROM->Read(onLook, address);
   ROM->Read(layerCount, address);
   ROM->Read(playerEntityIndex, address);
   ROM->Read(entityCount, address);
   ROM->Read(geometryCount, address);
   ROM->Read(scriptCount, address);
   ROM->Read(goDirectionsCount, address);

   address += sizeof(uint8_t); // padding

   ROM->InitializeCollectionOf<uint16_t>(entityGlobalIds, address, entityCount);
   ROM->InitializeCollectionOf<uint16_t>(geometryGlobalIds, address, geometryCount);
   ROM->InitializeCollectionOf<uint16_t>(scriptGlobalIds, address, scriptCount);
   ROM->InitializeCollectionOf<GoDirection>(goDirections, address, goDirectionsCount);

   //padding to align with uint32_t memory spacing:
   if ((entityCount + geometryCount + scriptCount) % 2)
   {
      address += sizeof(uint16_t); // Padding
   }

   for (uint32_t i = 0; i < layerCount; i++)
   {
      mapLayerOffsets.push_back(address);
      address += rows * cols * sizeof(uint8_t*);
   }

   if (entityCount > MAX_ENTITIES_PER_MAP)
   {
      ENGINE_PANIC("Error: Game is attempting to load more than %d entities on one map", MAX_ENTITIES_PER_MAP);
   }

   for (uint8_t i = 0; i < entityCount; i++)
   {
      auto offset = entityHeader.offset(getGlobalEntityId(i));
      //fill in entity data from gameEngine->ROM:
      auto entity = MageEntity{ ROM, offset };

      if (isEntityDebugOn)
      { // show all entities, we're in debug mode
         filteredMapLocalEntityIds[i] = i;
         mapLocalEntityIds[i] = i;
         entities[i] = std::move(entity);
         filteredEntityCountOnThisMap++;
      }
      else
      { // show only filtered entities
         bool isEntityMeantForDebugModeOnly = entity.direction & RENDER_FLAGS_IS_DEBUG;
         if (!isEntityMeantForDebugModeOnly)
         {
            filteredMapLocalEntityIds[i] = filteredEntityCountOnThisMap;
            mapLocalEntityIds[filteredEntityCountOnThisMap] = i;
            entities[filteredEntityCountOnThisMap] = std::move(entity);
            filteredEntityCountOnThisMap++;
         }
      }
   }
}

void MageMap::DrawEntities(MageGameEngine* gameEngine)
{
   int32_t cameraX = gameEngine->gameControl->camera.adjustedCameraPosition.x;
   int32_t cameraY = gameEngine->gameControl->camera.adjustedCameraPosition.y;
   //first sort entities by their y values:
   auto sortByY = [](const MageEntity& entity1, const MageEntity& entity2) { return entity1.location.y < entity2.location.y; };
   std::sort(entities.begin(), entities.end(), sortByY);

   uint8_t filteredPlayerEntityIndex = getFilteredEntityId(playerEntityIndex);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (const auto& entity : entities)// uint8_t i = 0; i < FilteredEntityCount(); i++)
   {
      //MageEntity* entity = &entities[i];
      auto renderableData = entity.getRenderableData();
      gameEngine->gameControl->tileManager->DrawTile(renderableData, x, y);

      if (gameEngine->gameControl->isCollisionDebugOn)
      {
         auto tileOrigin = Point{ entity.location.x - cameraX, entity.location.y - cameraY - tileHeight };
         auto hitboxOrigin = renderableData->hitBox.origin - gameEngine->gameControl->camera.adjustedCameraPosition;

         gameEngine->frameBuffer->drawRect(tileOrigin, tileWidth, tileHeight, COLOR_LIGHTGREY);
         gameEngine->frameBuffer->drawRect(hitboxOrigin, renderableData->hitBox.w, renderableData->hitBox.h, 
            renderableData->isInteracting ? COLOR_RED : COLOR_GREEN );
         gameEngine->frameBuffer->drawPoint(renderableData->center - gameEngine->gameControl->camera.adjustedCameraPosition, 5, COLOR_BLUE);
         if (getPlayerEntityIndex() == filteredPlayerEntityIndex)
         {
            auto interactBoxOrigin = renderableData->interactBox.origin - gameEngine->gameControl->camera.adjustedCameraPosition;
            gameEngine->frameBuffer->drawRect(interactBoxOrigin, renderableData->interactBox.w, renderableData->interactBox.h, 
               renderableData->isInteracting ? COLOR_BLUE : COLOR_YELLOW);
         }
      }
   }
}
void MageMap::Draw(MageGameControl* gameControl, uint8_t layer, const MageCamera& camera, bool isCollisionDebugOn)
{
   const auto layerAddress = LayerOffset(layer);
   if (layerAddress == 0)
   {
      return;
   }

   Point playerPoint = entities[getMapLocalEntityId(playerEntityIndex)]
      .getRenderableData()->center;

   for (auto i = 0; i < cols * rows; i++)
   {
      auto tileOrigin = Point{ tileWidth * (i % cols), tileHeight * (i / cols) };
      auto tileDrawPoint = tileOrigin - camera.adjustedCameraPosition;

      if (tileDrawPoint.x + tileWidth < 0 || tileDrawPoint.x >= WIDTH
         || tileDrawPoint.y + tileHeight < 0 || tileDrawPoint.y >= HEIGHT)
      {
         continue;
      }

      auto address = layerAddress + (i * sizeof(MageMapTile));

      const MageMapTile* currentTile;
      ROM->GetPointerTo(currentTile, address);
      if (currentTile->tileId == 0) { continue; }

      //currentTile.tileId -= 1;
      auto tileset = gameControl->tileManager->GetTileset(currentTile->tilesetId);
      gameControl->tileManager->DrawTile(currentTile, x, y);
      
      if (isCollisionDebugOn)
      {
         auto geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile->tileId-1);
         if (geometryId)
         {
            geometryId -= 1;

            auto geometryOffset = geometryHeader.offset(geometryId % geometryHeader.count());
            const MageGeometry* geometryIn;
            ROM->GetPointerTo(geometryIn, geometryOffset);
            auto geometry = geometryIn->flipSelfByFlags(currentTile->flags, tileset->TileWidth(), tileset->TileHeight());

            auto points = geometry.getPoints();
            bool isMageInGeometry = false;
            
            if (playerEntityIndex != NO_PLAYER
             && playerPoint.x >= tileDrawPoint.x && playerPoint.x <= tileDrawPoint.x + tileset->TileWidth()
             && playerPoint.y >= tileDrawPoint.y && playerPoint.y <= tileDrawPoint.y + tileset->TileHeight())
            {
               auto offsetPoint = playerPoint - tileDrawPoint;
               isMageInGeometry = geometry.isPointInGeometry(offsetPoint);
            }

            if (geometry.GetTypeId() == MageGeometryType::Point)
            {
               frameBuffer->drawPoint(points[0] + tileDrawPoint - camera.adjustedCameraPosition, 4, isMageInGeometry ? COLOR_RED : COLOR_GREEN);
            }
            else
            {
               // POLYLINE segmentCount is pointCount - 1
               // POLYGON segmentCount is same as pointCount
               for (int i = 0; i < points.size(); i++)
               {
                  auto pointA = points[i];
                  auto pointB = points[(i + 1) % points.size()];
                  frameBuffer->drawLine(pointA + tileDrawPoint - camera.adjustedCameraPosition, 
                     pointB + tileDrawPoint - camera.adjustedCameraPosition, 
                     isMageInGeometry ? COLOR_RED : COLOR_GREEN);
               }
            }
         }
      }
   }
}

void MageMap::DrawGeometry(const MageCamera& camera)
{
   const Point* playerPosition;
   bool isColliding = false;
   if (playerEntityIndex != NO_PLAYER)
   {
      auto renderable = entities[getMapLocalEntityId(playerEntityIndex)].getRenderableData();
      playerPosition = &renderable->center;
   }

   for (uint16_t i = 0; i < GeometryCount(); i++)
   {
      auto geometryOffset = geometryHeader.offset(getGlobalGeometryId(i) % geometryHeader.count());
      const MageGeometry* geometry;
      ROM->GetPointerTo(geometry, geometryOffset);

      if (playerEntityIndex != NO_PLAYER)
      {
         isColliding = geometry->isPointInGeometry(*playerPosition);
      }
      //geometry.draw(cameraX, cameraY, isColliding ? COLOR_RED : COLOR_GREEN);
   }
}