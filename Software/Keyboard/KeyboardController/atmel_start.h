#ifndef ATMEL_START_H_INCLUDED
#define ATMEL_START_H_INCLUDED



#include "include/driver_init.h"
#include "include/atmel_start_pins.h"

#include "touch.h"
#include "bm_board.h"
#include "adc.h"


/**
 * Initializes MCU, drivers and middleware in the project
 **/
void atmel_start_init(void);


#endif
