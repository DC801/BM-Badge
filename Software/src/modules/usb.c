#ifdef DC801_EMBEDDED

#include "common.h"
#include "nrf_drv_usbd.h"
#include "nrf_drv_clock.h"
#include "nrf_drv_power.h"

#include "app_util.h"
#include "app_usbd_core.h"
#include "app_usbd.h"
#include "app_usbd_string_desc.h"
#include "app_usbd_cdc_acm.h"
#include "app_usbd_serial_num.h"

#define READ_SIZE 1024
bool tx_ready, peer_connected;
static char m_rx_buffer[READ_SIZE];
char rx_char;
size_t idx;

#ifndef USBD_POWER_DETECTION
#define USBD_POWER_DETECTION true
#endif


static void cdc_acm_user_ev_handler(app_usbd_class_inst_t const * p_inst, app_usbd_cdc_acm_user_event_t event);

#define CDC_ACM_COMM_INTERFACE  0
#define CDC_ACM_COMM_EPIN       NRF_DRV_USBD_EPIN2

#define CDC_ACM_DATA_INTERFACE  1
#define CDC_ACM_DATA_EPIN       NRF_DRV_USBD_EPIN1
#define CDC_ACM_DATA_EPOUT      NRF_DRV_USBD_EPOUT1


/**
 * @brief CDC_ACM class instance
 * */
APP_USBD_CDC_ACM_GLOBAL_DEF(m_app_cdc_acm, cdc_acm_user_ev_handler,
                            CDC_ACM_COMM_INTERFACE,
                            CDC_ACM_DATA_INTERFACE,
                            CDC_ACM_COMM_EPIN,
                            CDC_ACM_DATA_EPIN,
                            CDC_ACM_DATA_EPOUT,
                            APP_USBD_CDC_COMM_PROTOCOL_AT_V250
);




/**
 * @brief User event handler @ref app_usbd_cdc_acm_user_ev_handler_t (headphones)
 * */
static void cdc_acm_user_ev_handler(app_usbd_class_inst_t const * p_inst, app_usbd_cdc_acm_user_event_t event)
{
    app_usbd_cdc_acm_t const * p_cdc_acm = app_usbd_cdc_acm_class_get(p_inst);

    switch (event)
    {
        case APP_USBD_CDC_ACM_USER_EVT_PORT_OPEN:
        {
            peer_connected = true;
            NRF_LOG_INFO("USB Serial Port opened");
            /*Setup first transfer*/
            app_usbd_cdc_acm_read(&m_app_cdc_acm, &rx_char, 1);
            break;
        }
        case APP_USBD_CDC_ACM_USER_EVT_PORT_CLOSE:
            NRF_LOG_INFO("USB Serial Port closed");
            peer_connected = false;
            break;
        case APP_USBD_CDC_ACM_USER_EVT_TX_DONE:
            tx_ready = true;
            break;
        case APP_USBD_CDC_ACM_USER_EVT_RX_DONE:
        {
            ret_code_t ret;
            size_t a = app_usbd_cdc_acm_bytes_stored(p_cdc_acm);
            do
            {
                if ((idx>0) && (rx_char == '\b'))
                    m_rx_buffer[--idx]='\0';
                else if (idx<sizeof(m_rx_buffer))
                    m_rx_buffer[idx++] = rx_char;
                app_usbd_cdc_acm_write(&m_app_cdc_acm, &rx_char, 1); //echo char
                ret = app_usbd_cdc_acm_read(&m_app_cdc_acm, &rx_char, 1);
            } while (ret == NRF_SUCCESS);
            m_rx_buffer[idx]=0;
            
             break;
        }
        default:
            break;
    }
}

static void usbd_user_ev_handler(app_usbd_event_type_t event)
{
    switch (event)
    {
        case APP_USBD_EVT_DRV_SUSPEND:
            NRF_LOG_INFO("USB Serial device suspended");
            break;
        case APP_USBD_EVT_DRV_RESUME:
            NRF_LOG_INFO("USB Serial device resumed");
            break;
        case APP_USBD_EVT_STARTED:
            NRF_LOG_INFO("USB Serial device started");
            break;
        case APP_USBD_EVT_STOPPED:
            NRF_LOG_INFO("USB Serial device stopped");
            app_usbd_disable();
            break;
        case APP_USBD_EVT_POWER_DETECTED:
            NRF_LOG_INFO("USB power detected");

            if (!nrf_drv_usbd_is_enabled())
            {
                app_usbd_enable();
            }
            break;
        case APP_USBD_EVT_POWER_REMOVED:
            NRF_LOG_INFO("USB power removed");
            app_usbd_stop();
            break;
        case APP_USBD_EVT_POWER_READY:
            NRF_LOG_INFO("USB power ready");
            app_usbd_start();
            break;
        default:
            break;
    }
}

bool usb_serial_write(const char* data, size_t len) {
    while (!tx_ready)
        APP_ERROR_CHECK(sd_app_evt_wait());

    ret_code_t ret = app_usbd_cdc_acm_write(&m_app_cdc_acm, data, len);
    return ret == NRF_SUCCESS;
}

size_t usb_serial_read(char* data, size_t max_len) {
    if (idx == 0)
        return 0;

    size_t read = MIN(max_len, idx);
    memcpy(data, m_rx_buffer, read);
    if (idx>read)
        memmove(m_rx_buffer, &m_rx_buffer[read], idx-read);
    idx-=read;
    return read;
}

bool usb_serial_read_line(char* input_buffer, size_t max_len) {
    for (int i=0; i<idx; ++i) {
        if ((m_rx_buffer[i] == '\n') || (m_rx_buffer[i] == '\r')) {
            m_rx_buffer[i++]='\0';
            while((i<idx) && ((m_rx_buffer[i] == '\n') || (m_rx_buffer[i] == '\r')))
                m_rx_buffer[i++]='\0';
            size_t read =  MIN(i, max_len);
            memcpy(input_buffer, m_rx_buffer, read);
            if (idx>read)
                memmove(m_rx_buffer, &m_rx_buffer[read], idx-read);
            idx-=read;
            return true;
        }
    }
    return false;
}

size_t usb_serial_available() {
    return idx;
}

void usb_serial_init() {
    static const app_usbd_config_t usbd_config = {
        .ev_state_proc = usbd_user_ev_handler
    };
    
    NRF_LOG_INFO("USB Serial device init");
    app_usbd_serial_num_generate();
    APP_ERROR_CHECK(nrf_drv_clock_init());
    APP_ERROR_CHECK(app_usbd_init(&usbd_config));
    
    app_usbd_class_inst_t const * class_cdc_acm = app_usbd_cdc_acm_class_inst_get(&m_app_cdc_acm);
    APP_ERROR_CHECK(app_usbd_class_append(class_cdc_acm));
    nrf_drv_clock_lfclk_request(NULL);
    APP_ERROR_CHECK(app_usbd_power_events_enable());
    app_usbd_enable();
    app_usbd_start();
    tx_ready = true;
    peer_connected = false;
    idx = 0;
}

bool usb_serial_is_connected() {
    return peer_connected;
}


/** @} */

#endif