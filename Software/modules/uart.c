//
// Created by hamster on 8/2/18.
//

#ifdef DC801_EMBEDDED

#include <mdk/nrf52840_bitfields.h>
#include <hal/nrf_uart.h>
#include "common.h"
#include "uart.h"

#define UART_TX_BUF_SIZE                512                                         /**< UART TX buffer size. */
#define UART_RX_BUF_SIZE                128                                         /**< UART RX buffer size. */


/**@brief   Function for handling app_uart events.
 *
 * @details This function will receive a single character from the app_uart module and append it to
 *          a string. The string will be be sent over BLE when the last character received was a
 *          'new line' '\n' (hex 0x0A) or if the string has reached the maximum data length.
 */
/**@snippet [Handling the data received over UART] */
void uart_event_handle(app_uart_evt_t *p_event) {
    static uint8_t data_array[64];
    static uint8_t index = 0;
    uint32_t
    err_code;

    switch (p_event->evt_type) {
        case APP_UART_DATA_READY:
            UNUSED_VARIABLE(app_uart_get(&data_array[index]));

            data_array[index] = toupper(data_array[index]);

            if ((data_array[index] == '\n') || (data_array[index] == '\r') || (index >= (64))) {
                data_array[index + 1] = '\0';
                serial_GotString((char *) data_array, index + 1);
                index = 0;
                memset(data_array, 0, 64);
            }
            else{
                app_uart_put(data_array[index]);
                index++;
            }
            break;

        default:
            //printf("Evt: %d\n", p_event->evt_type);
            break;
    }
}


/**
 * Initialize the UART
 */
void uart_init(void) {
    uint32_t err_code;

    app_uart_comm_params_t const comm_params =
            {
                    .rx_pin_no    = RX_PIN_NUMBER,
                    .tx_pin_no    = TX_PIN_NUMBER,
                    .rts_pin_no   = RTS_PIN_NUMBER,
                    .cts_pin_no   = CTS_PIN_NUMBER,
                    .flow_control = APP_UART_FLOW_CONTROL_DISABLED,
                    .use_parity   = false,
                    .baud_rate    = NRF_UART_BAUDRATE_115200
            };

    APP_UART_FIFO_INIT(&comm_params,
                       UART_RX_BUF_SIZE,
                       UART_TX_BUF_SIZE,
                       uart_event_handle,
                       APP_IRQ_PRIORITY_LOWEST,
                       err_code);

    APP_ERROR_CHECK(err_code);
}

#endif
