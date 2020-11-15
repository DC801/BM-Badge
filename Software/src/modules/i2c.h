//
// Created by hamster on 5/23/19.
//

#ifndef I2C_H
#define I2C_H

#ifdef DC801_EMBEDDED

#ifdef __cplusplus
extern "C" {
#endif

void twi_master_init(void);
void i2cMasterTransmit(uint16_t addr, uint8_t const * pdata, size_t size);
void i2cMasterRead(uint16_t addr, uint8_t *pdata, size_t size);

#ifdef __cplusplus
}
#endif

#endif

#endif //I2C_H
