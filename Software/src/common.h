/*
 * @file system.h
 *
 * @date May 24, 2017
 * @author hamster
 *
 * Common header file included by all files in the project
 * This will pull in all the other header files so our includes are neater
 *
 */

#ifndef SYSTEM_H_
#define SYSTEM_H_

// System headers
#include <ctype.h>
#include <math.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>

#include "config/custom_board.h"

#ifdef DC801_EMBEDDED
	#include "config/sdk_config.h"

	// Nordic headers
	#include "nordic_common.h"
	#include "nrf.h"
	#include "app_error.h"
	#include "app_pwm.h"
	#include "ble.h"
	#include "ble_err.h"
	#include "ble_hci.h"
	#include "ble_srv_common.h"
	#include "ble_advdata.h"
	#include "ble_conn_params.h"
	#include "bsp.h"
	#include "nrf_sdh.h"
	#include "nrf_sdh_ble.h"
	#include "boards.h"
	#include "app_timer.h"
	#include "app_button.h"
	#include "app_usbd.h"
	#include "ble_lbs.h"
	#include "nrf_ble_gatt.h"
	#include "nrf_ble_qwr.h"
	#include "nrf_pwr_mgmt.h"
	#include "nrf_delay.h"
	#include "nrf_drv_clock.h"
	#include "nrf52840_peripherals.h"
	#include "nrf_spim.h"
	#include "nrf_drv_spi.h"
	#include "nrf_drv_twi.h"
	#include "nrf_block_dev_sdc.h"
	#include "nrf_block_dev.h"
	#include "diskio.h"
	#include "diskio_blkdev.h"
	#include "legacy/nrf_drv_rng.h"
	#include "nrf_drv_saadc.h"
	#include "nrf_saadc.h"
	#include "nrf_drv_ppi.h"
	#include "nrf_drv_timer.h"
	#include "app_uart.h"
	#include "nrf_soc.h"
	#include "nrf_gpio.h"

	#include "nrfx_i2s.h"

	#include "nrf_log.h"
	#include "nrf_log_ctrl.h"
	#include "nrf_log_default_backends.h"

	#include "ff.h"

	#define printf NRF_LOG_RAW_INFO
#endif

#ifdef DC801_DESKTOP
	#include <fcntl.h>
	#include "sdk_shim.h"
	#include <SDL2/SDL.h>

#endif

#define SWAP(c) (((c>>8)&0xFF)|(c&0xFF)<<8)

typedef enum{
    gm_command_none,
    gm_command_addscoremodifier,
    gm_command_addscore,
    gm_command_party,
    gm_command_sheep,
    gm_command_beep
} GODMODE_COMMAND;

// Includes for our app
#include "utility.h"
#include "main.h"
#include "menu.h"
#include "user.h"
#include "nearby.h"
#include "extras.h"
#include "modules/ble.h"
#include "godmode.h"
#include "modules/drv_st7735.h"
#include "modules/gfx.h"
#include "modules/sd.h"
#include "modules/adc.h"
#include "modules/uart.h"
#include "modules/i2c.h"
#include "modules/i2s.h"
#include "modules/led.h"
#include "modules/usb.h"
#include "adafruit/gfxfont.h"
#include "games/Space_Invaders_c.h"
#include "games/Snake.h"
#include "games/PipsTheET.h"
#include "games/Tic-Tac-Toe.h"
#include "games/Wargames.h"
#include "games/hcrn/hcrn.h"
#include "games/serial.h"
#include "games/galaga/galaga_c.h"



#define min(A,B) ((A)<(B)?(A):(B))
#define max(A,B) ((A)>(B)?(A):(B))

#endif /* SYSTEM_H_ */
