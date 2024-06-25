#include "sdk_shim.h"
#include "shim_err.h"

#ifndef DC801_EMBEDDED
static NRF_FICR_Type FICR_internal{};
NRF_FICR_Type *NRF_FICR = &FICR_internal;

bool app_usbd_event_queue_process(void)
{
    return false;
}

uint32_t sd_app_evt_wait(void)
{
    return NRF_SUCCESS;
}

void NVIC_SystemReset(void)
{
    // TODO: Figure this out
    // Maybe spawn a new instance of this process and kill the original?
}
#endif //DC801_EMBEDDED