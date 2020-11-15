#include "common.h"
#include "keyboard.h"

volatile uint32_t keyboard_mask = 0;
keyboard_evt_handler_t keyboard_evt_handler = NULL;

#ifdef DC801_EMBEDDED
#include "nrfx_gpiote.h"
#include "app_error.h"

#define KEYBOARD_ADDR 0x23
#define INTERRUPT_PIN 18

void keyboard_handler(nrfx_gpiote_pin_t pin, nrf_gpiote_polarity_t action)
{
	uint8_t *ptr = (uint8_t *)&keyboard_mask;

	i2cMasterRead(KEYBOARD_ADDR, ptr, sizeof(uint32_t));

	if (keyboard_evt_handler != NULL)
	{
		keyboard_evt_handler(keyboard_mask);
	}
}

void keyboard_init(void)
{
	// Setup the keyboard interrupt pin
	#ifdef DC801_EMBEDDED
	nrf_gpio_cfg_input(KEYBOARD_INT_PIN, NRF_GPIO_PIN_NOPULL);
	#else
	//don't need IO setup for non-embedded builds
	#endif
}

#endif

#ifdef DC801_DESKTOP

void keyboard_init(void)
{
	// TODO: SDL stuff here
}

#endif

int keyboard_key_is_down(KEYBOARD_KEY key)
{
	uint32_t mask = 0x01 << (uint32_t)key;

	if ((keyboard_mask & mask) != 0x00)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

void keyboard_get_mask(uint32_t *mask)
{
	*mask = keyboard_mask;
}

void keyboard_register_callback(keyboard_evt_handler_t handler)
{
	keyboard_evt_handler = handler;
}
