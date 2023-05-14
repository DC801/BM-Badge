#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include <signal.h>
#include <stdint.h>

class ButtonState
{
public:
   ButtonState(uint32_t state) :buttons(state) {}

   bool IsPressed(KeyPress key) const
   {
      return buttons & (1 << (uint32_t)key);
   }

private:
   uint32_t buttons;
};

class EngineInput
{
public:

   ButtonState GetButtonState() const
   {
      return ButtonState{ buttons };
   }

   ButtonState GetButtonActivatedState() const
   {
      return ButtonState{ activated };
   }

   void HandleKeyboard();
   bool IsRunning() const { return running; }
   bool ShouldReloadGameDat() const { return shouldReloadGameDat; }
   void TriggerRomReload() { shouldReloadGameDat = true; }

   //this is a global that holds the amount of millis that a blocking delay will
   //prevent the main loop from continuing for. It is set by the blockingDelay() action.
   uint32_t blockingDelayTime{ 0 };

private:
   bool running = true;
   bool shouldReloadGameDat = false;

   uint32_t buttons{ 0 };
   uint32_t activated{ 0 };

#ifndef DC801_EMBEDDED
   uint32_t GetDesktopInputState();
#endif
};



#endif