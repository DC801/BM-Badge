#include "shim_pwm.h"

// TODO: Implement this shit

ret_code_t app_pwm_init(app_pwm_t const * const p_instance, app_pwm_config_t const * const p_config, app_pwm_callback_t p_ready_callback)
{
    UNUSED_PARAMETER(p_instance);
    UNUSED_PARAMETER(p_config);
    UNUSED_PARAMETER(p_ready_callback);

	return NRF_SUCCESS;
}

void app_pwm_enable(app_pwm_t const * const p_instance)
{
	UNUSED_PARAMETER(p_instance);
}

ret_code_t app_pwm_channel_duty_set(app_pwm_t const * const p_instance, uint8_t channel, app_pwm_duty_t duty)
{
	UNUSED_PARAMETER(p_instance);
    UNUSED_PARAMETER(channel);
    UNUSED_PARAMETER(duty);

    return NRF_SUCCESS;
}
