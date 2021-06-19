/*
 * bm_board.c
 *
 * Created: 9/11/2020 1:45:13 AM
 *  Author: hamster
 */ 

#include <atmel_start.h>
#include "bm_board.h"


const KEYMAP keymap[NUM_KEYS - 1] = {
	// Key,			Row,	Col
	{ KEY_MEM0,			0,		0 },	// SW2
	{ KEY_MEM1,			1,		0 },	// SW3
	{ KEY_MEM2,			2,		0 },	// SW4
	{ KEY_MEM3,			3,		0 },	// SW5
	{ KEY_BIT128,		0,		1 },	// SW6
	{ KEY_BIT64,		1,		1 },	// SW7
	{ KEY_BIT32,		2,		1 },	// SW8
	{ KEY_BIT16,		3,		1 },	// SW9
	{ KEY_BIT8,			0,		2 },	// SW10
	{ KEY_BIT4,			1,		2 },	// SW11
	{ KEY_BIT2,			2,		2 },	// SW12
	{ KEY_BIT1,			3,		2 },	// SW13
	{ KEY_XOR,			0,		3 },	// SW14
	{ KEY_ADD,			1,		3 },	// SW15
	{ KEY_SUB,			2,		3 },	// SW16
	{ KEY_PAGE,			3,		3 },	// SW17
	{ KEY_LJOY_CENTER,	0,		4 },	// SW18
	{ KEY_LJOY_UP,		1,		4 },
	{ KEY_LJOY_DOWN,	2,		4 },
	{ KEY_LJOY_LEFT,	3,		4 },
	{ KEY_LJOY_RIGHT,	4,		4 },
	{ KEY_RJOY_CENTER,	0,		5 },	// SW19
	{ KEY_RJOY_UP,		1,		5 },
	{ KEY_RJOY_DOWN,	2,		5 },
	{ KEY_RJOY_LEFT,	3,		5 },
	{ KEY_RJOY_RIGHT,	4,		5 }
};

//
// @brief Try to find the bit offset of the key based on the given row and col
// @param row Row key is connected to
// @param col Col key is connected to
// @return Bit position in keyState map or NO_KEY if key does not exist
//
uint8_t getKeyOffset(uint8_t row, uint8_t col){
	
	for(uint8_t i = 0; i < (sizeof(keymap) / sizeof(keymap[0])); i++){
		// See if the row and col match
		if(keymap[i].col == col && keymap[i].row == row){
			// It's a match
			return keymap[i].key;
		}
	}
	
	return NO_KEY;
	
}