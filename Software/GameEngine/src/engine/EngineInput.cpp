#include "EngineInput.h"
#include "main.h"

#ifndef DC801_EMBEDDED
#include <SDL.h>
#include <SDL_image.h>
#include "EngineWindowFrame.h"
#include <cstdio>
#include <string>
#include <regex>

void EngineInput::GetDesktopInputState()
{
   if (application_quit != 0)
   {
      running = false;
      return;
   }

   SDL_PumpEvents();

   const uint8_t* keys = SDL_GetKeyboardState(nullptr);
   auto e = SDL_Event{};

   while (SDL_PollEvent(&e))
   {
      if (e.type == SDL_QUIT)
      {
         running = false;
         return;
      }

      if (e.type == SDL_KEYDOWN)
      {
         // Players were pressing ESC intending to close the hex editor,
         // but instead closing the program. ALT + F4 should be a more
         // intuitive/intentional close combination.
         // There is also the GUI close box.
         if (KMOD_ALT == (e.key.keysym.mod & KMOD_ALT) && e.key.keysym.sym == SDLK_F4)
         {
            running = false;
            return;
         }
         // ctrl-r should cause the desktop version of the game to
         // reload the `game.dat` from the filesystem
         else if (KMOD_CTRL == (e.key.keysym.mod & KMOD_CTRL) && e.key.keysym.sym == SDLK_r)
         {
            TriggerRomReload();
            return;
         }
         // + or - keys increase or decrease screen size:
//TODO: MOVE THIS
         /*else if (e.key.keysym.sym == SDLK_MINUS)
         {
            MainWindow->Resize(-1);
            return;
         }
         else if (e.key.keysym.sym == SDLK_EQUALS)
         {
            MainWindow->Resize(1);
            return;
         }*/
      }
   }

   uint32_t newValue = 0x00000000;

   //primary bindings:
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F5] << (uint32_t)KeyPress::Mem0;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F6] << (uint32_t)KeyPress::Mem1;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F7] << (uint32_t)KeyPress::Mem2;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F8] << (uint32_t)KeyPress::Mem3;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_B] << (uint32_t)KeyPress::Mem0;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_N] << (uint32_t)KeyPress::Mem1;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_M] << (uint32_t)KeyPress::Mem2;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_COMMA] << (uint32_t)KeyPress::Mem3;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_1] << (uint32_t)KeyPress::Bit128;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_2] << (uint32_t)KeyPress::Bit64;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_3] << (uint32_t)KeyPress::Bit32;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_4] << (uint32_t)KeyPress::Bit16;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_5] << (uint32_t)KeyPress::Bit8;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_6] << (uint32_t)KeyPress::Bit4;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_7] << (uint32_t)KeyPress::Bit2;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_8] << (uint32_t)KeyPress::Bit1;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F1] << (uint32_t)KeyPress::Xor;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F2] << (uint32_t)KeyPress::Add;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F3] << (uint32_t)KeyPress::Sub;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F4] << (uint32_t)KeyPress::Page;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_Z] << (uint32_t)KeyPress::Xor;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_X] << (uint32_t)KeyPress::Add;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_C] << (uint32_t)KeyPress::Sub;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_V] << (uint32_t)KeyPress::Page;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_1] << (uint32_t)KeyPress::Xor;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_2] << (uint32_t)KeyPress::Add;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_3] << (uint32_t)KeyPress::Sub;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_0] << (uint32_t)KeyPress::Page;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_Q] << (uint32_t)KeyPress::Ljoy_center;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_7] << (uint32_t)KeyPress::Ljoy_center;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_W] << (uint32_t)KeyPress::Ljoy_up;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_S] << (uint32_t)KeyPress::Ljoy_down;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_A] << (uint32_t)KeyPress::Ljoy_left;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_D] << (uint32_t)KeyPress::Ljoy_right;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_9] << (uint32_t)KeyPress::Rjoy_center;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_8] << (uint32_t)KeyPress::Rjoy_up;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_5] << (uint32_t)KeyPress::Rjoy_down;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_4] << (uint32_t)KeyPress::Rjoy_left;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_6] << (uint32_t)KeyPress::Rjoy_right;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_TAB] << (uint32_t)KeyPress::Hax;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_ESCAPE] << (uint32_t)KeyPress::Hax;
   //secondary bindings that duplicate values above:
   newValue ^= (uint32_t)keys[SDL_SCANCODE_LSHIFT] << (uint32_t)KeyPress::Rjoy_down;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_LCTRL] << (uint32_t)KeyPress::Page;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_UP] << (uint32_t)KeyPress::Ljoy_up;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_DOWN] << (uint32_t)KeyPress::Ljoy_down;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_LEFT] << (uint32_t)KeyPress::Ljoy_left;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_RIGHT] << (uint32_t)KeyPress::Ljoy_right;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_O] << (uint32_t)KeyPress::Rjoy_center;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_I] << (uint32_t)KeyPress::Rjoy_up;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_K] << (uint32_t)KeyPress::Rjoy_down;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_J] << (uint32_t)KeyPress::Rjoy_left;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_L] << (uint32_t)KeyPress::Rjoy_right;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_E] << (uint32_t)KeyPress::Rjoy_right;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_ENTER] << (uint32_t)KeyPress::Rjoy_right;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_GRAVE] << (uint32_t)KeyPress::Rjoy_up; // AKA Backtick
   newValue ^= (uint32_t)keys[SDL_SCANCODE_BACKSLASH] << (uint32_t)KeyPress::Rjoy_up;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_RETURN] << (uint32_t)KeyPress::Rjoy_right;

   Buttons.keyboardBitmask = newValue;
   Activated.keyboardBitmask = ~Activated.keyboardBitmask & newValue;
   // debug_print("EngineGetDesktopInputState keyboardBitmask: %" PRIu32 "\n", *keyboardBitmask);
}

#endif

void EngineInput::HandleKeyboard()
{
#ifdef DC801_EMBEDDED
   keyboardBitmask = get_keyboard_mask();
#else
   GetDesktopInputState();
#endif

   /*
   //screen logging, prints button states to screen:
   char mask_string[128];
   uint8_t length = 0;
   for(int k=0; k<KEYBOARD_NUM_KEYS; k++){
      length += sprintf(mask_string+length, "%d", *buttonBoolPointerArray[k]);
   }
   p_canvas()->clearScreen(COLOR_DARKBLUE);
   p_canvas()->printMessage(
      mask_string,
      Monaco9,
      COLOR_WHITE,
      32,
      32
   );
   //p_canvas()->blt();

   //nrf_delay_ms(500);

   //screen logging:
   length = 0;
   for(int k=0; k<KEYBOARD_NUM_KEYS; k++){
      length += sprintf(mask_string+length, "%d", *buttonBoolPointerArray[k]);
   }
   //p_canvas()->clearScreen(COLOR_RED);
   p_canvas()->printMessage(
      mask_string,
      Monaco9,
      COLOR_RED,
      32,
      32
   );
   p_canvas()->blt();

   nrf_delay_ms(500);
   */
}