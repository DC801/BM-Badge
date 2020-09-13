//
// Created by hamster on 5/23/19.
//

#include <common.h>
#include "i2c.h"
#include "mutex.h"

#ifdef DC801_EMBEDDED

#include <stdatomic.h>

/* Master Configuration */
#define MASTER_TWI_INST     0       //!< TWI interface used as a master accessing EEPROM memory.
#define TWI_SCL_M           7       //!< Master SCL pin.
#define TWI_SDA_M           9       //!< Master SDA pin.

static const nrf_drv_twi_t m_twi_master = NRF_DRV_TWI_INSTANCE(MASTER_TWI_INST);

atomic_int i2c_mutex = 0;

void twi_master_init(void)
{
    const nrf_drv_twi_config_t config =
    {
            .scl                = TWI_SCL_M,
            .sda                = TWI_SDA_M,
            .frequency          = NRF_DRV_TWI_FREQ_400K,
            .interrupt_priority = APP_IRQ_PRIORITY_HIGH,
            .clear_bus_init     = false
    };

    if (NRF_SUCCESS == nrf_drv_twi_init(&m_twi_master, &config, NULL, NULL))
    {
        nrf_drv_twi_enable(&m_twi_master);
    }
}

void i2cMasterTransmit(uint16_t addr, uint8_t const *pdata, size_t size)
{
    badge_mutex_lock(&i2c_mutex);

    nrf_drv_twi_tx(&m_twi_master, addr, pdata, size, false);

    badge_mutex_unlock(&i2c_mutex);
}

void i2cMasterRead(uint16_t addr, uint8_t *pdata, size_t size)
{
    badge_mutex_lock(&i2c_mutex);

    nrf_drv_twi_rx(&m_twi_master, addr, pdata, size);

    badge_mutex_unlock(&i2c_mutex);
}

#else

void twi_master_init(void) { }
void i2cMasterTransmit(uint16_t addr, uint8_t const * pdata, size_t size)
{
    UNUSED_PARAMETER(addr);
    UNUSED_PARAMETER(pdata);
    UNUSED_PARAMETER(size);
}

#endif
