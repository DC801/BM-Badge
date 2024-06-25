#ifndef MODULE_KEYBOARD_H
#define MODULE_KEYBOARD_H
	
#include <stdint.h>
#define KEYBOARD_DEBOUNCE_TIME 15

// 27 keys
// Bit position of the key within the key state array
enum class KeyPress
{
	Mem0			= 0,
	Mem1			= 1,
	Mem2			= 2,
	Mem3			= 3,
	Bit128		= 4,
	Bit64			= 5,
	Bit32			= 6,
	Bit16			= 7,
	Bit8			= 8,
	Bit4			= 9,
	Bit2			= 10,
	Bit1			= 11,
	Xor			= 12,
	Add			= 13,
	Sub			= 14,
	Page			= 15,
	Ljoy_center	= 16,
	Ljoy_up		= 17,
	Ljoy_down		= 18,
	Ljoy_left		= 19,
	Ljoy_right		= 20,
	Rjoy_center	= 21,
	Rjoy_up		= 22,
	Rjoy_down		= 23,
	Rjoy_left		= 24,
	Rjoy_right		= 25,
	Hax			= 26,	// Cap Touch
};
static const inline uint32_t KEYBOARD_NUM_KEYS = 27;					// Count of total number of keys

typedef void (*keyboard_evt_handler_t)(uint32_t keyboard_mask);

void keyboard_init(void);
bool is_keyboard_interrupt(void);
uint32_t get_keyboard_mask(void);
void keyboard_register_callback(keyboard_evt_handler_t handler);



#endif
