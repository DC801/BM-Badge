/*
 * adc.c
 *
 * Created: 9/11/2020 1:01:20 AM
 *  Author: hamster
 */ 

#include <atmel_start.h>
#include <adc.h>
#include <adc_basic.h>
#include <atomic.h>


//
// To get the Y location, we need to set:
// Yp - 3.2v
// Ym - GND
// Xp - input, sense here
// Xm - input
//
// @brief Get the Y touch position of a touch point
// @return A 8 bit value that is the ADC reading of the touch point
//
uint8_t ts_getY(void){
	
	adc_result_t ADC_0_measurement;
	
	Xp_set_dir(PORT_DIR_IN); //
	Xp_set_pull_mode(PORT_PULL_OFF);
	Xp_set_level(false);
	Xm_set_dir(PORT_DIR_IN);
	Xm_set_pull_mode(PORT_PULL_OFF);
	Xm_set_level(false);
	Yp_set_dir(PORT_DIR_OUT);
	Yp_set_pull_mode(PORT_PULL_OFF);
	Yp_set_level(true);
	Ym_set_dir(PORT_DIR_OUT);
	Ym_set_pull_mode(PORT_PULL_OFF);
	Ym_set_level(false);
	
	ADC_0_measurement = ADC_0_get_conversion(ADC_Xp);

	Xp_set_dir(PORT_DIR_OUT);
	Xp_set_level(false);
	Xm_set_dir(PORT_DIR_OFF);
	Xm_set_level(false);
	Yp_set_dir(PORT_DIR_OFF);
	Yp_set_level(false);
	Ym_set_dir(PORT_DIR_OFF);
	Ym_set_level(false);

	// Get 8 MSB of conversion result
	return ADC_0_measurement >> (ADC_0_get_resolution() - 8);
	
}


//
// To get the X location, we need to set:
// Yp - input sense here
// Ym - input
// Xp - 3.2v
// Xm - GND
//
// @brief Get the X touch position of a touch point
// @return A 8 bit value that is the ADC reading of the touch point
//
uint8_t ts_getX(void){
	
	adc_result_t ADC_0_measurement;
		
	Xp_set_dir(PORT_DIR_OUT);
	Xp_set_pull_mode(PORT_PULL_OFF);
	Xp_set_level(true);
	Xm_set_dir(PORT_DIR_OUT);
	Xm_set_pull_mode(PORT_PULL_OFF);
	Xm_set_level(false);
	Yp_set_dir(PORT_DIR_IN); //
	Yp_set_pull_mode(PORT_PULL_OFF);
	Yp_set_level(false);
	Ym_set_dir(PORT_DIR_IN);
	Ym_set_pull_mode(PORT_PULL_OFF);
	Ym_set_level(false);
	
	ADC_0_measurement = ADC_0_get_conversion(ADC_Yp);

	Xp_set_dir(PORT_DIR_OUT);
	Xp_set_level(false);
	Xm_set_dir(PORT_DIR_OFF);
	Xm_set_level(false);
	Yp_set_dir(PORT_DIR_OFF);
	Yp_set_level(false);
	Ym_set_dir(PORT_DIR_OFF);
	Ym_set_level(false);

	// Get 8 MSB of conversion result
	return ADC_0_measurement >> (ADC_0_get_resolution() - 8);
		
}

