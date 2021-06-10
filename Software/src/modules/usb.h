#ifndef BADGE_USB_H
#define BADGE_USB_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdbool.h>
#include <stdint.h>

extern char command_buffer[];
extern bool was_command_entered;
extern uint16_t command_buffer_length;

void usb_serial_init();
void handle_usb_serial_input();
void send_serial_message(
	char *message
);
//bool usb_serial_is_connected();
//size_t usb_serial_available();
//size_t usb_serial_read(char* data, size_t max_len);
//bool usb_serial_write(const char* data, size_t len);
//bool usb_serial_read_line(char* data, size_t max_len);

#ifdef __cplusplus
}
#endif

#endif
