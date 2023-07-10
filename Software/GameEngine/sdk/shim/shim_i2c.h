//
// Created by hamster on 5/23/19.
//

#ifndef I2C_H
#define I2C_H

#ifdef DC801_EMBEDDED

#include "config/custom_board.h"
#include <nrf_twi_mngr.h>

#else

#include "shim_err.h"

#include <stdint.h>
#include <stddef.h>

void twi_master_init(void);
void i2cMasterTransmit(uint16_t addr, uint8_t const* pdata, size_t size);
void i2cMasterRead(uint16_t addr, uint8_t *pdata, size_t size);

typedef struct
{
   uint32_t* p_rx_buffer;
   uint32_t const* p_tx_buffer;
} nrfx_i2s_buffers_t;

#endif //DC801_EMBEDDED

#endif //I2C_H
