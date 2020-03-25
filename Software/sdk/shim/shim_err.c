#include <stdio.h>

#include "sdk_shim.h"

void app_error_handler(ret_code_t error_code)
{
    NRF_LOG_ERROR("received an error: 0x%08x!\r\n", error_code);
    NVIC_SystemReset();
}
