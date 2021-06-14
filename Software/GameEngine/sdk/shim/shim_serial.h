#ifndef SHIM_SERIAL_H
#define SHIM_SERIAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdbool.h>
#include <stddef.h>

// UART
void uart_init(void);
uint32_t app_uart_put(uint8_t byte);

// USB CDC
void usb_serial_init(void);
bool usb_serial_is_connected(void);
bool usb_serial_write(const char* data, size_t len);
bool usb_serial_read_line(char* input_buffer, size_t max_len);

// External implementation, SDL side will talk to this
void usb_serial_connect(void);
size_t usb_serial_write_in(const char *buffer);

#ifdef __cplusplus
}
#endif

#endif
