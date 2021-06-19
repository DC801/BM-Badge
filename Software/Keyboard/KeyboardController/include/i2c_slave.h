/**
 * \file
 *
 * \brief I2C slave driver.
 *
 (c) 2020 Microchip Technology Inc. and its subsidiaries.

    Subject to your compliance with these terms,you may use this software and
    any derivatives exclusively with Microchip products.It is your responsibility
    to comply with third party license terms applicable to your use of third party
    software (including open source software) that may accompany Microchip software.

    THIS SOFTWARE IS SUPPLIED BY MICROCHIP "AS IS". NO WARRANTIES, WHETHER
    EXPRESS, IMPLIED OR STATUTORY, APPLY TO THIS SOFTWARE, INCLUDING ANY IMPLIED
    WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY, AND FITNESS FOR A
    PARTICULAR PURPOSE.

    IN NO EVENT WILL MICROCHIP BE LIABLE FOR ANY INDIRECT, SPECIAL, PUNITIVE,
    INCIDENTAL OR CONSEQUENTIAL LOSS, DAMAGE, COST OR EXPENSE OF ANY KIND
    WHATSOEVER RELATED TO THE SOFTWARE, HOWEVER CAUSED, EVEN IF MICROCHIP HAS
    BEEN ADVISED OF THE POSSIBILITY OR THE DAMAGES ARE FORESEEABLE. TO THE
    FULLEST EXTENT ALLOWED BY LAW, MICROCHIP'S TOTAL LIABILITY ON ALL CLAIMS IN
    ANY WAY RELATED TO THIS SOFTWARE WILL NOT EXCEED THE AMOUNT OF FEES, IF ANY,
    THAT YOU HAVE PAID DIRECTLY TO MICROCHIP FOR THIS SOFTWARE.
 *
 */
#ifndef I2C_SLAVE_H
#define I2C_SLAVE_H

#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef void(I2C_0_callback)(void);

void I2C_0_init(void);

void I2C_0_open(void);

void I2C_0_close(void);

void I2C_0_isr(void);

uint8_t I2C_0_read(void);

void I2C_0_write(uint8_t data);

void I2C_0_enable(void);

void I2C_0_send_ack(void);

void I2C_0_send_nack(void);

void I2C_0_goto_unaddressed(void);

void I2C_0_set_read_callback(I2C_0_callback handler);

void I2C_0_set_write_callback(I2C_0_callback handler);

void I2C_0_set_address_callback(I2C_0_callback handler);

void I2C_0_set_stop_callback(I2C_0_callback handler);

void I2C_0_set_collision_callback(I2C_0_callback handler);

void I2C_0_set_bus_error_callback(I2C_0_callback handler);

void I2C_0_slave_init(void);

#ifdef __cplusplus
}
#endif

#endif /* I2C_SLAVE_H */
