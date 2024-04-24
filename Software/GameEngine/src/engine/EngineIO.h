#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

#include "modules/keyboard.h"
#include "EngineSerial.h"
#include <signal.h>
#include <stdint.h>
#include <chrono>
#include <queue>
#include <utility>
#include "shim_timer.h"
#include "led.h"

using namespace std::chrono;
struct GameClock
{
   using rep = uint32_t;
   using period = std::milli;
   using duration = duration<rep, period>;
   using time_point = time_point<GameClock>;

   static time_point now() noexcept
   {
      auto now_ms = time_point_cast<milliseconds>(system_clock::now());
      auto epochTime = now_ms.time_since_epoch().count();
      return time_point{ milliseconds{now_ms.time_since_epoch().count()} };
   }
};

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
   std::optional<GameClock::time_point> lastPressed;
   std::optional<GameClock::time_point> lastReleased;

   constexpr bool Pressed() const
   {
      return lastPressed.has_value()
         && (!lastReleased.has_value() || lastReleased.value() <= lastPressed.value());
   }
};

struct Inputs
{
   inline bool ToggleEntityDebug()
   {
      return IsPressed(KeyPress::Xor) && IsPressed(KeyPress::Mem1);
   }

   inline bool PlayerIsActioning()
   {
      return IsPressed(KeyPress::Rjoy_left);
   }

   inline bool Hack()
   {
      return IsPressed(KeyPress::Rjoy_up);
   }

   inline bool RightCenterTap()
   {
      return IsPressed(KeyPress::Rjoy_center);
   }

   inline bool Use()
   {
      return IsPressed(KeyPress::Rjoy_right);
   }

   inline bool Up()
   {
      return IsPressed(KeyPress::Ljoy_up) && !IsPressed(KeyPress::Ljoy_down);
   }
   inline bool Down()
   {
      return IsPressed(KeyPress::Ljoy_down) && !IsPressed(KeyPress::Ljoy_up);
   }
   inline bool Left()
   {
      return IsPressed(KeyPress::Ljoy_left) && !IsPressed(KeyPress::Ljoy_right);
   }
   inline bool Right()
   {
      return IsPressed(KeyPress::Ljoy_right) && !IsPressed(KeyPress::Ljoy_left);
   }

   inline bool AdvanceDialog()
   {
      return IsPressed(KeyPress::Rjoy_down)
         || IsPressed(KeyPress::Rjoy_left)
         || IsPressed(KeyPress::Rjoy_right);
   }
   inline bool NextDialogResponse()
   {
      return IsPressed(KeyPress::Ljoy_up);
   }
   inline bool PreviousDialogResponse()
   {
      return IsPressed(KeyPress::Ljoy_down);
   }
   inline bool SelectDialogResponse()
   {
      return IsPressed(KeyPress::Ljoy_right);
   }

   inline bool Increment()
   {
      return IsPressed(KeyPress::Rjoy_up) && !IsPressed(KeyPress::Rjoy_down);
   }
   inline bool Decrement()
   {
      return IsPressed(KeyPress::Rjoy_down) && !IsPressed(KeyPress::Rjoy_up);
   }

   inline bool Running()
   {
      return IsPressed(KeyPress::Rjoy_right);
   }

   constexpr bool IsPressed(KeyPress key)
   {
      //states[key].lastChecked.emplace(GameClock::now());
      return states[key].Pressed();
   }

   EnumClassArray<KeyPress, InputState, KEYBOARD_NUM_KEYS> states{};
};

struct Outputs
{
   inline void XOR(bool on) { ledSet(LEDID::XOR, on ? 0xFF : 0); }
   inline void ADD(bool on) { ledSet(LEDID::ADD, on ? 0xFF : 0); }
   inline void SUB(bool on) { ledSet(LEDID::SUB, on ? 0xFF : 0); }
   inline void PAGE(bool on) { ledSet(LEDID::PAGE, on ? 0xFF : 0); }
   inline void BIT128(bool on) { ledSet(LEDID::BIT128, on ? 0xFF : 0); }
   inline void BIT64(bool on) { ledSet(LEDID::BIT64, on ? 0xFF : 0); }
   inline void BIT32(bool on) { ledSet(LEDID::BIT32, on ? 0xFF : 0); }
   inline void BIT16(bool on) { ledSet(LEDID::BIT16, on ? 0xFF : 0); }
   inline void BIT8(bool on) { ledSet(LEDID::BIT8, on ? 0xFF : 0); }
   inline void BIT4(bool on) { ledSet(LEDID::BIT4, on ? 0xFF : 0); }
   inline void BIT2(bool on) { ledSet(LEDID::BIT2, on ? 0xFF : 0); }
   inline void BIT1(bool on) { ledSet(LEDID::BIT1, on ? 0xFF : 0); }
   inline void MEM3(bool on) { ledSet(LEDID::MEM3, on ? 0xFF : 0); }
   inline void MEM2(bool on) { ledSet(LEDID::MEM2, on ? 0xFF : 0); }
   inline void MEM1(bool on) { ledSet(LEDID::MEM1, on ? 0xFF : 0); }
   inline void MEM0(bool on) { ledSet(LEDID::MEM0, on ? 0xFF : 0); }
   inline void USB(bool on) { ledSet(LEDID::USB, on ? 0xFF : 0); }
   inline void HAX(bool on) { ledSet(LEDID::HAX, on ? 0xFF : 0); }
   inline void SD(bool on) { ledSet(LEDID::SD, on ? 0xFF : 0); }

   inline void SetCurrentByteLEDs(const uint8_t& currentByte) const
   {
      ledSet(LEDID::BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
      ledSet(LEDID::BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
   }
};

class EngineIO
{
public:
   void Update(const GameClock::time_point& curTime);

   [[nodiscard("Value of KeepRunning should be used to handle the main input loop")]]
   const bool KeepRunning() { return running; }

   [[nodiscard("Value of ShouldReset should be used to trigger map/engine reload when true")]]
   inline bool ShouldReset()
   {
      return reset;
   }

   Inputs in{};

   Outputs out{};

   //this is a global that holds the amount of millis that a blocking delay will
   //prevent the main loop from continuing for. It is set by the blockingDelay() action.
   uint32_t blockingDelayTime{ 0 };

   GameClock::time_point lastUpdate{ GameClock::now() };
   GameClock::duration lastDelta{ 0 };

   //this lets us make it so that inputs stop working for the player
   bool playerHasControl{ false };

private:
   bool running{ true };
   bool reset{ false };


   std::optional<KeyPress> mapScanCode(int scanCode) const;
#ifndef DC801_EMBEDDED
   std::string GetCommandStringFromStandardIn();
#else
   std::unique_ptr<EngineSerial> serial{};
#endif
};



#endif