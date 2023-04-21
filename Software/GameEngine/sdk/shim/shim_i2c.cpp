//
// Created by hamster on 5/23/19.
//
#include "shim_i2c.h"

#ifdef DC801_EMEDDED
static const nrf_drv_twi_t m_twi_master = NRF_DRV_TWI_INSTANCE(I2C_INSTANCE);

void twi_master_init(void)
{
    const auto config = nrf_drv_twi_config_t{
        I2C_SCL_PIN,
        I2C_SDA_PIN,
        NRF_DRV_TWI_FREQ_400K,
        APP_IRQ_PRIORITY_HIGH,
        false
    };

    if (NRF_SUCCESS == nrf_drv_twi_init(&m_twi_master, &config, NULL, NULL)){
        nrf_drv_twi_enable(&m_twi_master);
    }
}

void i2cMasterTransmit(uint16_t addr, uint8_t const *pdata, size_t size)
{
    //badge_mutex_lock(&i2c_mutex);
    nrf_drv_twi_tx(&m_twi_master, addr, pdata, size, false);
    //badge_mutex_unlock(&i2c_mutex);
}

void i2cMasterRead(uint16_t addr, uint8_t *pdata, size_t size)
{
    //badge_mutex_lock(&i2c_mutex);
    nrf_drv_twi_rx(&m_twi_master, addr, pdata, size);
    //badge_mutex_unlock(&i2c_mutex);
}
#endif