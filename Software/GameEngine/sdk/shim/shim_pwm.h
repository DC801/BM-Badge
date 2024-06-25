#ifndef SHIM_PWM_H
#define SHIM_PWM_H


#ifdef DC801_EMBEDDED
#include <app_pwm.h>
#include <nrfx_pwm.h>
#else

#include <stdint.h>
#include "shim_err.h"
#include "shim_timer.h"

typedef enum
{
    NRFX_DRV_STATE_UNINITIALIZED, // Uninitialized
    NRFX_DRV_STATE_INITIALIZED,   // Initialized but powered off
    NRFX_DRV_STATE_POWERED_ON,    // Initialized and powered on
} nrfx_drv_state_t;

#define APP_PWM_CHANNELS_PER_INSTANCE 2
#define APP_PWM_NOPIN                 0xFFFFFFFF

#define APP_PWM_INSTANCE(name, num)                                           \
    const nrf_drv_timer_t m_pwm_##name##_timer = NRF_DRV_TIMER_INSTANCE(num); \
    app_pwm_cb_t m_pwm_##name##_cb;                                           \
    const app_pwm_t name = {                                                  \
        &m_pwm_##name##_cb,                                        \
        &m_pwm_##name##_timer,                                     \
    }

#define APP_PWM_DEFAULT_CONFIG_1CH(period_in_us, pin)                                  \
    {                                                                                  \
        {pin, APP_PWM_NOPIN},                                       \
        {APP_PWM_POLARITY_ACTIVE_LOW, APP_PWM_POLARITY_ACTIVE_LOW}, \
        1,                                                          \
        period_in_us                                                \
    }

typedef enum
{
    NRF_PPI_CHANNEL0 = 0,
    NRF_PPI_CHANNEL1 = 1,
    NRF_PPI_CHANNEL2 = 2,
    NRF_PPI_CHANNEL3 = 3,
    NRF_PPI_CHANNEL4 = 4,
    NRF_PPI_CHANNEL5 = 5,
    NRF_PPI_CHANNEL6 = 6,
    NRF_PPI_CHANNEL7 = 7,
    NRF_PPI_CHANNEL8 = 8,
    NRF_PPI_CHANNEL9 = 9,
    NRF_PPI_CHANNEL10 = 10,
    NRF_PPI_CHANNEL11 = 11,
    NRF_PPI_CHANNEL12 = 12,
    NRF_PPI_CHANNEL13 = 13,
    NRF_PPI_CHANNEL14 = 14,
    NRF_PPI_CHANNEL15 = 15,
    NRF_PPI_CHANNEL16 = 16,
    NRF_PPI_CHANNEL17 = 17,
    NRF_PPI_CHANNEL18 = 18,
    NRF_PPI_CHANNEL19 = 19,
    NRF_PPI_CHANNEL20 = 20,
    NRF_PPI_CHANNEL21 = 21,
    NRF_PPI_CHANNEL22 = 22,
    NRF_PPI_CHANNEL23 = 23,
    NRF_PPI_CHANNEL24 = 24,
    NRF_PPI_CHANNEL25 = 25,
    NRF_PPI_CHANNEL26 = 26,
    NRF_PPI_CHANNEL27 = 27,
    NRF_PPI_CHANNEL28 = 28,
    NRF_PPI_CHANNEL29 = 29,
    NRF_PPI_CHANNEL30 = 30,
    NRF_PPI_CHANNEL31 = 31,
} nrf_ppi_channel_t;

typedef enum
{
    APP_PWM_POLARITY_ACTIVE_LOW  = 0,
    APP_PWM_POLARITY_ACTIVE_HIGH = 1
} app_pwm_polarity_t;

typedef void (* app_pwm_callback_t)(uint32_t);
typedef uint16_t app_pwm_duty_t;

typedef struct
{
    uint32_t           gpio_pin;        //!< Pin that is used by this PWM channel.
    uint32_t           pulsewidth;      //!< The copy of duty currently set (in ticks).
    nrf_ppi_channel_t  ppi_channels[2]; //!< PPI channels used by the PWM channel to clear and set the output.
    app_pwm_polarity_t polarity;        //!< The active state of the pin.
    uint8_t            initialized;     //!< The internal information if the selected channel was initialized.
} app_pwm_channel_cb_t;

typedef struct
{
    app_pwm_channel_cb_t    channels_cb[APP_PWM_CHANNELS_PER_INSTANCE]; //!< Channels data
    uint32_t                period;                                     //!< Selected period in ticks
    app_pwm_callback_t      p_ready_callback;                           //!< Callback function called on PWM readiness
    nrf_ppi_channel_t       ppi_channel;                               //!< PPI channel used temporary while changing duty
    nrfx_drv_state_t        state;                                      //!< Current driver status
} app_pwm_cb_t;

typedef struct
{
    uint32_t           pins[APP_PWM_CHANNELS_PER_INSTANCE];         //!< Pins configured as PWM output.
    app_pwm_polarity_t pin_polarity[APP_PWM_CHANNELS_PER_INSTANCE]; //!< Polarity of active state on pin.
    uint32_t           num_of_channels;                             //!< Number of channels that can be used.
    uint32_t           period_us;                                   //!< PWM signal output period to configure (in microseconds).
} app_pwm_config_t;

typedef struct
{
    app_pwm_cb_t *p_cb;                    //!< Pointer to control block internals.
    nrf_drv_timer_t const * const p_timer; //!< Timer used by this PWM instance.
} app_pwm_t;

ret_code_t app_pwm_init(app_pwm_t const * const p_instance, app_pwm_config_t const * const p_config, app_pwm_callback_t p_ready_callback);
void app_pwm_enable(app_pwm_t const * const p_instance);
ret_code_t app_pwm_channel_duty_set(app_pwm_t const * const p_instance, uint8_t channel, app_pwm_duty_t duty);


#endif //DC801_EMBEDDED
#endif
