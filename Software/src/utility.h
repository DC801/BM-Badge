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

#include "adafruit/gfxfont.h"

#ifdef DC801_DESKTOP
#include "sdk_shim.h"
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define BUTTON_PRESSED 	0
#define BUTTON_RELEASED 1
#define BUTTON_DEBOUNCE_MS		15
#define BUTTON_LONG_PRESS_MS	200

typedef enum{
    LEVEL0,
    LEVEL1,
    LEVEL2,
    LEVEL3,
    LEVEL4
} LEVEL;

typedef enum{
    POWERUP_0,
    POWERUP_1,
    POWERUP_2,
    POWERUP_3,
    POWERUP_4
} POWERUP;


#define CRC_SEED_DC26		0x0801
#define CRC_SEED_DC27		0x0180

uint16_t calcCRC(uint8_t *data, uint8_t len, const uint16_t POLYNOM);
uint16_t crc16(uint16_t crcValue, uint8_t newByte, const uint16_t POLYNOM);


uint8_t getButton(bool waitForLongPress);
bool isButtonDown(int button);
void pauseUntilPress(int button);
void beep(int duration, int frequency);
void getString(GFXfont font, char *string, uint8_t chars, bool showScroll);
void setLevelLEDs(LEVEL level);
void setPowerUpLEDs(POWERUP powerUp);

APP_TIMER_DEF(sysTickID);
void sysTickStart(void);
void sysTickHandler(void * p_context);
uint32_t getSystick(void);

uint32_t millis_elapsed(uint32_t currentMillis, uint32_t previousMillis);
uint32_t millis();

uint8_t getFiles(char files[][9], const char *path, uint8_t fileMax);

void EEpwm_init();
void EEpwm_set(int percent);
void EEget_milliVolts(int percent, int *v1, int *v2, int *v3);

uint32_t hex2dec(uint32_t v);

int RC4(const char *key, unsigned char *data, size_t dataLen);
int decryptFile(const char* key, const char* infile, const char* outfile);

void morseInit(void);
void morseStart(void);
void morseStop(void);
bool morseGetRunning(void);

void util_gfx_init(void);

#ifdef __cplusplus
}
#endif

#endif /* UTILITY_H_ */
