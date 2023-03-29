#include "mage_map.h"
#include "EnginePanic.h"
#include "shim_err.h"
#include <algorithm>
#include <numeric>
#include "mage.h"

void MapControl::Load(uint16_t index)
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

MapData::MapData(uint32_t& address)
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

   //padding to align with uint32_t memory spacing:
   if ((entityCount + geometryCount + scriptCount) % 2)
   {
      address += sizeof(uint16_t);
   }

   for (auto i = 0; i < layerCount; i++)
   {
      layerAddresses.push_back(address);
      address += rows * cols * sizeof(uint8_t*);
   }
}

void MapControl::DrawEntities(const Point& cameraPosition) const
{
   //sort entity indices by the entity y values:
   std::vector<size_t> entityDrawOrder(currentMap->entityCount);
   std::iota(entityDrawOrder.begin(), entityDrawOrder.end(), 0);
   auto sortByY = [&](size_t i1, size_t i2) { return entities[i1].y < entities[i2].y; };
   std::stable_sort(entityDrawOrder.begin(), entityDrawOrder.end(), sortByY);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (auto& entityIndex : entityDrawOrder)
   {
      tileManager->DrawTile(entityRenderableData[entityIndex], cameraPosition, getGlobalGeometryId(entityIndex));
   }
}

void MapControl::DrawLayer(uint8_t layer, const Point& cameraPosition) const
{
   auto layerAddress = LayerAddress(layer);
   auto layers = ROM()->GetReadPointerToAddress<MageMapTile>(layerAddress);

   for (auto mapTileRow = 0; mapTileRow < currentMap->rows; mapTileRow++)
   {
      for (auto mapTileCol = 0; mapTileCol < currentMap->cols; mapTileCol++)
      {
         auto tileIndex = mapTileCol + (mapTileRow * currentMap->cols);
         auto currentTile = &layers[tileIndex];

         if (!currentTile->tileId) { continue; }

         auto tileDrawPoint = Point{ currentMap->tileWidth * mapTileCol, currentMap->tileHeight * mapTileRow } - cameraPosition;

         // don't draw tiles that are entirely outside the screen bounds
         if (tileDrawPoint.x + currentMap->tileWidth < 0 || tileDrawPoint.x >= ScreenWidth
            || tileDrawPoint.y + currentMap->tileHeight < 0 || tileDrawPoint.y >= ScreenHeight)
         {
            continue;
         }

         tileManager->DrawTile(currentTile->tilesetId, currentTile->tileId - 1, tileDrawPoint, currentTile->flags);
      }
   }
}

void MapControl::DrawGeometry(const Point& camera) const
{
   bool isColliding = false;
   if (currentMap->playerEntityIndex != NO_PLAYER)
   {
      auto playerPosition = entityRenderableData[currentMap->playerEntityIndex].center;
      for (uint16_t i = 0; i < GeometryCount(); i++)
      {
         auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(getGlobalGeometryId(i));
         isColliding = geometry->isPointInGeometry(playerPosition);
         //geometry->draw(camera.x, camera.y, isColliding ? COLOR_RED : COLOR_GREEN);
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

void MapControl::TryMovePlayer(const Point& playerVelocity)
{
   auto pushback = Point{ 0,0 };
   auto minPushback = float{ 9999.9f };

   auto setPushbackToMinCollision = [&](const Point& hitboxCorner) {

      auto internalPushbackCalc = [&](const MageMapTile* tile, const Point& tileCorner) {

         auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tile->tilesetId);
         auto geometry = tileset->GetGeometryForTile(tile->tileId - 1);
         if (geometry)
         {
            auto geometryPoints = geometry->FlipByFlags(tile->flags, tileset->TileWidth, tileset->TileHeight);
            for (auto i = 0; i < geometryPoints.size(); i += 2)
            {
               auto& geometryPointA = geometryPoints[i] + tileCorner;
               auto& geometryPointB = geometryPoints[(i + 1) % geometryPoints.size()] + tileCorner;

               auto intersection = MageGeometry::getIntersectPointBetweenLineSegments(hitboxCorner, hitboxCorner + playerVelocity, geometryPointA, geometryPointB);
               if (intersection.has_value())
               {
                  auto& intersectionPoint = intersection.value();
                  auto cornerDistance = MageGeometry::VectorLength(intersectionPoint.x - hitboxCorner.x, intersectionPoint.y - hitboxCorner.y);
                  if (cornerDistance < minPushback)
                  {
                     pushback = intersectionPoint - hitboxCorner;
                  }
               }
            }
         }
      };

      for (auto layerIndex = 0; layerIndex < LayerCount(); layerIndex++)
      {
         auto tileCorner = Point{ 0,0 };
         auto getTile = [&](const Point & point)
         {
            auto layerAddress = LayerAddress(layerIndex);
            auto layerTiles = ROM()->GetReadPointerToAddress<MageMapTile>(layerAddress);

            auto col = point.x / TileWidth();
            auto row = point.y / TileHeight();
            auto tileIndex = col + (row * Cols());
            tileCorner = Point{ col * TileWidth(), row * TileHeight() };
            return &layerTiles[tileIndex];
         };

         const auto tile = getTile(hitboxCorner);
         internalPushbackCalc(tile, tileCorner);

         const auto tileAfterMove = getTile(hitboxCorner + playerVelocity);
         if (tile != tileAfterMove)
         {
            internalPushbackCalc(tileAfterMove, tileCorner);
         }
      }
   };

   const auto& playerHitBox = getPlayerEntityRenderableData().hitBox;
   const auto topLeft = Point{ playerHitBox.origin.x, playerHitBox.origin.y };
   const auto topRight = Point{ playerHitBox.origin.x + playerHitBox.w, playerHitBox.origin.y };
   const auto bottomLeft = Point{ playerHitBox.origin.x, playerHitBox.origin.y + playerHitBox.h };
   const auto bottomRight = Point{ playerHitBox.origin.x + playerHitBox.w, playerHitBox.origin.y + playerHitBox.h };

   //right
   if (playerVelocity.x > 0)
   {
      setPushbackToMinCollision(topRight);
      setPushbackToMinCollision(bottomRight);
   }
   //left
   else if (playerVelocity.x < 0)
   {
      setPushbackToMinCollision(topLeft);
      setPushbackToMinCollision(bottomLeft);
   }

   //down
   if (playerVelocity.y > 0)
   {
      setPushbackToMinCollision(bottomLeft);
      setPushbackToMinCollision(bottomRight);
   }
   //up
   else if (playerVelocity.y < 0)
   {
      setPushbackToMinCollision(topLeft);
      setPushbackToMinCollision(topRight);
   }

   getPlayerEntity().x += playerVelocity.x - pushback.x;
   getPlayerEntity().y += playerVelocity.y - pushback.y;
}