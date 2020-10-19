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

// LEDs definitions

// Low is active
#define LEDS_ACTIVE_STATE 0

#define VOLTAGE_SENSE		4

// LED Pins

#define LED_LEVEL_UP_0     	32
#define LED_LEVEL_UP_1     	32
#define LED_LEVEL_UP_2     	32
#define LED_LEVEL_UP_3		32

#define LED_POWER_UP_0  	32
#define LED_POWER_UP_1      	32
#define LED_POWER_UP_2      	32
#define LED_POWER_UP_3		32

// Arrays to make iteration easy
// The Nordic SDK uses LEDS_LIST internally
#define LEDS_LIST { \
		LED_LEVEL_UP_0, 	\
		LED_LEVEL_UP_1, 	\
		LED_LEVEL_UP_2,	\
		LED_LEVEL_UP_3,	\
		LED_POWER_UP_0,	\
		LED_POWER_UP_1,	\
		LED_POWER_UP_2,	\
		LED_POWER_UP_3	}

#define LEDS_NUMBER    		8

//static const uint32_t led_list[LEDS_NUMBER] = LEDS_LIST;

#define LEVEL_UP_LEDS_LIST { \
		LED_LEVEL_UP_0, 	\
		LED_LEVEL_UP_1, 	\
		LED_LEVEL_UP_2,	\
		LED_LEVEL_UP_3	}

#define LEVEL_UP_LEDS_NUMBER    		4

static const uint32_t level_up_led_list[LEVEL_UP_LEDS_NUMBER] = LEVEL_UP_LEDS_LIST;

#define POWER_UP_LEDS_LIST { \
		LED_POWER_UP_0, 	\
		LED_POWER_UP_1, 	\
		LED_POWER_UP_2,	\
		LED_POWER_UP_3	}

#define POWER_UP_LEDS_NUMBER    		4

static const uint32_t power_up_led_list[POWER_UP_LEDS_NUMBER] = POWER_UP_LEDS_LIST;

// Push buttons

#define BUTTONS_NUMBER 6


#define USER_BUTTON_NONE     0
#define USER_BUTTON_UP       31
#define USER_BUTTON_DOWN     2
#define USER_BUTTON_LEFT     9+32
#define USER_BUTTON_RIGHT    1
#define USER_BUTTON_A        25
#define USER_BUTTON_B        6+32

#define LONG_PRESS_MASK      0x8000

#define USER_BUTTON_UP_LONG    	(17  | LONG_PRESS_MASK)
#define USER_BUTTON_DOWN_LONG   (19  | LONG_PRESS_MASK)
#define USER_BUTTON_LEFT_LONG   (20 | LONG_PRESS_MASK)
#define USER_BUTTON_RIGHT_LONG  (18 | LONG_PRESS_MASK)
#define USER_BUTTON_A_LONG		(27  | LONG_PRESS_MASK)
#define USER_BUTTON_B_LONG		(26 | LONG_PRESS_MASK)

#define BUTTONS_LIST { \
    USER_BUTTON_UP, \
    USER_BUTTON_DOWN, \
    USER_BUTTON_LEFT, \
    USER_BUTTON_RIGHT, \
    USER_BUTTON_A, \
    USER_BUTTON_B \
}

// Low is active
#define BUTTONS_ACTIVE_STATE	0
// Don't need a pull up
#define BUTTON_PULL				0

#define BSP_BUTTON_0   USER_BUTTON_UP
#define BSP_BUTTON_1   USER_BUTTON_DOWN
#define BSP_BUTTON_2   USER_BUTTON_LEFT
#define BSP_BUTTON_3   USER_BUTTON_RIGHT

#define RX_PIN_NUMBER  8
#define TX_PIN_NUMBER  6
#define CTS_PIN_NUMBER NRF_UART_PSEL_DISCONNECTED
#define RTS_PIN_NUMBER NRF_UART_PSEL_DISCONNECTED
#define HWFC           false

#define BUTTON_PRESSED 	0

// Just one speaker
#define SPEAKER		0

// LCD
// LCD
#define LCD_SPIM_INSTANCE   3

#define ILI9341_SCK_PIN		28
#define ILI9341_MOSI_PIN	30
#define ILI9341_PIN_CS		31
#define ILI9341_PIN_DC		29
#define ILI9341_PIN_LED		0
#define ILI9341_PIN_RESET	10+32

#define LCD_WIDTH  			320
#define LCD_HEIGHT 			240
#define LCD_X_OFFSET		0
#define LCD_Y_OFFSET		0

// I2C configuration
#define I2C_INSTANCE        0

#define I2C_SCL_PIN         23
#define I2C_SDA_PIN         22

// SD card interface
#define SDC_SCK_PIN         17
#define SDC_MOSI_PIN        21
#define SDC_MISO_PIN        16
#define SDC_CS_PIN          19

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
