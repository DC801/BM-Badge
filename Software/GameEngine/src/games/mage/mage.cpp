#include "mage.h"

#include <algorithm>
#include <chrono>

#include "mage_defines.h"
#include "mage_script_control.h"
#include "shim_timer.h"
#include "utility.h"

#ifndef DC801_EMBEDDED
#include <SDL.h>
#endif

#ifdef EMSCRIPTEN
#include "emscripten.h"
#endif

void MageGameEngine::Run()
{
   mapControl->mapLoadId = ROM()->GetCurrentSave().currentMapId;
   LoadMap();

   // TODO: fix/move emscripten startup
#ifdef EMSCRIPTEN
   emscripten_set_main_loop(gameLoop, 24, 1);
#else

   //update timing information at the start of every game loop
   auto lastTime = GameClock::now();
   auto totalTime = GameClock::duration{ 0 };
   auto accumulator = GameClock::duration{ 0 };
   auto fps = 0;

   while (inputHandler->KeepRunning())
   {
      if (inputHandler->Reset())
      {
         mapControl->mapLoadId = ROM()->GetCurrentSave().currentMapId;
      }

      if (mapControl->mapLoadId != MAGE_NO_MAP)
      {
         LoadMap();
      }

      const auto deltaState = inputHandler->GetDeltaState();

      applyUniversalInputs(deltaState);
       
      const auto loopStart = GameClock::now();
      const auto deltaTime = loopStart - lastTime;
      lastTime = loopStart;
      accumulator += deltaTime; 

      // using a fixed frame rate targeting the compile-time FPS
      // update the game state  
      while (accumulator >= MinTimeBetweenRenders)
      {
         gameUpdate(deltaState);
         camera.applyEffects();
         accumulator -= IntegrationStepSize;
         totalTime += IntegrationStepSize;
      }

      // don't run scripts when hex editor is on
      if (!hexEditor->isHexEditorOn())
      {
         scriptControl->tickScripts();
      }

      // commands are only allowed to be sent once per frame, so they are outside the update loop
      commandControl->sendBufferedOutput();

      gameRender();

      lastTime = loopStart;

      // TODO: shouldn't this only pause the input updates, not the whole game loop?
      // if a blocking delay was added by any actions, pause before returning to the game loop:
      if (inputHandler->blockingDelayTime)
      {
         debug_print("Pretend to block for %x ms", inputHandler->blockingDelayTime);
         // TODO: after looking into it, we should avoid `nrf_delay_ms` entirely - it just loops nops:
         //delay for the right amount of time
         //nrf_delay_ms(inputHandler->blockingDelayTime);
         //reset delay time when done so we don't do this every loop.
         inputHandler->blockingDelayTime = 0;
      }
   }
#endif
}

void MageGameEngine::LoadMap()
{
   // clear any scripts that might trigger
   scriptControl->jumpScriptId = MAGE_NO_SCRIPT;

   // reset any fading that might be in progress
   frameBuffer->ResetFade();

   // close any open dialogs/hex editor overlays
   dialogControl->close();
   hexEditor->setHexEditorOn(false);

   commandControl->reset();

   // Load the map and trigger its OnLoad script
   // This is the only place OnLoad should be called
   mapControl->Load();
   auto onLoad = MageScriptState{ mapControl->currentMap->onLoadScriptId, true };
   scriptControl->processScript(onLoad, MAGE_MAP_ENTITY);

   // ensure the player has control
   playerHasControl = true;
}

void MageGameEngine::applyUniversalInputs(const DeltaState& delta)
{
   //make sure any delta.Buttons handling in this function can be processed in ANY game mode.
   //that includes the game mode, hex editor mode, any menus, maps, etc.
   ledSet(LED_PAGE, delta.Buttons.IsPressed(KeyPress::Page) ? 0xFF : 0x00);
   if (delta.Buttons.IsPressed(KeyPress::Xor)) { hexEditor->setHexOp(HEX_OPS_XOR); }
   if (delta.Buttons.IsPressed(KeyPress::Add)) { hexEditor->setHexOp(HEX_OPS_ADD); }
   if (delta.Buttons.IsPressed(KeyPress::Sub)) { hexEditor->setHexOp(HEX_OPS_SUB); }
   if (delta.Buttons.IsPressed(KeyPress::Bit128)) { hexEditor->runHex(0b10000000); }
   if (delta.Buttons.IsPressed(KeyPress::Bit64)) { hexEditor->runHex(0b01000000); }
   if (delta.Buttons.IsPressed(KeyPress::Bit32)) { hexEditor->runHex(0b00100000); }
   if (delta.Buttons.IsPressed(KeyPress::Bit16)) { hexEditor->runHex(0b00010000); }
   if (delta.Buttons.IsPressed(KeyPress::Bit8)) { hexEditor->runHex(0b00001000); }
   if (delta.Buttons.IsPressed(KeyPress::Bit4)) { hexEditor->runHex(0b00000100); }
   if (delta.Buttons.IsPressed(KeyPress::Bit2)) { hexEditor->runHex(0b00000010); }
   if (delta.Buttons.IsPressed(KeyPress::Bit1)) { hexEditor->runHex(0b00000001); }

   // only trigger on the first release of XOR MEM0, regardless of order it is pressed
   if (delta.Buttons.IsPressed(KeyPress::Xor) && delta.ActivatedButtons.IsPressed(KeyPress::Mem0)
      || delta.ActivatedButtons.IsPressed(KeyPress::Xor) && delta.Buttons.IsPressed(KeyPress::Mem0))
   {
      tileManager->ToggleDrawGeometry();
   }
}

void MageGameEngine::applyGameModeInputs(const DeltaState& delta)
{
   auto playerEntity = mapControl->getPlayerEntityData();

   // try to update the player or camera's position
   auto& pointToUpdate = playerEntity != NoPlayer
      ? playerEntity.value()->position
      : camera.position;
   const auto buttons = delta.Buttons;

   //set mage speed based on if the right pad down is being pressed:
   const auto moveAmount = buttons.IsPressed(KeyPress::Rjoy_down) ? RunSpeed : WalkSpeed;

   if (buttons.IsPressed(KeyPress::Ljoy_left) && !buttons.IsPressed(KeyPress::Ljoy_right))
   {
      pointToUpdate.x = pointToUpdate.x - moveAmount > pointToUpdate.x ? 0 : pointToUpdate.x - moveAmount;
   }
   else if (buttons.IsPressed(KeyPress::Ljoy_right) && !buttons.IsPressed(KeyPress::Ljoy_left))
   {
      pointToUpdate.x = pointToUpdate.x + moveAmount < pointToUpdate.x ? 0 : pointToUpdate.x + moveAmount;
   }

   if (buttons.IsPressed(KeyPress::Ljoy_up) && !buttons.IsPressed(KeyPress::Ljoy_down))
   {
      pointToUpdate.y = pointToUpdate.y - moveAmount > pointToUpdate.y ? 0 : pointToUpdate.y - moveAmount;
   }
   else if (buttons.IsPressed(KeyPress::Ljoy_down) && !buttons.IsPressed(KeyPress::Ljoy_up))
   {
      pointToUpdate.y = pointToUpdate.y + moveAmount < pointToUpdate.y ? 0 : pointToUpdate.y + moveAmount;
   }


   // if there is a player on the map
   if (playerEntity != NoPlayer)
   {
      auto player = playerEntity.value();
      auto playerEntityTypeId = player->primaryIdType % NUM_PRIMARY_ID_TYPES;
      auto hasEntityType = playerEntityTypeId == ENTITY_TYPE;
      auto entityType = hasEntityType ? ROM()->GetReadPointerByIndex<MageEntityType>(playerEntityTypeId) : nullptr;

      //check to see if the mage is pressing the action buttons, or currently in the middle of an action animation.
      if (playerHasControl && !delta.PlayerIsActioning())
      {
         //if not actioning or resetting, handle all remaining inputs:
         auto interactionTarget = mapControl->TryMovePlayer(delta);

         if (interactionTarget.has_value())
         {
            auto target = interactionTarget.value();
            auto hack = delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_up);

            if (hack && hexEditor->playerHasHexEditorControl)
            {
               hexEditor->disableMovementUntilRJoyUpRelease();
               hexEditor->openToEntity(target);
            }
            else if (!hack && target->onInteractScriptId)
            {
               //target->OnInteract(scriptControl.get());
            }
            //handleEntityInteract(delta.ActivatedButtons);
         }
      }

      auto& playerRenderableData = *mapControl->getPlayerRenderableData().value();
      //handle animation assignment for the player:
      //Scenario 1 - perform action:
      if (delta.PlayerIsActioning() && hasEntityType
         && entityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
      {
         playerRenderableData.SetAnimation(MAGE_ACTION_ANIMATION_INDEX);
      }
      //Scenario 2 - show walk animation:
      else if (mapControl->playerIsMoving && hasEntityType
         && entityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
      {
         playerRenderableData.SetAnimation(MAGE_WALK_ANIMATION_INDEX);
      }
      //Scenario 3 - show idle animation:
      else if (playerHasControl)
      {
         playerRenderableData.SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
      }

      //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
      bool isPlayingActionButShouldReturnControlToPlayer = hasEntityType
         && (playerRenderableData.currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
         && (playerRenderableData.currentFrameIndex == playerRenderableData.frameCount - 1)
         && (playerRenderableData.currentFrameTicks >= playerRenderableData.duration);

      //if the above bool is true, set the player back to their idle animation:
      if (isPlayingActionButShouldReturnControlToPlayer)
      {
         playerRenderableData.SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
      }
   }

   if (!hexEditor->playerHasHexEditorControl || !playerHasControl)
   {
      return;
   }

   //opening the hex editor is the only button press that will lag actual gameplay by one frame
   //this is to allow entity scripts to check the hex editor state before it opens to run scripts
   if (delta.ActivatedButtons.IsPressed(KeyPress::Hax))
   {
      hexEditor->setHexEditorOn(true);
   }
   hexEditor->applyMemRecallInputs();
}


void MageGameEngine::gameUpdate(const DeltaState& delta)
{
   // hack mode
   if (hexEditor->isHexEditorOn()
      && !(dialogControl->isOpen()
         || !playerHasControl
         || !hexEditor->playerHasHexEditorControl
         || hexEditor->IsMovementDisabled()))
   {
      hexEditor->updateHexStateVariables();
      hexEditor->applyHexModeInputs(mapControl->GetEntityDataPointer());
   }
   // dialog mode
   else if (dialogControl->isOpen())
   {
      scriptControl->jumpScriptId = dialogControl->update(delta);
   }
   // gameplay mode
   else
   {
      applyGameModeInputs(delta);
   }
   // if the map is about to change, don't bother updating entities since they're about to be reloaded
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

   // update the entities based on the current state of their (hackable) data array.
   mapControl->UpdateEntities(delta);
}

void MageGameEngine::gameRender()
{
   if (hexEditor->isHexEditorOn())
   {
      hexEditor->Render();
   }
   else
   {
      mapControl->Draw(camera.position);

      // dialogs are drawn after/on top of the map
      if (dialogControl->isOpen())
      {
         dialogControl->draw();
      }
   }
   //update the state of the LEDs
       // drawButtonStates(inputHandler->GetButtonState());
       // drawLEDStates();
   updateHexLights();
   frameBuffer->blt();
}


void MageGameEngine::updateHexLights() const
{
   const auto entityDataPointer = mapControl->GetEntityDataPointer();
   const auto hexCursorOffset = hexEditor->GetCursorOffset();
   const auto currentByte = *(entityDataPointer + hexCursorOffset);
   ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);

   const auto entityRelativeMemOffset = hexCursorOffset % sizeof(MageEntityData);
   ledSet(LED_MEM0, (entityRelativeMemOffset == hexEditor->memOffsets[0]) ? 0xFF : 0x00);
   ledSet(LED_MEM1, (entityRelativeMemOffset == hexEditor->memOffsets[1]) ? 0xFF : 0x00);
   ledSet(LED_MEM2, (entityRelativeMemOffset == hexEditor->memOffsets[2]) ? 0xFF : 0x00);
   ledSet(LED_MEM3, (entityRelativeMemOffset == hexEditor->memOffsets[3]) ? 0xFF : 0x00);
}