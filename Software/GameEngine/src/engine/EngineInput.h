#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include <signal.h>
#include <stdint.h>

class ButtonState
{
public:
   ButtonState(uint32_t buttons) :buttons(buttons) {}

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
   void TriggerRomReload() { shouldReloadGameDat = true;}

private:
   bool running = true;
   bool shouldReloadGameDat = false;

   uint32_t buttons = {};
   uint32_t activated = {};

#ifndef DC801_EMBEDDED
   void GetDesktopInputState();
#endif
};



#endif