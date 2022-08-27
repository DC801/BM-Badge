//
// Created by hamster on 8/2/18.
//
// Determine battery level
//


#include "adc.h"
#include "shim_timer.h"
#include "shim_adc.h"

#define BATTERY_LEVEL_MEAS_INTERVAL     APP_TIMER_TICKS(1500)                 /**< Battery level measurement interval (ticks). This value corresponds to 120 seconds. */
#define ADC_REF_VOLTAGE_IN_MILLIVOLTS   600                                   /**< Reference voltage (in milli volts) used by ADC while doing conversion. */
#define ADC_PRE_SCALING_COMPENSATION    6                                     /**< The ADC is configured to use VDD with 1/3 prescaling as input. And hence the result of conversion is to be multiplied by 3 to get the actual value of the battery voltage.*/
#define ADC_RES_10BIT                   1024                                  /**< Maximum digital value for 10-bit ADC conversion. */
#define DC801_MULTIPLIER                1.403

#define ADC_RESULT_IN_MILLI_VOLTS(ADC_VALUE)\
(((((ADC_VALUE) * ADC_REF_VOLTAGE_IN_MILLIVOLTS) / ADC_RES_10BIT) * ADC_PRE_SCALING_COMPENSATION))

APP_TIMER_DEF(m_battery_timer_id);                      /**< Battery measurement timer. */

static nrf_saadc_value_t adc_buf[2][2];

static uint8_t batteryPercent = 0;
static uint16_t batt_lvl_in_milli_volts = 0;
static uint16_t vcc_lvl_in_milli_volts = 0;
static nrf_saadc_value_t vcc_result = 0, batt_result = 0;

/**
 * Called automatically when the timer times out for battery measurement
 * @param p_context
 */
static void battery_level_meas_timeout_handler(void *p_context) {
    UNUSED_PARAMETER(p_context);

    ret_code_t err_code;
    err_code = nrf_drv_saadc_sample();
    APP_ERROR_CHECK(err_code);
}

/**
 * @return our percentage calculation
 */
uint8_t getBatteryPercent(void){
    return batteryPercent;
}

/**
 * Get VCC in millivolts
 * @return
 */
uint16_t getVccMillivolts(void){
    return ADC_RESULT_IN_MILLI_VOLTS(vcc_result);
}

/**
 * Get battery in millivolts
 * @return
 */
uint16_t getBattMillivolts(void){
    return ADC_RESULT_IN_MILLI_VOLTS(batt_result) * DC801_MULTIPLIER;
}

/**
 * Determine battery level based on measured millivolts
 * @param millivolts
 * @return in quarters of battery level
 */
uint8_t calcBatteryPercent(uint16_t millivolts){

    // New AAAs are about 4550mV
    if(millivolts > 4700){
        // Charging
        return 255;
    }
    if(millivolts > 4100){
        return 100;
    }
    if(millivolts > 3800){
        return 75;
    }
    if(millivolts > 3500){
        return 50;
    }
    if(millivolts > 3300){
        return 25;
    }
    if(millivolts > 3000) {
        return 1;
    }
    return 0;

}

/**
 * handler for when the ADC has a result
 * @param p_event
 */
void saadc_event_handler(nrf_drv_saadc_evt_t const *p_event) {
    if (p_event->type == NRF_DRV_SAADC_EVT_DONE) {

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
void adc_configure(void) {
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
void adc_start(void){
    app_timer_start(m_battery_timer_id, BATTERY_LEVEL_MEAS_INTERVAL, NULL);
}


