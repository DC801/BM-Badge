#include "sdk_shim.h"

static NRF_FICR_Type FICR_internal;
NRF_FICR_Type *NRF_FICR = &FICR_internal;

uint32_t sd_app_evt_wait(void)
{
    return NRF_SUCCESS;
}

void NVIC_SystemReset(void)
{
    // TODO: Figure this out
    // Maybe spawn a new instance of this process and kill the original?
}
