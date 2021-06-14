#include <assert.h>

#include "sdk_shim.h"

#define MAX_PIN_COUNT 48

static PIN pins[MAX_PIN_COUNT] = { 0 };
static nrf_gpio_callback *callback;

void nrf_gpio_cfg_input(uint32_t pin_number, nrf_gpio_pin_pull_t pull_config)
{
	assert(pin_number < MAX_PIN_COUNT);

    pins[pin_number].config = pull_config;

    if (pins[pin_number].direction == 0)
    {
        if (pull_config == NRF_GPIO_PIN_PULLUP)
        {
            pins[pin_number].state = 1;
        }
        else if (pull_config == NRF_GPIO_PIN_PULLDOWN)
        {
            pins[pin_number].state = 0;
        }
    }
}

void nrf_gpio_cfg_output(uint32_t pin_number)
{
	assert(pin_number < MAX_PIN_COUNT);

    pins[pin_number].direction = 1;
}

uint32_t nrf_gpio_pin_read(uint32_t pin_number)
{
	assert(pin_number < MAX_PIN_COUNT);

    return pins[pin_number].state;
}

void nrf_gpio_pin_write(uint32_t pin_number, uint32_t value)
{
	assert(pin_number < MAX_PIN_COUNT);

    // Assume anything non-zero is true
    pins[pin_number].state = (uint32_t)(value != 0);
}

void nrf_gpio_pin_clear(uint32_t pin_number)
{
	assert(pin_number < MAX_PIN_COUNT);

    pins[pin_number].state = 0;
}

void nrf_gpio_pin_set(uint32_t pin_number)
{
	assert(pin_number < MAX_PIN_COUNT);

    pins[pin_number].state = 1;
}

// Used by SDL UI to respond to internal IO changes
//  External GPIO management is going to get pretty ugly. It will need to be
//  synchronized to prevent too many issues. Need to lock operations when handling
//  interrupts from this callback against external manipulation, ie button presses
void nrf_gpio_set_callback(nrf_gpio_callback *gpio_callback)
{
    if (gpio_callback)
    {
        callback = gpio_callback;
    }
}