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
*****************************************************************************/
#ifndef UTIL_UTIL_SD_H_
#define UTIL_UTIL_SD_H_

#ifdef DC801_EMBEDDED
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include "EnginePanic.h"

#include "config/custom_board.h"
#include "utility.h"

#include <nrf.h>
#include <bsp.h>
#include <ff.h>
#include <diskio.h>
#include <diskio_blkdev.h>
#include <nrf_block_dev_sdc.h>
#include <nrf_log.h>
#include <nrf_log_ctrl.h>
#include <nrf_log_default_backends.h>

#include <stdint.h>
extern bool util_sd_available();
extern void util_sd_load_file(const char* path, char* p_buffer, uint32_t count);
extern void util_sd_store_file(const char* path, char* p_buffer, uint32_t count);
extern bool util_sd_init();
extern bool util_sd_recover();
extern void util_sd_error();
extern uint8_t util_sd_getnum_files(const char* path, const char* extension);
#endif

#endif /* UTIL_UTIL_SD_H_ */
