/**
 *
 * @file custom_board.h
 *
 * @date May 24, 2017
 * @author hamster
 *
 * This is the custom board defines for the LEDs and etc on the DC25 badge
 *
 */

#ifndef DC801_H
#define DC801_H

#ifdef __cplusplus
extern "C" {
#endif

// Low is active
#define LEDS_ACTIVE_STATE    0

// Defines for preventing unused framebuffer functions from blowing up the compiler:
#define BUTTONS_NUMBER       0
#define BUTTONS_ACTIVE_STATE NRF_GPIO_PIN_SENSE_LOW
#define USER_BUTTON_NONE     0	

// Keyboard config
#define KEYBOARD_ADDRESS    0x23
#define KEYBOARD_INT_PIN    18

//UART config:
#define RX_PIN_NUMBER       8
#define TX_PIN_NUMBER       6
#define CTS_PIN_NUMBER      NRF_UART_PSEL_DISCONNECTED
#define RTS_PIN_NUMBER      NRF_UART_PSEL_DISCONNECTED
#define HWFC                false

// LCD
#define LCD_SPIM_INSTANCE   3

#define ILI9341_SCK_PIN		28
#define ILI9341_MOSI_PIN	30
#define ILI9341_PIN_CS		31
#define ILI9341_PIN_DC		29
#define ILI9341_PIN_LED		0
#define ILI9341_PIN_RESET	32+10

#define LCD_WIDTH  			320
#define LCD_HEIGHT 			240
#define LCD_X_OFFSET		0
#define LCD_Y_OFFSET		0

// I2C configuration
#define I2C_INSTANCE        0

#define I2C_SCL_PIN         23
#define I2C_SDA_PIN         22

//I2S configuration
#define I2S_TWI_INST		1
#define I2S_SCL_M			3
#define I2S_SDA_M			32+13

#define I2S_SCK_M			5
#define I2S_LRCK_M			32+15
#define I2S_MCK_M			32+14
#define I2S_SDOUT_M			7

// SD card interface
#define SDC_SCK_PIN         17
#define SDC_MOSI_PIN        21
#define SDC_MISO_PIN        16
#define SDC_CS_PIN          19

//QSPI Configuration
#define BSP_QSPI_SCK_PIN   12
#define BSP_QSPI_CSN_PIN   2
#define BSP_QSPI_IO0_PIN   13
#define BSP_QSPI_IO1_PIN   12+32
#define BSP_QSPI_IO2_PIN   14
#define BSP_QSPI_IO3_PIN   1


// Clock
// Low frequency clock source to be used by the SoftDevice
// We're using the internal RC osc
#define NRF_CLOCK_LFCLKSRC      {.source        = NRF_CLOCK_LF_SRC_RC, \
                                 .rc_ctiv       = 16, \
                                 .rc_temp_ctiv  = 2, \
                                 .xtal_accuracy = NRF_CLOCK_LF_XTAL_ACCURACY_20_PPM}


#ifdef __cplusplus
}
#endif

#endif // DC801_H
