/*
 * adc.h
 *
 * Created: 9/11/2020 1:01:20 AM
 *  Author: hamster
 */ 

#ifndef ADC_BASIC_EXAMPLE_H
#define ADC_BASIC_EXAMPLE_H

// ADC channels used
#define ADC_Xp ADC_MUXPOS_AIN6_gc
#define ADC_Yp ADC_MUXPOS_AIN7_gc
#define ADC_Xm ADC_MUXPOS_AIN8_gc
#define ADC_Ym ADC_MUXPOS_AIN9_gc

uint8_t ts_getX();
uint8_t ts_getY();

#endif /* ADC_BASIC_EXAMPLE_H */
