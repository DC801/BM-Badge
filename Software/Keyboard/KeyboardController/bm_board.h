/*
 * bm_board.h
 *
 * Created: 9/10/2020 11:38:37 PM
 *  Author: hamster
 */ 


#ifndef BMBOARD_H_
#define BMBOARD_H_

extern uint8_t keyState[6];

// 27 keys
// Bit position of the key within the key state array
typedef enum {
	KEY_MEM0			= 0,	// SW2
	KEY_MEM1			= 1,	// SW3
	KEY_MEM2			= 2,	// SW4
	KEY_MEM3			= 3,	// SW5
	KEY_BIT128			= 4,	// SW6
	KEY_BIT64			= 5,	// SW7
	KEY_BIT32			= 6,	// SW8
	KEY_BIT16			= 7,	// SW9
	KEY_BIT8			= 8,	// SW10
	KEY_BIT4			= 9,	// SW11
	KEY_BIT2			= 10,	// SW12
	KEY_BIT1			= 11,	// SW13
	KEY_XOR				= 12,	// SW14
	KEY_ADD				= 13,	// SW15
	KEY_SUB				= 14,	// SW16
	KEY_PAGE			= 15,	// SW17
	KEY_LJOY_CENTER		= 16,	// SW18
	KEY_LJOY_LEFT		= 17,
	KEY_LJOY_DOWN		= 18,
	KEY_LJOY_UP			= 19,
	KEY_LJOY_RIGHT		= 20,
	KEY_RJOY_CENTER		= 21,	// SW19
	KEY_RJOY_LEFT		= 22,
	KEY_RJOY_DOWN		= 23,
	KEY_RJOY_UP			= 24,
	KEY_RJOY_RIGHT		= 25,
	KEY_HAX				= 26,	// Cap Touch
	NUM_KEYS					// Count of total number of keys
} KEY;

typedef struct {
	KEY key;
	uint8_t row;
	uint8_t col;
} KEYMAP;

// See bm_board.c for mapping of keys to row/col
extern const KEYMAP keymap[NUM_KEYS - 1];

#define NO_KEY 255

uint8_t getKeyOffset(uint8_t row, uint8_t col);

#endif /* BMBOARD_H_ */