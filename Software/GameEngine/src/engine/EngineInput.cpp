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
         if (
            e.key.keysym.sym == SDLK_F4
            && (e.key.keysym.mod & KMOD_ALT)
            )
         {
            running = false;
            return;
         }
         // ctrl-r should cause the desktop version of the game to
         // reload the `game.dat` from the filesystem
         else if (
            e.key.keysym.sym == SDLK_r
            && (e.key.keysym.mod & KMOD_CTRL)
            )
         {
            shouldReloadGameDat = true;
            return;
         }
         // + or - keys increase or decrease screen size:
//TODO: MOVE THIS
         //else if (e.key.keysym.sym == SDLK_MINUS)
         //{
         //   MainWindow->Resize(-1);
         //   return;
         //}
         //else if (e.key.keysym.sym == SDLK_EQUALS)
         //{
         //   MainWindow->Resize(1);
         //   return;
         //}
      }
   }

   uint32_t newValue = 0x00000000;

   //primary bindings:
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F5] << KEYBOARD_KEY_MEM0;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F6] << KEYBOARD_KEY_MEM1;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F7] << KEYBOARD_KEY_MEM2;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F8] << KEYBOARD_KEY_MEM3;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_B] << KEYBOARD_KEY_MEM0;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_N] << KEYBOARD_KEY_MEM1;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_M] << KEYBOARD_KEY_MEM2;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_COMMA] << KEYBOARD_KEY_MEM3;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_1] << KEYBOARD_KEY_BIT128;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_2] << KEYBOARD_KEY_BIT64;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_3] << KEYBOARD_KEY_BIT32;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_4] << KEYBOARD_KEY_BIT16;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_5] << KEYBOARD_KEY_BIT8;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_6] << KEYBOARD_KEY_BIT4;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_7] << KEYBOARD_KEY_BIT2;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_8] << KEYBOARD_KEY_BIT1;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F1] << KEYBOARD_KEY_XOR;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F2] << KEYBOARD_KEY_ADD;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F3] << KEYBOARD_KEY_SUB;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_F4] << KEYBOARD_KEY_PAGE;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_Z] << KEYBOARD_KEY_XOR;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_X] << KEYBOARD_KEY_ADD;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_C] << KEYBOARD_KEY_SUB;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_V] << KEYBOARD_KEY_PAGE;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_1] << KEYBOARD_KEY_XOR;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_2] << KEYBOARD_KEY_ADD;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_3] << KEYBOARD_KEY_SUB;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_0] << KEYBOARD_KEY_PAGE;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_Q] << KEYBOARD_KEY_LJOY_CENTER;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_7] << KEYBOARD_KEY_LJOY_CENTER;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_W] << KEYBOARD_KEY_LJOY_UP;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_S] << KEYBOARD_KEY_LJOY_DOWN;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_A] << KEYBOARD_KEY_LJOY_LEFT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_D] << KEYBOARD_KEY_LJOY_RIGHT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_9] << KEYBOARD_KEY_RJOY_CENTER;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_8] << KEYBOARD_KEY_RJOY_UP;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_5] << KEYBOARD_KEY_RJOY_DOWN;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_4] << KEYBOARD_KEY_RJOY_LEFT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_6] << KEYBOARD_KEY_RJOY_RIGHT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_TAB] << KEYBOARD_KEY_HAX;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_ESCAPE] << KEYBOARD_KEY_HAX;
   //secondary bindings that duplicate values above:
   newValue ^= (uint32_t)keys[SDL_SCANCODE_LSHIFT] << KEYBOARD_KEY_RJOY_DOWN;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_LCTRL] << KEYBOARD_KEY_PAGE;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_UP] << KEYBOARD_KEY_LJOY_UP;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_DOWN] << KEYBOARD_KEY_LJOY_DOWN;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_LEFT] << KEYBOARD_KEY_LJOY_LEFT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_RIGHT] << KEYBOARD_KEY_LJOY_RIGHT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_O] << KEYBOARD_KEY_RJOY_CENTER;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_I] << KEYBOARD_KEY_RJOY_UP;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_K] << KEYBOARD_KEY_RJOY_DOWN;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_J] << KEYBOARD_KEY_RJOY_LEFT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_L] << KEYBOARD_KEY_RJOY_RIGHT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_E] << KEYBOARD_KEY_RJOY_RIGHT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_KP_ENTER] << KEYBOARD_KEY_RJOY_RIGHT;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_GRAVE] << KEYBOARD_KEY_RJOY_UP; // AKA Backtick
   newValue ^= (uint32_t)keys[SDL_SCANCODE_BACKSLASH] << KEYBOARD_KEY_RJOY_UP;
   newValue ^= (uint32_t)keys[SDL_SCANCODE_RETURN] << KEYBOARD_KEY_RJOY_RIGHT;

   Buttons.keyboardBitmask = (Button)newValue;
   // debug_print("EngineGetDesktopInputState keyboardBitmask: %" PRIu32 "\n", *keyboardBitmask);
}

#endif

void EngineInput::SetHardwareBitmaskToButtonStates()
{
   uint32_t oneBit = 0x00000001;

   memcpy(&Activated.keyboardBitmask, &Buttons.keyboardBitmask, sizeof(ButtonStates));
}

void EngineInput::HandleKeyboard()
{
#ifdef DC801_EMBEDDED
   keyboardBitmask = get_keyboard_mask();
#else
   GetDesktopInputState();
#endif

   SetHardwareBitmaskToButtonStates();

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

bool EngineInput::IsRunning()
{
   return running;
}

bool EngineInput::ShouldReloadGameDat()
{
   bool result = shouldReloadGameDat;
   shouldReloadGameDat = false;
   return result;
}

void EngineInput::TriggerRomReload()
{
   shouldReloadGameDat = true;
}

