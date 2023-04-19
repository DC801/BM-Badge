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

/**
 * @brief Structure for the TWI master driver instance configuration.
 */
typedef struct
{
    uint32_t                scl;                 ///< SCL pin number.
    uint32_t                sda;                 ///< SDA pin number.
    nrf_drv_twi_frequency_t frequency;           ///< TWI frequency.
    uint8_t                 interrupt_priority;  ///< Interrupt priority.
    bool                    clear_bus_init;      ///< Clear bus during init.
    bool                    hold_bus_uninit;     ///< Hold pull up state on gpio pins after uninit.
} nrf_drv_twi_config_t;

#endif //DC801_EMBEDDED

#include <stdint.h>
#include <stddef.h>

void twi_master_init(void);
void i2cMasterTransmit(uint16_t addr, uint8_t const* pdata, size_t size);
void i2cMasterRead(uint16_t addr, uint8_t *pdata, size_t size);

#endif //I2C_H
