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

template <typename... Ts>
static inline void error_print(const char* format, Ts... fmt)
{
   printf("ERROR: ");
   printf(format, std::forward<Ts>(fmt)...);
   printf("\n");
}

static inline void error_print(const char* strLike)
{
   printf("ERROR: ");
   printf("%s\n", strLike);
}
#endif

namespace Util
{


   template <typename T, typename P>
   static inline T lerp(T a, T b, P progress) { return (T)((b - a) * progress) + a; }

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

uint32_t millis_elapsed(uint32_t currentMillis, uint32_t previousMillis);

uint32_t hex2dec(uint32_t v);

void morseInit(void);
void morseStart(void);
void morseStop(void);
bool morseGetRunning(void);

void check_ram_usage(void);



#endif /* UTILITY_H_ */
