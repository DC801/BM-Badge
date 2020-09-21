/*-
 * Copyright (c) 2019
 *      Bill Paul <wpaul@windriver.com>.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. All advertising materials mentioning features or use of this software
 *    must display the following acknowledgement:
 *      This product includes software developed by Bill Paul.
 * 4. Neither the name of the author nor the names of any co-contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY Bill Paul AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL Bill Paul OR THE VOICES IN HIS HEAD
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef SOFTWARE_LED_H
#define SOFTWARE_LED_H
#include "common.h"
#include "i2c.h"
#include <string.h>

#ifdef __cplusplus
extern "C" {
#endif

#define ISSI_I2C_ADDR		0x50
#define ISSI_REG_MAX		0xBE

#define ISSI_PAGE_LED		0x00
#define ISSI_PAGE_PWM		0x01
#define ISSI_PAGE_BREATH	0x02
#define ISSI_PAGE_FUNCTION	0x03

#define ISSI_REG_GCC		0x01
#define ISSI_REG_SWY_PULLUP	0x0F
#define ISSI_REG_CSX_PULLDOWN	0x10

#define ISSI_REG_CONFIG 	0x00
#define ISSI_REG_CURRENT    0x01
#define ISSI_REG_ABM1_IN    0x02
#define ISSI_REG_ABM1_OUT   0x03
#define ISSI_REG_ABM1_LOOP1 0x04
#define ISSI_REG_ABM1_LOOP2 0x05
#define ISSI_REG_ABM2_IN    0x06
#define ISSI_REG_ABM2_OUT   0x07
#define ISSI_REG_ABM2_LOOP1 0x08
#define ISSI_REG_ABM2_LOOP2 0x09
#define ISSI_REG_ABM3_IN    0x0A
#define ISSI_REG_ABM3_OUT   0x0B
#define ISSI_REG_ABM3_LOOP1 0x0C
#define ISSI_REG_ABM3_LOOP2 0x0D
#define ISSI_REG_TIME       0x0E
#define ISSI_REG_RESET	 	0x11

#define ISSI_REG_COMMAND	0xFD
#define ISSI_REG_COMMAND_UNLOCK	0xFE

#define ISSI_CMDUNLOCK_ENABLE	0xC5

#define ISSI_REG_CONFIG_SSD_ON	0x00    /* Soft shutdown mode enabled */
#define ISSI_REG_CONFIG_SSD_OFF	0x01    /* Soft shutdown mode disabled */
#define ISSI_REG_CONFIG_B_EN	0x02
#define ISSI_REG_CONFIG_OSD	0x04

#define ISSI_LED_COUNT		36

#define ISSI_TIMEOUT		1000

/* Set intensity to half PWM duty cycle */

#define LED_INTENSITY		0x30

typedef enum {
    LED_MEM0 = 0,
    LED_MEM1,
    LED_MEM2,
    LED_MEM3,
    LED_BIT128,
    LED_BIT64,
    LED_BIT32,
    LED_BIT16,
    LED_BIT8,
    LED_BIT4,
    LED_BIT2,
    LED_BIT1,
    LED_XOR,
    LED_ADD,
    LED_SUB,
    LED_PAGE,
    LED_HAX,
    LED_COUNT
} LEDID;

extern uint8_t led_states[LED_COUNT];

extern void ledInit(void);
extern void ledsOn(void);
extern void ledsOff(void);
extern void ledSet(LEDID index, uint8_t intensity);
extern void ledOn(LEDID id);
extern void ledOff(LEDID id);
extern void ledPulse(LEDID id);
extern void ledPulseFast(LEDID id);
extern void ledPwm(LEDID id, uint8_t val);
extern void ledShow();

extern void ledGunsShoot(uint32_t ms);
extern void ledThrusterFire(uint32_t ms);

#ifdef __cplusplus
}
#endif

#endif //SOFTWARE_LED_H
