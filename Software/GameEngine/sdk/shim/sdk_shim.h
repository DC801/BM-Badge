#ifndef SDK_SHIM_H
#define SDK_SHIM_H

#include <stdint.h>
#include <errno.h>
#include <stdbool.h>
#include <stdio.h>




#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

#define NRF_LOG_INIT(unused) NRF_SUCCESS
#define NRF_LOG_DEFAULT_BACKENDS_INIT()

#define NRF_LOG_INFO(...)   printf(__VA_ARGS__);printf("\n")
#define NRF_LOG_ERROR(...)  fprintf(stderr, __VA_ARGS__); fprintf(stderr, "\n")


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

	extern NRF_FICR_Type* NRF_FICR;

	bool app_usbd_event_queue_process(void);

	uint32_t sd_app_evt_wait(void);

	void NVIC_SystemReset(void);





#endif
