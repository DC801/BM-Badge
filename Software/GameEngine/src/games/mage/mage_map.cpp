#include "mage_map.h"
#include "EnginePanic.h"
#include "shim_err.h"
#include <algorithm>
#include <numeric>
#include "mage.h"

void MapControl::Load(uint16_t index, bool isCollisionDebugOn, bool isEntityDebugOn)
{
   auto map = ROM()->InitializeRAMCopy<MapData>(index);
   
   for (auto i = 0; i < MAX_ENTITIES_PER_MAP; i++)
   {
      if (i < map->entityCount)
      {
         auto entityAddress = ROM()->GetAddress<MageEntity>(map->entityGlobalIds[i]);
         ROM()->Read(entities[i], entityAddress);
      }
      else
      {
         entities[i] = {};
      }
   }
   currentMap = std::move(map);
}

MapData::MapData(uint32_t& address, bool isEntityDebugOn)
{
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

   ROM()->InitializeVectorFrom(entityGlobalIds, address, entityCount);
   ROM()->InitializeVectorFrom(geometryGlobalIds, address, geometryCount);
   ROM()->InitializeVectorFrom(scriptGlobalIds, address, scriptCount);
   ROM()->InitializeVectorFrom(goDirections, address, goDirectionsCount);
   
   for (auto i = 0; i < layerCount; i++)
   {
      layerAddresses.push_back(address);
      address += rows * cols * sizeof(uint8_t*);
   }

   //padding to align with uint32_t memory spacing:
   if ((entityCount + geometryCount + scriptCount) % 2)
   {
      address += sizeof(uint16_t);
   }
}

void MapControl::DrawEntities(const Point& cameraPosition, bool isCollisionDebugOn) const
{
   int32_t cameraX = cameraPosition.x;
   int32_t cameraY = cameraPosition.y;
   //first sort entities by their y values:
   std::vector<size_t> entityDrawOrder(currentMap->entityCount);
   std::iota(entityDrawOrder.begin(), entityDrawOrder.end(), 0);
   auto sortByY = [&](size_t i1, size_t i2) { return entities[i1].location.y < entities[i2].location.y; };
   std::stable_sort(entityDrawOrder.begin(), entityDrawOrder.end(), sortByY);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (auto& entityIndex: entityDrawOrder)
   {
      auto& entity = entities[entityIndex];
      auto& renderableData = entityRenderableData[entityIndex];

      tileManager->DrawTile(renderableData, entity.location.x, entity.location.y);

      if (isCollisionDebugOn)
      {
         auto tileOrigin = Point{ uint16_t(entity.location.x - cameraX), uint16_t(entity.location.y - cameraY - currentMap->tileHeight) };
         auto hitboxOrigin = renderableData.hitBox.origin - cameraPosition;

         frameBuffer->drawRect(tileOrigin, currentMap->tileWidth, currentMap->tileHeight, COLOR_LIGHTGREY);
         frameBuffer->drawRect(hitboxOrigin, renderableData.hitBox.w, renderableData.hitBox.h, renderableData.isInteracting ? COLOR_RED : COLOR_GREEN);
         frameBuffer->drawPoint(renderableData.center - cameraPosition, 5, COLOR_BLUE);
         uint8_t filteredPlayerEntityIndex = getFilteredEntityId(currentMap->playerEntityIndex);
         if (getPlayerEntityIndex() == filteredPlayerEntityIndex)
         {
            auto interactBoxOrigin = renderableData.interactBox.origin - cameraPosition;
            frameBuffer->drawRect(interactBoxOrigin, renderableData.interactBox.w, renderableData.interactBox.h, renderableData.isInteracting ? COLOR_BLUE : COLOR_YELLOW);
         }
      }
   }
}
void MapControl::Draw(uint8_t layer, const Point& cameraPosition, bool isCollisionDebugOn) const
{
   const auto layerAddress = LayerAddress(layer);
   if (layerAddress == 0)
   {
      return;
   }

   Point playerPoint = entityRenderableData[currentMap->playerEntityIndex].center;

   for (auto i = 0; i < currentMap->cols * currentMap->rows; i++)
   {
      auto tileOrigin = Point{ uint16_t(currentMap->tileWidth * (i % currentMap->cols)), uint16_t(currentMap->tileHeight * (i / currentMap->rows)) };
      auto tileDrawPoint = tileOrigin - cameraPosition;

      // don't draw tiles that are entirely outside the screen bounds
      if (tileDrawPoint.x + currentMap->tileWidth < 0 || tileDrawPoint.x >= WIDTH
         || tileDrawPoint.y + currentMap->tileHeight < 0 || tileDrawPoint.y >= HEIGHT)
      {
         continue;
      }

      auto address = layerAddress + (i * sizeof(MageMapTile));

      auto currentTile = ROM()->GetReadPointerToAddress<MageMapTile>(address);
      if (currentTile->tileId == 0) { continue; }

      //currentTile.tileId -= 1;
      auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentTile->tilesetId);

      tileManager->DrawTile(tileset, tileDrawPoint.x, tileDrawPoint.y, currentTile->flags);

      if (isCollisionDebugOn)
      {
         auto geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile->tileId - 1);
         if (geometryId)
         {
            geometryId -= 1;

            auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(geometryId);
            auto geometryPoints = geometry->FlipByFlags(currentTile->flags, tileset->TileWidth, tileset->TileHeight);

            bool isMageInGeometry = false;

            if (currentMap->playerEntityIndex != NO_PLAYER
               && playerPoint.x >= tileDrawPoint.x && playerPoint.x <= tileDrawPoint.x + tileset->TileWidth
               && playerPoint.y >= tileDrawPoint.y && playerPoint.y <= tileDrawPoint.y + tileset->TileHeight)
            {
               auto offsetPoint = playerPoint - tileDrawPoint;
               isMageInGeometry = geometry->isPointInGeometry(offsetPoint);
            }

            if (geometry->GetTypeId() == MageGeometryType::Point)
            {
               frameBuffer->drawPoint(geometryPoints[0] + tileDrawPoint - cameraPosition, 4, isMageInGeometry ? COLOR_RED : COLOR_GREEN);
            }
            else
            {
               // POLYLINE segmentCount is pointCount - 1
               // POLYGON segmentCount is same as pointCount
               for (int i = 0; i < geometryPoints.size(); i++)
               {
                  auto& pointA = geometryPoints[i] + tileDrawPoint - cameraPosition;
                  auto& pointB = geometryPoints[i + 1] + tileDrawPoint - cameraPosition;
                  frameBuffer->drawLine(pointA, pointB, isMageInGeometry ? COLOR_RED : COLOR_GREEN);
               }
            }
         }
      }
   }
}

void MapControl::DrawGeometry(const Point& cameraPosition) const
{
   Point playerPosition;
   bool isColliding = false;
   if (currentMap->playerEntityIndex != NO_PLAYER)
   {
      playerPosition = entityRenderableData[currentMap->playerEntityIndex].center;
      for (uint16_t i = 0; i < GeometryCount(); i++)
      {
         auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(getGlobalGeometryId(i));
         isColliding = geometry->isPointInGeometry(playerPosition);
         //geometry.draw(cameraX, cameraY, isColliding ? COLOR_RED : COLOR_GREEN);
      }
   }
}


void MapControl::UpdateEntities(uint32_t deltaTime)
{
   for (auto i = 0; i < currentMap->entityCount; i++)
   {
      auto& entity = entities[i];
      auto& renderableData = entityRenderableData[i];
      entity.updateRenderableData(renderableData, deltaTime);
   }
}
