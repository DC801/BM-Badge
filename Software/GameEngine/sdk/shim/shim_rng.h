#ifndef SHIM_RNG_H
#define SHIM_RNG_H

#ifdef DC801_EMBEDDED
#include <nrf_rng.h>
#include <nrf_drv_rng.h>
#else
#include <stdint.h>
#include "shim_err.h"


	

typedef struct
{
    bool     error_correction : 1;  /**< Error correction flag. */
    uint8_t  interrupt_priority;    /**< Interrupt priority. */
} nrf_drv_rng_config_t;

ret_code_t nrf_drv_rng_rand(uint8_t * p_buff, uint8_t length);
ret_code_t nrf_drv_rng_init(nrf_drv_rng_config_t const * p_config);



#endif //SHIM_RNG_H
#endif //DC801_EMBEDDED
