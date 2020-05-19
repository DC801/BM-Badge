//
// Created by dvdfreitag on 5/13/20
//

#include <common.h>
#include "i2s.h"

#ifdef DC801_EMBEDDED

void i2s_master_init(void)
{
    const nrfx_i2s_config_t config = {
            .sck_pin        = I2S_SCK_M,
            .lrck_pin       = I2S_LRCK_M,
            .mck_pin        = I2S_MCK_M,
            .sdout_pin      = I2S_SDOUT_M,
            .sdin_pin       = I2S_SDIN_M,
            .irq_priority   = I2S_PRIORITY_M,
            .mode           = I2S_MODE_M,
            .format         = I2S_FORMAT_M,
            .alignment      = I2S_ALIGN_M,
            .sample_width   = I2S_WIDTH_M,
            .channels       = I2S_CHANNEL_M,
            .mck_setup      = I2S_MCKSETUP_M,
            .ratio          = I2S_RATIO_M
    };
}

#else

void i2s_master_init(void) { }

#endif