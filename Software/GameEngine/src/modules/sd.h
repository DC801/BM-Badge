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

#include "common.h"

#ifdef __cplusplus
extern "C" {
#endif

extern bool util_sd_available();
extern uint32_t util_sd_file_size(const char *path);
extern FRESULT util_sd_load_file(const char *path, uint8_t *p_buffer, uint32_t count);
extern FRESULT util_sd_store_file(const char *path, uint8_t *p_buffer, uint32_t count);
extern bool util_sd_init();
extern uint16_t util_sd_read_16(FIL *p_file);
extern uint32_t util_sd_read_32(FIL *p_file);
extern bool util_sd_recover();
extern void util_sd_error();
extern uint8_t util_sd_getnum_files(const char *path, const char *extension);

#ifdef __cplusplus
}
#endif

#endif /* UTIL_UTIL_SD_H_ */
