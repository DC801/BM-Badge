#include "mage.h"

#include <SDL.h>

#include "convert_endian.h"
#include "utility.h"

#include "mage_defines.h"
#include "mage_script_control.h"

#ifndef DC801_EMBEDDED
#include "shim_timer.h"
#endif

#ifdef EMSCRIPTEN
#include "emscripten.h"
#endif

void MageGameEngine::Run()
{
   //main game loop:
#ifdef EMSCRIPTEN
   emscripten_set_main_loop(EngineMainGameLoop, 24, 1);
#else
   while (inputHandler->IsRunning())
   {
      if (!engineIsInitialized || inputHandler->ShouldReloadGameDat())
      {
         scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
         LoadMap(ROM()->GetCurrentSave()->currentMapId);
         engineIsInitialized = true;
      }
      EngineMainGameLoop();
   }
#endif

   // Close rom and any open files
   EngineSerialRegisterEventHandlers(nullptr, nullptr);

}

void MageGameEngine::handleEntityInteract(bool hack)
{
   //interacting is impossible if there is no player entity
   if (mapControl->getPlayerEntityIndex() == NO_PLAYER) { return; }

   auto& playerEntity = mapControl->getPlayerEntity();
   auto& playerRenderableData = mapControl->getPlayerEntityRenderableData();
   playerRenderableData.interactBox = playerRenderableData.hitBox;

   const uint8_t interactLength = 32;
   auto direction = playerEntity.direction & RENDER_FLAGS_DIRECTION_MASK;
   if (direction == NORTH)
   {
      playerRenderableData.interactBox.origin.y -= interactLength;
      playerRenderableData.interactBox.h = interactLength;
   }
   if (direction == EAST)
   {
      playerRenderableData.interactBox.origin.x += playerRenderableData.interactBox.w;
      playerRenderableData.interactBox.w = interactLength;
   }
   if (direction == SOUTH)
   {
      playerRenderableData.interactBox.origin.y += playerRenderableData.interactBox.h;
      playerRenderableData.interactBox.h = interactLength;
   }
   if (direction == WEST)
   {
      playerRenderableData.interactBox.origin.x -= interactLength;
      playerRenderableData.interactBox.w = interactLength;
   }

   for (uint8_t i = 0; i < mapControl->FilteredEntityCount(); i++)
   {
      // reset all interact states first
      auto& targetEntity = mapControl->getEntity(i);
      auto& targetRenderableData = mapControl->getEntityRenderableData(i);
      targetRenderableData.isInteracting = false;

      if (i != mapControl->getPlayerEntityIndex())
      {
         bool colliding = targetRenderableData.hitBox
            .Overlaps(playerRenderableData.interactBox);

         if (colliding)
         {
            playerRenderableData.isInteracting = true;
            mapControl->getEntityRenderableData(i).isInteracting = true;
            isMoving = false;
            if (hack && playerHasHexEditorControl)
            {
               hexEditor->disableMovementUntilRJoyUpRelease();
               hexEditor->openToEntityByIndex(i);
            }
            else if (!hack && targetEntity.onInteractScriptId)
            {
               scriptControl->SetEntityInteractResumeState(i, MageScriptState{ targetEntity.onInteractScriptId, true });
            }
            break;
         }
      }
   }
}

void MageGameEngine::LoadMap(uint16_t index)
{
   //reset the fade fraction, in case player reset the map
   //while the fraction was anything other than 0
   frameBuffer->ResetFade();

   //close any open dialogs and return player control as well:
   dialogControl->close();
   playerHasControl = true;

   //get the data for the map:
   mapControl->Load(index);

   mapControl->getPlayerEntity().SetName(ROM()->GetCurrentSave()->name);

   scriptControl->initializeScriptsOnMapLoad();

   commandControl->reset();
   scriptControl->handleMapOnLoadScript(true);

   //close hex editor if open:
   if (hexEditor->isHexEditorOn())
   {
      hexEditor->toggleHexEditor();
   }
   if (mapControl->getPlayerEntityIndex() != NO_PLAYER)
   {
      hexEditor->openToEntityByIndex(mapControl->getPlayerEntityIndex());
      hexEditor->toggleHexEditor();
   }
}

void MageGameEngine::handleBlockingDelay()
{
   //if a blocking delay was added by any actions, pause before returning to the game loop:
   if (inputHandler->blockingDelayTime)
   {
      //delay for the right amount of time
      nrf_delay_ms(inputHandler->blockingDelayTime);
      //reset delay time when done so we don't do this every loop.
      inputHandler->blockingDelayTime = 0;
   }
}

void MageGameEngine::applyUniversalInputs()
{
   const auto button = inputHandler->GetButtonState();

   if (button.IsPressed(KeyPress::Xor))
   {
      if (button.IsPressed(KeyPress::Mem3))
      {
         //make map reload global regardless of player control state:
         mapControl->mapLoadId = ROM()->GetCurrentSave()->currentMapId;
      }
      else if (button.IsPressed(KeyPress::Mem1))
      {
         mapControl->isEntityDebugOn = !mapControl->isEntityDebugOn;
         scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
         LoadMap(ROM()->GetCurrentSave()->currentMapId);
         return;
      }
   }

   //check to see if player input is allowed:
   if (dialogControl->isOpen()
      || !(playerHasControl || playerHasHexEditorControl))
   {
      return;
   }
   //make sure any button handling in this function can be processed in ANY game mode.
   //that includes the game mode, hex editor mode, any menus, maps, etc.
   ledSet(LED_PAGE, button.IsPressed(KeyPress::Page) ? 0xFF : 0x00);
   if (button.IsPressed(KeyPress::Xor)) { hexEditor->setHexOp(HEX_OPS_XOR); }
   if (button.IsPressed(KeyPress::Add)) { hexEditor->setHexOp(HEX_OPS_ADD); }
   if (button.IsPressed(KeyPress::Sub)) { hexEditor->setHexOp(HEX_OPS_SUB); }
   if (button.IsPressed(KeyPress::Bit128)) { hexEditor->runHex(0b10000000); }
   if (button.IsPressed(KeyPress::Bit64)) { hexEditor->runHex(0b01000000); }
   if (button.IsPressed(KeyPress::Bit32)) { hexEditor->runHex(0b00100000); }
   if (button.IsPressed(KeyPress::Bit16)) { hexEditor->runHex(0b00010000); }
   if (button.IsPressed(KeyPress::Bit8)) { hexEditor->runHex(0b00001000); }
   if (button.IsPressed(KeyPress::Bit4)) { hexEditor->runHex(0b00000100); }
   if (button.IsPressed(KeyPress::Bit2)) { hexEditor->runHex(0b00000010); }
   if (button.IsPressed(KeyPress::Bit1)) { hexEditor->runHex(0b00000001); }

   if (button.IsPressed(KeyPress::Xor) && button.IsPressed(KeyPress::Mem0))
   {
   }
}

void MageGameEngine::applyGameModeInputs(uint32_t deltaTime)
{
   const auto button = inputHandler->GetButtonState();
   const auto activatedButton = inputHandler->GetButtonActivatedState();
   //set mage speed based on if the right pad down is being pressed:
   float moveType = button.IsPressed(KeyPress::Rjoy_down) ? MAGE_RUNNING_SPEED : MAGE_WALKING_SPEED;
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
   if (mapControl->getPlayerEntityIndex() != NO_PLAYER)
   {
      auto& playerEntity = mapControl->getPlayerEntity();
      auto& playerRenderableData = mapControl->getPlayerEntityRenderableData();
      playerEntity.updateRenderableData(playerRenderableData, 0);

      //update renderable info before proceeding:
      uint16_t playerEntityTypeId = playerEntity.primaryIdType % NUM_PRIMARY_ID_TYPES;
      bool hasEntityType = playerEntityTypeId == ENTITY_TYPE;
      auto entityType = hasEntityType ? ROM()->GetReadPointerByIndex<MageEntityType>(playerEntityTypeId) : nullptr;
      uint8_t previousPlayerAnimation = playerEntity.currentAnimation;
      bool playerIsActioning = playerEntity.currentAnimation == MAGE_ACTION_ANIMATION_INDEX;

      isMoving = false;

      //check to see if the mage is pressing the action button, or currently in the middle of an action animation.
      if (playerHasControl
         && (playerIsActioning || button.IsPressed(KeyPress::Rjoy_left)))
      {
         playerIsActioning = true;
      }
      //if not actioning or resetting, handle all remaining inputs:
      else if (playerHasControl)
      {
         playerVelocity = { 0,0 };
         auto& direction = playerEntity.direction;
         if (button.IsPressed(KeyPress::Ljoy_left)) { playerVelocity.x -= mageSpeed; direction = WEST; isMoving = true; }
         if (button.IsPressed(KeyPress::Ljoy_right)) { playerVelocity.x += mageSpeed; direction = EAST; isMoving = true; }
         if (button.IsPressed(KeyPress::Ljoy_up)) { playerVelocity.y -= mageSpeed; direction = NORTH; isMoving = true; }
         if (button.IsPressed(KeyPress::Ljoy_down)) { playerVelocity.y += mageSpeed; direction = SOUTH; isMoving = true; }
         if (isMoving)
         {
            playerEntity.direction |= (direction & RENDER_FLAGS_DIRECTION_MASK);
            auto pushback = getPushBackFromTilesThatCollideWithPlayer();
            auto velocityAfterPushback = playerVelocity + pushback;
            auto dotProductOfVelocityAndPushback = playerVelocity.DotProduct(velocityAfterPushback);
            // false would mean that the pushback is greater than the input velocity,
            // which would glitch the player into geometry really bad, so... don't.
            if (dotProductOfVelocityAndPushback > 0)
            {
               playerEntity.x += velocityAfterPushback.x;
               playerEntity.y += velocityAfterPushback.y;
            }
         }
         if (inputHandler->GetButtonActivatedState().IsPressed(KeyPress::Rjoy_right))
         {
            const auto hack = false;
            handleEntityInteract(hack);
         }
         if (button.IsPressed(KeyPress::Rjoy_up))
         {
            const auto hack = true;
            handleEntityInteract(hack);
         }
         if (button.IsPressed(KeyPress::Ljoy_center))
         {
            //no task assigned to ljoy_center in game mode
         }
         if (button.IsPressed(KeyPress::Rjoy_center))
         {
            //no task assigned to rjoy_center in game mode
         }
         if (button.IsPressed(KeyPress::Page))
         {
            //no task assigned to op_page in game mode
         }
      }


      //handle animation assignment for the player:
      //Scenario 1 - perform action:
      if (playerIsActioning && hasEntityType
         && entityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
      {
         playerEntity.currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
      }
      //Scenario 2 - show walk animation:
      else if (isMoving && hasEntityType
         && entityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
      {
         playerEntity.currentAnimation = MAGE_WALK_ANIMATION_INDEX;
      }
      //Scenario 3 - show idle animation:
      else if (playerHasControl)
      {
         playerEntity.currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
      }

      //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
      bool isPlayingActionButShouldReturnControlToPlayer = hasEntityType
         && (playerEntity.currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
         && (playerEntity.currentFrameIndex == (playerRenderableData.frameCount - 1))
         && (playerRenderableData.currentFrameTicks + deltaTime >= (playerRenderableData.duration));

      //if the above bool is true, set the player back to their idle animation:
      if (isPlayingActionButShouldReturnControlToPlayer)
      {
         playerEntity.currentFrameIndex = 0;
         playerEntity.currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
      }

      //if the animation changed since the start of this function, reset to the first frame and restart the timer:
      if (previousPlayerAnimation != playerEntity.currentAnimation)
      {
         playerEntity.currentFrameIndex = 0;
         playerRenderableData.currentFrameTicks = 0;
      }

      //What scenarios call for an extra renderableData update?
      if (isMoving || (playerRenderableData.lastTilesetId != playerRenderableData.tilesetId))
      {
         playerEntity.updateRenderableData(playerRenderableData, 0);
      }

      if (!playerHasControl || !playerHasHexEditorControl)
      {
         return;
      }

      //opening the hex editor is the only button press that will lag actual gameplay by one frame
      //this is to allow entity scripts to check the hex editor state before it opens to run scripts
      if (inputHandler->GetButtonActivatedState().IsPressed(KeyPress::Hax))
      {
         hexEditor->toggleHexEditor();
      }
      hexEditor->applyMemRecallInputs();
   }
   else //no player on map
   {
      if (!playerHasControl)
      {
         return;
      }
      if (button.IsPressed(KeyPress::Ljoy_left))
      {
         camera.position.x -= mageSpeed;
      }
      if (button.IsPressed(KeyPress::Ljoy_right))
      {
         camera.position.x += mageSpeed;
      }
      if (button.IsPressed(KeyPress::Ljoy_up))
      {
         camera.position.y -= mageSpeed;
      }
      if (button.IsPressed(KeyPress::Ljoy_down))
      {
         camera.position.y += mageSpeed;
      }

      if (!playerHasHexEditorControl)
      {
         return;
      }
      if (inputHandler->GetButtonActivatedState().IsPressed(KeyPress::Hax)) { hexEditor->toggleHexEditor(); }
      hexEditor->applyMemRecallInputs();
   }
}


void MageGameEngine::GameUpdate(uint32_t deltaTime)
{
   //apply inputs that work all the time
   applyUniversalInputs();

   //check for loadMap:
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

   //update universally used hex editor state variables:
   hexEditor->updateHexStateVariables(mapControl->FilteredEntityCount());

   // turn on hax inputs if player input is allowed or be boring and normal
   if (hexEditor->isHexEditorOn()
      && !(dialogControl->isOpen()
         || !playerHasControl
         || !playerHasHexEditorControl
         || hexEditor->IsMovementDisabled()))
   {
      //apply inputs to the hex editor:
      hexEditor->applyHexModeInputs(mapControl->GetEntityDataPointer());

      //then handle any still-running scripts:
      scriptControl->tickScripts();
      commandControl->sendBufferedOutput();
   }
   else
   {
      //this handles buttons and state updates based on button presses in game mode:
      applyGameModeInputs(deltaTime);

      //update the entities based on the current state of their (hackable) data array.
      mapControl->UpdateEntities(deltaTime);

      //handle scripts:
      scriptControl->tickScripts();
      commandControl->sendBufferedOutput();

      //check for loadMap:
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

      camera.applyEffects(deltaTime);
   }
}

void MageGameEngine::GameRender()
{
   //make hax do
   if (hexEditor->isHexEditorOn())
   {
      //run hex editor if appropriate
      frameBuffer->clearScreen(RGB(0, 0, 0));
      hexEditor->renderHexEditor(mapControl->GetEntityDataPointer());
   }

   //otherwise be boring and normal/run mage game:
   else
   {
      uint16_t backgroundColor = RGB(0, 0, 0);
      frameBuffer->clearScreen(backgroundColor);

      //then draw the map and entities:
      uint8_t layerCount = mapControl->LayerCount();

      for (uint8_t layerIndex = 0; layerCount == 1 || layerIndex < (layerCount - 1); layerIndex++)
      {
         //draw all map layers except the last one before drawing entities.
         mapControl->Draw(layerIndex, camera.position);
      }

      //now that the entities are updated, draw them to the screen.
      mapControl->DrawEntities(camera.position);

      if (layerCount > 1)
      {
         //draw the final layer above the entities.
         mapControl->Draw(layerCount - 1, camera.position);
      }

      if (dialogControl->isOpen())
      {
         dialogControl->draw();
      }
   }
   //update the state of the LEDs
;   hexEditor->updateHexLights(mapControl->GetEntityDataPointer());

   //update the screen
   frameBuffer->blt(inputHandler->GetButtonState());
}

void MageGameEngine::EngineMainGameLoop()
{
   //update timing information at the start of every game loop
   now = millis();
   deltaTime = now - lastTime;
   lastTime = now;

   //frame limiter code to keep game running at a specific FPS:
   //only do this on the real hardware:
#ifdef DC801_EMBEDDED
// if(now < (lastLoopTime + MAGE_MIN_MILLIS_BETWEEN_FRAMES) )
// { continue; }

// //code below here will only be run if enough ms have passed since the last frame:
// lastLoopTime = now;
#endif

//handles hardware inputs and makes their state available		
   inputHandler->HandleKeyboard();

   //on desktop, interact with stdin
   //on embedded, interact with USBC com port over serial
   EngineHandleSerialInput();

   //If the loadMap() action has set a new map, we will load it before we render this frame.
   if (mapControl->mapLoadId != MAGE_NO_MAP)
   {
      //load the new map data into gameControl
      LoadMap(mapControl->mapLoadId);

      //clear the mapLoadId to prevent infinite reloads
      scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
      mapControl->mapLoadId = MAGE_NO_MAP;
   }

   //updates the state of all the things before rendering:
   GameUpdate(deltaTime);

   //This renders the game to the screen based on the loop's updated state.
   GameRender();

   uint32_t fullLoopTime = millis() - lastTime;

   //this pauses for scriptControl->blockingDelayTime before continuing to the next loop:
   handleBlockingDelay();

   uint32_t updateAndRenderTime = millis() - lastTime;

#ifndef DC801_EMBEDDED
   if (updateAndRenderTime < MAGE_MIN_MILLIS_BETWEEN_FRAMES)
   {
      SDL_Delay(MAGE_MIN_MILLIS_BETWEEN_FRAMES - updateAndRenderTime);
   }
#endif
}

void MageGameEngine::onSerialStart()
{
   commandControl->handleStart();
}
void MageGameEngine::onSerialCommand(char* commandString)
{
   commandControl->processCommand(commandString);
}

Point MageGameEngine::getPushBackFromTilesThatCollideWithPlayer()
{
   auto mageCollisionSpokes = MageGeometry{ MageGeometryType::Polygon, MAGE_COLLISION_SPOKE_COUNT };
   float maxSpokePushbackLengths[MAGE_COLLISION_SPOKE_COUNT]{ 0 };
   Point maxSpokePushbackVectors[MAGE_COLLISION_SPOKE_COUNT]{ 0 };
   auto& playerRenderableData = mapControl->getPlayerEntityRenderableData();

   auto& playerRect = playerRenderableData.hitBox;
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
   uint16_t geometryId = 0;
   auto pushback = Point{};
   Point playerPoint = playerRenderableData.center;
   float playerSpokeRadius = playerRenderableData.hitBox.w / 1.5;
   float angleOffset = atan2(playerVelocity.y, playerVelocity.x)
      - (PI / 2)
      + ((PI / MAGE_COLLISION_SPOKE_COUNT) / 2);

   for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
   {
      maxSpokePushbackLengths[i] = -INFINITY;
      maxSpokePushbackVectors[i].x = 0;
      maxSpokePushbackVectors[i].y = 0;
      auto& spokePoint = mageCollisionSpokes.GetPoint(i);
      float angle = (float)i * (PI / MAGE_COLLISION_SPOKE_COUNT) + angleOffset;
      spokePoint.x = cos(angle) * playerSpokeRadius + playerVelocity.x + playerPoint.x;
      spokePoint.y = sin(angle) * playerSpokeRadius + playerVelocity.y + playerPoint.y;
   }

   for (auto layerIndex = 0u; layerIndex < mapControl->LayerCount(); layerIndex++)
   {
      const auto layerAddress = mapControl->LayerAddress(layerIndex);
      for (auto i = 0u; i < mapControl->Cols() * mapControl->Rows(); i++)
      {
         tileTopLeftPoint.x = (int32_t)(mapControl->TileWidth() * (i % mapControl->Cols()));
         tileTopLeftPoint.y = (int32_t)(mapControl->TileHeight() * (i / mapControl->Cols()));
         auto x = tileTopLeftPoint.x - playerRect.origin.x;
         auto y = tileTopLeftPoint.y - playerRect.origin.y;

         if (x + mapControl->TileWidth() < 0 || x > playerRect.w
            || y + mapControl->TileHeight() < 0 || y > playerRect.h)
         {
            continue;
         }
         auto offset = layerAddress + (i * sizeof(MageMapTile));

         auto currentTile = ROM()->GetReadPointerToAddress<MageMapTile>(offset);

         if (currentTile->tileId == 0)
         {
            continue;
         }

         auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentTile->tilesetId);

         if (!tileset->Valid())
         {
            continue;
         }
         geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile->tileId - 1);
         if (geometryId)
         {
            for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
            {
               float angle = (float)i * (PI / MAGE_COLLISION_SPOKE_COUNT) + angleOffset;
               auto& spokePoint = mageCollisionSpokes.GetPoint(i);
               spokePoint.x = cos(angle) * playerSpokeRadius
                  + playerVelocity.x + playerPoint.x
                  - tileTopLeftPoint.x;
               spokePoint.y = sin(angle) * playerSpokeRadius
                  + playerVelocity.y + playerPoint.y
                  - tileTopLeftPoint.y;
            }
            geometryId--;

            auto geometryPoints = ROM()->GetReadPointerByIndex<MageGeometry>(geometryId)
               ->FlipByFlags(currentTile->flags, tileset->TileWidth, tileset->TileHeight);

            auto offsetPoint = Point{ uint16_t(playerPoint.x - tileTopLeftPoint.x), uint16_t(playerPoint.y - tileTopLeftPoint.y) };
            bool isMageInGeometry = false;

            bool collidedWithThisTileAtAll = false;
            for (int tileLinePointIndex = 0; tileLinePointIndex < geometryPoints.size(); tileLinePointIndex++)
            {
               auto& tileLinePointA = geometryPoints[tileLinePointIndex];
               auto& tileLinePointB = geometryPoints[tileLinePointIndex + 1];
               bool collidedWithTileLine = false;

               for (auto spokeIndex = 0; spokeIndex < mageCollisionSpokes.GetPointCount(); spokeIndex++)
               {
                  auto spokePointB = mageCollisionSpokes.GetPoint(spokeIndex);

                  auto spokeIntersectionPoint = MageGeometry::getIntersectPointBetweenLineSegments(offsetPoint, spokePointB, tileLinePointA, tileLinePointB);
                  if (spokeIntersectionPoint.has_value())
                  {
                     collidedWithTileLine = true;
                     isMageInGeometry = true;
                     auto diff = spokeIntersectionPoint.value() - spokePointB;

                     frameBuffer->drawLine(offsetPoint, spokePointB, COLOR_RED);
                     frameBuffer->drawLine(offsetPoint, spokeIntersectionPoint.value(), COLOR_GREENYELLOW);
                     frameBuffer->drawLine(offsetPoint, offsetPoint + diff, COLOR_ORANGE);
                     float currentIntersectLength = diff.VectorLength();

                     maxSpokePushbackLengths[spokeIndex] = std::max(currentIntersectLength, maxSpokePushbackLengths[spokeIndex]);
                     if (currentIntersectLength == maxSpokePushbackLengths[spokeIndex])
                     {
                        maxSpokePushbackVectors[spokeIndex] = diff;
                     }
                  }
               }
               frameBuffer->drawLine(tileLinePointA, tileLinePointB, collidedWithTileLine ? COLOR_RED : COLOR_ORANGE);
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
      frameBuffer->drawLine(playerPoint - camera.position, playerPoint + pushback - camera.position, COLOR_RED);
   }
   return pushback;
}
