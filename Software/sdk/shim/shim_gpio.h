#ifndef SHIM_GPIO_H
#define SHIM_GPIO_H

#ifdef __cplusplus
extern "C" {
#endif

typedef enum
{
    NRF_GPIO_PIN_NOPULL   = 0UL, // Pin pull-up resistor disabled.
    NRF_GPIO_PIN_PULLDOWN = 1UL, // Pin pull-down resistor enabled.
    NRF_GPIO_PIN_PULLUP   = 3UL, // Pin pull-up resistor enabled.
} nrf_gpio_pin_pull_t;

void nrf_gpio_cfg_input(uint32_t pin_number, nrf_gpio_pin_pull_t pull_config);
void nrf_gpio_cfg_output(uint32_t pin_number);
uint32_t nrf_gpio_pin_read(uint32_t pin_number);
void nrf_gpio_pin_write(uint32_t pin_number, uint32_t value);
void nrf_gpio_pin_clear(uint32_t pin_number);
void nrf_gpio_pin_set(uint32_t pin_number);

#ifdef __cplusplus
}
#endif

#endif
