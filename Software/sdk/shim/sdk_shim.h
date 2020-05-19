#ifndef SDK_SHIM_H
#define SDK_SHIM_H

#include <stdint.h>
#include <stdbool.h>

#include "shim_err.h"
#include "shim_gpio.h"
#include "shim_pwm.h"
#include "shim_timer.h"
#include "shim_rng.h"
#include "shim_serial.h"
#include "shim_adc.h"
#include "shim_ble.h"
#include "shim_filesystem.h"

#ifdef __cplusplus
extern "C" {
#endif

#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

#define UNUSED_VARIABLE(X)     ((void)(X))
#define UNUSED_PARAMETER(X)    UNUSED_VARIABLE(X)
#define UNUSED_RETURN_VALUE(X) UNUSED_VARIABLE(X)

#define NRF_LOG_INIT(unused) NRF_SUCCESS
#define NRF_LOG_DEFAULT_BACKENDS_INIT()

#define NRF_LOG_INFO(...)   printf(__VA_ARGS__);printf("\n")
#define NRF_LOG_ERROR(...)  fprintf(stderr, __VA_ARGS__); fprintf(stderr, "\n")

#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define MAX(a, b) ((a) < (b) ? (b) : (a))

#define CRITICAL_REGION_ENTER()
#define CRITICAL_REGION_EXIT()

typedef enum
{
    NRF_LOG_SEVERITY_NONE,
    NRF_LOG_SEVERITY_ERROR,
    NRF_LOG_SEVERITY_WARNING,
    NRF_LOG_SEVERITY_INFO,
    NRF_LOG_SEVERITY_DEBUG,
    NRF_LOG_SEVERITY_INFO_RAW, /* Artificial level to pass information about skipping string postprocessing.*/
} nrf_log_severity_t;

typedef struct {
    uint32_t  DEVICEADDR[2];
} NRF_FICR_Type;

extern NRF_FICR_Type *NRF_FICR;

bool app_usbd_event_queue_process(void);

uint32_t sd_app_evt_wait(void);

void NVIC_SystemReset(void);

#ifdef __cplusplus
}
#endif

#endif
