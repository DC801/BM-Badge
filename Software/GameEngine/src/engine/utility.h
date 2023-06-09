/*
 * @file utility.h
 *
 * @date Jul 24, 2017
 * @author hamster
 *
 * Utility functions
 *
 */

#ifndef UTILITY_H_
#define UTILITY_H_

#include <stddef.h>
#include <cstdio>
#include <utility>
#include <chrono>
#include <cmath>
#include "sdk_shim.h"

#ifdef DC801_EMBEDDED
#include <app_timer.h>
#include <nrfx_systick.h>
#include <nrf_log.h>
#include <nrf_log_ctrl.h>
#include <nrf_log_default_backends.h>
#include "games/mage/mage_app_timers.h"
#define debug_print(...)   NRF_LOG_INFO(__VA_ARGS__)
#define error_print(...) NRF_LOG_ERROR(__VA_ARGS__)

#else

#define NRF_LOG_RAW_INFO printf
template <typename... Ts>
static inline void debug_print(const char* format, Ts... fmt)
{
   printf(format, std::forward<Ts>(fmt)...);
   printf("\n");
}

static inline void debug_print(const char* strLike)
{
   printf("%s\n", strLike);
}
#endif

namespace Util
{
   class ClockProxy
   {
   public:
      using period = std::milli;
      using rep = uint32_t;
      using duration = std::chrono::duration<rep, period>;
      using time_point = std::chrono::time_point<ClockProxy>;
      static constexpr bool is_steady = true;

      static time_point now() noexcept
      {
         // nrfx_systick_get(&systick);
         // return time_point{ duration{systick.time} };
         return time_point{ duration{getSystick()} };
      }

   private:
      static nrfx_systick_state_t systick;
   };

   template <typename T, typename P>
   static inline T lerp(T a, T b, P progress) { return (T)((b - a) * progress) + a; }

   static ClockProxy::time_point lastTime{ClockProxy::duration{0}};
   static uint32_t millis()
   {
      auto startTime = ClockProxy::now();

      auto delta = (startTime - lastTime).count();
      if (lastTime > startTime) { delta += 0xFFFFFFFF; }
      lastTime = ClockProxy::now();
      return delta;
      // #ifdef DC801_EMBEDDED

//       //return std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
//       return systick.time / 32;// app_timer_cnt_get() / 32;
// #else
//       return std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
// #endif
   }
};


#define BUTTON_PRESSED 	0
#define BUTTON_RELEASED 1
#define BUTTON_DEBOUNCE_MS		15
#define BUTTON_LONG_PRESS_MS	200

typedef enum
{
   LEVEL0,
   LEVEL1,
   LEVEL2,
   LEVEL3,
   LEVEL4
} LEVEL;

typedef enum
{
   POWERUP_0,
   POWERUP_1,
   POWERUP_2,
   POWERUP_3,
   POWERUP_4
} POWERUP;


#define CRC_SEED_DC26		0x0801
#define CRC_SEED_DC27		0x0180

uint16_t calcCRC(uint8_t* data, uint8_t len, const uint16_t POLYNOM);
uint16_t crc16(uint16_t crcValue, uint8_t newByte, const uint16_t POLYNOM);


uint8_t getButton(bool waitForLongPress);
bool isButtonDown(int button);
void pauseUntilPress(int button);

void setLevelLEDs(LEVEL level);
void setPowerUpLEDs(POWERUP powerUp);


uint32_t millis_elapsed(uint32_t currentMillis, uint32_t previousMillis);

uint32_t hex2dec(uint32_t v);

void morseInit(void);
void morseStart(void);
void morseStop(void);
bool morseGetRunning(void);

void check_ram_usage(void);



#endif /* UTILITY_H_ */
