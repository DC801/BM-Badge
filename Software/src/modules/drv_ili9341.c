// System headers
#ifdef DC801_EMBEDDED

#include "common.h"
#include "drv_ili9341.h"

// Register defines
#define ILI9341_CASET    		(0x2A)
#define ILI9341_RASET    		(0x2B)
#define ILI9341_RAMWR    		(0x2C)

#define SWAP(c) (((c>>8)&0xFF)|(c&0xFF)<<8)

#define COMMAND(c)

#define SPIM_CONCAT(p1, p2)      p1 ## p2
#define SPIM(INSTANCE) SPIM_CONCAT(NRF_SPIM, INSTANCE)

static nrfx_spim_t lcd_spim = NRFX_SPIM_INSTANCE(LCD_SPIM_INSTANCE);
static volatile bool m_busy = false;

static bool m_large_tx = false;
static uint16_t m_large_tx_size = 0;
static uint8_t *p_large_tx_data = NULL;

/**
 * Handler for unblocked SPI transfers that assumes the transfer is complete
 */
static void __spim_event_handler(nrfx_spim_evt_t const * p_event, void * context) {
	//If we're in the middle of a large transfer, setup the next chunk
	if (m_large_tx) {
		if (m_large_tx_size == 0) {
			m_busy = false;
			return;
		}

		uint8_t rx = 0;
		uint8_t count = MIN(254, m_large_tx_size);
		nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_large_tx_data, count);
		nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);

		p_large_tx_data += count;	//advance the pointer
		m_large_tx_size -= count;
	}

	//If not a large transfer, unset the flag
	else {
		m_busy = false;
	}
}


/**
 * Internal method to write a single byte command. Note: Low-level SPIM required to
 * avoid a bug in the Nordic SPI implementation that cannot send a single byte
 */
static void inline __writeCommand(uint8_t command) {
	nrf_spim_tx_buffer_set(SPIM(LCD_SPIM_INSTANCE), &command, 1);
	nrf_spim_rx_buffer_set(SPIM(LCD_SPIM_INSTANCE), NULL, 0);

	while (ili9341_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
	nrf_delay_us(10);

	nrf_gpio_pin_clear(ILI9341_PIN_DC);
	nrf_spim_task_trigger(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_TASK_START);
	while (!nrf_spim_event_check(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX)) {
	}
	nrf_spim_event_clear(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX);

	nrf_gpio_pin_set(ILI9341_PIN_DC);
	nrf_delay_us(20);
}

/**
 * Internal method to write a byte of data to the bus. Note: Low-level SPIM required to
 * avoid a bug in the Nordic SPI implementation that cannot send a single byte
 */
static void inline __writeData(uint8_t data) {
	nrf_spim_tx_buffer_set(SPIM(LCD_SPIM_INSTANCE), &data, 1);
	nrf_spim_rx_buffer_set(SPIM(LCD_SPIM_INSTANCE), NULL, 0);

	while (ili9341_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}

	nrf_spim_task_trigger(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_TASK_START);
	while (!nrf_spim_event_check(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX)) {
	}
	nrf_spim_event_clear(SPIM(LCD_SPIM_INSTANCE), NRF_SPIM_EVENT_ENDTX);
}

/**
 * Write 16-bit data to the bus
 */
static inline void __writeData16(uint16_t data) {
	data = SWAP(data);
//	nrf_spim_tx_buffer_set(LCD_SPIM, (uint8_t *) &data, 2);
//	nrf_spim_rx_buffer_set(LCD_SPIM, NULL, 0);

	while (ili9341_is_busy()) {
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
static inline void __set_XY_fast(uint16_t x, uint16_t y) {
	// Adjust screen offset in case GRAM does not match actual screen resolution
	x += LCD_X_OFFSET;
	y += LCD_Y_OFFSET;

	__writeCommand(ILI9341_CASET); // Column addr set
	__writeData16(x);

	__writeCommand(ILI9341_RASET); // Row addr set
	__writeData16(y);

	__writeCommand(ILI9341_RAMWR); // write to RAM
}

/**
 * Convert RGB color to 565
 */
uint16_t ili9341_color565(uint8_t r, uint8_t g, uint8_t b) {
	return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

/**
 * Draw a single pixel to the display
 */
void inline ili9341_draw_pixel(uint16_t x, uint16_t y, uint16_t color) {
	//Clip and adjust for display offsets
	if ((x < 0) || (x >= LCD_WIDTH) || (y < 0) || (y >= LCD_HEIGHT)) {
		return;
	}

	while(ili9341_is_busy());

	__set_XY_fast(x, y);
	__writeData16(color);

}

/**
 * Fill an area on the screen with a single color
 */
void ili9341_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
	int32_t bytecount = w * h * 2;
	uint8_t color_lsb[254];
	for (uint8_t i = 0; i < 254; i += 2) {
		color_lsb[i] = (uint8_t) (color >> 8);
		color_lsb[i + 1] = (uint8_t) (color & 0xFF);
	}

	// rudimentary clipping
	if ((x >= LCD_WIDTH) || (y >= LCD_HEIGHT))
		return;
	if ((x + w - 1) >= LCD_WIDTH)
		w = LCD_WIDTH - x;
	if ((y + h - 1) >= LCD_HEIGHT)
		h = LCD_HEIGHT - y;

    ili9341_set_addr(x, y, x + w - 1, y + h - 1);

	while (bytecount > 0) {
        ili9341_push_colors((uint8_t *) color_lsb, MIN(254, bytecount));
		bytecount -= 254;
	}

	while (m_busy) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
}

/**
 * Initialize the display
 */
void ili9341_init() {
	uint32_t err_code;

	//Init SPI0 for the LCD
	nrfx_spim_config_t spi_config = NRFX_SPIM_DEFAULT_CONFIG;
	spi_config.sck_pin = ILI9341_SCK_PIN;
	spi_config.mosi_pin = ILI9341_MOSI_PIN;
	spi_config.miso_pin = NRFX_SPIM_PIN_NOT_USED;
	spi_config.ss_pin = ILI9341_PIN_CS;
	spi_config.irq_priority = NRFX_SPIM_DEFAULT_CONFIG_IRQ_PRIORITY;
	spi_config.frequency = NRF_SPIM_FREQ_32M;
	spi_config.orc = 0x00;
	spi_config.mode = NRF_SPIM_MODE_0;
	spi_config.bit_order = NRF_SPIM_BIT_ORDER_MSB_FIRST;
    spi_config.use_hw_ss      = true;
    spi_config.ss_active_high = false;

	APP_ERROR_CHECK(
			nrfx_spim_init(&lcd_spim, &spi_config, __spim_event_handler, NULL)
	);

	
	nrf_gpio_cfg_output(ILI9341_PIN_DC);
	nrf_gpio_cfg_output(ILI9341_PIN_RESET);
	nrf_gpio_cfg_output(ILI9341_PIN_LED);

	//Keep CS pin low for all time, saves time later.
	//nrf_gpio_pin_clear(ILI9341_PIN_CS);
}

/**
 * Simple check for if the bus is busy
 */
inline bool ili9341_is_busy() {
	return m_busy;
}

/**
 * Push a single color (pixel) to the display. This is not very efficient as the CS line is toggled.
 * If pushing more than one pixel highly recommend streaming the colors through a DMA transfer
 */
void inline ili9341_push_color(uint16_t color) {
	//color = SWAP(color);
	__writeData16(color);
}

/**
 * Push many colors to the display
 */
inline void ili9341_push_colors(uint8_t *p_colors, int32_t size) {

    uint8_t count = 0;

    while (size > 0) {
        count = MIN(254, size);

        //Don't start next transfer until previous is complete
        while (m_busy) {
            APP_ERROR_CHECK(sd_app_evt_wait());
        }
        m_busy = true;

        nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_colors, count);
        nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);

        p_colors += count;      //advance the pointer
        size -= count;
    }
    //Function will return even while transfer is occuring

}

/**
 * Push many colors to the display very fast
 */
nrfx_err_t inline ili9341_push_colors_fast(uint8_t *p_colors, int32_t size) {
	//uint8_t count = 0;

	//Don't start next transfer until previous is complete
	while (m_busy) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}

	m_busy = true;
	//count = MIN(254, size);

	nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_colors, size);
	return nrfx_spim_xfer(&lcd_spim, &xfer_desc, 0);

	/*m_large_tx = true;
	p_large_tx_data = p_colors + count;
	m_large_tx_size = size - count;*/

}

/**
 * Set address window to specific values. This could be more efficient
 * "(3)Terminate commands and data-reads early (e.g. a command to set a screen
 * subregion can be terminated after setting only the lower limit, leaving the
 * upper limit as-is; Reading color data can be terminated after retrieving only
 * the first byte) "
 * Ref: http://crawlingrobotfortress.blogspot.com/2015/12/better-3d-graphics-engine-on-arduino.html
 */
void ili9341_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1) {

	uint8_t rx;

	__writeCommand(ILI9341_CASET); // Column addr set
	__writeData16(x0 + LCD_X_OFFSET); // XSTART
	__writeData16(x1 + LCD_X_OFFSET); // XEND

	__writeCommand(ILI9341_RASET); // Row addr set
	__writeData16(y0 + LCD_Y_OFFSET); // YSTART
	__writeData16(y1 + LCD_Y_OFFSET); // YEND

	__writeCommand(ILI9341_RAMWR); // write to RAM
}

/**
 * Start the display driver
 */
void ili9341_start() {
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
        __writeCommand(0x11);
        nrf_delay_ms(120);

        __writeCommand(0xCF);
        __writeData(0x00);
        __writeData(0xc1);
        __writeData(0X30);

        __writeCommand(0xED);
        __writeData(0x64);
        __writeData(0x03);
        __writeData(0X12);
        __writeData(0X81);

        __writeCommand(0xE8);
        __writeData(0x85);
        __writeData(0x00);
        __writeData(0x78);

        __writeCommand(0xCB);
        __writeData(0x39);
        __writeData(0x2C);
        __writeData(0x00);
        __writeData(0x34);
        __writeData(0x02);

        __writeCommand(0xF7);
        __writeData(0x20);

        __writeCommand(0xEA);
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

        __writeCommand(0x36);    // Memory Access Control (rotation)
        __writeData(0x28);

        __writeCommand(0x3A);
        __writeData(0x55);

        __writeCommand(0xB1);
        __writeData(0x00);
        __writeData(0x18);

        __writeCommand(0xB6);    // Display Function Control
        __writeData(0x08);
        __writeData(0x82);
        __writeData(0x27);

        __writeCommand(0xF6);
        __writeData(0x01);
        __writeData(0x30);

        __writeCommand(0xF2);    // 3Gamma Function Disable
        __writeData(0x00);

        __writeCommand(0x26);    //Gamma curve selected
        __writeData(0x01);

       __writeCommand(0xE0);    //Set Gamma
        __writeData(0x0F);
        __writeData(0x3F);
        __writeData(0x2F);
        __writeData(0x0C);
        __writeData(0x10);
        __writeData(0x0A);
        __writeData(0x53);
        __writeData(0XD5);
        __writeData(0x40);
        __writeData(0x0A);
        __writeData(0x13);
        __writeData(0x03);
        __writeData(0x08);
        __writeData(0x03);
        __writeData(0x00);

        __writeCommand(0XE1);    //Set Gamma
        __writeData(0x00);
        __writeData(0x00);
        __writeData(0x10);
        __writeData(0x03);
        __writeData(0x0F);
        __writeData(0x05);
        __writeData(0x2C);
        __writeData(0xA2);
        __writeData(0x3F);
        __writeData(0x05);
        __writeData(0x0E);
        __writeData(0x0C);
        __writeData(0x37);
        __writeData(0x3C);
        __writeData(0x0F);

        __writeCommand(0x11);    //Exit Sleep
        nrf_delay_ms(120);
        __writeCommand(0x29);    //Display on
        nrf_delay_ms(50);


	CRITICAL_REGION_EXIT();

}

#endif
