#include "mage.h"
#include "EngineROM.h"
#include "EngineInput.h"
#include "EnginePanic.h"
#include "EngineSerial.h"
#include "EngineWindowFrame.h"
#include <SDL.h>

#include "convert_endian.h"
#include "utility.h"

#include "mage_defines.h"
#include "mage_command_control.h"
#include "mage_game_control.h"

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
      if (inputHandler->ShouldReloadGameDat())
      {

      }
      EngineMainGameLoop();
   }
#endif

   // Close rom and any open files
   EngineSerialRegisterEventHandlers(
      nullptr,
      nullptr
   );

}


void MageGameEngine::handleBlockingDelay()
{
   //if a blocking delay was added by any actions, pause before returning to the game loop:
   if (scriptControl->blockingDelayTime)
   {
      //delay for the right amount of time
      nrf_delay_ms(scriptControl->blockingDelayTime);
      //reset delay time when done so we don't do this every loop.
      scriptControl->blockingDelayTime = 0;
   }
}

void MageGameEngine::GameUpdate(uint32_t deltaTime)
{
   //apply inputs that work all the time
   gameControl->applyUniversalInputs();

   //check for loadMap:
   if (scriptControl->mapLoadId != MAGE_NO_MAP) { return; }

   //update universally used hex editor state variables:
   hexEditor->updateHexStateVariables();

   //either do hax inputs:
   if (hexEditor->isHexEditorOn())
   {
      //apply inputs to the hex editor:
      hexEditor->applyHexModeInputs();

      //then handle any still-running scripts:
      scriptControl->tickScripts();
   }

   //or be boring and normal:
   else
   {
      //this handles buttons and state updates based on button presses in game mode:
      gameControl->applyGameModeInputs(deltaTime);

      //update the entities based on the current state of their (hackable) data array.
      gameControl->Map()->UpdateEntities(deltaTime);

      //handle scripts:
      scriptControl->tickScripts();

      //check for loadMap:
      if (scriptControl->mapLoadId != MAGE_NO_MAP) { return; }

      gameControl->applyCameraEffects(deltaTime);
   }
}

void MageGameEngine::GameRender()
{
   //make hax do
   if (hexEditor->isHexEditorOn())
   {
      //run hex editor if appropriate
      frameBuffer->clearScreen(RGB(0, 0, 0));
      hexEditor->renderHexEditor();
   }

   //otherwise be boring and normal/run mage game:
   else
   {
      uint16_t backgroundColor = RGB(0, 0, 0);
      frameBuffer->clearScreen(backgroundColor);

      //then draw the map and entities:
      uint8_t layerCount = gameControl->Map()->LayerCount();

      if (layerCount > 1)
      {
         for (uint8_t layerIndex = 0; layerIndex < (layerCount - 1); layerIndex++)
         {
            //draw all map layers except the last one before drawing entities.
            gameControl->DrawMap(layerIndex);
         }
      }
      else
      {
         //if there is only one map layer, it will always be drawn before the entities.
         gameControl->DrawMap(0);
      }

      //now that the entities are updated, draw them to the screen.
      gameControl->Map()->DrawEntities(this);

      if (layerCount > 1)
      {
         //draw the final layer above the entities.
         gameControl->DrawMap(layerCount - 1);
      }

      /*if (gameControl->isCollisionDebugOn)
      {
         gameControl->DrawGeometry();
         if (gameControl->playerEntityIndex != NO_PLAYER)
         {
            auto point = gameControl->getPushBackFromTilesThatCollideWithPlayer();
         }
      }*/
      if (gameControl->dialogControl->isOpen())
      {
         gameControl->dialogControl->draw();
      }
   }
   //update the state of the LEDs
   hexEditor->updateHexLights();

   //update the screen
   frameBuffer->blt();
}

void MageGameEngine::EngineMainGameLoop()
{
   if (!engineIsInitialized)
   {
      // Why do this in the game loop instead of before the game loop?
      // Because Emscripten started throwing a new useless, meaningless,
      // recoverable runtime error that the client can just ignore, unless
      // EngineInit is called from inside the game loop. No idea why.

      gameControl->LoadMap(gameControl->currentSave.currentMapId);
      engineIsInitialized = true;
   }
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

   //updates the state of all the things before rendering:
   GameUpdate(deltaTime);

   //If the loadMap() action has set a new map, we will load it before we render this frame.
   if (scriptControl->mapLoadId != MAGE_NO_MAP)
   {
      //load the new map data into gameControl
      gameControl->LoadMap(scriptControl->mapLoadId);
      //clear the mapLoadId to prevent infinite reloads
      scriptControl->mapLoadId = MAGE_NO_MAP;
      //Update the game for the new map
      GameUpdate(deltaTime);
   }

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
