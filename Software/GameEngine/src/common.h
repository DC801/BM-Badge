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

#define PI 3.141592653589793
#define TAU 6.283185307179586

typedef struct {
	int16_t xs, ys, xe, ye;
} area_t;


#include "config/custom_board.h"

#ifdef DC801_EMBEDDED
	#ifdef __cplusplus
extern "C" {
#endif
	#include "config/sdk_config.h"

	//this will fix nordik syntax highlighting in vscode when using compiledb and compiling for embedded:
	#ifdef DC801_EMBEDDED
		#undef _WIN32
		#undef __unix
		#undef __APPLE__
	#endif

	// Nordic headers
	#include "nordic_common.h"
	#include "nrf.h"
	#include "app_error.h"
	#include "app_pwm.h"
	#include "s140/headers/ble.h"
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
	#include "nrf_drv_qspi.h"
	#include "ff.h"
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
	#include "modules/usb.h"

#ifdef __cplusplus
}
#endif
#endif

#ifdef DC801_DESKTOP
	#include <fcntl.h>
	#include "sdk_shim.h"
	#include <SDL.h>

	#define NRF_LOG_RAW_INFO printf
	#define debug_print(...)   printf(__VA_ARGS__); printf("\n")
#endif

#ifdef DC801_EMBEDDED
	#define debug_print(...)   NRF_LOG_INFO(__VA_ARGS__)
#endif

#define SWAP(c) (((c>>8)&0xFF)|(c&0xFF)<<8)


// Includes for our app
#include "main.h"
#include "utility.h"
#include "modules/ble.h"
#include "modules/drv_ili9341.h"
#include "modules/sd.h"
#include "modules/adc.h"
#include "modules/uart.h"
#include "modules/i2c.h"
#include "modules/led.h"
#include "modules/keyboard.h"
#include "modules/drv_nau8810.h"
#include "adafruit/gfxfont.h"

#include "EngineInput.h"
#include "EngineSerial.h"
#include "EngineROM.h"
#include "engine/convert_endian.h"

#define PROGMEM

#include "../fonts/computerfont12pt7b.h"
#include "../fonts/monof55.h"
#include "../fonts/gameplay.h"
#include "../fonts/veramono5pt7b.h"
#include "../fonts/TomThumb.h"
#include "../fonts/practical8pt7b.h"
#include "../fonts/SFAlienEncounters5pt7b.h"

#endif /* SYSTEM_H_ */
