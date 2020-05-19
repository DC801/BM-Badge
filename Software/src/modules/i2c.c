//
// Created by hamster on 5/23/19.
//

#include <common.h>
#include "i2c.h"

#ifdef DC801_EMBEDDED

static const nrf_drv_twi_t m_twi_master = NRF_DRV_TWI_INSTANCE(MASTER_TWI_INST);

void twi_master_init(void){
    const nrf_drv_twi_config_t config = {
            .scl                = TWI_SCL_M,
            .sda                = TWI_SDA_M,
            .frequency          = NRF_DRV_TWI_FREQ_400K,
            .interrupt_priority = APP_IRQ_PRIORITY_HIGH,
            .clear_bus_init     = false
    };

    if (NRF_SUCCESS == nrf_drv_twi_init(&m_twi_master, &config, NULL, NULL)){
        nrf_drv_twi_enable(&m_twi_master);
    }

}


void i2cMasterTransmit(uint16_t addr, uint8_t const * pdata, size_t size){

    nrf_drv_twi_tx(&m_twi_master, addr, pdata, size, false);

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
