/*****************************************************************************
 * (C) Copyright 2017 AND!XOR LLC (http://andnxor.com/).
 *
 * PROPRIETARY AND CONFIDENTIAL UNTIL AUGUST 1ST, 2017 then,
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 * 	@andnxor
 * 	@zappbrandnxor
 * 	@hyr0n1
 * 	@andrewnriley
 * 	@lacosteaef
 * 	@bitstr3m
 *
 * 	Adapted for Nordic SDK15 by @hamster for use with the dc801 defcon 26 badge
 *****************************************************************************/

// System headers
#include <ctype.h>
#include <math.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>

#include "nordic_common.h"
#include "nrf52840_peripherals.h"
#include "nrf_gpio.h"
#include "nrf_spim.h"
#include "nrf_drv_spi.h"
#include "ff.h"
#include "nrf_block_dev_sdc.h"
#include "nrf_block_dev.h"
#include "diskio.h"
#include "diskio_blkdev.h"
#include "nrf_delay.h"
#include "nrf_soc.h"

#include "drv_st7735.h"

#define ST7735_SCK_PIN		5
#define ST7735_MOSI_PIN		14+32
#define ST7735_PIN_CS		13+32
#define ST7735_PIN_DC		15+32
#define ST7735_PIN_LED		12+32
#define ST7735_PIN_RESET	3

//----------------------------------------------------------------------------
// Defines for the ST7735 registers.
// ref: https://www.crystalfontz.com/products/document/3277/ST7735_V2.1_20100505.pdf
#define ST7735_SWRESET			(0x01)
#define ST7735_SLPOUT  			(0x11)
#define ST7735_NORON			(0x13)
#define ST7735_INVOFF			(0x20)
#define ST7735_INVON			(0x21)
#define ST7735_DISPOFF			(0x28)
#define ST7735_DISPON   		(0x29)
#define ST7735_CASET    		(0x2A)
#define ST7735_RASET    		(0x2B)
#define ST7735_RAMWR    		(0x2C)
#define ST7735_RAMRD    		(0x2E)
#define ST7735_PTLAR			(0x30)
#define ST7735_TEOFF			(0x34)
#define ST7735_TEON				(0x35)
#define ST7735_MADCTL   		(0x36)
#define ST7735_COLMOD   		(0x3A)
#define ST7735_FRMCTR1  		(0xB1)
#define ST7735_FRMCTR2  		(0xB2)
#define ST7735_FRMCTR3  		(0xB3)
#define ST7735_INVCTR   		(0xB4)
#define ST7735_DISSET5			(0xB6)
#define ST7735_PWCTR1   		(0xC0)
#define ST7735_PWCTR2   		(0xC1)
#define ST7735_PWCTR3  			(0xC2)
#define ST7735_PWCTR4  			(0xC3)
#define ST7735_PWCTR5		   	(0xC4)
#define ST7735_VMCTR1   		(0xC5)
#define ST7735_GAMCTRP1		 	(0xE0)
#define ST7735_GAMCTRN1 		(0xE1)

#define ST7735_NORMAL_MADCTL	(0xC8)
#define ST7735_INVERTED_MADCTL	(0x0C)

#define SWAP(c) (((c>>8)&0xFF)|(c&0xFF)<<8)

#define COMMAND(c)

//SPI 0 is for LCD
static nrfx_spim_t spim0 = NRFX_SPIM_INSTANCE(3);
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
		nrfx_spim_xfer(&spim0, &xfer_desc, 0);

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
	nrf_spim_tx_buffer_set(NRF_SPIM3, &command, 1);
	nrf_spim_rx_buffer_set(NRF_SPIM3, NULL, 0);

	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
	nrf_delay_us(10);

	nrf_gpio_pin_clear(ST7735_PIN_DC);
	nrf_spim_task_trigger(NRF_SPIM3, NRF_SPIM_TASK_START);
	while (!nrf_spim_event_check(NRF_SPIM3, NRF_SPIM_EVENT_ENDTX)) {
	}
	nrf_spim_event_clear(NRF_SPIM3, NRF_SPIM_EVENT_ENDTX);

	nrf_gpio_pin_set(ST7735_PIN_DC);
	nrf_delay_us(20);
}

/**
 * Internal method to write a byte of data to the bus. Note: Low-level SPIM required to
 * avoid a bug in the Nordic SPI implementation that cannot send a single byte
 */
static void inline __writeData(uint8_t data) {
	nrf_spim_tx_buffer_set(NRF_SPIM3, &data, 1);
	nrf_spim_rx_buffer_set(NRF_SPIM3, NULL, 0);

	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}

	nrf_spim_task_trigger(NRF_SPIM3, NRF_SPIM_TASK_START);
	while (!nrf_spim_event_check(NRF_SPIM3, NRF_SPIM_EVENT_ENDTX)) {
	}
	nrf_spim_event_clear(NRF_SPIM3, NRF_SPIM_EVENT_ENDTX);
}

/**
 * Write 16-bit data to the bus
 */
static inline void __writeData16(uint16_t data) {
	data = SWAP(data);
//	nrf_spim_tx_buffer_set(NRF_SPIM0, (uint8_t *) &data, 2);
//	nrf_spim_rx_buffer_set(NRF_SPIM0, NULL, 0);

	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}

    nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(&data, 2);
    nrfx_spim_xfer(&spim0, &xfer_desc, 0);

//	nrf_spim_task_trigger(NRF_SPIM0, NRF_SPIM_TASK_START);
//	while (!nrf_spim_event_check(NRF_SPIM0, NRF_SPIM_EVENT_ENDTX)) {
//	}
//	nrf_spim_event_clear(NRF_SPIM0, NRF_SPIM_EVENT_ENDTX);
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
	x += ST7735_X_OFFSET;
	y += ST7735_Y_OFFSET;

	__writeCommand(ST7735_CASET); // Column addr set
	__writeData16(x);

	__writeCommand(ST7735_RASET); // Row addr set
	__writeData16(y);

	__writeCommand(ST7735_RAMWR); // write to RAM
}

/**
 * Convert RGB color to 565
 */
uint16_t st7735_color565(uint8_t r, uint8_t g, uint8_t b) {
	return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

/**
 * Draw a single pixel to the display
 */
void inline st7735_draw_pixel(uint16_t x, uint16_t y, uint16_t color) {
	//Clip and adjust for display offsets
	if ((x < 0) || (x >= ST7735_WIDTH) || (y < 0) || (y >= ST7735_HEIGHT)) {
		return;
	}

	while(st7735_is_busy());

	__set_XY_fast(x, y);
	__writeData16(color);

}

/**
 * Fill an area on the screen with a single color
 */
void st7735_fill_rect(volatile int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
	int32_t bytecount = w * h * 2;
	uint8_t color_lsb[254];
	for (uint8_t i = 0; i < 254; i += 2) {
		color_lsb[i] = (uint8_t) (color >> 8);
		color_lsb[i + 1] = (uint8_t) (color & 0xFF);
	}

	// rudimentary clipping
	if ((x >= ST7735_WIDTH) || (y >= ST7735_HEIGHT))
		return;
	if ((x + w - 1) >= ST7735_WIDTH)
		w = ST7735_WIDTH - x;
	if ((y + h - 1) >= ST7735_HEIGHT)
		h = ST7735_HEIGHT - y;

	st7735_set_addr(x, y, x + w - 1, y + h - 1);

	while (bytecount > 0) {
		st7735_push_colors((uint8_t *) color_lsb, MIN(254, bytecount));
		bytecount -= 254;
	}

	while (m_busy) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
}

/**
 * Initialize the display
 */
void st7735_init() {
	uint32_t err_code;

	//Init SPI0 for the LCD
	nrfx_spim_config_t spi_config = NRFX_SPIM_DEFAULT_CONFIG;
	spi_config.sck_pin = ST7735_SCK_PIN;
	spi_config.mosi_pin = ST7735_MOSI_PIN;
	spi_config.miso_pin = NRFX_SPIM_PIN_NOT_USED;
	spi_config.ss_pin = ST7735_PIN_CS;
	spi_config.irq_priority = NRFX_SPIM_DEFAULT_CONFIG_IRQ_PRIORITY;
	spi_config.frequency = NRF_SPIM_FREQ_32M;
	spi_config.orc = 0x00;
	spi_config.mode = NRF_SPIM_MODE_0;
	spi_config.bit_order = NRF_SPIM_BIT_ORDER_MSB_FIRST;
    spi_config.use_hw_ss      = true;
    spi_config.ss_active_high = false;

	APP_ERROR_CHECK(
			nrfx_spim_init(&spim0, &spi_config, __spim_event_handler, NULL)
	);

	
	nrf_gpio_cfg_output(ST7735_PIN_DC);
	nrf_gpio_cfg_output(ST7735_PIN_RESET);
	nrf_gpio_cfg_output(ST7735_PIN_LED);

	//Keep CS pin low for all time, saves time later.
	//nrf_gpio_pin_clear(ST7735_PIN_CS);
}

/**
 * Simple check for if the bus is busy
 */
inline bool st7735_is_busy() {
	return m_busy;
}

/**
 * Push a single color (pixel) to the display. This is not very efficient as the CS line is toggled.
 * If pushing more than one pixel highly recommend streaming the colors through a DMA transfer
 */
void inline st7735_push_color(uint16_t color) {
	//color = SWAP(color);
	__writeData16(color);
}

/**
 * Push many colors to the display
 */
inline void st7735_push_colors(uint8_t *p_colors, int32_t size) {

    uint8_t count = 0;

    while (size > 0) {
        count = MIN(254, size);

        //Don't start next transfer until previous is complete
        while (m_busy) {
            APP_ERROR_CHECK(sd_app_evt_wait());
        }
        m_busy = true;

        nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_colors, count);
        nrfx_spim_xfer(&spim0, &xfer_desc, 0);

        p_colors += count;      //advance the pointer
        size -= count;
    }
    //Function will return even while transfer is occuring

}

/**
 * Push many colors to the display very fast
 */
nrfx_err_t inline st7735_push_colors_fast(uint8_t *p_colors, int32_t size) {
	//uint8_t count = 0;

	//Don't start next transfer until previous is complete
	while (m_busy) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}

	m_busy = true;
	//count = MIN(254, size);

	nrfx_spim_xfer_desc_t xfer_desc = NRFX_SPIM_XFER_TX(p_colors, size);
	return nrfx_spim_xfer(&spim0, &xfer_desc, 0);

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
void st7735_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1) {

	uint8_t rx;

	__writeCommand(ST7735_CASET); // Column addr set
	__writeData16(x0 + ST7735_X_OFFSET); // XSTART
	__writeData16(x1 + ST7735_X_OFFSET); // XEND

	__writeCommand(ST7735_RASET); // Row addr set
	__writeData16(y0 + ST7735_Y_OFFSET); // YSTART
	__writeData16(y1 + ST7735_Y_OFFSET); // YEND

	__writeCommand(ST7735_RAMWR); // write to RAM
}

/**
 * Start the display driver
 */
void st7735_start() {
	nrf_gpio_pin_clear(ST7735_PIN_LED);

	//Reset the display
	nrf_gpio_pin_set(ST7735_PIN_RESET);
	nrf_delay_ms(100);
	nrf_gpio_pin_clear(ST7735_PIN_RESET);
	nrf_delay_ms(100);
	nrf_gpio_pin_set(ST7735_PIN_RESET);
	nrf_delay_ms(100);

	nrf_spim_event_clear(NRF_SPIM2, NRF_SPIM_EVENT_END);
	nrf_spim_event_clear(NRF_SPIM2, NRF_SPIM_EVENT_ENDTX);

	CRITICAL_REGION_ENTER();
	__writeCommand(ST7735_SWRESET); //software reset
	nrf_delay_ms(150);

	__writeCommand(ST7735_SLPOUT); // Sleep out and Charge Pump on
	nrf_delay_ms(150);

	__writeCommand(ST7735_FRMCTR1); //Frame rate control
	__writeData(0x01);
	__writeData(0x2C);
	__writeData(0x2D);

	__writeCommand(ST7735_FRMCTR2); //Frame rate control
	__writeData(0x01);
	__writeData(0x2C);
	__writeData(0x2D);

	__writeCommand(ST7735_FRMCTR3); //In partial mode + Full colors
	__writeData(0x01); //RTNC: set 1-line period
	__writeData(0x2C); //FPC:  front porch
	__writeData(0x2D); //BPC:  back porch
	__writeData(0x01); //RTND: set 1-line period
	__writeData(0x2C); //FPD:  front porch
	__writeData(0x2D); //BPD:  back porch

	//INVCTR (B4h): Display Inversion Control
	__writeCommand(ST7735_INVCTR);
	__writeData(0x07);

	//PWCTR1 (C0h): Power Control 1
	__writeCommand(ST7735_PWCTR1);
	__writeData(0xa2);
	__writeData(0x02);
	__writeData(0x04);

	//PWCTR2 (C1h): Power Control 2
	// * Set the VGH and VGL supply power level
	//Restriction: VGH-VGL <= 32V
	__writeCommand(ST7735_PWCTR2);
	__writeData(0xC5);

	//PWCTR3 (C2h): Power Control 3 (in Normal mode/ Full colors)
	// * Set the amount of current in Operational amplifier in
	//   normal mode/full colors.
	// * Adjust the amount of fixed current from the fixed current
	//   source in the operational amplifier for the source driver.
	// * Set the Booster circuit Step-up cycle in Normal mode/ full
	//   colors.
	__writeCommand(ST7735_PWCTR3);
	__writeData(0x0D);	      // AP[2:0] Sets Operational Amplifier Bias Current
							  // AP[2:0] | Function
							  //    000b | Off
							  //    001b | Small
							  //    010b | Medium Low
							  //    011b | Medium
							  //    100b | Medium High
							  //    101b | Large          <<<<<
							  //    110b | reserved
							  //    111b | reserved
	__writeData(0x00);	                     // DC[2:0] Booster Frequency
											 // DC[2:0] | Circuit 1 | Circuit 2,4
											 //    000b | BCLK / 1  | BCLK / 1  <<<<<
											 //    001b | BCLK / 1  | BCLK / 2
											 //    010b | BCLK / 1  | BCLK / 4
											 //    011b | BCLK / 2  | BCLK / 2
											 //    100b | BCLK / 2  | BCLK / 4
											 //    101b | BCLK / 4  | BCLK / 4
											 //    110b | BCLK / 4  | BCLK / 8
											 //    111b | BCLK / 4  | BCLK / 16

	//PWCTR4 (C3h): Power Control 4 (in Idle mode/ 8-colors)
	// * Set the amount of current in Operational amplifier in
	//   normal mode/full colors.
	// * Adjust the amount of fixed current from the fixed current
	//   source in the operational amplifier for the source driver.
	// * Set the Booster circuit Step-up cycle in Normal mode/ full
	//   colors.
	__writeCommand(ST7735_PWCTR4);
	__writeData(0x8D);	      // AP[2:0] Sets Operational Amplifier Bias Current
							  // AP[2:0] | Function
							  //    000b | Off
							  //    001b | Small
							  //    010b | Medium Low
							  //    011b | Medium
							  //    100b | Medium High
							  //    101b | Large          <<<<<
							  //    110b | reserved
							  //    111b | reserved
	__writeData(0xEE);	                     // DC[2:0] Booster Frequency
											 // DC[2:0] | Circuit 1 | Circuit 2,4
											 //    000b | BCLK / 1  | BCLK / 1
											 //    001b | BCLK / 1  | BCLK / 2
											 //    010b | BCLK / 1  | BCLK / 4  <<<<<
											 //    011b | BCLK / 2  | BCLK / 2
											 //    100b | BCLK / 2  | BCLK / 4
											 //    101b | BCLK / 4  | BCLK / 4
											 //    110b | BCLK / 4  | BCLK / 8
											 //    111b | BCLK / 4  | BCLK / 16

	//PPWCTR5 (C4h): Power Control 5 (in Partial mode/ full-colors)
	// * Set the amount of current in Operational amplifier in
	//   normal mode/full colors.
	// * Adjust the amount of fixed current from the fixed current
	//   source in the operational amplifier for the source driver.
	// * Set the Booster circuit Step-up cycle in Normal mode/ full
	//   colors.
	__writeCommand(ST7735_PWCTR5);
	__writeData(0x8D);	      // AP[2:0] Sets Operational Amplifier Bias Current
							  // AP[2:0] | Function
							  //    000b | Off
							  //    001b | Small
							  //    010b | Medium Low
							  //    011b | Medium
							  //    100b | Medium High
							  //    101b | Large          <<<<<
							  //    110b | reserved
							  //    111b | reserved
	__writeData(0xEE);	                     // DC[2:0] Booster Frequency
											 // DC[2:0] | Circuit 1 | Circuit 2,4
											 //    000b | BCLK / 1  | BCLK / 1
											 //    001b | BCLK / 1  | BCLK / 2
											 //    010b | BCLK / 1  | BCLK / 4
											 //    011b | BCLK / 2  | BCLK / 2
											 //    100b | BCLK / 2  | BCLK / 4
											 //    101b | BCLK / 4  | BCLK / 4
											 //    110b | BCLK / 4  | BCLK / 8  <<<<<
											 //    111b | BCLK / 4  | BCLK / 16

	//VMCTR1 (C5h): VCOM Control 1
	__writeCommand(ST7735_VMCTR1);
	__writeData(0x09);	                     // Default: 0x51 => +4.525
											 // VMH[6:0] (0-100) Sets VCOMH
											 // VMH=0x00 => VCOMH= +2.5v
											 // VMH=0x64 => VCOMH= +5.0v

	//Ensure tearing effect line is off
	__writeCommand(ST7735_TEOFF);


	//GMCTRP1 (E0h): Gamma ‘+’polarity Correction Characteristics Setting
	__writeCommand(ST7735_GAMCTRP1);
	__writeData(0x0a);
	__writeData(0x1c);
	__writeData(0x0c);
	__writeData(0x14);
	__writeData(0x33);
	__writeData(0x2b);
	__writeData(0x24);
	__writeData(0x28);
	__writeData(0x27);
	__writeData(0x25);
	__writeData(0x2C);
	__writeData(0x39);
	__writeData(0x00);
	__writeData(0x05);
	__writeData(0x03);
	__writeData(0x0d);

	//GMCTRN1 (E1h): Gamma ‘-’polarity Correction Characteristics Setting
	__writeCommand(ST7735_GAMCTRN1);
	__writeData(0x0a);
	__writeData(0x1c);
	__writeData(0x0c);
	__writeData(0x14);
	__writeData(0x33);
	__writeData(0x2b);
	__writeData(0x24);
	__writeData(0x28);
	__writeData(0x27);
	__writeData(0x25);
	__writeData(0x2D);
	__writeData(0x3a);
	__writeData(0x00);
	__writeData(0x05);
	__writeData(0x03);
	__writeData(0x0d);


	//Normal Display Mode On
	__writeCommand(ST7735_NORON);
	nrf_delay_ms(10);

	//DISPON (29h): Display On
	// * This command is used to recover from DISPLAY OFF mode. Output
	//   from the Frame Memory is enabled.
	// * This command makes no change of contents of frame memory.
	// * This command does not change any other status.
	// * The delay time between DISPON and DISPOFF needs 120ms at least
	__writeCommand(ST7735_DISPON);	                     //Display On
	nrf_delay_ms(100);

	//COLMOD (3Ah): Interface Pixel Format
	// * This command is used to define the format of RGB picture
	//   data, which is to be transferred via the MCU interface.
	__writeCommand(ST7735_COLMOD);
	__writeData(0x05);	//Set pixel format to 16-bit (565) mode

	__writeCommand(ST7735_INVOFF);

	//MADCTL (36h): Memory Data Access Control
	__writeCommand(ST7735_MADCTL);
	__writeData(ST7735_INVERTED_MADCTL);	//Set display orientation and RGB order

	//1 clk cycle nonoverlap, 2 cycle gate rise, 3 cycle osc equalize, Fix on VTL
	__writeCommand(ST7735_DISSET5);
	__writeData(0x15);
	__writeData(0x02);

	//setOrientation
	__writeCommand(0x2A); //Column address set
	__writeData(0x00);
	__writeData(0x02);
	__writeData(0x00);
	__writeData(0x81);

	__writeCommand(0x2B); //Row address set
	__writeData(0x00);
	__writeData(0x01);
	__writeData(0x00);
	__writeData(0x80);

	CRITICAL_REGION_EXIT();

}


