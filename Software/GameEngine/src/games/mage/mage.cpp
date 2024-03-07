#include "mage.h"

#include <algorithm>
#include <chrono>
#include <limits>
#include <typeinfo>

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
//#ifdef EMSCRIPTEN
//   const auto EmscriptenUseRequestAnimation = 0;
//   const auto EmscriptenSimulateInfiniteLoop = 0;
//   emscripten_set_main_loop(gameLoopIteration, emscriptenFPS, emscriptenSimulateInfiniteLoop);
//#else

   //update timing information at the start of every game loop
   static auto lastTime = GameClock::now();
   static auto updateAccumulator = GameClock::duration{ 0 };
   static auto fps = 0;


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

      const auto loopStart = GameClock::now();
      const auto deltaTime = loopStart - lastTime;
      lastTime = loopStart;
      updateAccumulator += deltaTime;

      const auto input = inputHandler->GetDeltaState(deltaTime);
      gameLoopIteration(input);
      lastTime = loopStart;
   }
//#endif
}

void MageGameEngine::gameLoopIteration(const InputState& input)
{
   // if the map is about to change, don't bother updating entities since they're about to be reloaded
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

   applyUniversalInputs(input);
   applyGameModeInputs(input);

   const auto loopStart = GameClock::now();
   const auto deltaTime = input.deltaTime;
   auto updateAccumulator = input.deltaTime;
   // step forward in IntegrationStepSize increments until MinTimeBetweenRenders has passed
   while (updateAccumulator >= IntegrationStepSize)
   {
      // always apply camera effects before any other updates that rely on camera data
      camera.applyEffects();

      dialogControl->update();

      // if (uiInputAccumulator >= MinTimeBetweenUIInput)
      {
         hexEditor->applyInput(input);
         scriptControl->jumpScriptId = dialogControl->applyInput(input);
         // uiInputAccumulator -= MinTimeBetweenUIInput;
      }

      // always update entities last to accumulate all previous changes that may affect their hackable data
      mapControl->UpdateEntities(input);
      updateAccumulator -= IntegrationStepSize;
   }

   // methods that should only happen once per frame follow:
   if (!hexEditor->isHexEditorOn()) 
   { 
      scriptControl->tickScripts(); 
   }
   
   commandControl->sendBufferedOutput();

   mapControl->Draw();
   hexEditor->Draw();
   dialogControl->Draw();
   updateHexLights();

   frameBuffer->blt();

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

void MageGameEngine::applyUniversalInputs(const InputState& input)
{
   //make sure any input.Buttons handling in this function can be processed in ANY game mode.
   //that includes the game mode, hex editor mode, any menus, maps, etc.
   ledSet(LED_PAGE, input.Buttons.IsPressed(KeyPress::Page) ? 0xFF : 0x00);
   if (input.Buttons.IsPressed(KeyPress::Xor)) { hexEditor->setHexOp(HEX_OPS_XOR); }
   if (input.Buttons.IsPressed(KeyPress::Add)) { hexEditor->setHexOp(HEX_OPS_ADD); }
   if (input.Buttons.IsPressed(KeyPress::Sub)) { hexEditor->setHexOp(HEX_OPS_SUB); }

   if (input.Buttons.IsPressed(KeyPress::Bit128)) { hexEditor->runHex(0b10000000); }
   if (input.Buttons.IsPressed(KeyPress::Bit64)) { hexEditor->runHex(0b01000000); }
   if (input.Buttons.IsPressed(KeyPress::Bit32)) { hexEditor->runHex(0b00100000); }
   if (input.Buttons.IsPressed(KeyPress::Bit16)) { hexEditor->runHex(0b00010000); }
   if (input.Buttons.IsPressed(KeyPress::Bit8)) { hexEditor->runHex(0b00001000); }
   if (input.Buttons.IsPressed(KeyPress::Bit4)) { hexEditor->runHex(0b00000100); }
   if (input.Buttons.IsPressed(KeyPress::Bit2)) { hexEditor->runHex(0b00000010); }
   if (input.Buttons.IsPressed(KeyPress::Bit1)) { hexEditor->runHex(0b00000001); }

   // only trigger on the first release of XOR MEM0, regardless of order it is pressed
   if (input.Buttons.IsPressed(KeyPress::Xor) && input.ActivatedButtons.IsPressed(KeyPress::Mem0)
      || input.ActivatedButtons.IsPressed(KeyPress::Xor) && input.Buttons.IsPressed(KeyPress::Mem0))
   {
      screenManager->ToggleDrawGeometry();
   }
}

void MageGameEngine::applyGameModeInputs(const InputState& input)
{
   auto player = mapControl->getPlayerEntityData();
   const auto moveAmount = input.Running() ? RunSpeed : WalkSpeed;

   auto playerEntityTypeId = player->primaryIdType % NUM_PRIMARY_ID_TYPES;
   auto hasEntityType = playerEntityTypeId == ENTITY_TYPE;
   auto entityType = hasEntityType ? ROM()->GetReadPointerByIndex<MageEntityType>(playerEntityTypeId) : nullptr;

   // don't update player based on input if they don't have control or are actioning
   if (playerHasControl && !input.PlayerIsActioning())
   {
      // clip player to [0,max(uint16_t)]
      if (input.Left())
      {
         player->position.x = int(player->position.x) - moveAmount < 0
            ? 0
            : player->position.x - moveAmount;
      }
      else if (input.Right())
      {
         player->position.x = int(player->position.x) + moveAmount > std::numeric_limits<uint16_t>::max()
            ? std::numeric_limits<uint16_t>::max()
            : player->position.x + moveAmount;
      }

      if (input.Up())
      {
         player->position.y = int(player->position.y) - moveAmount < 0
            ? 0
            : player->position.y - moveAmount;
      }
      else if (input.Down())
      {
         player->position.y = int(player->position.y) + moveAmount > std::numeric_limits<uint16_t>::max()
            ? std::numeric_limits<uint16_t>::max()
            : player->position.y + moveAmount;
      }
      auto entityInteractId = mapControl->UpdatePlayer(input);
      if (entityInteractId)
      {
         if (input.Hack() && hexEditor->playerHasHexEditorControl)
         {
            hexEditor->openToEntity(*entityInteractId);
         } 
         else
         {
            const auto scriptId = mapControl->Get<MageEntityData>(*entityInteractId).onInteractScriptId;
            auto& scriptState = mapControl->Get<MapControl::OnInteractScript>(scriptId);
            scriptState.script = mapControl->scripts[scriptId];
            scriptState.scriptIsRunning = true;
            scriptControl->processScript(scriptState, *entityInteractId);
         }
      }
   }

   auto playerRenderableData = mapControl->getPlayerRenderableData();
   //handle animation assignment for the player:
   //Scenario 1 - perform action:
   if (input.PlayerIsActioning() && hasEntityType
      && entityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
   {
      playerRenderableData->SetAnimation(MAGE_ACTION_ANIMATION_INDEX);
   }
   //Scenario 2 - show walk animation:
   else if (mapControl->playerIsMoving && hasEntityType
      && entityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
   {
      playerRenderableData->SetAnimation(MAGE_WALK_ANIMATION_INDEX);
   }
   //Scenario 3 - show idle animation:
   else if (playerHasControl)
   {
      playerRenderableData->SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
   }

   //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
   bool isPlayingActionButShouldReturnControlToPlayer = hasEntityType
      && (playerRenderableData->currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
      && (playerRenderableData->currentFrameIndex == playerRenderableData->frameCount - 1)
      && (std::chrono::milliseconds{ playerRenderableData->currentFrameMs } >= playerRenderableData->duration);

   //if the above bool is true, set the player back to their idle animation:
   if (isPlayingActionButShouldReturnControlToPlayer)
   {
      playerRenderableData->SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
   }
   
   if (!hexEditor->playerHasHexEditorControl || !playerHasControl)
   {
      return;
   }

   //opening the hex editor is the only button press that will lag actual gameplay by one frame
   //this is to allow entity scripts to check the hex editor state before it opens to run scripts
   if (input.Hack())
   {
      hexEditor->setHexEditorOn(true);
   }
   hexEditor->applyMemRecallInputs(input);
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

   //update the state of the LEDs
   // drawButtonStates(inputHandler->GetButtonState());
   // drawLEDStates();

}