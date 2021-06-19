/*
 * i2c.c
 *
 * Created: 9/10/2020 3:46:46 PM
 *  Author: hamster
 */ 

#include <atmel_start.h>
#include <i2c_slave.h>
#include <atomic.h>

volatile uint8_t I2C_0_slave_address;
volatile uint8_t I2C_0_register_address;

int8_t counter = 0;

//
// @brief Called when the master reads from us.  Resets the counter for the byte offset.
//
void I2C_0_address_handler(){
	I2C_0_slave_address = I2C_0_read();
	I2C_0_send_ack();
	
	 counter = 0;
}

//
// @brief Handle a read from the master.  This is called for each byte the master requests, so we use a counter to find which byte to send
//
void I2C_0_read_handler(){
	// Master read operation

	// Send the proper buttonState byte
	if(counter > 5){
		I2C_0_write(0xFF);
	}
	else{
		I2C_0_write(keyState[counter]);
		counter++;
	}
	
	//lastKey = KEY_NONE;
	I2C_0_send_ack();
}

//
// @brief Handler for when the master writes to us. We don't really have anything to do when this happens but ack.
//
void I2C_0_write_handler(){
	// Master write handler
	I2C_0_register_address = I2C_0_read();
	I2C_0_send_ack(); // or send_nack() if we don't want to receive more data
}

//
// @brief Called at the stop of a read/write
//
void I2C_0_stop_handler(){
	counter = 0;
}

//
// @brief Called on error, just ignore errors for now
//
void I2C_0_error_handler(){
	//while (1)
	//;
}

//
// @brief Initialize the I2C interface
//
void I2C_0_slave_init(void){
	
	I2C_0_set_read_callback(I2C_0_read_handler);
	I2C_0_set_write_callback(I2C_0_write_handler);
	I2C_0_set_address_callback(I2C_0_address_handler);
	I2C_0_set_stop_callback(I2C_0_stop_handler);
	I2C_0_set_collision_callback(I2C_0_error_handler);
	I2C_0_set_bus_error_callback(I2C_0_error_handler);
	I2C_0_open();

}