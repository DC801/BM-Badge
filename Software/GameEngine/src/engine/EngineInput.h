#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include <signal.h>
#include <stdint.h>

enum Button : uint32_t
{
   mem0,
   mem1,
   mem2,
   mem3,
   bit_128,
   bit_64,
   bit_32,
   bit_16,
   bit_8,
   bit_4,
   bit_2,
   bit_1,
   op_xor,
   op_add,
   op_sub,
   op_page,
   ljoy_center,
   ljoy_up,
   ljoy_down,
   ljoy_left,
   ljoy_right,
   rjoy_center,
   rjoy_up,
   rjoy_down,
   rjoy_left,
   rjoy_right,
   hax,
};

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
   Button keyboardBitmask;
};

class EngineInput
{
public:

   bool GetButtonState(Button button)
   {
      return button == (Buttons.keyboardBitmask & button);
   }
   bool GetButtonActivatedState(Button button)
   {
      return button == (Activated.keyboardBitmask & button);
   }

   void HandleKeyboard();
   bool IsRunning();
   bool ShouldReloadGameDat();
   void TriggerRomReload();
private:
   bool running = true;
   bool shouldReloadGameDat = false;

   ButtonStates Buttons = {};
   ButtonStates Activated = {};
#ifndef DC801_EMBEDDED

   void GetDesktopInputState();
   void SetHardwareBitmaskToButtonStates();
#endif
};



#endif