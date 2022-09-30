#include "mage_game_control.h"
#include "convert_endian.h"
#include "mage_animation.h"
#include "mage_defines.h"
#include "utility.h"

#include <array>
#include <algorithm>

// Initializer list, default construct values
//   Don't waste any resources constructing unique_ptr's
//   Each header is constructed with offsets from the previous
MageGameControl::MageGameControl(MageGameEngine* gameEngine)
   : gameEngine(gameEngine), camera{}
{
   uint32_t offset = ENGINE_ROM_IDENTIFIER_STRING_LENGTH; //skip 'MAGEGAME' + crc32 string at front of .dat file

   gameEngine->ROM->Read(&gameEngine->engineVersion, offset);

   if (gameEngine->engineVersion != ENGINE_VERSION)
   {
      ENGINE_PANIC(
         "game.dat is incompatible with Engine\n\n"
         "Engine version: %d\n"
         "game.dat version: %d",
         ENGINE_VERSION,
         gameEngine->engineVersion
      );
   }

   gameEngine->ROM->Read(&gameEngine->scenarioDataCRC32, offset);
   gameEngine->ROM->Read(&gameEngine->scenarioDataLength, offset);

   currentSaveIndex = 0;
   setCurrentSaveToFreshState();

   auto mapHeader = MageHeader{ gameEngine->ROM, offset };
   auto tilesetHeader = MageHeader{ gameEngine->ROM, offset };
   auto animationHeader = MageHeader{ gameEngine->ROM, offset };
   auto entityTypeHeader = MageHeader{ gameEngine->ROM, offset };
   auto entityHeader = MageHeader{ gameEngine->ROM, offset };
   geometryHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);

   auto scriptHeader = MageHeader{ gameEngine->ROM, offset };
   auto portraitHeader = MageHeader{ gameEngine->ROM, offset };

   dialogControl = std::make_unique<MageDialogControl>(gameEngine, offset);

   auto serialDialogHeader = MageHeader{ gameEngine->ROM, offset };

   auto colorPaletteHeader = MageHeader{ gameEngine->ROM, offset };

   stringHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   auto saveFlagHeader = MageHeader{ gameEngine->ROM, offset };
   auto variableHeader = MageHeader{ gameEngine->ROM, offset };

   imageHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);

   tilesets = std::vector<MageTileset>{ tilesetHeader.count() };
   for (uint8_t i = 0; i < tilesetHeader.count(); i++)
   {
      auto tilesetOffset = tilesetHeader.offset(i);
      tilesets[i] = MageTileset{ gameEngine->ROM, i, tilesetOffset };
   }

   animations = std::vector<MageAnimation>{ animationHeader.count() };
   for (uint32_t i = 0; i < animationHeader.count(); i++)
   {
      auto animationOffset = animationHeader.offset(i);
      animations[i] = MageAnimation{ gameEngine->ROM, animationOffset };
   }

   entityTypes = std::vector<MageEntityType>(entityTypeHeader.count());
   for (uint32_t i = 0; i < entityTypeHeader.count(); i++)
   {
      auto entityOffset = entityTypeHeader.offset(i);
      entityTypes[i] = MageEntityType{ gameEngine->ROM, entityOffset };
   }

   colorPalettes = std::vector<MageColorPalette>{ colorPaletteHeader.count() };
   for (uint32_t i = 0; i < colorPaletteHeader.count(); i++)
   {
      auto colorPaletteOffset = colorPaletteHeader.offset(i);
      colorPalettes[i] = MageColorPalette{ gameEngine->ROM, colorPaletteOffset };
   }

   //load the map
   currentSave.currentMapId = currentSave.currentMapId % (mapHeader.count());

   auto mapOffset = mapHeader.offset(currentSave.currentMapId);
   map = std::make_unique<MageMap>(gameEngine->ROM, mapOffset, std::move(mapHeader), std::move(entityHeader));

   playerEntityIndex = map->getPlayerEntityIndex();
   camera.followEntityId = playerEntityIndex;

   map->Load(currentSave.currentMapId);
   readSaveFromRomIntoRam(true);

   playerHasControl = true;
   playerHasHexEditorControl = true;
   playerHasHexEditorControlClipboard = true;

}

void MageGameControl::setCurrentSaveToFreshState()
{
   auto newSave = MageSaveGame{};
   newSave.scenarioDataCRC32 = gameEngine->scenarioDataCRC32;
   currentSave = newSave;
}

void MageGameControl::readSaveFromRomIntoRam(bool silenceErrors)
{
   gameEngine->ROM->ReadSaveSlot(
      currentSaveIndex,
      sizeof(MageSaveGame),
      (uint8_t*)&currentSave
   );

   bool engineIncompatible = currentSave.engineVersion != gameEngine->engineVersion;
   bool saveLengthIncompatible = currentSave.saveDataLength != sizeof(MageSaveGame);
   bool scenarioIncompatible = currentSave.scenarioDataCRC32 != gameEngine->scenarioDataCRC32;
   if (engineIncompatible
      || saveLengthIncompatible
      || scenarioIncompatible)
   {
      std::string errorString = std::string("");
      if (scenarioIncompatible)
      {
         errorString.assign(
            "Save data is incompatible with current\n"
            "scenario data. Starting with fresh save."
         );
      }
      if (engineIncompatible || saveLengthIncompatible)
      {
         errorString.assign(
            "Save data is incompatible with current\n"
            "engine version. Starting with fresh save."
         );
      }
      debug_print("%s", errorString.c_str());
      if (!silenceErrors)
      {
         gameEngine->gameControl->dialogControl->showSaveMessageDialog(errorString);
      }
      setCurrentSaveToFreshState();
   }
   copyNameToAndFromPlayerAndSave(false);
}

void MageGameControl::saveGameSlotSave()
{
   // do rom writes
   copyNameToAndFromPlayerAndSave(true);
   gameEngine->ROM->WriteSaveSlot(
      currentSaveIndex,
      sizeof(MageSaveGame),
      &currentSave
   );
   readSaveFromRomIntoRam();
}

void MageGameControl::saveGameSlotErase(uint8_t slotIndex)
{
   currentSaveIndex = slotIndex;
   setCurrentSaveToFreshState();
   saveGameSlotSave();
}

void MageGameControl::saveGameSlotLoad(uint8_t slotIndex)
{
   currentSaveIndex = slotIndex;
   readSaveFromRomIntoRam();
   LoadMap(currentSave.currentMapId);
}

void MageGameControl::LoadMap(uint16_t index)
{

   //reset the fade fraction, in case player reset the map
   //while the fraction was anything other than 0
   gameEngine->frameBuffer->fadeFraction = 0;

   //close any open dialogs and return player control as well:
   dialogControl->closeDialog();
   playerHasControl = true;

   copyNameToAndFromPlayerAndSave(true);

   //get the data for the map:
   map->Load(index);

   copyNameToAndFromPlayerAndSave(false);

   //logAllEntityScriptValues("InitScripts-Before");
   gameEngine->scriptControl->initializeScriptsOnMapLoad();
   //logAllEntityScriptValues("InitScripts-After");

   //close hex editor if open:
   if (gameEngine->hexEditor->getHexEditorState())
   {
      gameEngine->hexEditor->toggleHexEditor();
   }
   if (playerEntityIndex != NO_PLAYER)
   {
      gameEngine->hexEditor->openToEntityByIndex(playerEntityIndex);
      gameEngine->hexEditor->toggleHexEditor();
   }
}

void MageGameControl::copyNameToAndFromPlayerAndSave(bool intoSaveRam) const
{
   if (playerEntityIndex == NO_PLAYER)
   {
      return;
   }
   auto playerEntity = &map->entities[map->getPlayerEntityIndex()];
   uint8_t* destination = (uint8_t*)&playerEntity->name;
   uint8_t* source = (uint8_t*)&currentSave.name;
   if (intoSaveRam)
   {
      uint8_t* temp = destination;
      destination = source;
      source = temp;
   }
   memcpy(
      destination,
      source,
      MAGE_ENTITY_NAME_LENGTH
   );
}

void MageGameControl::applyUniversalInputs()
{
   //make map reload global regardless of player control state:
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor) && gameEngine->inputHandler->GetButtonState(KeyPress::Mem3))
   {
      gameEngine->scriptControl->mapLoadId = currentSave.currentMapId;
   }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor) && gameEngine->inputHandler->GetButtonState(KeyPress::Mem1)
      || gameEngine->inputHandler->GetButtonState(KeyPress::Mem1) && gameEngine->inputHandler->GetButtonState(KeyPress::Xor))
   {
      isEntityDebugOn = !isEntityDebugOn;
      LoadMap(currentSave.currentMapId);
      return;
   }
   //check to see if player input is allowed:
   if (dialogControl->isOpen() || !playerHasControl && !playerHasHexEditorControl)
   {
      return;
   }
   //make sure any button handling in this function can be processed in ANY game mode.
   //that includes the game mode, hex editor mode, any menus, maps, etc.
   ledSet(LED_PAGE, gameEngine->inputHandler->GetButtonState(KeyPress::Page) ? 0xFF : 0x00);
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor)) { gameEngine->hexEditor->setHexOp(HEX_OPS_XOR); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Add)) { gameEngine->hexEditor->setHexOp(HEX_OPS_ADD); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Sub)) { gameEngine->hexEditor->setHexOp(HEX_OPS_SUB); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit128)) { gameEngine->hexEditor->runHex(0b10000000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit64)) { gameEngine->hexEditor->runHex(0b01000000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit32)) { gameEngine->hexEditor->runHex(0b00100000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit16)) { gameEngine->hexEditor->runHex(0b00010000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit8)) { gameEngine->hexEditor->runHex(0b00001000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit4)) { gameEngine->hexEditor->runHex(0b00000100); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit2)) { gameEngine->hexEditor->runHex(0b00000010); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit1)) { gameEngine->hexEditor->runHex(0b00000001); }

   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor) && gameEngine->inputHandler->GetButtonState(KeyPress::Mem0)
      || gameEngine->inputHandler->GetButtonState(KeyPress::Mem0) && gameEngine->inputHandler->GetButtonState(KeyPress::Xor))
   {
      isCollisionDebugOn = !isCollisionDebugOn;
   }
}

void MageGameControl::applyGameModeInputs(uint32_t deltaTime)
{
   //set mage speed based on if the right pad down is being pressed:
   float moveType = gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_down) ? MAGE_RUNNING_SPEED : MAGE_WALKING_SPEED;
   float howManyMsPerSecond = 1000.0;
   float whatFractionOfSpeed = moveType / howManyMsPerSecond;
   mageSpeed = whatFractionOfSpeed * MAGE_MIN_MILLIS_BETWEEN_FRAMES;
   if (dialogControl->isOpen())
   {
      // If interacting with the dialog this tick has closed the dialog,
      // return early before the same "advance button press triggers an on_interact below
      dialogControl->update();
      return;
   }
   // if there is a player on the map
   if (playerEntityIndex != NO_PLAYER)
   {
      //get useful variables for below:
      //updateEntityRenderableData(playerEntityIndex);
      auto playerEntity = getEntityByMapLocalId(playerEntityIndex);
      playerEntity->updateRenderableData(this);

      //update renderable info before proceeding:
      uint16_t playerEntityTypeId = playerEntity->primaryIdType % NUM_PRIMARY_ID_TYPES;
      bool hasEntityType = playerEntityTypeId == ENTITY_TYPE;
      MageEntityType* entityType = hasEntityType ? &entityTypes[playerEntityTypeId] : nullptr;
      uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
      uint16_t tilesetWidth = tilesets[playerEntity->getRenderableData()->tilesetId].TileWidth();
      uint16_t tilesetHeight = tilesets[playerEntity->getRenderableData()->tilesetId].TileHeight();
      bool playerIsActioning = playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX;
      bool acceptPlayerInput = !(dialogControl->isOpen() || !playerHasControl);

      isMoving = false;

      //check to see if the mage is pressing the action button, or currently in the middle of an action animation.
      if (acceptPlayerInput
         && (playerIsActioning || gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_left))
         )
      {
         playerIsActioning = true;
      }
      //if not actioning or resetting, handle all remaining inputs:
      else if (acceptPlayerInput)
      {
         playerVelocity = { 0,0 };
         MageEntityAnimationDirection direction = playerEntity->direction;
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left)) { playerVelocity.x -= mageSpeed; direction = WEST; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right)) { playerVelocity.x += mageSpeed; direction = EAST; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)) { playerVelocity.y -= mageSpeed; direction = NORTH; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)) { playerVelocity.y += mageSpeed; direction = SOUTH; isMoving = true; }
         if (isMoving)
         {
            playerEntity->direction = updateDirectionAndPreserveFlags(direction, playerEntity->direction);
            Point pushback = getPushBackFromTilesThatCollideWithPlayer();
            Point velocityAfterPushback = {
               playerVelocity.x + pushback.x,
               playerVelocity.y + pushback.y,
            };
            float dotProductOfVelocityAndPushback = playerVelocity.DotProduct(velocityAfterPushback);
            // false would mean that the pushback is greater than the input velocity,
            // which would glitch the player into geometry really bad, so... don't.
            if (dotProductOfVelocityAndPushback > 0)
            {
               playerEntity->x += velocityAfterPushback.x;
               playerEntity->y += velocityAfterPushback.y;
            }
         }
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Rjoy_right))
         {
            handleEntityInteract();
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_up))
         {
            handleEntityInteract(true);
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_center))
         {
            //no task assigned to ljoy_center in game mode
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_center))
         {
            //no task assigned to rjoy_center in game mode
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Page))
         {
            //no task assigned to op_page in game mode
         }
      }


      //handle animation assignment for the player:
      //Scenario 1 - preform action:
      if (playerIsActioning
         && hasEntityType
         && entityType->AnimationCount() >= MAGE_ACTION_ANIMATION_INDEX)
      {
         playerEntity->currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
      }
      //Scenario 2 - show walk animation:
      else if (isMoving
         && hasEntityType
         && entityType->AnimationCount() >= MAGE_WALK_ANIMATION_INDEX)
      {
         playerEntity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
      }
      //Scenario 3 - show idle animation:
      else if (acceptPlayerInput)
      {
         playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
      }

      //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
      bool isPlayingActionButShouldReturnControlToPlayer =
         hasEntityType
         && (playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
         && (playerEntity->currentFrameIndex == (playerEntity->getRenderableData()->frameCount - 1))
         && (playerEntity->getRenderableData()->currentFrameTicks + deltaTime >= (playerEntity->getRenderableData()->duration));

      //if the above bool is true, set the player back to their idle animation:
      if (isPlayingActionButShouldReturnControlToPlayer)
      {
         playerEntity->currentFrameIndex = 0;
         playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
      }

      //if the animation changed since the start of this function, reset to the first frame and restart the timer:
      if (previousPlayerAnimation != playerEntity->currentAnimation)
      {
         playerEntity->currentFrameIndex = 0;
         playerEntity->getRenderableData()->currentFrameTicks = 0;
      }

      //What scenarios call for an extra renderableData update?
      if (isMoving || (playerEntity->getRenderableData()->lastTilesetId != playerEntity->getRenderableData()->tilesetId))
      {
         //updateEntityRenderableData(playerEntityIndex);
         playerEntity->updateRenderableData(this);
      }
      if (!acceptPlayerInput || !playerHasHexEditorControl)
      {
         return;
      }

      //opening the hex editor is the only button press that will lag actual gameplay by one frame
      //this is to allow entity scripts to check the hex editor state before it opens to run scripts
      if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Hax))
      {
         gameEngine->hexEditor->toggleHexEditor();
      }
      gameEngine->hexEditor->applyMemRecallInputs();
   }
   else //no player on map
   {
      if (!playerHasControl)
      {
         return;
      }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left)) { camera.position.x -= mageSpeed; }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right)) { camera.position.x += mageSpeed; }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)) { camera.position.y -= mageSpeed; }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)) { camera.position.y += mageSpeed; }

      if (!playerHasHexEditorControl)
      {
         return;
      }
      if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Hax)) { gameEngine->hexEditor->toggleHexEditor(); }
      gameEngine->hexEditor->applyMemRecallInputs();
   }
}

void MageGameControl::handleEntityInteract(bool hack)
{
   //interacting is impossible if there is no player entity, so return.
   if (playerEntityIndex == NO_PLAYER)
   {
      return;
   }
   auto playerRenderableData = map->entities[map->getMapLocalEntityId(playerEntityIndex)].getRenderableData();
   MageEntity::RenderableData* targetRenderableData;
   MageEntity* playerEntity = getEntityByMapLocalId(playerEntityIndex);
   MageEntity* targetEntity;
   playerRenderableData->interactBox.x = playerRenderableData->hitBox.x;
   playerRenderableData->interactBox.y = playerRenderableData->hitBox.y;
   playerRenderableData->interactBox.w = playerRenderableData->hitBox.w;
   playerRenderableData->interactBox.h = playerRenderableData->hitBox.h;
   uint8_t interactLength = 32;
   MageEntityAnimationDirection direction = getValidEntityTypeDirection(playerEntity->direction);
   if (direction == NORTH)
   {
      playerRenderableData->interactBox.y -= interactLength;
      playerRenderableData->interactBox.h = interactLength;
   }
   if (direction == EAST)
   {
      playerRenderableData->interactBox.x += playerRenderableData->interactBox.w;
      playerRenderableData->interactBox.w = interactLength;
   }
   if (direction == SOUTH)
   {
      playerRenderableData->interactBox.y += playerRenderableData->interactBox.h;
      playerRenderableData->interactBox.h = interactLength;
   }
   if (direction == WEST)
   {
      playerRenderableData->interactBox.x -= interactLength;
      playerRenderableData->interactBox.w = interactLength;
   }
   for (uint8_t i = 0; i < map->FilteredEntityCount(); i++)
   {
      // reset all interact states first
      targetRenderableData = &entityRenderableData[i];
      targetRenderableData->isInteracting = false;
      if (i != playerEntityIndex)
      {
         targetEntity = &map->entities[i];
         bool colliding = targetRenderableData->hitBox
            .Overlaps(playerRenderableData->interactBox);

         if (colliding)
         {
            playerRenderableData->isInteracting = true;
            targetRenderableData->isInteracting = true;
            isMoving = false;
            if (hack && playerHasHexEditorControl)
            {
               gameEngine->hexEditor->disableMovementUntilRJoyUpRelease();
               gameEngine->hexEditor->openToEntityByIndex(i);
            }
            else if (!hack && targetEntity->onInteractScriptId)
            {
               *gameEngine->scriptControl->getEntityInteractResumeState(i) =
                  MageScriptState{ targetEntity->onInteractScriptId, true };
            }
            break;
         }
      }
   }
}

void MageGameControl::DrawMap(uint8_t layer)
{
   int32_t camera_x = camera.adjustedCameraPosition.x;
   int32_t camera_y = camera.adjustedCameraPosition.y;
   uint32_t tilesPerLayer = map->Cols() * map->Rows();
   uint32_t layerAddress = map->LayerOffset(layer);
   if (layerAddress == 0)
   {
      return;
   }

   Point playerPoint = map->entities[map->getMapLocalEntityId(playerEntityIndex)]
      .getRenderableData()->center;
   for (uint32_t i = 0; i < tilesPerLayer; i++)
   {
      auto tile_x = (int32_t)(map->TileWidth() * (i % map->Cols()));
      auto tile_y = (int32_t)(map->TileHeight() * (i / map->Cols()));
      auto x = tile_x - camera_x;
      auto y = tile_y - camera_y;

      if ((x < (-map->TileWidth()) ||
         (x > WIDTH) ||
         (y < (-map->TileHeight())) ||
         (y > HEIGHT)))
      {
         continue;
      }
      auto address = layerAddress + (i * sizeof(MageMapTile));

      auto currentTile = MageMapTile{};

      gameEngine->ROM->Read(&currentTile, address);
      if (currentTile.tileId == 0)
      {
         continue;
      }

      currentTile.tileId -= 1;

      const auto& tileset = GetTileset(currentTile.tilesetId);

      MageColorPalette* colorPalette = getValidColorPalette(tileset->ImageId());
      address = imageHeader->offset(tileset->ImageId());
      gameEngine->frameBuffer->drawChunkWithFlags(
         address,
         colorPalette,
         x, y,
         tileset->TileWidth(),
         tileset->TileHeight(),
         (currentTile.tileId % tileset->Cols()) * tileset->TileWidth(),
         (currentTile.tileId / tileset->Cols()) * tileset->TileHeight(),
         tileset->ImageWidth(),
         TRANSPARENCY_COLOR,
         currentTile.flags
      );

      if (isCollisionDebugOn)
      {
         auto geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile.tileId);
         if (geometryId)
         {
            geometryId -= 1;
            auto geometry = getGeometryFromGlobalId(geometryId);
            geometry.flipSelfByFlags(
               currentTile.flags,
               tileset->TileWidth(),
               tileset->TileHeight()
            );
            bool isMageInGeometry = false;
            if (playerEntityIndex != NO_PLAYER
               && playerPoint.x >= tile_x && playerPoint.x <= tile_x + tileset->TileWidth()
               && playerPoint.y >= tile_y && playerPoint.y <= tile_y + tileset->TileHeight())
            {
               Point offsetPoint = {
                  playerPoint.x - tile_x,
                  playerPoint.y - tile_y,
               };
               isMageInGeometry = geometry.isPointInGeometry(offsetPoint);
            }

            if (geometry.typeId == MageGeometryType::Point)
            {
               gameEngine->frameBuffer->drawPoint(
                  geometry.points[0].x + tile_x - camera_x,
                  geometry.points[0].y + tile_y - camera_y,
                  4,
                  isMageInGeometry ? COLOR_RED : COLOR_GREEN
               );
            }
            else
            {
               // POLYLINE segmentCount is pointCount - 1
               // POLYGON segmentCount is same as pointCount
               for (int i = 0; i < geometry.segmentCount; i++)
               {
                  auto pointA = geometry.points[i];
                  auto pointB = geometry.points[(i + 1) % geometry.pointCount];
                  gameEngine->frameBuffer->drawLine(
                     pointA.x + tile_x - camera_x,
                     pointA.y + tile_y - camera_y,
                     pointB.x + tile_x - camera_x,
                     pointB.y + tile_y - camera_y,
                     isMageInGeometry ? COLOR_RED : COLOR_GREEN

                  );
               }
            }
            geometry.draw(
               camera_x,
               camera_y,
               isMageInGeometry
               ? COLOR_RED
               : COLOR_GREEN,
               tile_x,
               tile_y
            );
         }
      }
   }
}

Point MageGameControl::getPushBackFromTilesThatCollideWithPlayer()
{
   MageGeometry mageCollisionSpokes = MageGeometry(MageGeometryType::Polygon, MAGE_COLLISION_SPOKE_COUNT);
   float maxSpokePushbackLengths[MAGE_COLLISION_SPOKE_COUNT];
   Point maxSpokePushbackVectors[MAGE_COLLISION_SPOKE_COUNT];
   auto playerRenderableData = map->entities[map->getMapLocalEntityId(playerEntityIndex)].getRenderableData();
   uint32_t tilesPerLayer = map->Cols() * map->Rows();
   uint32_t layerAddress = 0;
   uint32_t address = 0;
   Rect playerRect = {
      playerRenderableData->hitBox.x,
      playerRenderableData->hitBox.y,
      playerRenderableData->hitBox.w,
      playerRenderableData->hitBox.h,
   };
   int16_t abs_x = abs(playerVelocity.x);
   int16_t abs_y = abs(playerVelocity.y);
   if (abs_x)
   {
      playerRect.w += abs_x;
      if (playerVelocity.x < 0)
      {
         playerRect.x += playerVelocity.x;
      }
   }
   if (abs_y)
   {
      playerRect.h += abs_y;
      if (playerVelocity.y < 0)
      {
         playerRect.y += playerVelocity.y;
      }
   }
   Point tileTopLeftPoint = {
      0,
      0,
   };
   int32_t x = 0;
   int32_t y = 0;
   uint16_t geometryId = 0;
   auto pushback = Point{};
   auto currentTile = MageMapTile{};
   Point playerPoint = playerRenderableData->center;
   // get the geometry for where the player is
   int32_t x0 = playerRect.x;
   int32_t x1 = x0 + playerRect.w;
   int32_t y0 = playerRect.y;
   int32_t y1 = y0 + playerRect.h;
   float playerSpokeRadius = playerRenderableData->hitBox.w / 1.5;
   float angleOffset = (
      atan2(playerVelocity.y, playerVelocity.x)
      - (PI / 2)
      + ((PI / MAGE_COLLISION_SPOKE_COUNT) / 2)
      );
   for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
   {
      maxSpokePushbackLengths[i] = -INFINITY;
      maxSpokePushbackVectors[i].x = 0;
      maxSpokePushbackVectors[i].y = 0;
      Point* spokePoint = &mageCollisionSpokes.points[i];
      float angle = (
         (((float)i) * (PI / MAGE_COLLISION_SPOKE_COUNT))
         + angleOffset
         );
      spokePoint->x = (
         (cos(angle) * playerSpokeRadius)
         + playerVelocity.x
         + playerPoint.x
         );
      spokePoint->y = (
         (sin(angle) * playerSpokeRadius)
         + playerVelocity.y
         + playerPoint.y
         );
   }
   if (isCollisionDebugOn)
   {
      gameEngine->frameBuffer->drawRect(
         playerRect.x - camera.position.x,
         playerRect.y - camera.position.y,
         playerRect.w,
         playerRect.h,
         COLOR_BLUE
      );
      for (int i = 0; i < mageCollisionSpokes.segmentCount; i++)
      {
         auto point = mageCollisionSpokes.points[i];
         gameEngine->frameBuffer->drawLine(
            point.x - camera.adjustedCameraPosition.x,
            point.y - camera.adjustedCameraPosition.y,
            playerPoint.x - camera.adjustedCameraPosition.x,
            playerPoint.y - camera.adjustedCameraPosition.y,
            COLOR_PURPLE
         );
      }
   }
   uint8_t layerCount = map->LayerCount();
   for (int layerIndex = 0; layerIndex < layerCount; layerIndex++)
   {
      layerAddress = map->LayerOffset(layerIndex);
      for (uint32_t i = 0; i < tilesPerLayer; i++)
      {
         tileTopLeftPoint.x = (int32_t)(map->TileWidth() * (i % map->Cols()));
         tileTopLeftPoint.y = (int32_t)(map->TileHeight() * (i / map->Cols()));
         x = tileTopLeftPoint.x - x0;
         y = tileTopLeftPoint.y - y0;
         if (
            (x < -map->TileWidth() ||
               (x > playerRect.w) ||
               (y < -map->TileHeight()) ||
               (y > playerRect.h))
            )
         {
            continue;
         }
         address = layerAddress + (i * sizeof(MageMapTile));

         gameEngine->ROM->Read(&currentTile, address);

         currentTile.tileId = ROM_ENDIAN_U2_VALUE(currentTile.tileId);

         if (currentTile.tileId == 0)
         {
            continue;
         }

         currentTile.tileId -= 1;

         auto tileset = GetTileset(currentTile.tilesetId);

         if (!tileset->Valid())
         {
            continue;
         }
         geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile.tileId);
         if (geometryId)
         {
            for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
            {
               float angle = (
                  (((float)i) * (PI / MAGE_COLLISION_SPOKE_COUNT))
                  + angleOffset
                  );
               Point* spokePoint = &mageCollisionSpokes.points[i];
               spokePoint->x = (
                  (
                     cos(angle)
                     * playerSpokeRadius
                     )
                  + playerVelocity.x
                  + playerPoint.x
                  - tileTopLeftPoint.x
                  );
               spokePoint->y = (
                  (
                     sin(angle)
                     * playerSpokeRadius
                     )
                  + playerVelocity.y
                  + playerPoint.y
                  - tileTopLeftPoint.y
                  );
            }
            geometryId--;

            auto geometry = getGeometryFromGlobalId(geometryId);
            geometry.flipSelfByFlags(
               currentTile.flags,
               tileset->TileWidth(),
               tileset->TileHeight()
            );

            Point offsetPoint = {
               playerPoint.x - tileTopLeftPoint.x,
               playerPoint.y - tileTopLeftPoint.y,
            };

            bool isMageInGeometry = MageGeometry::pushADiagonalsVsBEdges(
               &offsetPoint,
               &mageCollisionSpokes,
               maxSpokePushbackLengths,
               maxSpokePushbackVectors,
               &geometry,
               gameEngine->frameBuffer.get()
            );
            if (isCollisionDebugOn)
            {
               geometry.draw(
                  camera.adjustedCameraPosition.x,
                  camera.adjustedCameraPosition.y,
                  isMageInGeometry ? COLOR_RED : COLOR_YELLOW,
                  tileTopLeftPoint.x,
                  tileTopLeftPoint.y
               );
            }
         }
      }
   }
   uint8_t collisionCount = 0;
   for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
   {
      if (maxSpokePushbackLengths[i] != -INFINITY)
      {
         collisionCount++;
         pushback.x += maxSpokePushbackVectors[i].x;
         pushback.y += maxSpokePushbackVectors[i].y;
      };
   }
   if (collisionCount > 0)
   {
      pushback.x /= collisionCount;
      pushback.y /= collisionCount;
      gameEngine->frameBuffer->drawLine(
         playerPoint.x - camera.adjustedCameraPosition.x,
         playerPoint.y - camera.adjustedCameraPosition.y,
         playerPoint.x + pushback.x - camera.adjustedCameraPosition.x,
         playerPoint.y + pushback.y - camera.adjustedCameraPosition.y,
         COLOR_RED
      );
   }
   return pushback;
}

MageEntityType* MageGameControl::getValidEntityType(uint16_t entityTypeId)
{
   //always return a valid entity type for the entityTypeId submitted.
   return &entityTypes[getValidEntityTypeId(entityTypeId)];
}

MageEntityAnimationDirection MageGameControl::getValidEntityTypeDirection(MageEntityAnimationDirection direction)
{
   return (MageEntityAnimationDirection)((direction & RENDER_FLAGS_DIRECTION_MASK) % NUM_DIRECTIONS);
}

MageEntityAnimationDirection MageGameControl::updateDirectionAndPreserveFlags(MageEntityAnimationDirection desired, MageEntityAnimationDirection previous)
{
   return (MageEntityAnimationDirection)(
      getValidEntityTypeDirection(desired)
      | (previous & RENDER_FLAGS_IS_DEBUG)
      | (previous & RENDER_FLAGS_IS_GLITCHED)
      );
}

void MageGameControl::updateEntityRenderableData(uint8_t mapLocalEntityId, bool skipTilesetCheck)
{
   if (mapLocalEntityId >= MAX_ENTITIES_PER_MAP)
   {
      ENGINE_PANIC(
         "We somehow have an entity mapLocalEntityId\n"
         "greater than MAX_ENTITIES_PER_MAP:\n"
         "Index:%d\n"
         "MAX_ENTITIES_PER_MAP:%d\n",
         mapLocalEntityId,
         MAX_ENTITIES_PER_MAP
      );
   }

   //but make a pointer to the real deal in case it needs to be moved by hacking changes
   MageEntity* entity = getEntityByMapLocalId(mapLocalEntityId);
   entity->updateRenderableData(this);
}

void MageGameControl::UpdateEntities(uint32_t deltaTime)
{
   //cycle through all map entities:
   for (uint8_t i = 0; i < map->FilteredEntityCount(); i++)
   {
      uint8_t mapLocalEntityId = map->getMapLocalEntityId(i);
      //tileset entities are not animated, return if entity is type tileset.
      if (map->entities[i].primaryIdType == MageEntityPrimaryIdType::TILESET)
      {
         //Update Entity in case it's been hacked.
         updateEntityRenderableData(mapLocalEntityId);
         continue;
      }
      //increment the frame ticks based on the delta_time since the last check:
      entityRenderableData[i].currentFrameTicks += deltaTime;

      //update entity info:
      updateEntityRenderableData(mapLocalEntityId);

      //check for frame change and adjust if needed:
      if (entityRenderableData[i].currentFrameTicks >= entityRenderableData[i].duration)
      {
         //increment frame and reset tick counter:
         map->entities[i].currentFrameIndex++;
         entityRenderableData[i].currentFrameTicks = 0;

         //reset animation to first frame after max frame is reached:
         if (map->entities[i].currentFrameIndex >= entityRenderableData[i].frameCount)
         {
            map->entities[i].currentFrameIndex = 0;
         }
         //update the entity info again with the corrected frame index:
         updateEntityRenderableData(mapLocalEntityId);
      }
   }
}

void MageGameControl::DrawGeometry()
{
   int32_t cameraX = camera.adjustedCameraPosition.x;
   int32_t cameraY = camera.adjustedCameraPosition.y;
   Point* playerPosition{ nullptr };
   bool isColliding = false;
   bool isPlayerPresent = playerEntityIndex != NO_PLAYER;
   if (isPlayerPresent)
   {
      auto renderable = map->entities[map->getMapLocalEntityId(playerEntityIndex)].getRenderableData();
      playerPosition = &renderable->center;
   }

   for (uint16_t i = 0; i < map->GeometryCount(); i++)
   {
      MageGeometry geometry = getGeometryFromMapLocalId(i);
      if (isPlayerPresent)
      {
         isColliding = geometry.isPointInGeometry(*playerPosition);
      }
      geometry.draw(
         cameraX,
         cameraY,
         isColliding
         ? COLOR_RED
         : COLOR_GREEN
      );
   }
}

MageGeometry MageGameControl::getGeometryFromMapLocalId(uint16_t mapLocalGeometryId)
{
   auto geometryOffset = geometryHeader->offset(map->getGlobalGeometryId(mapLocalGeometryId) % geometryHeader->count());
   return MageGeometry{ gameEngine->ROM, geometryOffset };
}

MageGeometry MageGameControl::getGeometryFromGlobalId(uint16_t globalGeometryId)
{
   auto geometryOffset = geometryHeader->offset(globalGeometryId % geometryHeader->count());
   return MageGeometry{ gameEngine->ROM, geometryOffset };
}

MageColorPalette* MageGameControl::getValidColorPalette(uint16_t colorPaletteId)
{
   return &colorPalettes[colorPaletteId % colorPalettes.size()];
}

void MageGameControl::applyCameraEffects(uint32_t deltaTime)
{
   if (camera.followEntityId != NO_PLAYER)
   {
      auto renderableData = &entityRenderableData[map->getFilteredEntityId(camera.followEntityId)];
      camera.position.x = renderableData->center.x - HALF_WIDTH;
      camera.position.y = renderableData->center.y - HALF_HEIGHT;
   }
   camera.applyCameraEffects(deltaTime);
}

const MageEntity* MageGameControl::getEntityByMapLocalId(uint8_t mapLocalEntityId) const
{
   auto returnVal = &map->entities[map->getFilteredEntityId(mapLocalEntityId)];
   return returnVal;
}

MageEntity* MageGameControl::getEntityByMapLocalId(uint8_t mapLocalEntityId)
{
   auto returnVal = &map->entities[map->getFilteredEntityId(mapLocalEntityId)];
   return returnVal;
}

MageTileset* MageGameControl::getValidTileset(uint16_t tilesetId)
{
   return &tilesets[tilesetId % tilesets.size()];
}

std::string MageGameControl::getString(uint16_t stringId, int16_t mapLocalEntityId)
{
   uint16_t sanitizedIndex = stringId % stringHeader->count();
   uint32_t start = stringHeader->offset(sanitizedIndex);
   uint32_t length = stringHeader->length(sanitizedIndex);
   std::string romString(length, '\0');
   uint8_t* romStringPointer = (uint8_t*)&romString[0];
   gameEngine->ROM->Read(romStringPointer, start, length);
   std::string outputString(0, '\0');
   size_t cursor = 0;
   size_t variableStartPosition = 0;
   size_t variableEndPosition = 0;
   size_t replaceCount = 0;
   while ((variableStartPosition = romString.find("%%", variableStartPosition)) != std::string::npos)
   {
      outputString += romString.substr(
         cursor,
         (variableStartPosition - cursor)
      );
      variableEndPosition = romString.find("%%", variableStartPosition + 1) + 1;
      std::string variableHolder = romString.substr(
         variableStartPosition + 2,
         variableStartPosition - (variableEndPosition - 2)
      );
      int parsedEntityIndex = std::stoi(variableHolder);
      int16_t entityIndex = gameEngine->scriptActions->getUsefulEntityIndexFromActionEntityId(parsedEntityIndex, mapLocalEntityId);
      if (entityIndex != NO_PLAYER)
      {
         std::string entityName = getEntityNameStringById(entityIndex);
         outputString += entityName.c_str();
      }
      else
      {
         char missingError[MAGE_ENTITY_NAME_LENGTH + 1];
         sprintf(
            missingError,
            "MISSING: %d",
            parsedEntityIndex
         );
         outputString += missingError;
      }
      variableStartPosition = variableEndPosition + 1;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += romString.substr(cursor, romString.length() - 1);
      romString = outputString;
      outputString = "";
   }
   cursor = 0;
   variableStartPosition = 0;
   variableEndPosition = 0;
   replaceCount = 0;
   while ((variableStartPosition = romString.find("$$", variableStartPosition)) != std::string::npos)
   {
      outputString += romString.substr(
         cursor,
         (variableStartPosition - cursor)
      );
      variableEndPosition = romString.find("$$", variableStartPosition + 1) + 1;
      std::string variableHolder = romString.substr(
         variableStartPosition + 2,
         variableStartPosition - (variableEndPosition - 2)
      );
      int parsedVariableIndex = std::stoi(variableHolder);
      uint16_t variableValue = currentSave.scriptVariables[parsedVariableIndex];
      std::string valueString = std::to_string(variableValue);
      outputString += valueString.c_str();
      variableStartPosition = variableEndPosition + 1;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += romString.substr(cursor, romString.length() - 1);
      romString = outputString;
      outputString = "";
   }
   // why wrap it in another string at the end?
   // Because somehow, extra null bytes were being explicitly stored in the return value's length,
   // and this should crop them out from the return value
   return std::string(romString.c_str());
}

std::string MageGameControl::getEntityNameStringById(int8_t mapLocalEntityId)
{
   MageEntity* entity = getEntityByMapLocalId(mapLocalEntityId);
   std::string entityName(MAGE_ENTITY_NAME_LENGTH + 1, '\0');
   entityName.assign(entity->name, MAGE_ENTITY_NAME_LENGTH);
   return entityName;
}

void MageGameControl::logAllEntityScriptValues(const char* string)
{
   debug_print("%s", string);
   for (uint8_t i = 0; i < map->FilteredEntityCount(); i++)
   {
      //Initialize the script ResumeStateStructs to default values for this map->
      MageEntity* entity = &map->entities[i];
      debug_print(
         "Index: %02d; EntityName: %12s; tick: %05d/0x%04X; interact: %05d/0x%04X;",
         i,
         entity->name,
         entity->onTickScriptId,
         entity->onTickScriptId,
         entity->onInteractScriptId,
         entity->onInteractScriptId
      );
   }
}
