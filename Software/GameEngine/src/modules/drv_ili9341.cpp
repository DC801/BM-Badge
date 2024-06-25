#ifdef DC801_EMBEDDED

#include "drv_ili9341.h"
#include "utility.h"
#include <algorithm>
#include <array>

#include <nrf_pwr_mgmt.h>

//size of chunk to transfer each interrupt
static const inline size_t ILI_TRANSFER_CHUNK_SIZE = 254;

// Register defines
#define ILI9341_COL_ADDRESS_SET  0x2A
#define ILI9341_ROW_ADDRESS_SET  0x2B
#define ILI9341_RAMWR            0x2C

#define COMMAND(c)

#define SPIM_CONCAT(p1, p2)      p1 ## p2
#define SPIM(INSTANCE) SPIM_CONCAT(NRF_SPIM, INSTANCE)

static nrfx_spim_t lcd_spim = NRFX_SPIM_INSTANCE(LCD_SPIM_INSTANCE);

static volatile bool m_busy{ false };
static bool m_large_tx = false;
static size_t m_large_tx_size{0};
static uint8_t* p_large_tx_data{nullptr};

/**
 * Handler for unblocked SPI transfers that assumes the transfer is complete
 */
static void __spim_event_handler(nrfx_spim_evt_t const* p_event, void* _)
{
    // m_busy = false;
    //If we're in the middle of a large transfer, setup the next chunk
    //If not a large transfer, unset the flag
    if (!m_large_tx || m_large_tx_size <= 0)
    {
        m_busy = false;
    }
    else
    {
        auto count = std::min<size_t>(m_large_tx_size, ILI_TRANSFER_CHUNK_SIZE);
        nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_large_tx_data, count);
        nrfx_spim_xfer(&lcd_spim, &xfer_desc, NRFX_SPIM_FLAG_TX_POSTINC);

        m_large_tx_size -= count;
    }
}

/**
 * Internal method to write a single byte command. Note: Low-level SPIM required to
 * avoid a bug in the Nordic SPI implementation that cannot send a single byte
 */
static void inline __writeCommand(uint8_t command)
{
    nrf_spim_tx_buffer_set(SPIM(LCD_SPIM_INSTANCE), &command, 1);
    nrf_spim_rx_buffer_set(SPIM(LCD_SPIM_INSTANCE), nullptr, 0);

    while (m_busy)
    {
        APP_ERROR_CHECK(sd_app_evt_wait());
    }
    nrf_delay_us(10);

    nrf_gpio_pin_clear(ILI9341_PIN_DC);
    nrf_spim_task_trigger(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_TASK_START);
    while (!nrf_spim_event_check(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX))
    {
    }
    nrf_spim_event_clear(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX);

    nrf_gpio_pin_set(ILI9341_PIN_DC);
    nrf_delay_us(20);
}

/**
 * Internal method to write a byte of data to the bus. Note: Low-level SPIM required to
 * avoid a bug in the Nordic SPI implementation that cannot send a single byte
 */
static void inline __writeData(uint8_t data)
{
    nrf_spim_tx_buffer_set(SPIM(LCD_SPIM_INSTANCE), &data, 1);
    nrf_spim_rx_buffer_set(SPIM(LCD_SPIM_INSTANCE), nullptr, 0);

    while (m_busy)
    {
        APP_ERROR_CHECK(sd_app_evt_wait());
    }

    nrf_spim_task_trigger(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_TASK_START);
    while (!nrf_spim_event_check(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX))
    {
    }
    nrf_spim_event_clear(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX);
}

/**
 * Write 16-bit data to the bus
 */
static inline void __writeData16(uint16_t data)
{
    //data = SWAP(data);
    //	nrf_spim_tx_buffer_set(LCD_SPIM, (uint8_t *) &data,S 2);
    //	nrf_spim_rx_buffer_set(LCD_SPIM, nullptr, 0);

    while (m_busy)
    {
        APP_ERROR_CHECK(sd_app_evt_wait());
    }

    nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(&data, 2);
    nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);

    //	nrf_spim_task_trigger(LCD_SPIM, NRF_SPIM_TASK_START);
    //	while (!nrf_spim_event_check(LCD_SPIM, NRF_SPIM_EVENT_ENDTX)) {
    //	}
    //	nrf_spim_event_clear(LCD_SPIM, NRF_SPIM_EVENT_ENDTX);
}

/**
 * Move XY quickly, skip a few bytes
 * "(3)Terminate commands and data-reads early (e.g. a command to set a screen
 * subregion can be terminated after setting only the lower limit, leaving the
 * upper limit as-is; Reading color data can be terminated after retrieving only
 * the first byte) "
 * Ref: http://crawlingrobotfortress.blogspot.com/2015/12/better-3d-graphics-engine-on-arduino.html
 */
inline void __set_XY_fast(uint16_t x, uint16_t y)
{
    // Adjust screen offset in case GRAM does not match actual screen resolution
    x += LCD_X_OFFSET;
    y += LCD_Y_OFFSET;

    __writeCommand(ILI9341_COL_ADDRESS_SET); // Column addr set
    __writeData16(x);

    __writeCommand(ILI9341_ROW_ADDRESS_SET); // Row addr set
    __writeData16(y);

    __writeCommand(ILI9341_RAMWR); // write to RAM
}

/**
 * Fill an area on the screen with a single color
 */
void ili9341_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color)
{
    size_t bytecount = w * h * 2;
    
    // rudimentary clipping
    if ((x >= LCD_WIDTH) || (y >= LCD_HEIGHT))
        return;
    if (x + w >= LCD_WIDTH)
        w = LCD_WIDTH - x;
    if (y + h >= LCD_HEIGHT)
        h = LCD_HEIGHT - y;

    ili9341_set_addr(x, y, x + w - 1, y + h - 1);

    while (bytecount > 0)
    {
        ili9341_push_colors((uint8_t*)color, std::min(ILI_TRANSFER_CHUNK_SIZE, bytecount));
        bytecount -= ILI_TRANSFER_CHUNK_SIZE;
    }
}

/**
 * Initialize the display
 */
void ili9341_init()
{
    uint32_t err_code;

    //Init SPI0 for the LCD
    auto spi_config = nrfx_spim_config_t{
        .sck_pin = ILI9341_SCK_PIN,
        .mosi_pin = ILI9341_MOSI_PIN,
        .miso_pin = NRFX_SPIM_PIN_NOT_USED,
        .ss_pin = ILI9341_PIN_CS,
        .ss_active_high = false,
        .irq_priority = NRFX_SPIM_DEFAULT_CONFIG_IRQ_PRIORITY,
        .orc = 0x00,
        .frequency = NRF_SPIM_FREQ_32M,
        .mode = NRF_SPIM_MODE_0,
        .bit_order = NRF_SPIM_BIT_ORDER_MSB_FIRST,
        .dcx_pin = ILI9341_PIN_DC,
        .rx_delay = 2,
        .use_hw_ss = true,
        .ss_duration = 2
    };

    APP_ERROR_CHECK(nrfx_spim_init(&lcd_spim, &spi_config, __spim_event_handler, nullptr));

    nrf_gpio_cfg_output(ILI9341_PIN_DC);
    nrf_gpio_cfg_output(ILI9341_PIN_RESET);
    nrf_gpio_cfg_output(ILI9341_PIN_LED);

    //Keep CS pin low for all time, saves time later.
    nrf_gpio_pin_clear(ILI9341_PIN_CS);

    debug_print("Initialized ili9341");
}

/**
 * Push many colors to the display
 */
void ili9341_push_colors(uint8_t* p_colors, size_t size)
{
    while (size > 0)
    {
        auto count = std::min(ILI_TRANSFER_CHUNK_SIZE, size);

        //Don't start next transfer until previous is complete
        while (m_busy)
        {
            //wait for previous transfer to complete before starting a new one
            __WFE();
        }
        m_busy = true;

        auto xfer_desc = nrfx_spim_xfer_desc_t{ p_colors, count };
        nrfx_spim_xfer(&lcd_spim, &xfer_desc, NRFX_SPIM_FLAG_TX_POSTINC);
        size -= count;
    }
}

/**
 * Push many colors to the display very fast
 */
nrfx_err_t ili9341_push_colors_fast(uint8_t* p_colors, size_t size)
{
    //Don't start next transfer until previous is complete
    while (m_busy)
    {
        //wait for previous transfer to complete before starting a new one
        __WFE();
    }

    m_busy = true;
    if (size > ILI_TRANSFER_CHUNK_SIZE)
    {
        m_large_tx = true;
        p_large_tx_data = p_colors;
        m_large_tx_size = size;
        size = std::min(ILI_TRANSFER_CHUNK_SIZE, size);
    }

    nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_colors, size);
    return nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);
    //Function will return even while transfer is occuring
}

/**
 * Set offset window to specific values. This could be more efficient
 * "(3)Terminate commands and data-reads early (e.g. a command to set a screen
 * subregion can be terminated after setting only the lower limit, leaving the
 * upper limit as-is; Reading color data can be terminated after retrieving only
 * the first byte) "
 * Ref: http://crawlingrobotfortress.blogspot.com/2015/12/better-3d-graphics-engine-on-arduino.html
 */
void ili9341_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1)
{
    __writeCommand(ILI9341_COL_ADDRESS_SET); // Column addr set
    __writeData16(x0 + LCD_X_OFFSET); // XSTART
    __writeData16(x1 + LCD_X_OFFSET); // XEND

    __writeCommand(ILI9341_ROW_ADDRESS_SET); // Row addr set
    __writeData16(y0 + LCD_Y_OFFSET); // YSTART
    __writeData16(y1 + LCD_Y_OFFSET); // YEND

    __writeCommand(ILI9341_RAMWR); // write to RAM
}

/**
 * Start the display driver
 */
void ili9341_start()
{
    nrf_gpio_pin_clear(ILI9341_PIN_LED);

    //Reset the display
    nrf_gpio_pin_set(ILI9341_PIN_RESET);
    nrf_delay_ms(100);
    nrf_gpio_pin_clear(ILI9341_PIN_RESET);
    nrf_delay_ms(100);
    nrf_gpio_pin_set(ILI9341_PIN_RESET);
    nrf_delay_ms(100);

    nrf_spim_event_clear(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_END);
    nrf_spim_event_clear(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX);

    CRITICAL_REGION_ENTER();
    __writeCommand(0x11); //Sleep OUT:
    nrf_delay_ms(120);

    __writeCommand(0xCF); //Power Control B:
    __writeData(0x00);
    __writeData(0xc1);
    __writeData(0X30);

    __writeCommand(0xED); //Power On Sequence Control
    __writeData(0x64);
    __writeData(0x03);
    __writeData(0X12);
    __writeData(0X81);

    __writeCommand(0xE8); //Driver Timing Control A
    __writeData(0x85);
    __writeData(0x00);
    __writeData(0x78);

    __writeCommand(0xCB); //Power Control A
    __writeData(0x39);
    __writeData(0x2C);
    __writeData(0x00);
    __writeData(0x34);
    __writeData(0x02);

    __writeCommand(0xF7); //Pump Ratio Control
    __writeData(0x20);

    __writeCommand(0xEA); //Driver Timing Control B
    __writeData(0x00);
    __writeData(0x00);

    __writeCommand(0xC0);    //Power control
    __writeData(0x23);   //VRH[5:0]

    __writeCommand(0xC1);    //Power control
    __writeData(0x10);   //SAP[2:0];BT[3:0]

    __writeCommand(0xC5);    //VCM control
    __writeData(0x3e);
    //LCD_DataWrite_ILI9341(0x30);
    __writeData(0x28);

    __writeCommand(0xC7);    //VCM control2
    //LCD_DataWrite_ILI9341(0xBD);
    __writeData(0x86); //0xB0

    __writeCommand(0x36); // Memory Access Control (rotation)
    __writeData(0x28);

    __writeCommand(0x3A); // COLMOD (Pixel Format Set)
    __writeData(0x55); // 101 = 16 bits per pixel for both RGB and MCU

    __writeCommand(0xB1); //Frame Rate Control
    __writeData(0x00); // DIVA = 0: division ratio for processor
    __writeData(0x18); // RTNA[4:0] sets the line period of normal mode for the MCU, 0x18 = 11000b = 24 clocks

    __writeCommand(0xB6); // Display Function Control
    __writeData(0x08);
    __writeData(0x82);
    __writeData(0x27);

    __writeCommand(0xF6); // Interface control
    __writeData(0x00); // WE reset column and page after a full page disabled
    __writeData(0x30); // EPF = 11, last bit of green (our alpha bit) is conditionally copied to red or blue
    __writeData(0x20); // little endian, internal clock operation 

    __writeCommand(0xF2);    // 3Gamma Function Disable
    __writeData(0x00);

    __writeCommand(0x26);    //Gamma curve selected
    __writeData(0x01);

    __writeCommand(0xE0);    //Set Gamma
    std::array<uint8_t, 15> gamma = { 0x0F, 0x3F, 0x2F, 0x0C, 0x10, 0x0A, 0x53, 0XD5, 0x40, 0x0A, 0x13, 0x03, 0x08, 0x03, 0x00 };
    auto xfer_desc = nrfx_spim_xfer_desc_t{ gamma.data(), gamma.size() };
    nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);
    
    __writeCommand(0XE1);    //Set Gamma
    gamma = { 0x00, 0x00, 0x10, 0x03, 0x0F, 0x05, 0x2C, 0xA2, 0x3F, 0x05, 0x0E, 0x0C, 0x37, 0x3C, 0x0F };
    xfer_desc = nrfx_spim_xfer_desc_t{ gamma.data(), gamma.size() };
    nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);

    __writeCommand(0x11);    //Exit Sleep
    nrf_delay_ms(120);

    __writeCommand(0x29);    //Display on
    nrf_delay_ms(50);


    CRITICAL_REGION_EXIT();

}

#endif // DC801_EMBEDDED
