//
// Created by hamster on 8/2/18.
//

#ifndef DC26_BADGE_ADC_H
#define DC26_BADGE_ADC_H

#ifdef __cplusplus
extern "C" {
#endif

void adc_configure(void);
void adc_start(void);

uint8_t getBatteryPercent(void);
uint16_t getVccMillivolts(void);
uint16_t getBattMillivolts(void);

#ifdef __cplusplus
}
#endif

#endif //DC26_BADGE_ADC_H
