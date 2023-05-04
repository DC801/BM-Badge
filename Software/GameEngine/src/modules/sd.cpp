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

#ifdef DC801_EMBEDDED

#include "sd.h"

static FATFS m_fs;
static bool m_sd_available = false;

static nrf_block_dev_sdc_work_t m_block_dev_sdc_work{};
static const auto m_block_dev_sdc = nrf_block_dev_sdc_t
{
		nrf_block_dev_t{
			reinterpret_cast<const nrf_block_dev_s::nrf_block_dev_ops_s*>(& nrf_block_device_sdc_ops)
		},
		nrf_block_dev_info_strings_t{"Nordic", "SDC", "1.00"},
		nrf_block_dev_sdc_config_t{SDC_SECTOR_SIZE, app_sdc_config_t{SDC_MOSI_PIN, SDC_MISO_PIN, SDC_SCK_PIN, SDC_CS_PIN}},
		&m_block_dev_sdc_work
};

bool util_sd_available() {
	return m_sd_available;
}

bool util_sd_init() {

	FRESULT ff_result;
	DSTATUS disk_state = STA_NOINIT;

	// Initialize FATFS disk I/O interface by providing the block device.
	static diskio_blkdev_t drives[] = { DISKIO_BLOCKDEV_CONFIG(NRF_BLOCKDEV_BASE_ADDR(m_block_dev_sdc, block_dev), NULL) };

	diskio_blockdev_register(drives, ARRAY_SIZE(drives));


	for (uint32_t retries = 3; retries && disk_state; --retries) {
		disk_state = disk_initialize(0);
	}

	if (disk_state) {
		debug_print("Can't init SD Card");
		return false;
	}

	uint32_t blocks_per_mb = (1024uL * 1024uL) / m_block_dev_sdc.block_dev.p_ops->geometry(&m_block_dev_sdc.block_dev)->blk_size;
	uint32_t capacity = m_block_dev_sdc.block_dev.p_ops->geometry(&m_block_dev_sdc.block_dev)->blk_count / blocks_per_mb;
	UNUSED_VARIABLE(capacity);

	ff_result = f_mount(&m_fs, "", 1);
	if (ff_result) {
		debug_print("Can't mount SD Card");
		return false;
	}

	m_sd_available = true;
	debug_print("SD init OK");
	return true;
}

#endif //DC801_EMBEDDED
void util_sd_load_file(const char* path, char* p_buffer, uint32_t count)
{
	
    debug_print("Try to load %s\n", path);

	auto file = std::fstream{ path, std::ios_base::in| std::ios_base::binary };

	// copy the file into the buffer
	if (!file || !file.read(p_buffer, count))
	{
		debug_print("Can't load file %s\n", path);
	}
	file.close();
}

void util_sd_store_file(const char* path, char* p_buffer, uint32_t count)
{
	auto file = std::fstream{ path, std::ios_base::out | std::ios_base::binary };

	// copy the file into the buffer
	if (!file || !file.write(p_buffer, count))
	{
		debug_print("Can't write file %s\n", path);
	}
	file.close();

}

bool util_sd_recover() {
#ifdef DC801_EMBEDDED
	disk_uninitialize(0);
	return util_sd_init();
#else
	return true;
#endif
}


/**
 * @param dir Directory to scan
 * @param extension extension to filter with
 * @return number of files in the directory
 */

uint8_t util_sd_getnum_files(const char* path, const char* extension) {
	const auto dirPath = std::filesystem::path{ path };
	uint8_t counter = 0;

	if (!std::filesystem::directory_entry{ dirPath }.is_directory()) {
		debug_print("Can't open extras\n");
		return counter;
	}

	for (auto const& dirEntry : std::filesystem::directory_iterator{ dirPath })
	{
		if (counter == 255) { break; }
		if (dirEntry.is_regular_file() && dirEntry.path().extension().compare(extension) == 0) {
			// Add the file
			counter++;
		}
	}
	return counter;
}
//
//void util_sd_error()
//{
//	//ENGINE_PANIC("SD Card Error\nCheck card and reboot");
//	frameBuffer->clearScreen(COLOR_BLUE);
//	frameBuffer->printMessage(
//		"SD Card did not initialize properly.\n\
//		Check Card and Reboot if you\n\
//		want to use the SD Card to reflash\n\
//		the ROM chip with a new mage.dat file.",
//		Monaco9,
//		COLOR_WHITE,
//		32,
//		32
//	);
//	frameBuffer->blt();
//	nrf_delay_ms(5000);
//}
