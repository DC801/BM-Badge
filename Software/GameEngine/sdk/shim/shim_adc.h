#ifndef SHIM_ADC_H
#define SHIM_ADC_H

#include <stdint.h>
#include "shim_err.h"

#ifdef __cplusplus
extern "C" {
#endif

#define NRF_DRV_SAADC_DEFAULT_CHANNEL_CONFIG_SE(PIN_P) \
{                                                   \
    NRF_SAADC_RESISTOR_DISABLED,      \
    NRF_SAADC_RESISTOR_DISABLED,      \
    NRF_SAADC_GAIN1_6,                \
    NRF_SAADC_REFERENCE_INTERNAL,     \
    NRF_SAADC_ACQTIME_10US,           \
    NRF_SAADC_MODE_SINGLE_ENDED,      \
    NRF_SAADC_BURST_DISABLED,         \
    (nrf_saadc_input_t)(PIN_P),       \
    NRF_SAADC_INPUT_DISABLED          \
}

typedef int16_t nrf_saadc_value_t;

typedef enum
{
    NRF_SAADC_RESISTOR_DISABLED = 0,   ///< Bypass resistor ladder.
    NRF_SAADC_RESISTOR_PULLDOWN = 1, ///< Pull-down to GND.
    NRF_SAADC_RESISTOR_PULLUP   = 2,   ///< Pull-up to VDD.
    NRF_SAADC_RESISTOR_VDD1_2   = 3    ///< Set input at VDD/2.
} nrf_saadc_resistor_t;

typedef enum
{
    NRF_SAADC_GAIN1_6 = 0, ///< Gain factor 1/6.
    NRF_SAADC_GAIN1_5 = 1, ///< Gain factor 1/5.
    NRF_SAADC_GAIN1_4 = 2, ///< Gain factor 1/4.
    NRF_SAADC_GAIN1_3 = 3, ///< Gain factor 1/3.
    NRF_SAADC_GAIN1_2 = 4, ///< Gain factor 1/2.
    NRF_SAADC_GAIN1   = 5,   ///< Gain factor 1.
    NRF_SAADC_GAIN2   = 6,   ///< Gain factor 2.
    NRF_SAADC_GAIN4   = 7,   ///< Gain factor 4.
} nrf_saadc_gain_t;

typedef enum
{
    NRF_SAADC_REFERENCE_INTERNAL = 0, ///< Internal reference (0.6 V).
    NRF_SAADC_REFERENCE_VDD4     = 1    ///< VDD/4 as reference.
} nrf_saadc_reference_t;

typedef enum
{
    NRF_SAADC_ACQTIME_3US  = 0,  ///< 3 us.
    NRF_SAADC_ACQTIME_5US  = 1,  ///< 5 us.
    NRF_SAADC_ACQTIME_10US = 2, ///< 10 us.
    NRF_SAADC_ACQTIME_15US = 3, ///< 15 us.
    NRF_SAADC_ACQTIME_20US = 4, ///< 20 us.
    NRF_SAADC_ACQTIME_40US = 5  ///< 40 us.
} nrf_saadc_acqtime_t;

typedef enum
{
    NRF_SAADC_MODE_SINGLE_ENDED = 0,  ///< Single-ended mode. PSELN will be ignored, negative input to ADC shorted to GND.
    NRF_SAADC_MODE_DIFFERENTIAL = 1 ///< Differential mode.
} nrf_saadc_mode_t;

typedef enum
{
    NRF_SAADC_BURST_DISABLED = 0, ///< Burst mode is disabled (normal operation).
    NRF_SAADC_BURST_ENABLED  = 1   ///< Burst mode is enabled. SAADC takes 2^OVERSAMPLE number of samples as fast as it can, and sends the average to Data RAM.
} nrf_saadc_burst_t;

typedef enum
{
    NRF_SAADC_INPUT_DISABLED = 0,           ///< Not connected.
    NRF_SAADC_INPUT_AIN0     = 1, ///< Analog input 0 (AIN0).
    NRF_SAADC_INPUT_AIN1     = 2, ///< Analog input 1 (AIN1).
    NRF_SAADC_INPUT_AIN2     = 3, ///< Analog input 2 (AIN2).
    NRF_SAADC_INPUT_AIN3     = 4, ///< Analog input 3 (AIN3).
    NRF_SAADC_INPUT_AIN4     = 5, ///< Analog input 4 (AIN4).
    NRF_SAADC_INPUT_AIN5     = 6, ///< Analog input 5 (AIN5).
    NRF_SAADC_INPUT_AIN6     = 7, ///< Analog input 6 (AIN6).
    NRF_SAADC_INPUT_AIN7     = 8, ///< Analog input 7 (AIN7).
    NRF_SAADC_INPUT_VDD      = 9           ///< VDD as input.
} nrf_saadc_input_t;

typedef enum
{
    NRF_SAADC_RESOLUTION_8BIT  = 0,  ///< 8 bit resolution.
    NRF_SAADC_RESOLUTION_10BIT = 1, ///< 10 bit resolution.
    NRF_SAADC_RESOLUTION_12BIT = 2, ///< 12 bit resolution.
    NRF_SAADC_RESOLUTION_14BIT = 3  ///< 14 bit resolution.
} nrf_saadc_resolution_t;

typedef enum
{
    NRF_SAADC_OVERSAMPLE_DISABLED = 0,   ///< No oversampling.
    NRF_SAADC_OVERSAMPLE_2X       = 1,   ///< Oversample 2x.
    NRF_SAADC_OVERSAMPLE_4X       = 2,   ///< Oversample 4x.
    NRF_SAADC_OVERSAMPLE_8X       = 3,   ///< Oversample 8x.
    NRF_SAADC_OVERSAMPLE_16X      = 4,  ///< Oversample 16x.
    NRF_SAADC_OVERSAMPLE_32X      = 5,  ///< Oversample 32x.
    NRF_SAADC_OVERSAMPLE_64X      = 6,  ///< Oversample 64x.
    NRF_SAADC_OVERSAMPLE_128X     = 7, ///< Oversample 128x.
    NRF_SAADC_OVERSAMPLE_256X     = 8  ///< Oversample 256x.
} nrf_saadc_oversample_t;

typedef enum
{
    NRF_SAADC_LIMIT_LOW  = 0, ///< Low limit type.
    NRF_SAADC_LIMIT_HIGH = 1  ///< High limit type.
} nrf_saadc_limit_t;

typedef enum
{
    NRF_DRV_SAADC_EVT_DONE,         ///< Event generated when the buffer is filled with samples.
    NRF_DRV_SAADC_EVT_LIMIT,        ///< Event generated after one of the limits is reached.
    NRF_DRV_SAADC_EVT_CALIBRATEDONE ///< Event generated when the calibration is complete.
} nrf_saadc_evt_type_t;

typedef struct
{
    nrf_saadc_resistor_t  resistor_p; ///< Resistor value on positive input.
    nrf_saadc_resistor_t  resistor_n; ///< Resistor value on negative input.
    nrf_saadc_gain_t      gain;       ///< Gain control value.
    nrf_saadc_reference_t reference;  ///< Reference control value.
    nrf_saadc_acqtime_t   acq_time;   ///< Acquisition time.
    nrf_saadc_mode_t      mode;       ///< SAADC mode. Single-ended or differential.
    nrf_saadc_burst_t     burst;      ///< Burst mode configuration.
    nrf_saadc_input_t     pin_p;      ///< Input positive pin selection.
    nrf_saadc_input_t     pin_n;      ///< Input negative pin selection.
} nrf_saadc_channel_config_t;

typedef struct
{
    nrf_saadc_value_t * p_buffer; ///< Pointer to buffer with converted samples.
    uint16_t            size;     ///< Number of samples in the buffer.
} nrf_saadc_done_evt_t;

typedef struct
{
    uint8_t           channel;    ///< Channel on which the limit was detected.
    nrf_saadc_limit_t limit_type; ///< Type of limit detected.
} nrf_saadc_limit_evt_t;

typedef struct
{
    nrf_saadc_evt_type_t type; ///< Event type.
    union
    {
        nrf_saadc_done_evt_t  done;  ///< Data for @ref NRFX_SAADC_EVT_DONE event.
        nrf_saadc_limit_evt_t limit; ///< Data for @ref NRFX_SAADC_EVT_LIMIT event.
    } data;                           ///< Union to store event data.
} nrf_drv_saadc_evt_t;

typedef struct
{
    nrf_saadc_resolution_t resolution;         ///< Resolution configuration.
    nrf_saadc_oversample_t oversample;         ///< Oversampling configuration.
    uint8_t                interrupt_priority; ///< Interrupt priority.
    bool                   low_power_mode;     ///< Indicates if low power mode is active.
} nrf_drv_saadc_config_t;

typedef uint32_t ret_code_t;

typedef void (* nrf_drv_saadc_event_handler_t)(nrf_drv_saadc_evt_t const * p_event);

ret_code_t nrf_drv_saadc_init(nrf_drv_saadc_config_t const * p_config, nrf_drv_saadc_event_handler_t  event_handler);
nrf_err_t nrf_drv_saadc_sample(void);
nrf_err_t nrf_drv_saadc_buffer_convert(nrf_saadc_value_t * buffer, uint16_t size);
nrfx_err_t nrf_drv_saadc_channel_init(uint8_t channel, nrf_saadc_channel_config_t const * const p_config);

#ifdef __cplusplus
}
#endif

#endif
