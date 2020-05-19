//
// Created by hamster on 5/23/19.
//

#ifndef I2C_H
#define I2C_H

void twi_master_init(void);
void i2cMasterTransmit(uint16_t addr, uint8_t const * pdata, size_t size);

/* Master Configuration */
#define MASTER_TWI_INST     0       //!< TWI interface used as a master accessing EEPROM memory.
#define TWI_SCL_M           7       //!< Master SCL pin.
#define TWI_SDA_M           9       //!< Master SDA pin.


#endif //I2C_H
