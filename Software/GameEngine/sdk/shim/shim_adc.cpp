#include "shim_adc.h"
#include "shim_pwm.h"
#include "shim_timer.h"

#ifdef DC801_EMBEDDED

static nrf_saadc_value_t adc_buf[2][2];

static uint8_t batteryPercent = 0;
static uint16_t batt_lvl_in_milli_volts = 0;
static uint16_t vcc_lvl_in_milli_volts = 0;
static nrf_saadc_value_t vcc_result = 0, batt_result = 0;


APP_PWM_INSTANCE(PWM1, 1);

#define EE_R1 3900
#define EE_R2 10000
#define EE_R3 15000
#define EE_R4 4999
#define EE_TOTR (EE_R1 + EE_R2 + EE_R3 + EE_R4)
#define EE_VOLT(X) (ADC_RESULT_IN_MILLI_VOLTS(vcc_result) * (X) / EE_TOTR)

#define BATTERY_LEVEL_MEAS_INTERVAL     APP_TIMER_TICKS(1500)                 /**< Battery level measurement interval (ticks). This value corresponds to 120 seconds. */
#define ADC_REF_VOLTAGE_IN_MILLIVOLTS   600                                   /**< Reference voltage (in milli volts) used by ADC while doing conversion. */
#define ADC_PRE_SCALING_COMPENSATION    6                                     /**< The ADC is configured to use VDD with 1/3 prescaling as input. And hence the result of conversion is to be multiplied by 3 to get the actual value of the battery voltage.*/
#define ADC_RES_10BIT                   1024                                  /**< Maximum digital value for 10-bit ADC conversion. */
#define DC801_MULTIPLIER                1.403

#define ADC_RESULT_IN_MILLI_VOLTS(ADC_VALUE)\
(((((ADC_VALUE) * ADC_REF_VOLTAGE_IN_MILLIVOLTS) / ADC_RES_10BIT) * ADC_PRE_SCALING_COMPENSATION))

APP_TIMER_DEF(m_battery_timer_id);                      /**< Battery measurement timer. */

void EEpwm_init()
{
    app_pwm_config_t pwm1_cfg = APP_PWM_DEFAULT_CONFIG_1CH(5000L, 11);
    APP_ERROR_CHECK(app_pwm_init(&PWM1, &pwm1_cfg, NULL));
    app_pwm_enable(&PWM1);
}


void EEpwm_set(int r)
{
    r = r % 101;
    app_pwm_channel_duty_set(&PWM1, 0, 100 - r);
}

void EEget_milliVolts(int r, int* v1, int* v2, int* v3)
{
    *v1 = EE_VOLT(EE_R4) * r / 100;
    *v2 = EE_VOLT(EE_R3 + EE_R4) * r / 100;
    *v3 = EE_VOLT(EE_R2 + EE_R3 + EE_R4) * r / 100;
}

/**
 * Called automatically when the timer times out for battery measurement
 * @param p_context
 */
static void battery_level_meas_timeout_handler(void* p_context)
{
    UNUSED_PARAMETER(p_context);

    ret_code_t err_code;
    err_code = nrf_drv_saadc_sample();
    APP_ERROR_CHECK(err_code);
}

/**
 * @return our percentage calculation
 */
uint8_t getBatteryPercent(void)
{
    return batteryPercent;
}

/**
 * Get battery in millivolts
 * @return
 */
uint16_t getBattMillivolts(void)
{
    return ADC_RESULT_IN_MILLI_VOLTS(batt_result) * DC801_MULTIPLIER;
}

/**
 * Determine battery level based on measured millivolts
 * @param millivolts
 * @return in quarters of battery level
 */
uint8_t calcBatteryPercent(uint16_t millivolts)
{

    // New AAAs are about 4550mV
    if (millivolts > 4700)
    {
        // Charging
        return 255;
    }
    if (millivolts > 4100)
    {
        return 100;
    }
    if (millivolts > 3800)
    {
        return 75;
    }
    if (millivolts > 3500)    
{
        return 50;
    }
    if (millivolts > 3300)
    {
        return 25;
    }
    if (millivolts > 3000)
    {
        return 1;
    }
    return 0;

}

/**
 * handler for when the ADC has a result
 * @param p_event
 */
void saadc_event_handler(nrf_drv_saadc_evt_t const* p_event)
{
    if (p_event->type == NRF_DRV_SAADC_EVT_DONE)
    {

        nrf_drv_saadc_buffer_convert(p_event->data.done.p_buffer, 2);

        batt_result = p_event->data.done.p_buffer[0];
        vcc_result = p_event->data.done.p_buffer[1];

        batt_lvl_in_milli_volts = ADC_RESULT_IN_MILLI_VOLTS(batt_result) * DC801_MULTIPLIER;
        batteryPercent = calcBatteryPercent(batt_lvl_in_milli_volts);

    }
}

/**
 * Configure the ADC and create a timer
 */
void adc_configure(void)
{
    nrf_drv_saadc_init(NULL, saadc_event_handler);

    nrf_saadc_channel_config_t batt_config = NRF_DRV_SAADC_DEFAULT_CHANNEL_CONFIG_SE(NRF_SAADC_INPUT_AIN2);
    nrf_drv_saadc_channel_init(0, &batt_config);

    nrf_saadc_channel_config_t vcc_config = NRF_DRV_SAADC_DEFAULT_CHANNEL_CONFIG_SE(NRF_SAADC_INPUT_VDD);
    nrf_drv_saadc_channel_init(1, &vcc_config);

    nrf_drv_saadc_buffer_convert(adc_buf[0], 2);
    nrf_drv_saadc_buffer_convert(adc_buf[1], 2);

    app_timer_create(&m_battery_timer_id, APP_TIMER_MODE_REPEATED, battery_level_meas_timeout_handler);

}

/**
 * Start the timer
 */
void adc_start(void)
{
    app_timer_start(m_battery_timer_id, BATTERY_LEVEL_MEAS_INTERVAL, NULL);
}



#else 
ret_code_t nrf_drv_saadc_init(nrf_drv_saadc_config_t const* p_config, nrf_drv_saadc_event_handler_t  event_handler)
{
	UNUSED_PARAMETER(p_config);
    UNUSED_PARAMETER(event_handler);

    return NRF_SUCCESS;
}

nrf_err_t nrf_drv_saadc_sample(void)
{
	return NRF_SUCCESS;
}

nrf_err_t nrf_drv_saadc_buffer_convert(nrf_saadc_value_t * buffer, uint16_t size)
{
	UNUSED_PARAMETER(buffer);
    UNUSED_PARAMETER(size);

    return NRF_SUCCESS;
}

nrfx_err_t nrf_drv_saadc_channel_init(uint8_t channel, nrf_saadc_channel_config_t const * const p_config)
{
	UNUSED_PARAMETER(channel);
    UNUSED_PARAMETER(p_config);

    return NRFX_SUCCESS;
}
#endif //DC801_EMBEDDED