#include "sdk_shim.h"

// TODO: Implement this shit

ret_code_t nrf_drv_saadc_init(nrf_drv_saadc_config_t const * p_config, nrf_drv_saadc_event_handler_t  event_handler)
{
	UNUSED_PARAMETER(p_config);
    UNUSED_PARAMETER(event_handler);

    return NRF_SUCCESS;
}

nrf_err_t nrf_drv_saadc_sample(void)
{
	return NRF_SUCCESS;
}

nrf_err_t nrf_drv_saadc_buffer_convert(nrf_saadc_value_t * buffer, uint16_t size)
{
	UNUSED_PARAMETER(buffer);
    UNUSED_PARAMETER(size);

    return NRF_SUCCESS;
}

nrfx_err_t nrf_drv_saadc_channel_init(uint8_t channel, nrf_saadc_channel_config_t const * const p_config)
{
	UNUSED_PARAMETER(channel);
    UNUSED_PARAMETER(p_config);

    return NRF_SUCCESS;
}
