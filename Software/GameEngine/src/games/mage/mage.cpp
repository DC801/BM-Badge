#include "mage.h"

#include <algorithm>
#include <chrono>
#include <format>
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
//   const auto EmscriptenFps_UseBrowser = 0;
//   const auto EmscriptenSimulateInfiniteLoop = 0;
//   emscripten_set_main_loop(gameLoopIteration, emscriptenFPS, emscriptenSimulateInfiniteLoop);
//#else

   //update timing information at the start of every game loop
   auto lastTime = GameClock::now();
   auto fps = 0;
   auto frames = 0;

   while (inputHandler->KeepRunning())
   {
      if (inputHandler->ShouldReset())
      {
         mapControl->mapLoadId = ROM()->GetCurrentSave().currentMapId;
      }

      if (inputHandler->ToggleEntityDebug())
      {
         screenManager->ToggleDrawGeometry();
      }

      if (mapControl->mapLoadId != MAGE_NO_MAP)
      {
         LoadMap();
      }

      frames++;
      const auto newTime = GameClock::now();
      if (newTime - lastTime >= GameClock::duration{ std::chrono::seconds{1} })
      {
         fps = frames / (newTime - lastTime).count();
         lastTime = newTime;
      }
      gameLoopIteration();
      frameBuffer->printMessage(std::format("FPS: {}", fps), Monaco9, COLOR_RED, 10, 10);
   }
   //#endif
}

void MageGameEngine::gameLoopIteration()
{
   const auto loopStart = GameClock::now();
   inputHandler->UpdateState(loopStart);
   auto updateAccumulator = inputHandler->lastDelta;
   // step forward in IntegrationStepSize increments until MinTimeBetweenRenders has passed
   while (updateAccumulator >= IntegrationStepSize)
   {
      // if the map is about to change, don't bother updating entities since they're about to be reloaded
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

      applyGameModeInputs();
      
      // always apply camera effects before any other updates that rely on camera data
      camera.applyEffects();
      scriptControl->jumpScriptId = dialogControl->Update();
      hexEditor->Update();

      // always update entities last to accumulate all previous changes that may affect their hackable data
      mapControl->UpdateEntities();
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

   // finish any buffered serial I/O
   commandControl->reset();

   // reset any fading that might be in progress
   frameBuffer->ResetFade();

   // close any open dialogs/hex editor overlays
   dialogControl->close();
   hexEditor->setHexEditorOn(false);

   // Load the map and trigger its OnLoad script
   // This is the only place a map's OnLoad should be called
   mapControl->Load();
   auto onLoad = MageScriptState{ mapControl->currentMap->onLoadScriptId, true };
   scriptControl->processScript(onLoad, MAGE_MAP_ENTITY);

   // ensure the player has control
   playerHasControl = true;
}

void MageGameEngine::applyGameModeInputs()
{
   auto player = mapControl->getPlayerEntityData();
   const auto moveAmount = inputHandler->IsPressed(KeyPress::Rjoy_down) ? RunSpeed : WalkSpeed;

   auto playerEntityTypeId = player->primaryIdType % NUM_PRIMARY_ID_TYPES;
   auto hasEntityType = playerEntityTypeId == ENTITY_TYPE;
   auto entityType = hasEntityType ? ROM()->GetReadPointerByIndex<MageEntityType>(playerEntityTypeId) : nullptr;

   // position updates while player is actioning cause loss of collision data
   // because th
   if (playerHasControl && !inputHandler->PlayerIsActioning())
   {
      // clip player to [0,max(uint16_t)]
      if (inputHandler->Left())
      {
         player->position.x = static_cast<int>(player->position.x) - moveAmount < 0
            ? 0
            : player->position.x - moveAmount;
      }
      else if (inputHandler->Right())
      {
         player->position.x = static_cast<int>(player->position.x) + moveAmount > std::numeric_limits<uint16_t>::max()
            ? std::numeric_limits<uint16_t>::max()
            : player->position.x + moveAmount;
      }

      if (inputHandler->Up())
      {
         player->position.y = static_cast<int>(player->position.y) - moveAmount < 0
            ? 0
            : player->position.y - moveAmount;
      }
      else if (inputHandler->Down())
      {
         player->position.y = static_cast<int>(player->position.y) + moveAmount > std::numeric_limits<uint16_t>::max()
            ? std::numeric_limits<uint16_t>::max()
            : player->position.y + moveAmount;
      }
      auto entityInteractId = mapControl->UpdatePlayer();
      if (entityInteractId.has_value())
      {
         if (inputHandler->Hack() && hexEditor->playerHasHexEditorControl)
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
   if (inputHandler->PlayerIsActioning() && hasEntityType
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
   if (inputHandler->Hack())
   {
      hexEditor->setHexEditorOn(true);
   }
   hexEditor->applyMemRecallInputs();
}

void MageGameEngine::updateHexLights() const
{
   const auto entityDataPointer = mapControl->GetEntityDataPointer();
   const auto hexCursorOffset = hexEditor->GetCursorOffset();
   const auto currentByte = *(entityDataPointer + hexCursorOffset);
   ledSet(LED_PAGE, inputHandler->IsPressed(KeyPress::Page) ? 0xFF : 0x00);

   ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);

   const auto entityRelativeMemOffset = hexCursorOffset % sizeof(MageEntityData);
   const auto leds = std::array{ LED_MEM0, LED_MEM1, LED_MEM2, LED_MEM3 };
   for (auto i = 0; i < leds.size(); i++)
   {
      const auto led = leds[i];
      if (entityRelativeMemOffset == hexEditor->memOffsets[i])
      {
         ledOn(led);
      }
      else
      {
         ledOff(led);
      }
   }
}