#include "EnginePanic.h"
#include "usb.h"
#include "common.h"

// Note to self: No part of this file should be ifdef'd in or out
// to make the Desktop build possible - the whole thing should
// just not be included, because we'll need a completely different
// implementation for Desktop. Instead, this file's "handler"
// functions should call "Command handling" methods defined in
// "mage_text_commands.cpp", and the desktop interface will call
// those same methods as well, but only when "enter" is pressed.

#include "nrf_drv_usbd.h"
#include "nrf_drv_clock.h"
#include "nrf_drv_power.h"

#include "app_util.h"
#include "app_usbd_core.h"
#include "app_usbd.h"
#include "app_usbd_string_desc.h"
#include "app_usbd_cdc_acm.h"
#include "app_usbd_serial_num.h"

/**@file
 * @defgroup usbd_cdc_acm_example main.c
 * @{
 * @ingroup usbd_cdc_acm_example
 * @brief USBD CDC ACM example
 *
 */

/**
 * @brief Enable power USB detection
 *
 * Configure if example supports USB port connection
 */
#ifndef USBD_POWER_DETECTION
#define USBD_POWER_DETECTION false
#endif

static void cdc_acm_user_ev_handler(
	app_usbd_class_inst_t const * p_inst,
	app_usbd_cdc_acm_user_event_t event
);

#define CDC_ACM_COMM_INTERFACE  0
#define CDC_ACM_COMM_EPIN       NRF_DRV_USBD_EPIN2

#define CDC_ACM_DATA_INTERFACE  1
#define CDC_ACM_DATA_EPIN       NRF_DRV_USBD_EPIN1
#define CDC_ACM_DATA_EPOUT      NRF_DRV_USBD_EPOUT1


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

// do not change READ_SIZE, this is the size the NRF SDK
// example uses, and it works better than ours used to
#define READ_SIZE 1
#define ECHO_BUFFER_SIZE (COMMAND_BUFFER_MAX_READ + 1) // plus space for an extra null terminator
static char m_rx_buffer[READ_SIZE];
static char echo_buffer[ECHO_BUFFER_SIZE];
uint16_t echo_buffer_length = 0;
bool is_echo_buffer_populated = false;

bool is_serial_connected = false;

static void handle_serial_character(char value) {
	if (
		// handle newlines
		value == '\r'
		|| value == '\n'
	) {
		was_command_entered = true;
	} else if (
		// handle delete
		value == '\b'
		|| value == 127
	) {
		// prevents deleting past the allowed input start offset
		if (command_buffer_length > 0) {
			command_buffer_length--;
			command_buffer[(command_buffer_length + COMMAND_BUFFER_SIZE) % COMMAND_BUFFER_SIZE] = '\0';

			// move the cursor back
			echo_buffer[(echo_buffer_length + ECHO_BUFFER_SIZE) % ECHO_BUFFER_SIZE] = '\b';
			echo_buffer_length++;

			// replace the value where the cursor is with a space
			echo_buffer[(echo_buffer_length + ECHO_BUFFER_SIZE) % ECHO_BUFFER_SIZE] = ' ';
			echo_buffer_length++;

			// move the cursor back again
			echo_buffer[(echo_buffer_length + ECHO_BUFFER_SIZE) % ECHO_BUFFER_SIZE] = '\b';
			echo_buffer_length++;

			is_echo_buffer_populated = true;
		}
	} else if (
		// it's a renderable character
		value >= 32
		&& command_buffer_length < COMMAND_BUFFER_MAX_READ // don't allow input larger than the buffer
	) {
		command_buffer[command_buffer_length % COMMAND_BUFFER_SIZE] = value;
		echo_buffer[echo_buffer_length % ECHO_BUFFER_SIZE] = value;
		command_buffer_length++;
		echo_buffer_length++;
		command_buffer[command_buffer_length % COMMAND_BUFFER_SIZE] = '\0';
		echo_buffer[echo_buffer_length % ECHO_BUFFER_SIZE] = '\0';
		is_echo_buffer_populated = true;
	}
}

/**
 * @brief User event handler @ref app_usbd_cdc_acm_user_ev_handler_t (headphones)
 * */
static void cdc_acm_user_ev_handler(
	app_usbd_class_inst_t const * p_inst,
	app_usbd_cdc_acm_user_event_t event
) {
	app_usbd_cdc_acm_t const * p_cdc_acm = app_usbd_cdc_acm_class_get(p_inst);

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
			is_serial_connected = true;
			break;
		}
		case APP_USBD_CDC_ACM_USER_EVT_PORT_CLOSE:
			//bsp_board_led_off(LED_CDC_ACM_OPEN);
			//ledOff(LED_BIT1);
			is_serial_connected = false;
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
	if (was_command_entered) {
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

void usb_serial_init()
{
	ret_code_t ret;
	static const app_usbd_config_t usbd_config = {
		.ev_state_proc = usbd_user_ev_handler
	};

	app_usbd_serial_num_generate();

	ret = app_usbd_init(&usbd_config);
	APP_ERROR_CHECK(ret);
	debug_print("USBD CDC ACM example started.");

	app_usbd_class_inst_t const * class_cdc_acm = app_usbd_cdc_acm_class_inst_get(&m_app_cdc_acm);
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
}

void send_serial_message_with_length(
	const char *message,
	size_t message_length
) {
	if (!is_serial_connected) {
		// if you call `app_usbd_cdc_acm_write`
		// WHEN THE DEVICE IS NOT ACTUALLY CONNECTED, YOU'RE GONNA HAVE A BAD TIME.
		// So just don't.
		return;
	}
	// Turns out that calling `app_usbd_cdc_acm_write` with message_length
	// greater than NRF_DRV_USBD_EPSIZE/64 totally corrupts all output,
	// so we have to break it into NRF buffer size friendly chunks
	size_t page_size_max = NRF_DRV_USBD_EPSIZE;
	size_t pages = message_length / page_size_max;
	size_t remainder = message_length % page_size_max;
	if (remainder > 0) {
		pages++;
	}
	for (size_t i = 0; i < pages; i++) {
		size_t offset = i * page_size_max;
		size_t page_size = (message_length - offset) >= page_size_max
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
	const char *message
) {
	size_t message_length = strlen(message);
	send_serial_message_with_length(message, message_length);
}

void handle_usb_serial_input() {
	while(app_usbd_event_queue_process()) {
		// handle ALL of the events until there are no more events
	}
	if(is_echo_buffer_populated)
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
