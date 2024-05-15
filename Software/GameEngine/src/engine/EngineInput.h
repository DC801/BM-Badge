#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "src/games/mage/mage_defines.h"
#include "modules/keyboard.h"
#include "EngineSerial.h"
#include <signal.h>
#include <stdint.h>
#include <chrono>
#include <queue>
#include <utility>
#include "shim_timer.h"

template <typename IndexType, typename ValueType, int Length >
class EnumClassArray : public std::array<ValueType, Length>
{
public:
   template <typename T>
   constexpr ValueType& operator[](T i)
   {
      return this->at(static_cast<size_t>(i));
   }

   template <typename T>
   constexpr const ValueType& operator[](T i) const
   {
      return this->at(static_cast<size_t>(i));
   }
};

struct InputState
{
   std::optional<GameClock::time_point> lastPressed{};
   std::optional<GameClock::time_point> lastReleased{};
   std::optional<GameClock::time_point> lastChecked{};

   constexpr bool Pressed() const
   {
      return lastPressed.has_value()
         && (!lastReleased.has_value() || lastReleased.value() < lastPressed.value());
   }
};

class EngineInput
{
public:
   void Update(const GameClock::time_point& curTime);

   [[nodiscard("Value of KeepRunning should be used to handle the main input loop")]]
   const bool KeepRunning() const { return running; }

   [[nodiscard("Value of ShouldReset should be used to trigger map/engine reload when true")]]
   inline bool ShouldReset()
   {
      if (reset)
      {
         reset = false;
         return true;
      }
      else
      {
         return IsPressed(KeyPress::Xor) && IsPressed(KeyPress::Mem3);
      }
   }

   inline bool ToggleEntityDebug() const
   {
      return IsPressed(KeyPress::Xor) && IsPressed(KeyPress::Mem1);
   }

   inline bool PlayerIsActioning() const
   {
      return IsPressed(KeyPress::Rjoy_left);
   }

   inline bool Hack() const
   {
      return IsPressed(KeyPress::Rjoy_up);
   }

   inline bool Use() const
   {
      return IsPressed(KeyPress::Rjoy_right);
   }

   inline bool Up() const
   {
      return IsPressed(KeyPress::Ljoy_up) && !IsPressed(KeyPress::Ljoy_down);
   }
   inline bool Down() const
   {
      return IsPressed(KeyPress::Ljoy_down) && !IsPressed(KeyPress::Ljoy_up);
   }
   inline bool Left() const
   {
      return IsPressed(KeyPress::Ljoy_left) && !IsPressed(KeyPress::Ljoy_right);
   }
   inline bool Right() const
   {
      return IsPressed(KeyPress::Ljoy_right) && !IsPressed(KeyPress::Ljoy_left);
   }

   inline bool AdvanceDialog() const
   {
      return IsPressed(KeyPress::Rjoy_down)
         || IsPressed(KeyPress::Rjoy_left)
         || IsPressed(KeyPress::Rjoy_right);
   }
   inline bool NextDialogResponse() const
   {
      return IsPressed(KeyPress::Ljoy_up);
   }
   inline bool PreviousDialogResponse() const
   {
      return IsPressed(KeyPress::Ljoy_down);
   }
   inline bool SelectDialogResponse() const
   {
      return IsPressed(KeyPress::Ljoy_right);
   }
   inline bool Increment() const
   {
      return IsPressed(KeyPress::Rjoy_up) && !IsPressed(KeyPress::Rjoy_down);
   }
   inline bool Decrement() const
   {
      return IsPressed(KeyPress::Rjoy_down) && !IsPressed(KeyPress::Rjoy_up);
   }
   inline bool Running() const
   {
      return IsPressed(KeyPress::Rjoy_right);
   }   
   constexpr bool IsPressed(KeyPress key) const
   {
      return inputStates[key].Pressed();
   }

   constexpr const EnumClassArray<KeyPress, InputState, KEYBOARD_NUM_KEYS>& GetInputStates() const
   {
      return inputStates;
   }
   
   GameClock::duration blockingDelayTime{ 0 };
   GameClock::time_point lastUpdate{ GameClock::now() };
   GameClock::duration lastDelta{ 0 };
private:
   bool running{ true };
   bool reset{ false };

   EnumClassArray<KeyPress, InputState, KEYBOARD_NUM_KEYS> inputStates{};

   std::optional<KeyPress> mapScanCode(int scanCode) const;
#ifndef DC801_EMBEDDED
   std::string GetCommandStringFromStandardIn();
   void UpdateDesktopInputState(const GameClock::time_point& curTime);
#else
   std::unique_ptr<EngineSerial> serial{};
#endif
};



#endif