#include <string.h>
#include "shim_err.h"
#include "shim_serial.h"
#include "EnginePanic.h"

#define BUFFER_SIZE 255

static char uart_buffer[BUFFER_SIZE + 1] = { 0 };
static uint32_t uart_index = 0;

static char usb_buffer[BUFFER_SIZE + 1] = { 0 };
static uint32_t usb_index = 0;

bool usb_connected = false;

#define COMMAND_BUFFER_SIZE 1024
#define COMMAND_RESPONSE_SIZE (COMMAND_BUFFER_SIZE + 128)

// always allow for a null termination byte
#define COMMAND_BUFFER_MAX_READ (COMMAND_BUFFER_SIZE - 1)

static void cdc_acm_user_ev_handler(
    app_usbd_class_inst_t const* p_inst,
    app_usbd_cdc_acm_user_event_t event
);

#define CDC_ACM_COMM_INTERFACE  0
#define CDC_ACM_COMM_EPIN       NRF_DRV_USBD_EPIN2

#define CDC_ACM_DATA_INTERFACE  1
#define CDC_ACM_DATA_EPIN       NRF_DRV_USBD_EPIN1
#define CDC_ACM_DATA_EPOUT      NRF_DRV_USBD_EPOUT1

bool was_serial_started = false;
static bool was_command_entered = false;

// do not change READ_SIZE, this is the size the NRF SDK
// example uses, and it works better than ours used to
#define READ_SIZE 1
#define ECHO_BUFFER_SIZE (COMMAND_BUFFER_MAX_READ + 1) // plus space for an extra null terminator
static char m_rx_buffer[READ_SIZE];
static char echo_buffer[ECHO_BUFFER_SIZE];
static uint16_t echo_buffer_length = 0;
static bool is_echo_buffer_populated = false;

char command_buffer[COMMAND_BUFFER_SIZE];
uint16_t command_buffer_length = 0;


/**
 * @brief CDC_ACM class instance
 * */
APP_USBD_CDC_ACM_GLOBAL_DEF(
    m_app_cdc_acm,
    cdc_acm_user_ev_handler,
    CDC_ACM_COMM_INTERFACE,
    CDC_ACM_DATA_INTERFACE,
    CDC_ACM_COMM_EPIN,
    CDC_ACM_DATA_EPIN,
    CDC_ACM_DATA_EPOUT,
    APP_USBD_CDC_COMM_PROTOCOL_AT_V250
);



static void handle_serial_character(char value)
{
    if (
        // handle newlines
        value == '\r'
        || value == '\n'
        )
    {
        was_command_entered = true;
    }
    else if (
        // handle delete
        value == '\b'
        || value == 127
        )
    {
        // prevents deleting past the allowed input start offset
        if (command_buffer_length > 0)
        {
            command_buffer_length--;
            command_buffer[(command_buffer_length + COMMAND_BUFFER_SIZE) % COMMAND_BUFFER_SIZE] = '\0';
            echo_buffer[(echo_buffer_length + ECHO_BUFFER_SIZE) % ECHO_BUFFER_SIZE] = 127;
            echo_buffer_length++; // we need to ADD delete characters to the echo_buffer
            echo_buffer[(echo_buffer_length + ECHO_BUFFER_SIZE) % ECHO_BUFFER_SIZE] = '\b';
            echo_buffer_length++;
            echo_buffer[(echo_buffer_length + ECHO_BUFFER_SIZE) % ECHO_BUFFER_SIZE] = command_buffer[command_buffer_length - 1];
            echo_buffer_length++;
            is_echo_buffer_populated = true;
        }
    }
    else if (
        // it's a renderable character
        value >= 32
        && command_buffer_length < COMMAND_BUFFER_MAX_READ // don't allow input larger than the buffer
        )
    {
        command_buffer[command_buffer_length % COMMAND_BUFFER_SIZE] = value;
        echo_buffer[echo_buffer_length % ECHO_BUFFER_SIZE] = value;
        command_buffer_length++;
        echo_buffer_length++;
        command_buffer[command_buffer_length % COMMAND_BUFFER_SIZE] = '\0';
        echo_buffer[echo_buffer_length % ECHO_BUFFER_SIZE] = '\0';
        is_echo_buffer_populated = true;
    }
}


void send_serial_message_with_length(
    const char* message,
    size_t message_length
)
{
    // Turns out that calling `app_usbd_cdc_acm_write` with message_length
    // greater than NRF_DRV_USBD_EPSIZE/64 totally corrupts all output,
    // so we have to break it into NRF buffer size friendly chunks
    size_t page_size_max = NRF_DRV_USBD_EPSIZE;
    size_t pages = message_length / page_size_max;
    size_t remainder = message_length % page_size_max;
    if (remainder > 0)
    {
        pages++;
    }
    for (size_t i = 0; i < pages; i++)
    {
        size_t offset = i * page_size_max;
        size_t page_size = (message_length - offset) > page_size_max
            ? page_size_max
            : remainder;
        // This may seem super wacky, but unless I call either `debug_print`
        // OR `nrf_delay_ms` between calls to `app_usbd_cdc_acm_write`,
        // we get an engine panic. Guess it takes a tick to write that buffer
        /*
        debug_print(
            "send_serial_message_with_length: offset %d | page_size %d\n",
            offset,
            page_size
        );
        */
        nrf_delay_ms(1);
        ret_code_t ret = app_usbd_cdc_acm_write(
            &m_app_cdc_acm,
            message + offset,
            page_size
        );
        if (ret != NRF_SUCCESS)
        {
            ENGINE_PANIC(
                "FAILED TO WRITE SERIAL TO USB"
            );
        }
    }
}

void send_serial_message(
    const char* message
)
{
    size_t message_length = strlen(message);
    send_serial_message_with_length(message, message_length);
}

void handle_usb_serial_input()
{
    while (app_usbd_event_queue_process())
    {
        // handle ALL of the events until there are no more events
    }
    if (is_echo_buffer_populated)
    {
        // Why use this instead of send_serial_message?
        // because if you're doing weird ASCII control code shit,
        // detecting length with strlen() don't work out so good.
        // We already know the buffer length from handling chars.
        // Just use that explicitly.
        send_serial_message_with_length(
            echo_buffer,
            echo_buffer_length
        );
        memset(
            echo_buffer,
            0,
            ECHO_BUFFER_SIZE
        );
        echo_buffer_length = 0;
        is_echo_buffer_populated = false;
    }
}

/**
 * @brief User event handler @ref app_usbd_cdc_acm_user_ev_handler_t (headphones)
 * */
static void cdc_acm_user_ev_handler(
    app_usbd_class_inst_t const* p_inst,
    app_usbd_cdc_acm_user_event_t event
)
{
    app_usbd_cdc_acm_t const* p_cdc_acm = app_usbd_cdc_acm_class_get(p_inst);

    switch (event)
    {
    case APP_USBD_CDC_ACM_USER_EVT_PORT_OPEN:
    {
        //bsp_board_led_on(LED_CDC_ACM_OPEN);
        //ledOn(LED_BIT1);

        /*Setup first transfer*/
        ret_code_t ret = app_usbd_cdc_acm_read(
            &m_app_cdc_acm,
            m_rx_buffer,
            READ_SIZE
        );
        UNUSED_VARIABLE(ret);
        was_serial_started = true;
        break;
    }
    case APP_USBD_CDC_ACM_USER_EVT_PORT_CLOSE:
        //bsp_board_led_off(LED_CDC_ACM_OPEN);
        //ledOff(LED_BIT1);
        break;
    case APP_USBD_CDC_ACM_USER_EVT_TX_DONE:
        // bsp_board_led_invert(LED_CDC_ACM_TX);
        //ledInvert(LED_BIT64);
        break;
    case APP_USBD_CDC_ACM_USER_EVT_RX_DONE:
    {
        ret_code_t ret;
        debug_print("Bytes waiting: %d", app_usbd_cdc_acm_bytes_stored(p_cdc_acm));
        do
        {
            /*Get amount of data transfered*/
            size_t size = app_usbd_cdc_acm_rx_size(p_cdc_acm);
            char value = m_rx_buffer[0];
            /*
            debug_print(
                "RX: size: %lu char: %c code: %d",
                size,
                value,
                value
            );
            */
            handle_serial_character(value);
            /* Fetch data until internal buffer is empty */
            ret = app_usbd_cdc_acm_read(
                &m_app_cdc_acm,
                m_rx_buffer,
                READ_SIZE
            );
        } while (ret == NRF_SUCCESS);

        //bsp_board_led_invert(LED_CDC_ACM_RX);
        //ledInvert(LED_BIT128);
        break;
    }
    default:
        break;
    }
    if (was_command_entered)
    {
        send_serial_message("\r\n");
    }
}

static void usbd_user_ev_handler(app_usbd_event_type_t event)
{
    switch (event)
    {
    case APP_USBD_EVT_DRV_SUSPEND:
        //bsp_board_led_off(LED_USB_RESUME);
        //ledOff(LED_BIT2);
        break;
    case APP_USBD_EVT_DRV_RESUME:
        //bsp_board_led_on(LED_USB_RESUME);
        //ledOn(LED_BIT2);
        break;
    case APP_USBD_EVT_STARTED:
        //ledOn(LED_BIT4);
        break;
    case APP_USBD_EVT_STOPPED:
        app_usbd_disable();
        //bsp_board_leds_off();
        //ledsOff();
        break;
    case APP_USBD_EVT_POWER_DETECTED:
        debug_print("USB power detected");

        if (!nrf_drv_usbd_is_enabled())
        {
            app_usbd_enable();
        }
        break;
    case APP_USBD_EVT_POWER_REMOVED:
        debug_print("USB power removed");
        app_usbd_stop();
        break;
    case APP_USBD_EVT_POWER_READY:
        debug_print("USB ready");
        app_usbd_start();
        break;
    default:
        break;
    }
}


void uart_init()
{
    memset(uart_buffer, 0, BUFFER_SIZE + 1);
    uart_index = 0;
}

uint32_t app_uart_put(uint8_t byte)
{
    UNUSED_PARAMETER(byte);

    return NRF_SUCCESS;
}

void usb_serial_init() {
    memset(usb_buffer, 0, BUFFER_SIZE + 1);
    usb_index = 0;
    usb_connected = false;

#ifdef DC801_EMBEDDED
    ret_code_t ret;
    static const app_usbd_config_t usbd_config = {
        .ev_state_proc = usbd_user_ev_handler
    };

    app_usbd_serial_num_generate();

    ret = app_usbd_init(&usbd_config);
    APP_ERROR_CHECK(ret);

    app_usbd_class_inst_t const* class_cdc_acm = app_usbd_cdc_acm_class_inst_get(&m_app_cdc_acm);
    ret = app_usbd_class_append(class_cdc_acm);
    APP_ERROR_CHECK(ret);

    if (USBD_POWER_DETECTION)
    {
        ret = app_usbd_power_events_enable();
        APP_ERROR_CHECK(ret);
    }
    else
    {
        debug_print("No USB power detection enabled\r\nStarting USB now");
        app_usbd_enable();
        app_usbd_start();
    }
#endif //DC801_EMBEDDED
}

bool usb_serial_is_connected() {
    return usb_connected;
}

bool usb_serial_write(const char* data, uint32_t len) {
    UNUSED_PARAMETER(data);
    UNUSED_PARAMETER(len);

    return true;
}

bool usb_serial_read_line(char* input_buffer, uint32_t max_len) {
    for (uint32_t i = 0; i < usb_index; ++i)
    {
        if ((usb_buffer[i] == '\n') || (usb_buffer[i] == '\r'))
        {
            usb_buffer[i++]='\0';

            while((i < usb_index) && ((usb_buffer[i] == '\n') || (usb_buffer[i] == '\r')))
            {
                usb_buffer[i++] = '\0';
            }

            uint32_t read =  std::min(i, max_len);

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

void usb_serial_connect() {
    usb_connected = true;
}

uint32_t usb_serial_write_in(const char *buffer)
{
    uint32_t len = strlen(buffer);

    if (len > BUFFER_SIZE)
    {
        len = BUFFER_SIZE;
    }

    for (uint32_t i = 0; i < len; i++)
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

