#include "common.h"
#include "keyboard.h"

volatile uint32_t keyboard_mask = 0;
keyboard_evt_handler_t keyboard_evt_handler = NULL;
uint32_t last_keyboard_interrupt_time = 0;

#ifdef DC801_EMBEDDED
#include "nrfx_gpiote.h"
#include "app_error.h"

void keyboard_handler(nrfx_gpiote_pin_t pin, nrf_gpiote_polarity_t action)
{
	uint8_t *ptr = (uint8_t *)&keyboard_mask;

	i2cMasterRead(KEYBOARD_ADDRESS, ptr, sizeof(uint32_t));

	if (keyboard_evt_handler != NULL)
	{
		keyboard_evt_handler(keyboard_mask);
	}
}

/**
 * Initialize the keyboard interface
 */
void keyboard_init(void){
	#ifdef DC801_EMBEDDED
	//setup keyboard interrupt pin
    nrf_gpio_cfg_input(KEYBOARD_INT_PIN, NRF_GPIO_PIN_NOPULL);
	#endif
}

/**
 * Determine if an interrupt is occuring
 */
bool is_keyboard_interrupt(void){
    return nrf_gpio_pin_read(KEYBOARD_INT_PIN) == 0;
}

#endif

uint32_t get_keyboard_mask(void)
{
	//need to wait at least KEYBOARD_DEBOUNCE_TIME ms before we try to update again:
	uint32_t state = 0x0;
	i2cMasterRead(KEYBOARD_ADDRESS, (uint8_t *)&state, sizeof(uint32_t));
	return state;
}

void keyboard_register_callback(keyboard_evt_handler_t handler)
{
	keyboard_evt_handler = handler;
}
