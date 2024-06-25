#include "EngineIO.h"
#include "main.h"

#include <SDL.h>
#include <SDL_image.h>
#include <iostream>
#include <span>
#include <string>
#include <regex>

void EngineIO::Update(const GameClock::time_point& curTime)
{
   if (application_quit)
   {
      running = false;
      return;
   }

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
            reset = true;
            return;
         }
         else
         {
            auto keyDown = mapScanCode(e.key.keysym.scancode);
            if (keyDown.has_value())
            {
               in.states[keyDown.value()].lastPressed = curTime;
            }
         }
      }
      else if (e.type == SDL_KEYUP)
      {
         auto keyUp = mapScanCode(e.key.keysym.scancode);
         if (keyUp.has_value())
         {
            in.states[keyUp.value()].lastReleased = curTime;
         }
      }

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

   GetCommandStringFromStandardIn();

   lastDelta = curTime - lastUpdate;
   lastUpdate = curTime;
}

std::optional<KeyPress> EngineIO::mapScanCode(int scanCode) const
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


std::string EngineIO::GetCommandStringFromStandardIn()
{
   std::string commandBuffer;
   auto& charsRead = std::getline(std::cin, commandBuffer, '\n');
   //was_command_entered = bool(charsRead);
   return commandBuffer;
}