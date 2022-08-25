#include <string.h>
#include "shim_err.h"
#include "shim_serial.h"

#define BUFFER_SIZE 255

static char uart_buffer[BUFFER_SIZE + 1] = { 0 };
static uint32_t uart_index = 0;

static char usb_buffer[BUFFER_SIZE + 1] = { 0 };
static uint32_t usb_index = 0;

bool usb_connected = false;

// TODO: Implement this shit

void uart_init(void)
{
    memset(uart_buffer, 0, BUFFER_SIZE + 1);
    uart_index = 0;
}

uint32_t app_uart_put(uint8_t byte)
{
    UNUSED_PARAMETER(byte);

    return NRF_SUCCESS;
}

void usb_serial_init(void) {
    memset(usb_buffer, 0, BUFFER_SIZE + 1);
    usb_index = 0;
    usb_connected = false;
}

bool usb_serial_is_connected(void) {
    return usb_connected;
}

bool usb_serial_write(const char* data, size_t len) {
    UNUSED_PARAMETER(data);
    UNUSED_PARAMETER(len);

    return true;
}

bool usb_serial_read_line(char* input_buffer, size_t max_len) {
    for (uint32_t i = 0; i < usb_index; ++i)
    {
        if ((usb_buffer[i] == '\n') || (usb_buffer[i] == '\r'))
        {
            usb_buffer[i++]='\0';

            while((i < usb_index) && ((usb_buffer[i] == '\n') || (usb_buffer[i] == '\r')))
            {
                usb_buffer[i++] = '\0';
            }

            size_t read =  MIN(i, max_len);

            memcpy(input_buffer, usb_buffer, read);

            if (usb_index > read)
            {
                memmove(usb_buffer, &usb_buffer[read], usb_index - read);
            }

            usb_index -= read;

            return true;
        }
    }

    return false;
}

void usb_serial_connect(void) {
    usb_connected = true;
}

size_t usb_serial_write_in(const char *buffer)
{
    size_t len = strlen(buffer);

    if (len > BUFFER_SIZE)
    {
        len = BUFFER_SIZE;
    }

    for (size_t i = 0; i < len; i++)
    {
        if ((usb_index > 0) && (buffer[i] == '\b'))
        {
            usb_buffer[--usb_index] = '\0';
        }
        else if (usb_index < BUFFER_SIZE)
        {
            usb_buffer[usb_index++] = buffer[i];
        }

        usb_serial_write(&buffer[i], 1); //echo char
    }

    usb_buffer[usb_index] = 0;

    return len;
}
