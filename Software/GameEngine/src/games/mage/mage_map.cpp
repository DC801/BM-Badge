#include "mage_map.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "convert_endian.h"
#include "shim_err.h"
#include <algorithm>
#include "mage.h"

MageMap::MageMap(std::shared_ptr<EngineROM> ROM, uint32_t address)
   : ROM(ROM)
{
   uint32_t size = 0;

   // Read name
   ROM->Read(
      address,
      MapNameLength,
      (uint8_t*)name
   );
   address += MapNameLength;

   //read tileWidth
   ROM->Read(
      address,
      sizeof(tileWidth),
      (uint8_t*)&tileWidth
   );
   tileWidth = ROM_ENDIAN_U2_VALUE(tileWidth);
   address += sizeof(tileWidth);

   //read tileHeight
   ROM->Read(
      address,
      sizeof(tileHeight),
      (uint8_t*)&tileHeight
   );
   tileHeight = ROM_ENDIAN_U2_VALUE(tileHeight);
   address += sizeof(tileHeight);

   //read cols
   ROM->Read(
      address,
      sizeof(cols),
      (uint8_t*)&cols
   );
   cols = ROM_ENDIAN_U2_VALUE(cols);
   address += sizeof(cols);

   //read rows
   ROM->Read(
      address,
      sizeof(rows),
      (uint8_t*)&rows
   );
   rows = ROM_ENDIAN_U2_VALUE(rows);
   address += sizeof(rows);
   auto tilesPerLayer = cols * rows;

   //read onLoad
   ROM->Read(
      address,
      sizeof(onLoad),
      (uint8_t*)&onLoad
   );
   onLoad = ROM_ENDIAN_U2_VALUE(onLoad);
   address += sizeof(onLoad);

   //read onTick
   ROM->Read(
      address,
      sizeof(onTick),
      (uint8_t*)&onTick
   );
   onTick = ROM_ENDIAN_U2_VALUE(onTick);
   address += sizeof(onTick);

   //read onLook
   ROM->Read(
      address,
      sizeof(onLook),
      (uint8_t*)&onLook
   );
   onLook = ROM_ENDIAN_U2_VALUE(onLook);
   address += sizeof(onLook);

   //read layerCount
   ROM->Read(
      address,
      sizeof(layerCount),
      &layerCount
   );
   address += sizeof(layerCount);

   //read playerEntityIndex
   ROM->Read(
      address,
      sizeof(playerEntityIndex),
      &playerEntityIndex
   );
   address += sizeof(playerEntityIndex);

   //read entityCount
   ROM->Read(
      address,
      sizeof(entityCount),
      (uint8_t*)&entityCount
   );
   entityCount = ROM_ENDIAN_U2_VALUE(entityCount);
   address += sizeof(entityCount);

   //read geometryCount
   ROM->Read(
      address,
      sizeof(geometryCount),
      (uint8_t*)&geometryCount
   );
   geometryCount = ROM_ENDIAN_U2_VALUE(geometryCount);
   address += sizeof(geometryCount);

   //read scriptCount
   ROM->Read(
      address,
      sizeof(scriptCount),
      (uint8_t*)&scriptCount
   );
   scriptCount = ROM_ENDIAN_U2_VALUE(scriptCount);
   address += sizeof(scriptCount);

   uint8_t goDirectionCount{ 0 };
   //read goDirectionCount
   ROM->Read(
      address,
      sizeof(goDirectionCount),
      (uint8_t*)&goDirectionCount
   );
   address += sizeof(goDirectionCount);

   address += sizeof(uint8_t); // padding

   //read entityGlobalIds
   entityGlobalIds = std::vector<uint16_t>{ entityCount };
   size = sizeof(uint16_t) * entityCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)entityGlobalIds.data()
   );
   ROM_ENDIAN_U2_BUFFER(entityGlobalIds.data(), entityCount);
   address += size;

   //read geometryGlobalIds
   geometryGlobalIds = std::vector<uint16_t>{ geometryCount };
   size = sizeof(uint16_t) * geometryCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)geometryGlobalIds.data()
   );
   ROM_ENDIAN_U2_BUFFER(geometryGlobalIds.data(), geometryCount);
   address += size;

   //read entityGlobalIds
   scriptGlobalIds = std::vector<uint16_t>{ scriptCount };
   size = sizeof(uint16_t) * scriptCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)scriptGlobalIds.data()
   );
   ROM_ENDIAN_U2_BUFFER(scriptGlobalIds.data(), scriptCount);
   address += size;

   //read goDirections
   goDirections = std::vector<GoDirection>{ goDirectionCount };
   size = sizeof(GoDirection) * goDirectionCount;
   ROM->Read(
      address,
      size,
      (uint8_t*)goDirections.data()
   );
   for (int i = 0; i < goDirectionCount; ++i)
   {
      UNUSED_RETURN_VALUE(
         ROM_ENDIAN_U2_VALUE(&goDirections[i].mapLocalScriptId)
      );

   }
   address += size;

   //padding to align with uint32_t memory spacing:
   if ((entityCount + geometryCount + scriptCount) % 2)
   {
      address += sizeof(uint16_t); // Padding
   }

   mapLayerOffsets = std::vector<uint32_t>(layerCount);

   for (uint32_t i = 0; i < layerCount; i++)
   {
      mapLayerOffsets[i] = address;
      address += tilesPerLayer * (sizeof(uint16_t) + (2 * sizeof(uint8_t)));
   }
}


uint16_t MageMap::getGlobalEntityId(uint16_t mapLocalEntityId) const
{
   if (entityGlobalIds.empty()) return 0;
   return entityGlobalIds[mapLocalEntityId % entityGlobalIds.size()];
}

uint16_t MageMap::getGlobalGeometryId(uint16_t mapLocalGeometryId) const
{
   if (geometryGlobalIds.empty()) return 0;
   return geometryGlobalIds[mapLocalGeometryId % geometryGlobalIds.size()];
}

uint16_t MageMap::getGlobalScriptId(uint16_t mapLocalScriptId) const
{
   if (scriptGlobalIds.empty()) return 0;
   return scriptGlobalIds[mapLocalScriptId % scriptGlobalIds.size()];
}

std::string MageMap::getDirectionNames() const
{
   std::string result = "";
   for (auto& goDirection : goDirections)
   {
      result += "\t";
      result += goDirection.name;
   }
   return result;
}

uint16_t MageMap::getDirectionScriptId(const std::string directionName) const
{
   uint16_t result = 0;
   for (auto& direction : goDirections)
   {
      if (direction.name == directionName)
      {
         result = direction.mapLocalScriptId;
         break;
      }
   }
   return result;
}


void MageMap::PopulateData(MageGameEngine* gameEngine)
{
   if (entityCount > MAX_ENTITIES_PER_MAP)
   {
      char errorString[256];
      sprintf(
         errorString,
         "Error: Game is attempting to load more than %d entities on one ",
         MAX_ENTITIES_PER_MAP
      );
      ENGINE_PANIC(errorString);
   }

   //debug_print(
   //	"Populate entities:"
   //);

   for (uint8_t i = 0; i < entityCount; i++)
   {
      auto offset = gameEngine->gameControl->entityHeader->offset(getGlobalEntityId(i));
      //fill in entity data from gameEngine->ROM:
      auto entity = MageEntity{ ROM, offset };
      //debug_print(
      //	"originalId: %d, filteredId: %d, name: %s",
      //	i,
      //	filteredEntityCountOnThisMap,
      //	entity.name
      //);
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
   for (uint32_t i = 0; i < filteredEntityCountOnThisMap; i++)
   {
      //other values are filled in when getEntityRenderableData is called:
      //entities[i].updateRenderableData(this);
      //updateEntityRenderableData(getMapLocalEntityId(i), true);
   }
}


void MageMap::DrawEntities(MageGameEngine* gameEngine)
{
   int32_t cameraX = gameEngine->gameControl->camera.adjustedCameraPosition.x;
   int32_t cameraY = gameEngine->gameControl->camera.adjustedCameraPosition.y;
   //first sort entities by their y values:
   std::sort(
      entities.begin(),
      entities.end(),
      [](const MageEntity& entity1, const MageEntity& entity2) { return entity1.y < entity2.y; }
   );

   uint8_t filteredPlayerEntityIndex = getFilteredEntityId(playerEntityIndex);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (uint8_t i = 0; i < FilteredEntityCount(); i++)
   {
      //uint8_t entityIndex = entitySortOrder[i];
      MageEntity* entity = &entities[i];
      auto renderableData = entity->getRenderableData();
      MageTileset* tileset = &gameEngine->gameControl->tilesets[renderableData->tilesetId];
      uint16_t imageId = tileset->ImageId();
      uint16_t tileWidth = tileset->TileWidth();
      uint16_t tileHeight = tileset->TileHeight();
      uint16_t cols = tileset->Cols();
      uint16_t tileId = renderableData->tileId;
      uint32_t address = gameEngine->gameControl->imageHeader->offset(imageId);
      uint16_t source_x = (tileId % cols) * tileWidth;
      uint16_t source_y = (tileId / cols) * tileHeight;
      int32_t x = entity->x - cameraX;
      int32_t y = entity->y - cameraY - tileHeight;
      gameEngine->frameBuffer->drawChunkWithFlags(
         address,
         gameEngine->gameControl->getValidColorPalette(imageId),
         x,
         y,
         tileWidth,
         tileHeight,
         source_x,
         source_y,
         tileset->ImageWidth(),
         TRANSPARENCY_COLOR,
         renderableData->renderFlags
      );

      if (gameEngine->gameControl->isCollisionDebugOn)
      {
         gameEngine->frameBuffer->drawRect(
            x, y,
            tileWidth,
            tileHeight,
            COLOR_LIGHTGREY
         );
         gameEngine->frameBuffer->drawRect(
            renderableData->hitBox.x - cameraX,
            renderableData->hitBox.y - cameraY,
            renderableData->hitBox.w,
            renderableData->hitBox.h,
            renderableData->isInteracting
            ? COLOR_RED
            : COLOR_GREEN
         );
         gameEngine->frameBuffer->drawPoint(
            renderableData->center.x - cameraX,
            renderableData->center.y - cameraY,
            5,
            COLOR_BLUE
         );
         if (getPlayerEntityIndex() == filteredPlayerEntityIndex)
         {
            gameEngine->frameBuffer->drawRect(
               renderableData->interactBox.x - cameraX,
               renderableData->interactBox.y - cameraY,
               renderableData->interactBox.w,
               renderableData->interactBox.h,
               renderableData->isInteracting ? COLOR_BLUE : COLOR_YELLOW
            );
         }
      }
   }
}
