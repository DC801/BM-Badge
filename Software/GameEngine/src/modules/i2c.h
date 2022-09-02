//
// Created by hamster on 5/23/19.
//

#ifndef I2C_H
#define I2C_H

#include <stdint.h>

#ifdef DC801_EMBEDDED



void twi_master_init(void);
void i2cMasterTransmit(uint16_t addr, uint8_t const * pdata, size_t size);
void i2cMasterRead(uint16_t addr, uint8_t *pdata, size_t size);



#endif

#endif //I2C_H
