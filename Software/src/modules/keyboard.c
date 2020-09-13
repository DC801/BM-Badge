#include "common.h"
#include "keyboard.h"

#ifdef DC801_EMBEDDED
#include "nrfx_gpiote.h"
#include "app_error.h"

#define KEYBOARD_ADDR 0x23
#define INTERRUPT_PIN 18

volatile uint32_t keyboard_mask = 0;
keyboard_evt_handler_t keyboard_evt_handler = NULL;

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
	if (NRFX_SUCCESS != nrfx_gpiote_init())
	{
		return;
	}

	const nrfx_gpiote_in_config_t in_config =
	{
		.sense = NRF_GPIOTE_POLARITY_HITOLO,	// High to low transition
		.pull = NRF_GPIO_PIN_PULLUP,			// Pull up enabled
		.is_watcher = false,					// Not tracking an output pin
		.hi_accuracy = true,					// Use an IN_EVENT
		.skip_gpio_setup = false				// Configure GPIO
	};

	if (NRFX_SUCCESS != nrfx_gpiote_in_init(INTERRUPT_PIN, &in_config, keyboard_handler))
	{
		return;
	}
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

void keyboard_register_callback(keyboard_evt_handler_t handler)
{
	keyboard_evt_handler = handler;
}
