#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include <signal.h>
#include "main.h"

enum class Button
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

struct ButtonStates
{
   bool mem0;
   bool mem1;
   bool mem2;
   bool mem3;
   bool bit_128;
   bool bit_64;
   bool bit_32;
   bool bit_16;
   bool bit_8;
   bool bit_4;
   bool bit_2;
   bool bit_1;
   bool op_xor;
   bool op_add;
   bool op_sub;
   bool op_page;
   bool ljoy_center;
   bool ljoy_up;
   bool ljoy_down;
   bool ljoy_left;
   bool ljoy_right;
   bool rjoy_center;
   bool rjoy_up;
   bool rjoy_down;
   bool rjoy_left;
   bool rjoy_right;
   bool hax;
};

class EngineInput
{
public:
   EngineInput() {}

   bool GetButtonState(int button)
   {
      return *buttonBoolPointerArray[button];
   }
   void HandleKeyboard();
   bool IsRunning();
   bool ShouldReloadGameDat();
   void TriggerRomReload();
private:
   bool running = true;
   bool shouldReloadGameDat = false;

   ButtonStates EngineInput_Buttons = {};
   ButtonStates EngineInput_Activated = {};
   ButtonStates EngineInput_Deactivated = {};
   void GetDesktopInputState(uint32_t* keyboardBitmask);
   void SetHardwareBitmaskToButtonStates(uint32_t keyboardBitmask);

   bool* buttonBoolPointerArray[sizeof(ButtonStates) / sizeof(bool)] = {
      &EngineInput_Buttons.mem0,
      &EngineInput_Buttons.mem1,
      &EngineInput_Buttons.mem2,
      &EngineInput_Buttons.mem3,
      &EngineInput_Buttons.bit_128,
      &EngineInput_Buttons.bit_64,
      &EngineInput_Buttons.bit_32,
      &EngineInput_Buttons.bit_16,
      &EngineInput_Buttons.bit_8,
      &EngineInput_Buttons.bit_4,
      &EngineInput_Buttons.bit_2,
      &EngineInput_Buttons.bit_1,
      &EngineInput_Buttons.op_xor,
      &EngineInput_Buttons.op_add,
      &EngineInput_Buttons.op_sub,
      &EngineInput_Buttons.op_page,
      &EngineInput_Buttons.ljoy_center,
      &EngineInput_Buttons.ljoy_left,
      &EngineInput_Buttons.ljoy_down,
      &EngineInput_Buttons.ljoy_up,
      &EngineInput_Buttons.ljoy_right,
      &EngineInput_Buttons.rjoy_center,
      &EngineInput_Buttons.rjoy_left,
      &EngineInput_Buttons.rjoy_down,
      &EngineInput_Buttons.rjoy_up,
      &EngineInput_Buttons.rjoy_right,
      &EngineInput_Buttons.hax,
   };

};



#endif