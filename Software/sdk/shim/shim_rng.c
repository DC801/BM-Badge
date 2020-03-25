#include "sdk_shim.h"

// TODO: Implement this shit

ret_code_t nrf_drv_rng_rand(uint8_t * p_buff, uint8_t length)
{
	UNUSED_PARAMETER(p_buff);
    UNUSED_PARAMETER(length);

    return NRF_SUCCESS;
}

ret_code_t nrf_drv_rng_init(nrf_drv_rng_config_t const * p_config)
{
	UNUSED_PARAMETER(p_config);

    return NRF_SUCCESS;
}
