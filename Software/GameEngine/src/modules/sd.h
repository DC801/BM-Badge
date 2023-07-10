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


#include <iostream>
#include <memory>

extern bool util_sd_recover();
extern uint8_t util_sd_getnum_files(const char* path, const char* extension);



class SDCard
{
    class SDCardFile;
public:

    SDCard();
    ~SDCard();

    SDCardFile openFile(const char* filename) { return SDCardFile{ filename }; }

    operator bool() { return sdCardInitialized; }
private:
    FATFS m_fs{};
    bool sdCardInitialized = false;
    nrf_block_dev_sdc_work_t m_block_dev_sdc_work{};
    const nrf_block_dev_sdc_t m_block_dev_sdc = nrf_block_dev_sdc_t
    {
            nrf_block_dev_t{
                reinterpret_cast<const nrf_block_dev_s::nrf_block_dev_ops_s*>(&nrf_block_device_sdc_ops)
            },
            nrf_block_dev_info_strings_t{"Nordic", "SDC", "1.00"},
            nrf_block_dev_sdc_config_t{SDC_SECTOR_SIZE, app_sdc_config_t{SDC_MOSI_PIN, SDC_MISO_PIN, SDC_SCK_PIN, SDC_CS_PIN}},
            &m_block_dev_sdc_work
    };
    
    class SDCardFile
    {
    public:
        SDCardFile(const char* filename) : path(filename)
        {
            if (FR_OK != f_open(fp.get(), filename, FA_READ | FA_OPEN_EXISTING))
            {
               error_print("Could not open %s", filename);
            }
        }

        ~SDCardFile()
        {
            f_close(fp.get());
        }

        inline uint32_t read(void* outBuf, uint32_t bytesToRead)
        {
            unsigned int bytesRead;
            return FR_OK == f_read(fp.get(), outBuf, bytesToRead, &bytesRead) && bytesRead == bytesToRead;
        }

        inline uint32_t lseek(uint32_t offset)
        {
            return f_lseek(fp.get(), offset);
        }

        inline uint32_t size()
        {
            FILINFO info;

            if (FR_OK != f_stat(path, &info))
            {
                debug_print("Could not get filesize: %s", path)
                return 0;
            }

            return info.fsize;
        }

        operator bool()
        {
            return 0 == fp->err;
        }

    private:
        const char* path;
        std::unique_ptr<FIL> fp = std::make_unique<FIL>();
    };

};
#endif  // DC801_EMBEDDED

#endif /* UTIL_UTIL_SD_H_ */
