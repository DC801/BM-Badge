#ifndef SHIM_ERR_H
#define SHIM_ERR_H


#include <stdint.h>



#define UNUSED_VARIABLE(X)     ((void)(X))
#define UNUSED_PARAMETER(X)    UNUSED_VARIABLE(X)
#define UNUSED_RETURN_VALUE(X) UNUSED_VARIABLE(X)

#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define MAX(a, b) ((a) < (b) ? (b) : (a))

typedef enum {
    NRF_SUCCESS                      = (0x00), // Successful command
    NRF_ERROR_SVC_HANDLER_MISSING    = (0x01), // SVC handler is missing
    NRF_ERROR_SOFTDEVICE_NOT_ENABLED = (0x02), // SoftDevice has not been enabled
    NRF_ERROR_INTERNAL               = (0x03), // Internal Error
    NRF_ERROR_NO_MEM                 = (0x04), // No Memory for operation
    NRF_ERROR_NOT_FOUND              = (0x05), // Not found
    NRF_ERROR_NOT_SUPPORTED          = (0x06), // Not supported
    NRF_ERROR_INVALID_PARAM          = (0x07), // Invalid Parameter
    NRF_ERROR_INVALID_STATE          = (0x08), // Invalid state, operation disallowed in this state
    NRF_ERROR_INVALID_LENGTH         = (0x09), // Invalid Length
    NRF_ERROR_INVALID_FLAGS          = (0x0A), // Invalid Flags
    NRF_ERROR_INVALID_DATA           = (0x0B), // Invalid Data
    NRF_ERROR_DATA_SIZE              = (0x0C), // Invalid Data size
    NRF_ERROR_TIMEOUT                = (0x0D), // Operation timed out
    NRF_ERROR_NULL                   = (0x0E), // Null Pointer
    NRF_ERROR_FORBIDDEN              = (0x0F), // Forbidden Operation
    NRF_ERROR_INVALID_ADDR           = (0x10), // Bad Memory Address
    NRF_ERROR_BUSY                   = (0x11), // Busy
    NRF_ERROR_CONN_COUNT             = (0x12), // Maximum connection count exceeded.
    NRF_ERROR_RESOURCES              = (0x13), // Not enough resources for operation
} nrf_err_t;

typedef enum {
    NRFX_SUCCESS                     = (0x0BAD0000), // Operation performed successfully.
    NRFX_ERROR_INTERNAL              = (0x0BAD0001), // Internal error.
    NRFX_ERROR_NO_MEM                = (0x0BAD0002), // No memory for operation.
    NRFX_ERROR_NOT_SUPPORTED         = (0x0BAD0003), // Not supported.
    NRFX_ERROR_INVALID_PARAM         = (0x0BAD0004), // Invalid parameter.
    NRFX_ERROR_INVALID_STATE         = (0x0BAD0005), // Invalid state, operation disallowed in this state.
    NRFX_ERROR_INVALID_LENGTH        = (0x0BAD0006), // Invalid length.
    NRFX_ERROR_TIMEOUT               = (0x0BAD0007), // Operation timed out.
    NRFX_ERROR_FORBIDDEN             = (0x0BAD0008), // Operation is forbidden.
    NRFX_ERROR_NULL                  = (0x0BAD0009), // Null pointer.
    NRFX_ERROR_INVALID_ADDR          = (0x0BAD000A), // Bad memory address.
    NRFX_ERROR_BUSY                  = (0x0BAD000B), // Busy.
    NRFX_ERROR_ALREADY_INITIALIZED   = (0x0BAD000C), // Module already initialized.

    NRFX_ERROR_DRV_TWI_ERR_OVERRUN   = (0x0BAE0000), // TWI error: Overrun.
    NRFX_ERROR_DRV_TWI_ERR_ANACK     = (0x0BAE0001), // TWI error: Address not acknowledged.
    NRFX_ERROR_DRV_TWI_ERR_DNACK     = (0x0BAE0002)  // TWI error: Data not acknowledged.
} nrfx_err_t;

typedef uint32_t ret_code_t;

void app_error_handler(ret_code_t error_code);

#define APP_ERROR_CHECK(ERR_CODE)                   \
    {                                               \
        const uint32_t LOCAL_ERR_CODE = (ERR_CODE); \
        if (LOCAL_ERR_CODE != NRF_SUCCESS)          \
        {                                           \
            app_error_handler(LOCAL_ERR_CODE);      \
        }                                           \
    }



#endif
