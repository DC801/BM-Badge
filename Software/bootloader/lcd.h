/*
 * @file lcd.h
 *
 * @date May 24, 2017
 * @author hamster
 *
 */

#ifndef LCD_H_
#define LCD_H_


/*
 * RGB565 encoding
 *
 * 16 bit colors as hex value:
 * 15..11 = R4..0 (Red)
 * 10..5  = G5..0 (Green)
 *  4..0  = B4..0 (Blue)
 *
 * Notice that green gets 5 bits.  The human eye can pick
 * shades of green easier, so the color space is a little wider
 * than the red and blue.
 *
 * Here's an online calculator to help you out to pick a color:
 * http://www.rinkydinkelectronics.com/calc_rgb565.php
 *
 * Below is a basic table I lifted from some Keil ARM docs
 */
									   /* Red, Grn, Blu */
#define LCD_COLOR_BLACK        0x0000  /*   0,   0,   0 */
#define LCD_COLOR_NAVY         0x000F  /*   0,   0, 128 */
#define LCD_COLOR_DARK_GREEN   0x03E0  /*   0, 128,   0 */
#define LCD_COLOR_DARK_CYAN    0x03EF  /*   0, 128, 128 */
#define LCD_COLOR_MAROON       0x7800  /* 128,   0,   0 */
#define LCD_COLOR_PURPLE       0x780F  /* 128,   0, 128 */
#define LCD_COLOR_OLIVE        0x7BE0  /* 128, 128,   0 */
#define LCD_COLOR_LIGHT_GREY   0xC618  /* 192, 192, 192 */
#define LCD_COLOR_DARK_GREY    0x7BEF  /* 128, 128, 128 */
#define LCD_COLOR_BLUE         0x001F  /*   0,   0, 255 */
#define LCD_COLOR_GREEN        0x07E0  /*   0, 255,   0 */
#define LCD_COLOR_CYAN         0x07FF  /*   0, 255, 255 */
#define LCD_COLOR_RED          0xF800  /* 255,   0,   0 */
#define LCD_COLOR_MAGENTA      0xF81F  /* 255,   0, 255 */
#define LCD_COLOR_YELLOW       0xFFE0  /* 255, 255, 0   */
#define LCD_COLOR_WHITE        0xFFFF  /* 255, 255, 255 */

#define LCD_COLOR_LIST { 	\
	LCD_COLOR_BLACK,		\
	LCD_COLOR_NAVY,			\
	LCD_COLOR_DARK_GREEN,	\
	LCD_COLOR_DARK_CYAN,	\
	LCD_COLOR_MAROON,		\
	LCD_COLOR_PURPLE,		\
	LCD_COLOR_OLIVE,		\
	LCD_COLOR_LIGHT_GREY,	\
	LCD_COLOR_DARK_GREY,	\
	LCD_COLOR_BLUE,			\
	LCD_COLOR_GREEN,		\
	LCD_COLOR_CYAN,			\
	LCD_COLOR_RED,			\
	LCD_COLOR_MAGENTA,		\
	LCD_COLOR_YELLOW,		\
	LCD_COLOR_WHITE }

#define LCD_COLOR_NUMBER 16

static const uint32_t lcd_color_list[LCD_COLOR_NUMBER] = LCD_COLOR_LIST;

extern const nrf_gfx_font_desc_t orkney_8ptFontInfo;
extern const nrf_lcd_t nrf_lcd_st7735;

static const nrf_gfx_font_desc_t * p_font = &orkney_8ptFontInfo;
static const nrf_lcd_t * p_lcd = &nrf_lcd_st7735;


#endif /* LCD_H_ */
