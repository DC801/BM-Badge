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
 *****************************************************************************/
#ifndef UTIL_GFX_H_
#define UTIL_GFX_H_

#define PROGMEM

#define GFX_WIDTH			LCD_WIDTH
#define GFX_HEIGHT			LCD_HEIGHT

// Color definitions
#define COLOR_BLACK   		0x0000      /*   0,   0,   0 */
#define COLOR_BROWN			0x9B26
#define COLOR_NAVY   		0x000F      /*   0,   0, 128 */
#define COLOR_DARKBLUE		0x18E8
#define COLOR_DARKGREEN		0x03E0      /*   0, 128,   0 */
#define COLOR_DARKCYAN		0x03EF      /*   0, 128, 128 */
#define COLOR_MAROON		0x7800     /* 128,   0,   0 */
#define COLOR_PURPLE		0x780F      /* 128,   0, 128 */
#define COLOR_OLIVE  		0x7BE0      /* 128, 128,   0 */
#define COLOR_LIGHTBLUE		0xB6FF		/* #B4DEFF */
#define COLOR_LIGHTGREY		0xC618      /* 192, 192, 192 */
#define COLOR_DARKGREY		0x7BEF      /* 128, 128, 128 */
#define COLOR_BLUE			0x001F      /*   0,   0, 255 */
#define COLOR_GREEN   		0x07E0      /*   0, 255,   0 */
#define COLOR_CYAN  		0x07FF      /*   0, 255, 255 */
#define COLOR_RED   		0xF800      /* 255,   0,   0 */
#define COLOR_MAGENTA	 	0xF81F      /* 255,   0, 255 */
#define COLOR_YELLOW 	 	0xFFE0      /* 255, 255,   0 */
#define COLOR_WHITE   		0xFFFF      /* 255, 255, 255 */
#define COLOR_ORANGE   		0xFD20      /* 255, 165,   0 */
#define COLOR_GREENYELLOW 	0xAFE5      /* 173, 255,  47 */
#define COLOR_PINK        	0xFB56
#define COLOR_NEONPURPLE	0xFD5F

#define FONT_COMPUTER_12PT  0
#define FONT_MONO55_8PT     1
#define FONT_GAMEPLAY_5PT	2
#define FONT_VERAMONO_5PT   3
#define FONT_TOMTHUMB       4
#define FONT_PRACTICAL      5
#define FONT_ALIEN          6

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
	int16_t xs, ys, xe, ye;
} area_t;

typedef struct {
	uint8_t width;
	uint8_t height;
	uint8_t *data;
} bitmap_t;

/**
 * Set the visible area for text cursor for printing text. Any printing outside of it will not be visible
 *
 * @param 	area		Bounds of text area to clip
 */
extern void util_gfx_cursor_area_set(area_t area);

/**
 * Reset visible text area to defaults (full screen)
 */
extern void util_gfx_cursor_area_reset();

/**
 * Draw BMP file from the micro SD card. 24-bit RGB files only
 *
 * @param	filename	Pointer to path to BMP file to display
 * @param	x			X coordinate to draw the BMP file
 * @param	y			Y coordinate to draw the BMP file
 */
extern void util_gfx_draw_bmp_file(const char *filename, uint8_t x, uint16_t y);

/**
 * Draw bitmap (that is 1s and 0s) to the screen with a given foreground color
 *
 * @param	p_bitmap	Pointer to bitmap structure containing the raw data
 * @param	x			X coordinate to draw the bitmap
 * @param	y			Y coordinate to draw the bitmap
 * @param	color		Foreground RGB565 color for 1s in the bitmap data
 */
extern void util_gfx_draw_bmp(bitmap_t *p_bitmap, uint16_t x, uint16_t y, uint16_t color);

/**
 * Draw a circle to the screen
 *
 * @param 	x0			X coordinate for the center of the circle
 * @param	y0			Y coordinate for the center of the circle
 * @param	r			Radius of the circle
 * @param	color		RGB565 color of the circle
 */
extern void util_gfx_draw_circle(int16_t x0, int16_t y0, int16_t r, uint16_t color);

/**
 * Draw a line to the screen
 *
 * @param	x0			Starting X coordinate for the line
 * @param 	y0			Starting Y coordinate for the line
 * @param	x1			Ending Y coordinate for the line
 * @param	y1			Ending Y coordinate for the line
 * @param	color		RGB565 color of the circle
 */
extern void util_gfx_draw_line(int16_t x0, int16_t y0, int16_t x1, int16_t y1, uint16_t color);

/**
 * Draw RAW RGB565BE data to the screen
 *
 * @param	x			X coordinate to start the raw file at
 * @param	y			Y coordinate to start the raw file at
 * @param	w			Width of the raw file in pixels
 * @param	h			Height of the raw file in pixels
 * @param	p_raw		Pointer to the raw RGB565BE data
 */
extern void util_gfx_draw_raw(int16_t x, int16_t y, uint16_t w, uint16_t h, uint8_t *p_raw);

extern void util_gfx_draw_raw_int16(int16_t x, int16_t y, uint16_t w, uint16_t h, const uint16_t *p_raw);

/**
* Draw RAW RGB565BE data to the screen
*
* @param    x            X coordinate to start the raw file at
* @param    y            Y coordinate to start the raw file at
* @param    w            Width of the raw file in pixels
* @param    h            Height of the raw file in pixels
* @param    p_raw        Pointer to the raw RGB565BE data
*/
extern void util_gfx_draw_raw_async(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *p_raw);


/**
 * Draw or animate a raw file. The swiss army knife of bling
 *
 * @param 	filename	path to raw file to draw / animate
 * @param 	x			x coordinate to draw at
 * @param 	y			y coordinate to draw at
 * @param 	w			width of image, important to have correct or else file won't be parsed correctly
 * @param 	h			height of image, also important
 * @param 	p_callback 	pointer to callback function on every frame
 * @param 	loop		Set to true to loop until a button is pressed
 * @param 	data		data to send back to the callback
 *
 * @return Happiness
 */
extern uint8_t util_gfx_draw_raw_file(const char *filename, int16_t x, int16_t y, uint16_t w, uint16_t h,
									  void (*p_callback)(uint8_t frame, void *p_data),
									  bool loop, void *data);

/**
 * Indicate to the draw raw file function that it should interrupt its looping vice waiting for the user
 */
void util_gfx_draw_raw_file_stop();

/**
 * Draw a rectangle to the screen.
 *
 * @param	x			X coordinate of the upper left corner of the rectangle
 * @param	y			Y coordinate of the upper left corner of the rectangle
 * @param	w			Width of the rectangle
 * @param	h			Height of the rectangle
 * @param	color		RGB565 color for the rectangle
 */
extern void util_gfx_draw_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);

/**
 * Draw a triangle to the screen
 *
 * @param	x0			X coordinate of the first corner of the triangle
 * @param	y0			Y coordinate of the first corner of the triangle
 * @param	x1			X coordinate of the second corner of the triangle
 * @param	y1			Y coordinate of the second corner of the triangle
 * @param	x2			X coordinate of the third corner of the triangle
 * @param	y3			Y coordinate of the third corner of the triangle
 * @param	color		RGB565 color for the triangle
 */
extern void util_gfx_draw_triangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2, uint16_t color);

/**
 * Draw a filled rectangle to the screen
 *
 * @param	x			X coordinate of the upper left corner of the rectangle
 * @param	y			Y coordinate of the upper left corner of the rectangle
 * @param	w			Width of the rectangle
 * @param	h			Height of the rectangle
 * @param	color		RGB565 color for the rectangle
 */
extern void util_gfx_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);

/**
 * Fill the screen with a color
 *
 * @param	color		RGB565 color to fill the screen with
 */
extern void util_gfx_fill_screen(uint16_t color);

/**
 * Get the height of the current font
 *
 * @return	The height of the current font
 */
extern uint8_t util_gfx_font_height();

/**
 * Returns the width of the current font. Careful! Unreliable results for non-fixed width fonts
 *
 * @return	The width of the current font
 */
extern uint8_t util_gfx_font_width();

/**
 * Gets the current RGB565 color of the font
 */
extern uint16_t util_gfx_color_get();

/**
 * Gets the cursor's X coordinate
 */
extern int16_t util_gfx_cursor_x_get();

/**
 * Gets the cursor's Y coordinate
 */
extern int16_t util_gfx_cursor_y_get();

/**
 * Helper function that gets the text bounds of a string
 *
 * @param 	str			Pointer to string to check
 * @param 	x			Starting x point
 * @param 	y			Starting y point
 * @param 	w [out]		Pointer to memory to return height of text
 * @param 	h [out]		Pointer to memory to return width of text
 */
extern void util_gfx_get_text_bounds(char *str, int16_t x, int16_t y, uint16_t *w, uint16_t *h);

/**
 * Invalidate the current graphics state. Call this when something is changed on the display
 * that will need a full redraw. This should be used after interrupting the user to show
 * something graphically on the screen.
 */
extern void util_gfx_invalidate();

/**
 * Validate the current graphics state. Call this when a full render of the display is complete.
 */
extern void util_gfx_validate();

/**
 * Returns if the graphics state is still considered valid.
 *
 * @return 	true if state is valid
 */
extern bool util_gfx_is_valid_state();

/**
 * Handler for scheduler event that occurs when the display is inverted.
 */
extern void util_gfx_inverted_schedule_handler(void *p_data, uint16_t length);

/**
 * Load a raw file into memory
 *
 * @param 	raw				Pointer to where to put the raw file
 * @param 	filename		File to load
 * @param 	size			Size in bytes of file - buffer should match this
 */
extern void util_gfx_load_raw(uint8_t *raw, char *filename, uint16_t size);


/**
 * Print a single char at the current location, in the current color
 *
 * @param letter
 */
void util_gfx_print_char(char letter);

/**
 * Prints a string of text to the display at the current cursor position. Text will
 * wrap if it reaches the end of the current cursor area. Text will not be printed
 * outside of the current cursor area. The current color will be used to render the
 * text as well.
 *
 * @param	text			Pointer to character array of text to print.
 */
extern void util_gfx_print(const char *text);

/**
 * Converts an RGB color to 565BE color.
 *
 * @param	rgb				24-bit RGB color to convert
 * @return	RGB565BE color as a 16-bit integer
 */
extern uint16_t util_gfx_rgb_to_565(uint32_t rgb);

/**
 * Sets the current color for text rendering
 *
 * @param	color			RGB565BE color to use for future prints
 */
extern void util_gfx_set_color(uint16_t color);

/**
 * Sets the current cursor position for the text
 *
 * @param	x				X coordinate to print at
 * @param	y				Y coordinate to print at
 */
extern void util_gfx_set_cursor(int16_t x, int16_t y);

/**
 * Sets the font to use for printing text
 *
 * @param	font			Font to use. Use FONT_SMALL, FONT_MEDIUM, or FONT_LARGE
 */
extern void util_gfx_set_font(uint8_t font);

/**
 *	Sets a single pixel to a given color
 *
 *	@param	x				X coordinate to set
 *	@param	y				Y coordinate to set
 *	@param	color			RGB565BE color to set the pixel to
 */
extern void util_gfx_set_pixel(int16_t x, int16_t y, uint16_t color);

/**
 * Enable or disable automatic word wrapping when outside the viewport
 *
 * @param wrap True to enable word wrapping
 */
extern void util_gfx_set_wrap(bool wrap);

#ifdef __cplusplus
}
#endif

#endif /* UTIL_GFX_H_ */
