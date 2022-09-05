#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include <signal.h>
#include <stdint.h>

class EngineInput
{
public:

   bool GetButtonState(KeyPress key)
   {
      return Buttons.keyboardBitmask & (1 << (uint32_t)key);
   }
   bool GetButtonActivatedState(KeyPress key)
   {
      return Activated.keyboardBitmask & (1 << (uint32_t)key);
   }

   void HandleKeyboard();

   bool IsRunning() const { return running; }
   bool ShouldReloadGameDat() const { return shouldReloadGameDat; }
   constexpr void TriggerRomReload() { shouldReloadGameDat = true;}
private:
   union ButtonStates
   {
      struct
      {
         bool mem0 : 1;
         bool mem1 : 1;
         bool mem2 : 1;
         bool mem3 : 1;
         bool bit_128 : 1;
         bool bit_64 : 1;
         bool bit_32 : 1;
         bool bit_16 : 1;
         bool bit_8 : 1;
         bool bit_4 : 1;
         bool bit_2 : 1;
         bool bit_1 : 1;
         bool op_xor : 1;
         bool op_add : 1;
         bool op_sub : 1;
         bool op_page : 1;
         bool ljoy_center : 1;
         bool ljoy_up : 1;
         bool ljoy_down : 1;
         bool ljoy_left : 1;
         bool ljoy_right : 1;
         bool rjoy_center : 1;
         bool rjoy_up : 1;
         bool rjoy_down : 1;
         bool rjoy_left : 1;
         bool rjoy_right : 1;
         bool hax : 1;
      };
      uint32_t keyboardBitmask;
   };

   bool running = true;
   bool shouldReloadGameDat = false;

   ButtonStates Buttons = {};
   ButtonStates Activated = {};

#ifndef DC801_EMBEDDED
   void GetDesktopInputState();
#endif
};



#endif