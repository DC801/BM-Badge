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

      auto updateAccumulator = inputHandler->lastDelta;
      // step forward in IntegrationStepSize increments until MinTimeBetweenRenders has passed
      while (updateAccumulator >= IntegrationStepSize)
      {
         gameLoopIteration();
         updateAccumulator -= IntegrationStepSize;
      }

      while (GameClock::now() - loopStart < MinTimeBetweenRenders)
      {
         std::this_thread::sleep_for(GameClock::duration{ 1 });
         continue;
      }

      frameBuffer->ClearScreen(COLOR_BLACK);
      mapControl->Draw();
      hexEditor->Draw();
      dialogControl->Draw();

      frames++;

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
   // methods that should only happen once per frame:
   if (!hexEditor->isHexEditorOn())
   {
      scriptControl->tickScripts();
   }

   commandControl->sendBufferedOutput();

   inputHandler->Update(GameClock::now());
   // if the map is about to change, don't bother updating entities since they're about to be reloaded
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

   applyGameModeInputs();

   // always apply camera effects before any other updates that rely on camera data
   frameBuffer->camera.Update();

   auto dialogScriptId = dialogControl->Update();
   if (dialogScriptId != MAGE_NO_SCRIPT)
   {
      const auto dialogScript = ROM()->GetReadPointerByIndex<MageScript>(dialogScriptId.value());
      auto dialogScriptState = MageScriptState{ dialogScriptId.value(), dialogScript };
      dialogScriptState.scriptIsRunning = true;
      scriptControl->processScript(dialogScriptState, MAGE_MAP_ENTITY);
      return;
   }
   hexEditor->Update();

   // always update entities last to accumulate all previous changes that may affect their hackable data
   auto entityInteractId = mapControl->Update();
   if (entityInteractId.has_value())
   {
      if (inputHandler->Hack() && hexEditor->playerHasHexEditorControl)
      {
         hexEditor->openToEntity(*entityInteractId);
      }
      else if (inputHandler->Interact())
      {
         const auto scriptId = mapControl->Get<MageEntityData>(*entityInteractId).onInteractScriptId;
         auto& scriptState = mapControl->Get<OnInteractScript>(scriptId);
         scriptState.script = mapControl->scripts[scriptId];
         scriptState.scriptIsRunning = true;
         scriptControl->processScript(scriptState, *entityInteractId);
      }
   }
}

void MageGameEngine::LoadMap()
{
   // disable player control while loading map
   playerHasControl = false;

   // ensure that processing the map's onload won't immediately jump to a different script
   scriptControl->jumpScriptId = std::nullopt;
   frameBuffer->ResetFade();
   dialogControl->Close();
   hexEditor->setHexEditorOn(false);

   mapControl->Load();

   // center the camera on the player
   frameBuffer->camera.SetFollowEntity(mapControl->getPlayerRenderableData());

   // This is the only place a map's OnLoad script should be processed
   const auto onLoadScript = ROM()->GetReadPointerByIndex<MageScript>(mapControl->currentMap->onLoadScriptId);
   auto onLoad = MageScriptState{ mapControl->currentMap->onLoadScriptId, onLoadScript };
   onLoad.scriptIsRunning = true;
   scriptControl->processScript(onLoad, MAGE_MAP_ENTITY);

   playerHasControl = true;
}

void MageGameEngine::applyGameModeInputs()
{
   const auto moveAmount = inputHandler->IsPressed(KeyPress::Rjoy_down) ? RunSpeed : WalkSpeed;

   if (!playerHasControl)
   {
      return;
   }

   auto& playerEntityData = mapControl->getPlayerEntityData();
   auto& playerRenderableData = mapControl->getPlayerRenderableData();

   const auto playerEntityType = ROM()->GetReadPointerByIndex<MageEntityType>(static_cast<uint16_t>(playerEntityData.primaryIdType));

   if (playerEntityData.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      // position updates while player is actioning cause loss of collision data
      if (playerHasControl && !inputHandler->PlayerIsActioning())
      {
         const auto playerXInt = static_cast<int>(playerEntityData.targetPosition.x);
         const auto playerYInt = static_cast<int>(playerEntityData.targetPosition.y);

         // clip player to [0,max(uint16_t)]
         if (inputHandler->Left())
         {
            playerEntityData.SetDirection(MageEntityAnimationDirection::WEST);
            playerEntityData.targetPosition.x = playerXInt - moveAmount < 0
               ? 0
               : playerXInt - moveAmount;
         }
         else if (inputHandler->Right())
         {
            playerEntityData.SetDirection(MageEntityAnimationDirection::EAST);
            playerEntityData.targetPosition.x = playerXInt + moveAmount > std::numeric_limits<uint16_t>::max()
               ? std::numeric_limits<uint16_t>::max()
               : playerXInt + moveAmount;
         }

         if (inputHandler->Up())
         {
            playerEntityData.SetDirection(MageEntityAnimationDirection::NORTH);
            playerEntityData.targetPosition.y = playerYInt - moveAmount < 0
               ? 0
               : playerYInt - moveAmount;
         }
         else if (inputHandler->Down())
         {
            playerEntityData.SetDirection(MageEntityAnimationDirection::SOUTH);
            playerEntityData.targetPosition.y = playerYInt + moveAmount > std::numeric_limits<uint16_t>::max()
               ? std::numeric_limits<uint16_t>::max()
               : playerYInt + moveAmount;
         }

         const auto playerIsMoving = inputHandler->Right() != inputHandler->Left() || inputHandler->Up() != inputHandler->Down();
         if (playerIsMoving && playerEntityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
         {
            playerRenderableData.SetAnimation(MAGE_WALK_ANIMATION_INDEX);
         }
         else if (inputHandler->PlayerIsActioning()
            && playerEntityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
         {
            playerRenderableData.SetAnimation(MAGE_ACTION_ANIMATION_INDEX);
         }
         else
         {
            playerRenderableData.SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
         }
      }
   }

   if (!hexEditor->playerHasHexEditorControl)
   {
      return;
   }

   //opening the hex editor will delay by one frame
   //this is to allow entity scripts to check the hex editor state before it opens to run scripts
   if (inputHandler->Hack())
   {
      hexEditor->setHexEditorOn(true);
   }
   hexEditor->applyMemRecallInputs();
}
