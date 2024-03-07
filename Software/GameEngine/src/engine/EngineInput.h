#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include "EngineSerial.h"
#include <signal.h>
#include <stdint.h>
#include <chrono  >
#include <utility>
#include "shim_timer.h"


struct GameClock
{
   using rep = uint32_t;
   using period = std::milli;
   using duration = std::chrono::duration<rep, period>;
   using time_point = std::chrono::time_point<GameClock>;

   static time_point now() noexcept
   {
      auto now_ms = std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::system_clock::now());
      auto epochTime = now_ms.time_since_epoch().count();
      return time_point{ std::chrono::milliseconds{now_ms.time_since_epoch().count()} };
   }
};

struct ButtonState
{
   ButtonState(const uint32_t& state) : buttons(state) {}
   operator uint32_t() const { return buttons; }

   bool IsPressed(KeyPress key) const
   {
      return buttons & (1 << (uint32_t)key);
   }

   uint32_t buttons;
};

struct InputState
{
   //
   // Stream of consciousness thoughts:
   // Establish game behaviors and input mapping
   // queue updates 


   //InputState(ButtonState buttons, ButtonState activatedButtons) noexcept
   //   : Buttons(buttons), ActivatedButtons(activatedButtons), lastState(button) {}

   const ButtonState Buttons;
   const ButtonState ActivatedButtons;
   const GameClock::duration deltaTime;

   inline bool PlayerIsActioning() const
   {
      return Buttons.IsPressed(KeyPress::Rjoy_left);
   }

   inline bool Hack() const
   {
      return Buttons.IsPressed(KeyPress::Rjoy_up);
   }

   inline bool Use() const
   {
      return ActivatedButtons.IsPressed(KeyPress::Rjoy_right);
   }

   inline bool Left() const
   {
      return Buttons.IsPressed(KeyPress::Ljoy_left) && !Buttons.IsPressed(KeyPress::Ljoy_right);
   }
   inline bool Right() const
   {
      return Buttons.IsPressed(KeyPress::Ljoy_right) && !Buttons.IsPressed(KeyPress::Ljoy_left);
   }
   inline bool Up() const
   {
      return Buttons.IsPressed(KeyPress::Ljoy_up) && !Buttons.IsPressed(KeyPress::Ljoy_down);
   }
   inline bool Down() const
   {
      return Buttons.IsPressed(KeyPress::Ljoy_down) && !Buttons.IsPressed(KeyPress::Ljoy_up);
   }
   inline bool AdvanceDialog() const
   {
      return ActivatedButtons.IsPressed(KeyPress::Rjoy_down)
         || ActivatedButtons.IsPressed(KeyPress::Rjoy_left)
         || ActivatedButtons.IsPressed(KeyPress::Rjoy_right);
   }
   inline bool Increment() const
   {
      return Buttons.IsPressed(KeyPress::Rjoy_up) && !Buttons.IsPressed(KeyPress::Rjoy_down);
   }
   inline bool Decrement() const
   {
      return Buttons.IsPressed(KeyPress::Rjoy_down) && !Buttons.IsPressed(KeyPress::Rjoy_up);
   }

   inline bool Running() const
   {
      return Buttons.IsPressed(KeyPress::Rjoy_right);
   }
};

class EngineInput
{
public:
   const InputState GetDeltaState(const GameClock::duration deltaTime) const
   {
      return InputState{ buttons, activated, deltaTime };
   }

   const ButtonState GetButtonState() const
   {
      return buttons;
   }

   const ButtonState GetButtonActivatedState() const
   {
      return activated;
   }

   [[nodiscard("Value of KeepRunning should be used to handle the main input loop")]]
   bool KeepRunning();

   [[nodiscard("Value of Reset should be used to trigger map/engine reload when true")]]
   bool Reset()
   {
      auto curReset = reset;
      reset = false;
      return curReset;
   }

   //this is a global that holds the amount of millis that a blocking delay will
   //prevent the main loop from continuing for. It is set by the blockingDelay() action.
   uint32_t blockingDelayTime{ 0 };

private:
   bool running{ true };
   bool reset{ false };
   bool isEntityDebugOn{ false };

   std::unique_ptr<EngineSerial> serial{};

   ButtonState buttons{ 0 };
   ButtonState activated{ 0 };

#ifndef DC801_EMBEDDED
   std::string GetCommandStringFromStandardIn();
   ButtonState GetDesktopInputState();
#endif
};



#endif