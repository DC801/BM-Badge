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

#include "sd.h"

SDCard::SDCard()
{
	// Initialize FATFS disk I/O interface by providing the block device.
	static diskio_blkdev_t drives[] = { DISKIO_BLOCKDEV_CONFIG(NRF_BLOCKDEV_BASE_ADDR(m_block_dev_sdc, block_dev), NULL) };

	diskio_blockdev_register(drives, ARRAY_SIZE(drives));

	auto disk_state = disk_status(0);
	if (RES_OK == disk_state)
	{
		for (uint32_t retries = 3; retries && disk_state; --retries)
		{
			disk_state = disk_initialize(0);
		}

		if (disk_state)
		{
			debug_print("Can't init SD Card");
		}

		auto ff_result = f_mount(&m_fs, "", 1);
		if (ff_result)
		{
			debug_print("Can't mount SD Card");
		}

		sdCardInitialized = true;
		debug_print("SD initialized");
	}
	else
	{
		debug_print("No SD card inserted");
	}
}

SDCard::~SDCard()
{
	disk_uninitialize(0);
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
