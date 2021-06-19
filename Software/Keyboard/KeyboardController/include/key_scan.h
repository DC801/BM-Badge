/*
 * key_scan.h
 *
 * Created: 9/11/2020 1:01:20 AM
 *  Author: hamster
 */ 


#ifndef KEY_SCAN_H_
#define KEY_SCAN_H_


void setRow(uint8_t row);
bool readCol(uint8_t col);
bool getKeyState(uint8_t *keyState, uint8_t keyOffset);
void setKeyState(uint8_t *keyState, uint8_t keyOffset, bool value);


#endif /* KEY_SCAN_H_ */