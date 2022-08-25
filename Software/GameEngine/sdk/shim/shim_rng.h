#ifndef SHIM_RNG_H
#define SHIM_RNG_H

#include <stdint.h>
#include "sdk_shim.h"

#ifdef __cplusplus
extern "C" {
#endif
	

typedef struct
{
    bool     error_correction : 1;  /**< Error correction flag. */
    uint8_t  interrupt_priority;    /**< Interrupt priority. */
} nrf_drv_rng_config_t;

ret_code_t nrf_drv_rng_rand(uint8_t * p_buff, uint8_t length);
ret_code_t nrf_drv_rng_init(nrf_drv_rng_config_t const * p_config);

#ifdef __cplusplus
}
#endif

#endif
