#ifndef MAGE_APP_TIMERS_H
#define MAGE_APP_TIMERS_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif //__cplusplus
   volatile static uint32_t systick;

    void sysTickStart(void);
    void sysTickHandler(void* p_context);
    uint32_t getSystick(void);
    
#ifdef __cplusplus
}
#endif //__cplusplus
#endif // MAGE_APP_TIMERS_H