#ifndef BADGE_USB_H
#define BADGE_USB_H

#ifdef __cplusplus
extern "C" {
#endif

void usb_serial_init();
bool usb_serial_is_connected();
size_t usb_serial_available();
size_t usb_serial_read(char* data, size_t max_len);
bool usb_serial_write(const char* data, size_t len);
bool usb_serial_read_line(char* data, size_t max_len);

#ifdef __cplusplus
}
#endif

#endif
