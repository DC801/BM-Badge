/**
 *
 * @file boot.c
 *
 * @date May 24, 2017
 * @author hamster
 *
 */

#ifndef BOOT_H_
#define BOOT_H_

#define VERSION "2.01-flipton"
#define NORDICSDK "15.3"
#define SAOSPEC "1.69bis"

#include <stdint.h>
#include "common.h"

#ifdef DC801_DESKTOP
#include <signal.h>
#include "sdk_shim.h"
extern volatile sig_atomic_t application_quit;
#endif

static void speaker_init(void);
static void log_init(void);
static void rom_init(void);

int main(void);

void setUpRandomSeed();

#endif /* BOOT_H_ */
