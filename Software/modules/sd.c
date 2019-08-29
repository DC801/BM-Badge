/*****************************************************************************
 * (C) Copyright 2017 AND!XOR LLC (http://andnxor.com/).
 *
 * PROPRIETARY AND CONFIDENTIAL UNTIL AUGUST 1ST, 2017 then,
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 * 	@andnxor
 * 	@zappbrandnxor
 * 	@hyr0n1
 * 	@andrewnriley
 * 	@lacosteaef
 * 	@bitstr3m
 *
 * 	Adapted for the dc801 dc26 badge and SDK15 by @hamster
 *****************************************************************************/

// System headers
#include <ctype.h>
#include <math.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>
#include <common.h>

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
#include "nrf_delay.h"
#include "nrf_soc.h"

#include "sd.h"
#include "gfx.h"

////SPI 1 is for SD
//static nrf_drv_spi_t spi1 = NRF_DRV_SPI_INSTANCE(1);

#define SDC_SCK_PIN     (28)        ///< SDC serial clock (SCK) pin.
#define SDC_MOSI_PIN    (29)        ///< SDC serial data in (DI) pin.
#define SDC_MISO_PIN    (27)         ///< SDC serial data out (DO) pin.
#define SDC_CS_PIN      (30)   		///< SDC chip select (CS) pin.

/**
 * @brief  SDC block device definition
 * */

NRF_BLOCK_DEV_SDC_DEFINE(
		m_block_dev_sdc,
		NRF_BLOCK_DEV_SDC_CONFIG(
				SDC_SECTOR_SIZE,
				APP_SDCARD_CONFIG(SDC_MOSI_PIN, SDC_MISO_PIN, SDC_SCK_PIN, SDC_CS_PIN) ),
		NFR_BLOCK_DEV_INFO_CONFIG("Nordic", "SDC", "1.00"));

static FATFS m_fs;
bool m_sd_available = false;

bool util_sd_available() {
	return m_sd_available;
}

bool util_sd_init() {

	FRESULT ff_result;
	DSTATUS disk_state = STA_NOINIT;

	// Initialize FATFS disk I/O interface by providing the block device.
	static diskio_blkdev_t drives[] = {
	DISKIO_BLOCKDEV_CONFIG(NRF_BLOCKDEV_BASE_ADDR(m_block_dev_sdc, block_dev), NULL)
			};

	diskio_blockdev_register(drives, ARRAY_SIZE(drives));


	for (uint32_t retries = 3; retries && disk_state; --retries) {
		disk_state = disk_initialize(0);
	}

	if (disk_state) {
		printf("Can't init\n");
		return false;
	}

	uint32_t blocks_per_mb = (1024uL * 1024uL) / m_block_dev_sdc.block_dev.p_ops->geometry(&m_block_dev_sdc.block_dev)->blk_size;
	uint32_t capacity = m_block_dev_sdc.block_dev.p_ops->geometry(&m_block_dev_sdc.block_dev)->blk_count / blocks_per_mb;
	UNUSED_VARIABLE(capacity);

	ff_result = f_mount(&m_fs, "", 1);
	if (ff_result) {
		printf("Can't mount\n");
		return false;
	}

	//Check version metadata
	char version_data[32];
	FRESULT result = util_sd_load_file("VERSION", (uint8_t *) version_data, 32);
	if (result != FR_OK) {
		printf("No version\n");
		return false;
	}
	uint32_t version_number = strtol(version_data + 8, NULL, 10);


	m_sd_available = true;
	printf("SD init OK\n");
	return true;
}

uint32_t util_sd_file_size(const char *path) {
	FILINFO info;

	FRESULT result = f_stat(path, &info);
	if (result != FR_OK) {
		util_sd_recover();
		result = f_stat(path, &info);
	}

	if (result != FR_OK) {
		util_sd_recover();
		return 0;
	}

	return info.fsize;
}

/**
 * Read a file completely into memory, careful!
 */
FRESULT util_sd_load_file(const char *path, uint8_t *p_buffer, uint32_t count) {
	FIL file;

    printf("Try to load %s\n", path);

	FRESULT result = f_open(&file, path, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
		printf("Can't load file %s\n", path);
		return result;
	}

	UINT bytesread = 0;
	result = f_read(&file, p_buffer, count, &bytesread);

	f_close(&file);
	return result;
}

/**
 * Store some data
 * @param p_file
 * @return
 */
FRESULT util_sd_store_file(const char *path, uint8_t *p_buffer, uint32_t count){
    FIL file;

    FRESULT result = f_open(&file, path, FA_WRITE | FA_OPEN_ALWAYS);
    if(result != FR_OK){
        return result;
    }

    UINT byteswritten = 0;
    result = f_write(&file, p_buffer, count, &byteswritten);

	f_close(&file);

    return result;

}

uint16_t util_sd_read_16(FIL *p_file) {
	uint16_t result;
	UINT count;
	f_read(p_file, &result, 2, &count);
	return result;
}

uint32_t util_sd_read_32(FIL *p_file) {
	uint32_t result;
	UINT count;
	f_read(p_file, &result, 4, &count);
	return result;
}

bool util_sd_recover() {
	disk_uninitialize(0);
	return util_sd_init();
}

void util_sd_error(){

    // Something is wrong with the SD card
    util_gfx_fill_screen(COLOR_BLACK);

    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_WHITE);
    util_gfx_set_cursor(22, 20);
    util_gfx_print("SD Card");

    util_gfx_set_cursor(38, 38);
    util_gfx_print("Error");

    util_gfx_set_font(FONT_MONO55_8PT);
    util_gfx_set_color(COLOR_RED);

    util_gfx_set_cursor(10, 80);
    util_gfx_print("Check card and");

    util_gfx_set_cursor(38, 92);
    util_gfx_print("reboot");

    while(true);

}

/**
 * @param dir Directory to scan
 * @param extension extension to filter with
 * @return number of files in the directory
 */
uint8_t util_sd_getnum_files(const char *path, const char *extension){

	FRESULT ff_result;
	DIR dir;
	FILINFO fno;

	ff_result = f_opendir(&dir, path);
	if (ff_result) {
		// Can't open
		return 0;
	}

	uint8_t counter = 0;
	do {
		ff_result = f_readdir(&dir, &fno);
		if (ff_result != FR_OK || fno.fname[0] == 0) {
		    // Break on error or last file
			break;
		}
		if ((fno.fattrib & AM_DIR)) {
			// Ignore subdirs
		}
		else{
			char *ext = strrchr(fno.fname, '.') + 1;
			if (strcmp(ext, extension) == 0){
				counter++;
			}
		}
	} while(counter < 255);

	f_closedir(&dir);

	return counter;

}
