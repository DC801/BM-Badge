#ifndef MAGE_APP_TIMERS_H
#define MAGE_APP_TIMERS_H

#include <stdint.h>

void sysTickStart(void);
void sysTickHandler(void* p_context);
uint32_t getSystick(void);
    
#endif // MAGE_APP_TIMERS_H