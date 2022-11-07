#include "mage.h"
#include "mage_game_control.h"
#include "convert_endian.h"
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
   //skip 'MAGEGAME' at front of .dat file
   uint32_t offset = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;

   gameEngine->ROM->Read(engineVersion, offset);

   if (engineVersion != ENGINE_VERSION)
   {
      ENGINE_PANIC(
         "game.dat is incompatible with Engine\n\n"
         "Engine version: %d\n"
         "game.dat version: %d",
         ENGINE_VERSION,
         engineVersion
      );
   }

   gameEngine->ROM->Read(scenarioDataCRC32, offset);
   gameEngine->ROM->Read(scenarioDataLength, offset);

   setCurrentSaveToFreshState();

   auto mapHeader = MageHeader{ gameEngine->ROM, offset };
   auto tilesetHeader = MageHeader{ gameEngine->ROM, offset };
   auto animationHeader = MageHeader{ gameEngine->ROM, offset };
   auto entityTypeHeader = MageHeader{ gameEngine->ROM, offset };
   auto entityHeader = MageHeader{ gameEngine->ROM, offset };
   auto geometryHeader = MageHeader{ gameEngine->ROM, offset };
   auto scriptHeader = MageHeader{ gameEngine->ROM, offset };
   auto portraitHeader = MageHeader{ gameEngine->ROM, offset };
   auto dialogHeader = MageHeader{ gameEngine->ROM, offset };
   auto serialDialogHeader = MageHeader{ gameEngine->ROM, offset };
   auto colorPaletteHeader = MageHeader{ gameEngine->ROM, offset };
   auto stringHeader = MageHeader{ gameEngine->ROM, offset };
   auto saveFlagHeader = MageHeader{ gameEngine->ROM, offset };
   auto variableHeader = MageHeader{ gameEngine->ROM, offset };
   auto imageHeader = MageHeader{ gameEngine->ROM, offset };

   stringLoader = std::make_unique<StringLoader>(gameEngine, currentSave.scriptVariables, std::move(stringHeader));
   dialogControl = std::make_unique<MageDialogControl>(gameEngine, std::move(dialogHeader));

   for (uint32_t i = 0; i < entityTypeHeader.count(); i++)
   {
      const MageEntityType* entityType;
      auto entityOffset = entityTypeHeader.offset(i);
      gameEngine->ROM->GetPointerTo(entityType, entityOffset);
      entityTypes.push_back(entityType);
   }

   tileManager = std::make_shared<TileManager>(gameEngine->frameBuffer, gameEngine->ROM, std::move(tilesetHeader), std::move(animationHeader), std::move(colorPaletteHeader), std::move(imageHeader), std::move(portraitHeader));
   map = std::make_unique<MageMap>(gameEngine->ROM, gameEngine->frameBuffer, this, std::move(mapHeader), std::move(geometryHeader), std::move(entityHeader), std::move(scriptHeader));

   readSaveFromRomIntoRam(true);

   playerHasControl = true;
   playerHasHexEditorControl = true;
   playerHasHexEditorControlClipboard = true;
}

void MageGameControl::setCurrentSaveToFreshState()
{
   auto newSave = MageSaveGame{};
   newSave.scenarioDataCRC32 = scenarioDataCRC32;
   currentSave = newSave;
}

void MageGameControl::readSaveFromRomIntoRam(bool silenceErrors)
{
   gameEngine->ROM->ReadSaveSlot(currentSaveIndex, sizeof(MageSaveGame), (uint8_t*)&currentSave);

   bool engineIncompatible = currentSave.engineVersion != engineVersion;
   bool saveLengthIncompatible = currentSave.saveDataLength != sizeof(MageSaveGame);
   bool scenarioIncompatible = currentSave.scenarioDataCRC32 != scenarioDataCRC32;
   if (engineIncompatible || saveLengthIncompatible || scenarioIncompatible)
   {
      if (!silenceErrors)
      {
         if (scenarioIncompatible)
         {
            debug_print("Save data is incompatible with current\n"
               "scenario data. Starting with fresh save."
            );
         }
         if (engineIncompatible || saveLengthIncompatible)
         {
            debug_print("Save data is incompatible with current\n"
               "engine version. Starting with fresh save.");
         }
         gameEngine->gameControl->dialogControl->showSaveMessageDialog("error loading save");
      }
      setCurrentSaveToFreshState();
   }

   map->getPlayerEntity()->SetName(currentSave.name);
}

void MageGameControl::saveGameSlotSave()
{
   // do rom writes
   //copyNameToAndFromPlayerAndSave(true);
   currentSave.name = map->getPlayerEntity()->name;
   gameEngine->ROM->WriteSaveSlot(currentSaveIndex, sizeof(MageSaveGame), &currentSave);
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
   gameEngine->frameBuffer->ResetFade();

   //close any open dialogs and return player control as well:
   dialogControl->close();
   gameEngine->scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
   playerHasControl = true;

   currentSave.name = map->getPlayerEntity()->name;
   //copyNameToAndFromPlayerAndSave(true);

   //get the data for the map:
   map->Load(index);

   map->getPlayerEntity()->SetName(currentSave.name);

   gameEngine->scriptControl->initializeScriptsOnMapLoad(map.get());

   //close hex editor if open:
   if (gameEngine->hexEditor->isHexEditorOn())
   {
      gameEngine->hexEditor->toggleHexEditor();
   }
   if (map->getPlayerEntityIndex() != NO_PLAYER)
   {
      gameEngine->hexEditor->openToEntityByIndex(map->getPlayerEntityIndex());
      gameEngine->hexEditor->toggleHexEditor();
   }
}

//void MageGameControl::copyNameToAndFromPlayerAndSave(bool intoSaveRam) const
//{
//   if (map->getPlayerEntityIndex() == NO_PLAYER)
//   {
//      return;
//   }
//   auto playerEntity = map->getPlayerEntity();
//   if (intoSaveRam)
//   {
//      memcpy((uint8_t*)&currentSave.name, (uint8_t*)&playerEntity->name, MAGE_ENTITY_NAME_LENGTH);
//   }
//   else
//   {
//      memcpy((uint8_t*)&playerEntity->name, (uint8_t*)&currentSave.name, MAGE_ENTITY_NAME_LENGTH);
//   }
//}

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
   if (map->getPlayerEntityIndex() != NO_PLAYER)
   {
      //get useful variables for below:
      //updateEntityRenderableData(map->getPlayerEntityIndex());

      auto playerEntity = getEntityByMapLocalId(map->getPlayerEntityIndex());
      playerEntity->updateRenderableData();

      //update renderable info before proceeding:
      uint16_t playerEntityTypeId = playerEntity->primaryIdType % NUM_PRIMARY_ID_TYPES;
      bool hasEntityType = playerEntityTypeId == ENTITY_TYPE;
      const MageEntityType* entityType = hasEntityType ? entityTypes[playerEntityTypeId] : nullptr;
      uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
      bool playerIsActioning = playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX;
      bool acceptPlayerInput = !(dialogControl->isOpen() || !playerHasControl);

      isMoving = false;

      //check to see if the mage is pressing the action button, or currently in the middle of an action animation.
      if (acceptPlayerInput
         && (playerIsActioning || gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_left)))
      {
         playerIsActioning = true;
      }
      //if not actioning or resetting, handle all remaining inputs:
      else if (acceptPlayerInput)
      {
         playerVelocity = { 0,0 };
         auto direction = playerEntity->renderFlags;
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left)) { playerVelocity.x -= mageSpeed; direction = WEST; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right)) { playerVelocity.x += mageSpeed; direction = EAST; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)) { playerVelocity.y -= mageSpeed; direction = NORTH; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)) { playerVelocity.y += mageSpeed; direction = SOUTH; isMoving = true; }
         if (isMoving)
         {
            playerEntity->renderFlags = updateDirectionAndPreserveFlags(direction, playerEntity->renderFlags);
            auto pushback = getPushBackFromTilesThatCollideWithPlayer();
            auto velocityAfterPushback = playerVelocity + pushback;
            auto dotProductOfVelocityAndPushback = playerVelocity.DotProduct(velocityAfterPushback);
            // false would mean that the pushback is greater than the input velocity,
            // which would glitch the player into geometry really bad, so... don't.
            if (dotProductOfVelocityAndPushback > 0)
            {
               playerEntity->location += velocityAfterPushback;
            }
         }
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Rjoy_right))
         {
            handleEntityInteract(false);
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
      //Scenario 1 - perform action:
      if (playerIsActioning && hasEntityType
         && entityType->AnimationCount() >= MAGE_ACTION_ANIMATION_INDEX)
      {
         playerEntity->currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
      }
      //Scenario 2 - show walk animation:
      else if (isMoving && hasEntityType
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
      bool isPlayingActionButShouldReturnControlToPlayer = hasEntityType
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
         //updateEntityRenderableData(map->getPlayerEntityIndex());
         playerEntity->updateRenderableData();
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
   //interacting is impossible if there is no player entity
   if (map->getPlayerEntityIndex() == NO_PLAYER) { return; }

   MageEntity* playerEntity = getEntityByMapLocalId(map->getPlayerEntityIndex());

   auto playerRenderableData = map->entities[map->getMapLocalEntityId(map->getPlayerEntityIndex())].getRenderableData();
   playerRenderableData->interactBox = playerRenderableData->hitBox;

   const uint8_t interactLength = 32;
   auto direction = playerEntity->renderFlags & RENDER_FLAGS_DIRECTION_MASK;
   if (direction == NORTH)
   {
      playerRenderableData->interactBox.origin.y -= interactLength;
      playerRenderableData->interactBox.h = interactLength;
   }
   if (direction == EAST)
   {
      playerRenderableData->interactBox.origin.x += playerRenderableData->interactBox.w;
      playerRenderableData->interactBox.w = interactLength;
   }
   if (direction == SOUTH)
   {
      playerRenderableData->interactBox.origin.y += playerRenderableData->interactBox.h;
      playerRenderableData->interactBox.h = interactLength;
   }
   if (direction == WEST)
   {
      playerRenderableData->interactBox.origin.x -= interactLength;
      playerRenderableData->interactBox.w = interactLength;
   }

   for (uint8_t i = 0; i < map->FilteredEntityCount(); i++)
   {
      // reset all interact states first
      auto targetEntity = map->getEntity(i);
      auto targetRenderableData = targetEntity->getRenderableData();
      targetRenderableData->isInteracting = false;

      if (i != map->getPlayerEntityIndex())
      {
         bool colliding = targetRenderableData->hitBox
            .Overlaps(playerRenderableData->interactBox);

         if (colliding)
         {
            playerRenderableData->isInteracting = true;
            map->getEntity(i)->getRenderableData()->isInteracting = true;
            isMoving = false;
            if (hack && playerHasHexEditorControl)
            {
               gameEngine->hexEditor->disableMovementUntilRJoyUpRelease();
               gameEngine->hexEditor->openToEntityByIndex(i);
            }
            else if (!hack && targetEntity->onInteractScriptId)
            {
               gameEngine->scriptControl->SetEntityInteractResumeState(i, MageScriptState{ targetEntity->onInteractScriptId, true });
            }
            break;
         }
      }
   }
}

void MageGameControl::DrawMap(uint8_t layer)
{
   map->Draw(this, layer, camera);
}

Point MageGameControl::getPushBackFromTilesThatCollideWithPlayer()
{
   auto mageCollisionSpokes = MageGeometry{ MageGeometryType::Polygon, MAGE_COLLISION_SPOKE_COUNT };
   float maxSpokePushbackLengths[MAGE_COLLISION_SPOKE_COUNT]{ 0 };
   Point maxSpokePushbackVectors[MAGE_COLLISION_SPOKE_COUNT]{ 0 };
   auto playerRenderableData = map->getPlayerEntity()->getRenderableData();

   auto playerRect = playerRenderableData->hitBox;
   int16_t abs_x = abs(playerVelocity.x);
   int16_t abs_y = abs(playerVelocity.y);
   if (abs_x)
   {
      playerRect.w += abs_x;
      if (playerVelocity.x < 0)
      {
         playerRect.origin.x += playerVelocity.x;
      }
   }
   if (abs_y)
   {
      playerRect.h += abs_y;
      if (playerVelocity.y < 0)
      {
         playerRect.origin.y += playerVelocity.y;
      }
   }
   Point tileTopLeftPoint = { 0, 0 };
   int32_t x = 0;
   int32_t y = 0;
   uint16_t geometryId = 0;
   auto pushback = Point{};
   auto currentTile = MageMapTile{};
   Point playerPoint = playerRenderableData->center;
   // get the geometry for where the player is
   int32_t x0 = playerRect.origin.x;
   int32_t x1 = x0 + playerRect.w;
   int32_t y0 = playerRect.origin.y;
   int32_t y1 = y0 + playerRect.h;
   float playerSpokeRadius = playerRenderableData->hitBox.w / 1.5;
   float angleOffset = atan2(playerVelocity.y, playerVelocity.x)
      - (PI / 2)
      + ((PI / MAGE_COLLISION_SPOKE_COUNT) / 2);

   for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
   {
      maxSpokePushbackLengths[i] = -INFINITY;
      maxSpokePushbackVectors[i].x = 0;
      maxSpokePushbackVectors[i].y = 0;
      Point* spokePoint = &mageCollisionSpokes.points[i];
      float angle = (float)i * (PI / MAGE_COLLISION_SPOKE_COUNT) + angleOffset;
      spokePoint->x = cos(angle) * playerSpokeRadius + playerVelocity.x + playerPoint.x;
      spokePoint->y = sin(angle) * playerSpokeRadius + playerVelocity.y + playerPoint.y;
   }

   if (isCollisionDebugOn)
   {
      gameEngine->frameBuffer->drawRect(playerRect.origin - camera.position, playerRect.w, playerRect.h, COLOR_BLUE);
      for (int i = 0; i < mageCollisionSpokes.segmentLengths.size(); i++)
      {
         auto& point = mageCollisionSpokes.points[i];
         gameEngine->frameBuffer->drawLine(point - camera.adjustedCameraPosition, playerPoint - camera.adjustedCameraPosition, COLOR_PURPLE);
      }
   }

   uint8_t layerCount = map->LayerCount();
   for (auto layerIndex = 0u; layerIndex < layerCount; layerIndex++)
   {
      auto layerAddress = map->LayerOffset(layerIndex);
      for (auto i = 0u; i < map->Cols() * map->Rows(); i++)
      {
         tileTopLeftPoint.x = (int32_t)(map->TileWidth() * (i % map->Cols()));
         tileTopLeftPoint.y = (int32_t)(map->TileHeight() * (i / map->Cols()));
         x = tileTopLeftPoint.x - x0;
         y = tileTopLeftPoint.y - y0;

         if (x + map->TileWidth() < 0 || x > playerRect.w
            || y + map->TileHeight() < 0 || y > playerRect.h)
         {
            continue;
         }
         auto address = layerAddress + (i * sizeof(MageMapTile));

         gameEngine->ROM->Read(currentTile, address);

         if (currentTile.tileId == 0)
         {
            continue;
         }

         currentTile.tileId -= 1;

         auto tileset = tileManager->GetTileset(currentTile.tilesetId);

         if (!tileset->Valid())
         {
            continue;
         }
         geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile.tileId);
         if (geometryId)
         {
            for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
            {
               float angle = (float)i * (PI / MAGE_COLLISION_SPOKE_COUNT) + angleOffset;
               Point* spokePoint = &mageCollisionSpokes.points[i];
               spokePoint->x = cos(angle) * playerSpokeRadius
                  + playerVelocity.x + playerPoint.x
                  - tileTopLeftPoint.x;
               spokePoint->y = sin(angle) * playerSpokeRadius
                  + playerVelocity.y + playerPoint.y
                  - tileTopLeftPoint.y;
            }
            geometryId--;

            auto geometry = getGeometry(geometryId)
               ->flipSelfByFlags(currentTile.flags, tileset->TileWidth(), tileset->TileHeight());

            Point offsetPoint = { playerPoint.x - tileTopLeftPoint.x, playerPoint.y - tileTopLeftPoint.y };
            bool isMageInGeometry = false;

            bool collidedWithThisTileAtAll = false;
            for (int tileLinePointIndex = 0; tileLinePointIndex < geometry.GetPointCount(); tileLinePointIndex++)
            {
               Point tileLinePointA = geometry.GetPoint(tileLinePointIndex);
               Point tileLinePointB = geometry.GetPoint(tileLinePointIndex + 1);
               bool collidedWithTileLine = false;

               for (auto spokeIndex = 0; spokeIndex < mageCollisionSpokes.GetPointCount(); spokeIndex++)
               {
                  auto spokePointB = mageCollisionSpokes.GetPoint(spokeIndex);

                  auto spokeIntersectionPoint = geometry.getIntersectPointBetweenLineSegments(offsetPoint, spokePointB, tileLinePointA, tileLinePointB);
                  if (spokeIntersectionPoint.has_value())
                  {
                     collidedWithTileLine = true;
                     isMageInGeometry = true;
                     auto diff = spokeIntersectionPoint.value() - spokePointB;

                     gameEngine->frameBuffer->drawLine(offsetPoint, spokePointB, COLOR_RED);
                     gameEngine->frameBuffer->drawLine(offsetPoint, spokeIntersectionPoint.value(), COLOR_GREENYELLOW);
                     gameEngine->frameBuffer->drawLine(offsetPoint, offsetPoint + diff, COLOR_ORANGE);
                     float currentIntersectLength = diff.VectorLength();

                     maxSpokePushbackLengths[spokeIndex] = std::max(currentIntersectLength, maxSpokePushbackLengths[spokeIndex]);
                     if (currentIntersectLength == maxSpokePushbackLengths[spokeIndex])
                     {
                        maxSpokePushbackVectors[spokeIndex] = diff;
                     }
                  }
               }
               gameEngine->frameBuffer->drawLine(tileLinePointA, tileLinePointB, collidedWithTileLine ? COLOR_RED : COLOR_ORANGE);
            }

            if (isCollisionDebugOn)
            {

               //geometry.draw(
               //   camera.adjustedCameraPosition.x,
               //   camera.adjustedCameraPosition.y,
               //   isMageInGeometry ? COLOR_RED : COLOR_YELLOW,
               //   tileTopLeftPoint.x,
               //   tileTopLeftPoint.y
               //);
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
      gameEngine->frameBuffer->drawLine(playerPoint - camera.adjustedCameraPosition, playerPoint + pushback - camera.adjustedCameraPosition, COLOR_RED);
   }
   return pushback;
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
   entity->updateRenderableData();
}

const MageGeometry* MageGameControl::getGeometry(uint16_t globalGeometryId) const
{
   auto geometryOffset = map->geometryHeader.offset(globalGeometryId % map->geometryHeader.count());
   const MageGeometry* geometry;
   gameEngine->ROM->GetPointerTo(geometry, geometryOffset);
   return geometry;
}

void MageGameControl::applyCameraEffects(uint32_t deltaTime)
{
   if (camera.followEntityId != NO_PLAYER)
   {
      auto followEntity = map->getEntity(camera.followEntityId);
      const auto midScreen = Point{ HALF_WIDTH, HALF_HEIGHT };
      camera.position = followEntity->getRenderableData()->center - midScreen;
   }
   camera.applyCameraEffects(deltaTime);
}

const MageEntity* MageGameControl::getEntityByMapLocalId(uint8_t mapLocalEntityId) const
{
   return map->getEntity(map->getGlobalEntityId(mapLocalEntityId));
}

MageEntity* MageGameControl::getEntityByMapLocalId(uint8_t mapLocalEntityId)
{
   return map->getEntity(map->getGlobalEntityId(mapLocalEntityId));
}

std::string MageGameControl::getString(uint16_t stringId, int16_t mapLocalEntityId) const
{
   return stringLoader->getString(stringId, mapLocalEntityId);
}

std::string StringLoader::getString(uint16_t stringId, int16_t mapLocalEntityId) const
{
   uint16_t sanitizedIndex = stringId % stringHeader.count();
   uint32_t start = stringHeader.offset(sanitizedIndex);
   uint32_t length = stringHeader.length(sanitizedIndex);

   const char* romString;
   gameEngine->ROM->GetPointerTo(romString, start, length);
   std::string inputString{ romString };
   std::string outputString{};
   size_t cursor{ 0 };
   size_t variableStartPosition{ 0 };
   size_t variableEndPosition{ 0 };
   size_t replaceCount{ 0 };
   while ((variableStartPosition = inputString.find("%%", variableStartPosition)) != std::string::npos)
   {
      outputString += inputString.substr(cursor, variableStartPosition - cursor);
      variableStartPosition += 2;
      variableEndPosition = inputString.find("%%", variableStartPosition);
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString.substr(variableStartPosition, variableEndPosition - variableStartPosition);
      auto parsedEntityIndex = std::stoi(variableHolder);

      int16_t entityIndex = gameEngine->scriptActions->GetUsefulEntityIndexFromActionEntityId(parsedEntityIndex, mapLocalEntityId);
      if (entityIndex != NO_PLAYER)
      {
         auto entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
         outputString += entity->name;
      }
      else
      {
         char missingError[MAGE_ENTITY_NAME_LENGTH + 1];
         sprintf(missingError, "MISSING: %d", parsedEntityIndex);
         outputString += missingError;
      }
      variableStartPosition = variableEndPosition + 2;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += inputString.substr(cursor, inputString.length() - 1);
      inputString = outputString;
      outputString = "";
   }

   cursor = 0;
   variableStartPosition = 0;
   variableEndPosition = 0;
   replaceCount = 0;
   while ((variableStartPosition = inputString.find("$$", variableStartPosition)) != std::string::npos)
   {
      outputString += inputString.substr(cursor, variableStartPosition - cursor);
      variableStartPosition += 2;
      variableEndPosition = inputString.find("$$", variableStartPosition);
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString.substr(variableStartPosition, variableEndPosition - variableStartPosition);
      auto parsedVariableIndex = std::stoi(variableHolder);

      uint16_t variableValue = scriptVariables[parsedVariableIndex];
      std::string valueString = std::to_string(variableValue);
      outputString += valueString.c_str();
      variableStartPosition = variableEndPosition + 1;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += inputString.substr(cursor, inputString.length() - 1);
      inputString = outputString;
   }
   return inputString;
}