#include "mage.h"

#include <algorithm>
#include <chrono>
#include <format>
#include <limits>
#include <thread>
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

   auto frames = 0;
   auto fps = 0.0f;
   auto lastTime = GameClock::now();

   while (inputHandler->KeepRunning())
   {
      const auto loopStart = GameClock::now();
      inputHandler->Update(loopStart);

      if (inputHandler->ShouldReset())
      {
         mapControl->mapLoadId = ROM()->GetCurrentSave().currentMapId;
      }

      if (mapControl->mapLoadId != MAGE_NO_MAP)
      {
         LoadMap();
      }

      if (inputHandler->ToggleEntityDebug())
      {
         frameBuffer->ToggleDrawGeometry();
      }

      while (GameClock::now() - loopStart < MinTimeBetweenRenders)
      {
         std::this_thread::sleep_for(GameClock::duration{ 1 });
         continue;
      }

      gameLoopIteration();

      mapControl->Draw();
      hexEditor->Draw();
      dialogControl->Draw();
      updateHexLights();

      frames++;
      frameBuffer->DrawText(std::format("FPS: {:4}", fps), COLOR_RED, 10, 10, true);

      if (GameClock::now() - lastTime > GameClock::duration(125))
      {
         const auto smoothing = 0.9f;
         fps = smoothing * (8 * frames) + (8 * frames * (1.0f - smoothing));
         lastTime = GameClock::now();
         frames = 0;
      }

      frameBuffer->blt();
   }
   //#endif
}

void MageGameEngine::gameLoopIteration()
{
   auto updateAccumulator = inputHandler->lastDelta;

   // step forward in IntegrationStepSize increments until MinTimeBetweenRenders has passed
   while (updateAccumulator >= IntegrationStepSize)
   {
      // if the map is about to change, don't bother updating entities since they're about to be reloaded
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

      applyGameModeInputs();

      // always apply camera effects before any other updates that rely on camera data
      frameBuffer->camera.applyEffects();
      scriptControl->jumpScriptId = dialogControl->Update();
      hexEditor->Update();

      // always update entities last to accumulate all previous changes that may affect their hackable data
      auto entityInteractId = mapControl->Update();
      if (entityInteractId.has_value())
      {
         if (inputHandler->Hack() && hexEditor->playerHasHexEditorControl)
         {
            hexEditor->openToEntity(*entityInteractId);
         }
         else if (inputHandler->Use())
         {
            const auto scriptId = mapControl->Get<MageEntityData>(*entityInteractId).onInteractScriptId;
            auto& scriptState = mapControl->Get<MapControl::OnInteractScript>(scriptId);
            scriptState.script = mapControl->scripts[scriptId];
            scriptState.scriptIsRunning = true;
            scriptControl->processScript(scriptState, *entityInteractId);
         }
      }
      updateAccumulator -= IntegrationStepSize;
   }

   // methods that should only happen once per frame follow:
   if (!hexEditor->isHexEditorOn())
   {
      scriptControl->tickScripts();
   }

   commandControl->sendBufferedOutput();
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

   if (player->primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      auto entityType = ROM()->GetReadPointerByIndex<MageEntityType>(static_cast<uint16_t>(player->primaryIdType));

      // position updates while player is actioning cause loss of collision data
      if (playerHasControl && !inputHandler->PlayerIsActioning())
      {
         // clip player to [0,max(uint16_t)]
         if (inputHandler->Left())
         {
            player->SetDirection(MageEntityAnimationDirection::WEST);
            player->targetPosition.x = static_cast<int>(player->targetPosition.x) - moveAmount < 0
               ? 0
               : player->targetPosition.x - moveAmount;
         }
         else if (inputHandler->Right())
         {
            player->SetDirection(MageEntityAnimationDirection::EAST);
            player->targetPosition.x = static_cast<int>(player->targetPosition.x) + moveAmount > std::numeric_limits<uint16_t>::max()
               ? std::numeric_limits<uint16_t>::max()
               : player->targetPosition.x + moveAmount;
         }

         if (inputHandler->Up())
         {
            player->SetDirection(MageEntityAnimationDirection::NORTH);
            player->targetPosition.y = static_cast<int>(player->targetPosition.y) - moveAmount < 0
               ? 0
               : player->targetPosition.y - moveAmount;
         }
         else if (inputHandler->Down())
         {
            player->SetDirection(MageEntityAnimationDirection::SOUTH);
            player->targetPosition.y = static_cast<int>(player->targetPosition.y) + moveAmount > std::numeric_limits<uint16_t>::max()
               ? std::numeric_limits<uint16_t>::max()
               : player->targetPosition.y + moveAmount;
         }
      }

      auto playerRenderableData = mapControl->getPlayerRenderableData();
      playerRenderableData->SetAnimation(MAGE_IDLE_ANIMATION_INDEX);

      if (inputHandler->PlayerIsActioning()
         && entityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
      {
         playerRenderableData->SetAnimation(MAGE_ACTION_ANIMATION_INDEX);
      }
      else if (mapControl->playerIsMoving
         && entityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
      {
         playerRenderableData->SetAnimation(MAGE_WALK_ANIMATION_INDEX);
      }
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
