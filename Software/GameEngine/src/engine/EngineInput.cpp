#include "EngineInput.h"
#include "main.h"
#include "EngineSerial.h"

#ifndef DC801_EMBEDDED
#include <SDL.h>
#include <SDL_image.h>
#include <iostream>
#include <span>
#include <string>
#include <regex>

<<<<<<< HEAD
#ifdef __cplusplus
extern "C" {
#endif

bool running = true;
bool shouldReloadGameDat = false;

ButtonStates EngineInput_Buttons = {};
ButtonStates EngineInput_Activated = {};
ButtonStates EngineInput_Deactivated = {};
bool *buttonBoolPointerArray[] = {
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
	&EngineInput_Buttons.ljoy_up,
	&EngineInput_Buttons.ljoy_down,
	&EngineInput_Buttons.ljoy_left,
	&EngineInput_Buttons.ljoy_right,
	&EngineInput_Buttons.rjoy_center,
	&EngineInput_Buttons.rjoy_up,
	&EngineInput_Buttons.rjoy_down,
	&EngineInput_Buttons.rjoy_left,
	&EngineInput_Buttons.rjoy_right,
	&EngineInput_Buttons.hax,
};

#ifdef DC801_DESKTOP

int32_t buttonClickedOnScreenKeyboardIndex = -1;
void EngineGetDesktopInputState(uint32_t *keyboardBitmask)
=======
void EngineInput::UpdateDesktopInputState(const GameClock::time_point& curTime)
>>>>>>> scriptFixes
{
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
         if (KMOD_ALT == (e.key.keysym.mod & KMOD_ALT) && e.key.keysym.scancode == SDL_SCANCODE_F4)
         {
            running = false;
         }
         // ctrl-r should cause the desktop version of the game to
         // reload the `game.dat` from the filesystem
         else if ((e.key.keysym.mod & KMOD_CTRL) && e.key.keysym.scancode == SDL_SCANCODE_R)
         {
            reset = true;
            inputStates.fill(InputState{});
         }
         else
         {
            const auto keyDown = mapScanCode(e.key.keysym.scancode);
            if (keyDown.has_value())
            {
               const auto& key = keyDown.value();
               if (key == KeyPress::Rjoy_right)
               {

               }
               inputStates[key].lastPressed = curTime;
            }
         }
      }
      else if (e.type == SDL_KEYUP)
      {
         const auto keyUp = mapScanCode(e.key.keysym.scancode);
         if (keyUp.has_value())
         {
            const auto& key = keyUp.value();
            if (key == KeyPress::Rjoy_right)
            {

            }
            inputStates[key].lastReleased = curTime;
         }
      }

<<<<<<< HEAD
		if (e.type == SDL_KEYDOWN) {
			// Players were pressing ESC intending to close the hex editor,
			// but instead closing the program. ALT + F4 should be a more
			// intuitive/intentional close combination.
			// There is also the GUI close box.
			if (
				e.key.keysym.sym == SDLK_F4
				&& (e.key.keysym.mod & KMOD_ALT)
			) {
				running = false;
				return;
			}
			// ctrl-r should cause the desktop version of the game to
			// reload the `game.dat` from the filesystem
			else if (
				e.key.keysym.sym == SDLK_r
				&& (e.key.keysym.mod & KMOD_CTRL)
			) {
				shouldReloadGameDat = true;
				return;
			}
			// + or - keys increase or decrease screen size:
			else if (e.key.keysym.sym == SDLK_MINUS) {
				EngineWindowFrameResize(-1);
				return;
			}
			else if (e.key.keysym.sym == SDLK_EQUALS) {
				EngineWindowFrameResize(1);
				return;
			}
		}

		if (e.type == SDL_MOUSEBUTTONDOWN || e.type == SDL_MOUSEBUTTONUP) {
			buttonClickedOnScreenKeyboardIndex = -1;

			if (e.button.state == SDL_PRESSED) {
				for (int i = 0; i < KEYBOARD_NUM_KEYS; ++i) {
					SDL_Point buttonPoint = buttonDestPoints[i];
					buttonTargetRect.x = buttonPoint.x - buttonHalf.x;
					buttonTargetRect.y = buttonPoint.y - buttonHalf.y;

					SDL_Point mousePos = { e.button.x, e.button.y };

					if (SDL_EnclosePoints(&mousePos, 1, &buttonTargetRect, nullptr)) {
						buttonClickedOnScreenKeyboardIndex = i;
						break;
					}
				}
			}
		}
	}

	uint32_t newValue = 0x00000000;

	//primary bindings:
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F5] << KEYBOARD_KEY_MEM0;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F6] << KEYBOARD_KEY_MEM1;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F7] << KEYBOARD_KEY_MEM2;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F8] << KEYBOARD_KEY_MEM3;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_B] << KEYBOARD_KEY_MEM0;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_N] << KEYBOARD_KEY_MEM1;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_M] << KEYBOARD_KEY_MEM2;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_COMMA] << KEYBOARD_KEY_MEM3;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_1] << KEYBOARD_KEY_BIT128;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_2] << KEYBOARD_KEY_BIT64;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_3] << KEYBOARD_KEY_BIT32;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_4] << KEYBOARD_KEY_BIT16;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_5] << KEYBOARD_KEY_BIT8;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_6] << KEYBOARD_KEY_BIT4;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_7] << KEYBOARD_KEY_BIT2;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_8] << KEYBOARD_KEY_BIT1;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F1] << KEYBOARD_KEY_XOR;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F2] << KEYBOARD_KEY_ADD;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F3] << KEYBOARD_KEY_SUB;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_F4] << KEYBOARD_KEY_PAGE;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_Z] << KEYBOARD_KEY_XOR;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_X] << KEYBOARD_KEY_ADD;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_C] << KEYBOARD_KEY_SUB;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_V] << KEYBOARD_KEY_PAGE;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_1] << KEYBOARD_KEY_XOR;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_2] << KEYBOARD_KEY_ADD;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_3] << KEYBOARD_KEY_SUB;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_0] << KEYBOARD_KEY_PAGE;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_Q] << KEYBOARD_KEY_LJOY_CENTER;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_7] << KEYBOARD_KEY_LJOY_CENTER;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_W] << KEYBOARD_KEY_LJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_S] << KEYBOARD_KEY_LJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_A] << KEYBOARD_KEY_LJOY_LEFT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_D] << KEYBOARD_KEY_LJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_9] << KEYBOARD_KEY_RJOY_CENTER;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_8] << KEYBOARD_KEY_RJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_5] << KEYBOARD_KEY_RJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_4] << KEYBOARD_KEY_RJOY_LEFT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_6] << KEYBOARD_KEY_RJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_TAB] << KEYBOARD_KEY_HAX;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_ESCAPE] << KEYBOARD_KEY_HAX;
	//secondary bindings that duplicate values above:
	newValue ^= (uint32_t) keys[SDL_SCANCODE_LSHIFT] << KEYBOARD_KEY_RJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_LCTRL] << KEYBOARD_KEY_PAGE;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_UP] << KEYBOARD_KEY_LJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_DOWN] << KEYBOARD_KEY_LJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_LEFT] << KEYBOARD_KEY_LJOY_LEFT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_RIGHT] << KEYBOARD_KEY_LJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_O] << KEYBOARD_KEY_RJOY_CENTER;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_I] << KEYBOARD_KEY_RJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_K] << KEYBOARD_KEY_RJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_J] << KEYBOARD_KEY_RJOY_LEFT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_L] << KEYBOARD_KEY_RJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_E] << KEYBOARD_KEY_RJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_KP_ENTER] << KEYBOARD_KEY_RJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_BACKSLASH] << KEYBOARD_KEY_RJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_RETURN] << KEYBOARD_KEY_RJOY_RIGHT;

	if (buttonClickedOnScreenKeyboardIndex > -1) {
		newValue ^= 1 << (uint32_t)buttonClickedOnScreenKeyboardIndex;
	}

	*keyboardBitmask = newValue;
	// debug_print("EngineGetDesktopInputState keyboardBitmask: %" PRIu32 "\n", *keyboardBitmask);
=======
      // TODO: MOVE THIS (and hook it up)
      // + or - keys increase or decrease screen size:
      /*else if (e.key.keysym.sym == SDLK_MINUS)
      {
         MainWindow->Resize(-1);
         return 0;
      }
      else if (e.key.keysym.sym == SDLK_EQUALS)
      {
         MainWindow->Resize(1);
         return 0;
      }*/
   }
>>>>>>> scriptFixes
}

#endif

std::optional<KeyPress> EngineInput::mapScanCode(const int scanCode) const
{
   switch (scanCode)
   {
   case SDL_SCANCODE_F5:
   case SDL_SCANCODE_B:
   {
      return KeyPress::Mem0;
   }

   case SDL_SCANCODE_F6:
   case SDL_SCANCODE_N:
   {
      return KeyPress::Mem1;
   }

   case SDL_SCANCODE_F7:
   case SDL_SCANCODE_M:
   {
      return KeyPress::Mem2;
   }

   case SDL_SCANCODE_F8:
   case SDL_SCANCODE_COMMA:
   {
      return KeyPress::Mem3;
   }

   case SDL_SCANCODE_1:
   {
      return KeyPress::Bit128;
   }
   case SDL_SCANCODE_2:
   {
      return KeyPress::Bit64;
   }
   case SDL_SCANCODE_3:
   {
      return KeyPress::Bit32;
   }
   case SDL_SCANCODE_4:
   {
      return KeyPress::Bit16;
   }
   case SDL_SCANCODE_5:
   {
      return KeyPress::Bit8;
   }
   case SDL_SCANCODE_6:
   {
      return KeyPress::Bit4;
   }
   case SDL_SCANCODE_7:
   {
      return KeyPress::Bit2;
   }
   case SDL_SCANCODE_8:
   {
      return KeyPress::Bit1;
   }

   case SDL_SCANCODE_F1:
   case SDL_SCANCODE_Z:
   case SDL_SCANCODE_KP_1:
   {
      return KeyPress::Xor;
   }

   case SDL_SCANCODE_F2:
   case SDL_SCANCODE_X:
   case SDL_SCANCODE_KP_2:
   {
      return KeyPress::Add;
   }

   case SDL_SCANCODE_F3:
   case SDL_SCANCODE_C:
   case SDL_SCANCODE_KP_3:
   {
      return KeyPress::Sub;
   }

   case SDL_SCANCODE_F4:
   case SDL_SCANCODE_V:
   case SDL_SCANCODE_KP_0:
   case SDL_SCANCODE_LCTRL:
   {
      return KeyPress::Page;
   }

   case SDL_SCANCODE_TAB:
   case SDL_SCANCODE_ESCAPE:
   {
      return KeyPress::Hax;
   }


   case SDL_SCANCODE_Q:
   case SDL_SCANCODE_KP_7:
   {
      return KeyPress::Ljoy_center;
   }
   case SDL_SCANCODE_W:
   case SDL_SCANCODE_UP:
   {
      return KeyPress::Ljoy_up;
   }
   case SDL_SCANCODE_S:
   case SDL_SCANCODE_DOWN:
   {
      return KeyPress::Ljoy_down;
   }
   case SDL_SCANCODE_A:
   case SDL_SCANCODE_LEFT:
   {
      return KeyPress::Ljoy_left;
   }
   case SDL_SCANCODE_D:
   case SDL_SCANCODE_RIGHT:
   {
      return KeyPress::Ljoy_right;
   }

   case SDL_SCANCODE_KP_9:
   case SDL_SCANCODE_O:
   {
      return KeyPress::Rjoy_center;
   }
   case SDL_SCANCODE_KP_8:
   case SDL_SCANCODE_I:
   case SDL_SCANCODE_GRAVE: // Grave accent mark, AKA Backtick, left of 1
   case SDL_SCANCODE_BACKSLASH:
   {
      return KeyPress::Rjoy_up;
   }
   case SDL_SCANCODE_KP_5:
   case SDL_SCANCODE_K:
   case SDL_SCANCODE_LSHIFT:
   {
      return KeyPress::Rjoy_down;
   }
   case SDL_SCANCODE_KP_4:
   case SDL_SCANCODE_J:
   {
      return KeyPress::Rjoy_left;
   }
   case SDL_SCANCODE_KP_6:
   case SDL_SCANCODE_L:
   case SDL_SCANCODE_E:
   case SDL_SCANCODE_KP_ENTER:
   case SDL_SCANCODE_RETURN:
   {
      return KeyPress::Rjoy_right;
   }
   default:
      // std::nullopt represents keys that have no mapping (alt, shift, etc) 
      return std::nullopt;
   }
}

#ifndef DC801_EMBEDDED
std::string EngineInput::GetCommandStringFromStandardIn()
{
   std::string commandBuffer;
   auto& charsRead = std::getline(std::cin, commandBuffer, '\n');
   //was_command_entered = bool(charsRead);
   return commandBuffer;
}
#endif

void EngineInput::Update(const GameClock::time_point& curTime)
{
   if (application_quit)
   {
      running = false;
      return;
   }
#ifdef DC801_EMBEDDED
   auto newValue = get_keyboard_mask();
   serial->HandleInput();
#else
   UpdateDesktopInputState(curTime);
   GetCommandStringFromStandardIn();
#endif

   lastDelta = curTime - lastUpdate;
   lastUpdate = curTime;
}