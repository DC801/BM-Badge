/*
 * key_scan.c
 *
 * Created: 9/11/2020 1:00:08 AM
 *  Author: hamster
 */ 

#include <atmel_start.h>
#include "key_scan.h"

//
// @brief Set the specified row low in prep for the col scan. All others are set high.
// @param row Row to set low
//
void setRow(uint8_t row){
	switch(row){
		case 0:
			R0_set_level(false);
			R1_set_level(true);
			R2_set_level(true);
			R3_set_level(true);
			R4_set_level(true);
			break;
		case 1:
			R0_set_level(true);
			R1_set_level(false);
			R2_set_level(true);
			R3_set_level(true);
			R4_set_level(true);
			break;
		case 2:
			R0_set_level(true);
			R1_set_level(true);
			R2_set_level(false);
			R3_set_level(true);
			R4_set_level(true);
			break;
		case 3:
			R0_set_level(true);
			R1_set_level(true);
			R2_set_level(true);
			R3_set_level(false);
			R4_set_level(true);
			break;
		case 4:
			R0_set_level(true);
			R1_set_level(true);
			R2_set_level(true);
			R3_set_level(true);
			R4_set_level(false);
			break;
		default:
			break;
	}
}

//
// @brief Read the specified col
// @param col Col to read
// @return Boolean indicating if the col has a key down
//
bool readCol(uint8_t col){
	switch(col){
		case 0:
			return !C0_get_level();
		case 1:
			return !C1_get_level();
		case 2:
			return !C2_get_level();
		case 3:
			return !C3_get_level();
		case 4:
			return !C4_get_level();
		case 5:
			return !C5_get_level();
		default:
			return false;
	}
}


//
// @brief Get the key state of a specified offset using the provided array
// @param keyState An array of at least 4 bytes containing the key states
// @param keyOffset Bit offset of the key we are interested in
// @return Bit value at the specified offset
//
bool getKeyState(uint8_t *keyState, uint8_t keyOffset){
	
	if(keyOffset < 8){
		return (keyState[0] >> keyOffset) & 0x01;
	}
	if(keyOffset < 16){
		return (keyState[1] >> (keyOffset - 8)) & 0x01;
	}
	if(keyOffset < 24){
		return (keyState[2] >> (keyOffset - 16)) & 0x01;
	}
	if(keyOffset < 32){
		return (keyState[3] >> (keyOffset - 24)) & 0x01;
	}
	
	return false;
	
}

//
// Set the keystate of a specified keyoffset
//

//
// @brief Set the key state bit of a specified key in the provided array
// @param keyState An array of at least 4 bytes containing the key states
// @param keyOffset The bit position of the key in the array
// @param value Value to set the bit to
//
void setKeyState(uint8_t *keyState, uint8_t keyOffset, bool value){
	
		if(keyOffset < 8){			
			keyState[0] = (keyState[0] & ~(1UL << keyOffset)) | (value << keyOffset);
			return;
		}
		if(keyOffset < 16){
			keyState[1] = (keyState[1] & ~(1UL << (keyOffset - 8))) | (value << (keyOffset - 8));
			return;
		}
		if(keyOffset < 24){
			keyState[2] = (keyState[2] & ~(1UL << (keyOffset - 16))) | (value << (keyOffset - 16));
			return;
		}
		if(keyOffset < 32){
			keyState[3] = (keyState[3] & ~(1UL << (keyOffset - 24))) | (value << (keyOffset - 24));
		}
	
}
