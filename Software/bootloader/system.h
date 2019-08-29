/*
 * system.h
 *
 *  Created on: Jul 12, 2018
 *      Author: hamster
 */

#ifndef BOOTLOADER_SYSTEM_H_
#define BOOTLOADER_SYSTEM_H_

#include <stdint.h>
#include <stdbool.h>

#include "../config/custom_board.h"
#include "boards.h"
#include "nrf_mbr.h"
#include "nrf_bootloader.h"
#include "nrf_bootloader_app_start.h"
#include "nrf_dfu.h"
#include "app_error.h"
#include "app_error_weak.h"
#include "nrf_bootloader_info.h"
#include "app_timer.h"
#include "nrf_delay.h"

#include "nrf_gfx.h"
#include "nrf_gpio.h"
#include "nrf_delay.h"
#include "nordic_common.h"

#include "nrf52840_peripherals.h"
#include "nrf_gpio.h"
#include "nrf_spim.h"
#include "nrf_drv_spi.h"

#include "ff.h"
#include "nrf_block_dev_sdc.h"
#include "nrf_block_dev.h"
#include "diskio.h"
#include "diskio_blkdev.h"


#include "lcd.h"
#include "menu.h"
#include "tests.h"

#if defined(NRF52832_XXAA)
#error "It's defined"
#endif



extern nrf_gfx_point_t status;
extern nrf_gfx_rect_t status_box;


#endif /* BOOTLOADER_SYSTEM_H_ */
