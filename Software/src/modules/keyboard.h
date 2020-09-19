#ifndef MODULE_KEYBOARD_H
#define MODULE_KEYBOARD_H

// 27 keys
// Bit position of the key within the key state array
typedef enum
{
	KEYBOARD_KEY_MEM0			= 0,	// SW2
	KEYBOARD_KEY_MEM1			= 1,	// SW3
	KEYBOARD_KEY_MEM2			= 2,	// SW4
	KEYBOARD_KEY_MEM3			= 3,	// SW5
	KEYBOARD_KEY_BIT128			= 4,	// SW6
	KEYBOARD_KEY_BIT64			= 5,	// SW7
	KEYBOARD_KEY_BIT32			= 6,	// SW8
	KEYBOARD_KEY_BIT16			= 7,	// SW9
	KEYBOARD_KEY_BIT8			= 8,	// SW10
	KEYBOARD_KEY_BIT4			= 9,	// SW11
	KEYBOARD_KEY_BIT2			= 10,	// SW12
	KEYBOARD_KEY_BIT1			= 11,	// SW13
	KEYBOARD_KEY_XOR			= 12,	// SW14
	KEYBOARD_KEY_ADD			= 13,	// SW15
	KEYBOARD_KEY_SUB			= 14,	// SW16
	KEYBOARD_KEY_PAGE			= 15,	// SW17
	KEYBOARD_KEY_LJOY_CENTER	= 16,	// SW18
	KEYBOARD_KEY_LJOY_LEFT		= 17,
	KEYBOARD_KEY_LJOY_DOWN		= 18,
	KEYBOARD_KEY_LJOY_UP		= 19,
	KEYBOARD_KEY_LJOY_RIGHT		= 20,
	KEYBOARD_KEY_RJOY_CENTER	= 21,	// SW19
	KEYBOARD_KEY_RJOY_LEFT		= 22,
	KEYBOARD_KEY_RJOY_DOWN		= 23,
	KEYBOARD_KEY_RJOY_UP		= 24,
	KEYBOARD_KEY_RJOY_RIGHT		= 25,
	KEYBOARD_KEY_HAX			= 26,	// Cap Touch
	KEYBOARD_NUM_KEYS					// Count of total number of keys
} KEYBOARD_KEY;

typedef void (*keyboard_evt_handler_t)(uint32_t keyboard_mask);

void keyboard_init(void);
int keyboard_key_is_down(KEYBOARD_KEY key);
void keyboard_register_callback(keyboard_evt_handler_t handler);

#endif
