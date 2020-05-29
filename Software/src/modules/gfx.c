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
 * 	Adapted for the dc801 dc26 badge and SDK15 by @hamster
 *
 *****************************************************************************/
/*
// System headers
#include <ctype.h>
#include <math.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>

#include "common.h"

#include "gfx.h"
#include "drv_st7735.h"
#include "sd.h"
#include "../adafruit/gfxfont.h"

#define PROGMEM

#include "../fonts/computerfont12pt7b.h"
#include "../fonts/monof55.h"
#include "../fonts/gameplay.h"
#include "../fonts/veramono5pt7b.h"
#include "../fonts/TomThumb.h"
#include "../fonts/practical8pt7b.h"
#include "../fonts/SFAlienEncounters5pt7b.h"

#define PIXEL_BUFFER_COUNT	128

#ifndef _swap_int16_t
#define _swap_int16_t(a, b) { int16_t t = a; a = b; b = t; }
#endif

//Cursor coordinates
static int16_t m_cursor_x = 0;
static int16_t m_cursor_y = 0;
static area_t m_cursor_area = { 0, 0, 0, 0 };
static uint8_t m_font = FONT_MONO55_8PT;
static uint16_t m_color = COLOR_WHITE;
static bool m_wrap = true;
static volatile bool m_stop = false;

//Track validity of screen state
static volatile bool m_valid_state = false;


#define __FONT_MONO55_8PT       monof558pt7b
#define __FONT_COMPUTER_12PT    Computerfont12pt7b
#define __FONT_GAMEPLAY_5PT     gameplay5pt7b
#define __FONT_VERAMONO_5PT     VeraMono5pt7b
#define __FONT_TOMTHUMB         TomThumb
#define __FONT_PRACTICAL        practical8pt7b
#define __FONT_ALIEN            SFAlienEncountersSolid5pt7b

static inline GFXfont __get_font() {
	GFXfont font = __FONT_MONO55_8PT;

	switch(m_font){
	    case FONT_COMPUTER_12PT:
            font = __FONT_COMPUTER_12PT;
	        break;
	    case FONT_MONO55_8PT:
            font = __FONT_MONO55_8PT;
	        break;
        case FONT_GAMEPLAY_5PT:
            font = __FONT_GAMEPLAY_5PT;
            break;
		case FONT_VERAMONO_5PT:
			font = __FONT_VERAMONO_5PT;
			break;
        case FONT_TOMTHUMB:
            font = __FONT_TOMTHUMB;
            break;
        case FONT_PRACTICAL:
            font = __FONT_PRACTICAL;
            break;
        case FONT_ALIEN:
            font = __FONT_ALIEN;
            break;
	    default:
	        break;
	}

	return font;
}

// Draw single character anywhere on the screen. Adapted from Adafruit GFX library.
// Only supports custom fonts.
static void __draw_char(int16_t x, int16_t y, unsigned char c, uint16_t color,
		uint16_t bg, GFXfont font) {

	// Character is assumed previously filtered by write() to eliminate
	// newlines, returns, non-printable characters, etc.  Calling drawChar()
	// directly with 'bad' characters of font may cause mayhem!

	c -= font.first;
	GFXglyph *glyph = &(font.glyph[c]);
	uint8_t *bitmap = font.bitmap;

	uint16_t bo = glyph->bitmapOffset;
	uint8_t w = glyph->width;
	uint8_t h = glyph->height;

	int8_t xo = glyph->xOffset;
	int8_t yo = glyph->yOffset;
	uint8_t xx, yy, bits = 0, bit = 0;

	// NOTE: THERE IS NO 'BACKGROUND' COLOR OPTION ON CUSTOM FONTS.
	// THIS IS ON PURPOSE AND BY DESIGN.  The background color feature
	// has typically been used with the 'classic' font to overwrite old
	// screen contents with new data.  This ONLY works because the
	// characters are a uniform size; it's not a sensible thing to do with
	// proportionally-spaced fonts with glyphs of varying sizes (and that
	// may overlap).  To replace previously-drawn text when using a custom
	// font, use the getTextBounds() function to determine the smallest
	// rectangle encompassing a string, erase the area with fillRect(),
	// then draw new text.  This WILL infortunately 'blink' the text, but
	// is unavoidable.  Drawing 'background' pixels will NOT fix this,
	// only creates a new set of problems.  Have an idea to work around
	// this (a canvas object type for MCUs that can afford the RAM and
	// displays supporting setAddrWindow() and pushC(olors()), but haven't
	// implemented this yet.

	int16_t yyy;
	for (yy = 0; yy < h; yy++) {
		for (xx = 0; xx < w; xx++) {
			if (!(bit++ & 7)) {
				bits = bitmap[bo++];
			}
			if (bits & 0x80) {
				yyy = y + yo + yy;
				if (yyy >= m_cursor_area.ys && yyy <= m_cursor_area.ye) {
					util_gfx_set_pixel(x + xo + xx, y + yo + yy, color);
				}
			}
			bits <<= 1;
		}
	}
}

// Adapted from Adafruit GFX library. Draws custom font to the screen
// at the current cursor position.
static void __write_char(uint8_t c, GFXfont font) {
	//If newline, move down a row
	if (c == '\n') {
		m_cursor_x = m_cursor_area.xs;
		m_cursor_y += font.yAdvance;
	}
	//Otherwise, print the character (ignoring carriage return)
	else if (c != '\r') {
		uint8_t first = font.first;

		//Valid char?
		if ((c >= first) && (c <= font.last)) {
			uint8_t c2 = c - first;
			GFXglyph *glyph = &(font.glyph[c2]);

			uint8_t w = glyph->width;
			uint8_t h = glyph->height;

			if ((w > 0) && (h > 0)) { // Is there an associated bitmap?
				int16_t xo = glyph->xOffset;

				if ((m_cursor_x + (xo + w)) >= m_cursor_area.xe && m_wrap) {
					// Drawing character would go off right edge; wrap to new line
					m_cursor_x = m_cursor_area.xs;
					m_cursor_y += font.yAdvance;
				}

				__draw_char(m_cursor_x, m_cursor_y, c, m_color, COLOR_BLACK, font);
			}
			m_cursor_x += glyph->xAdvance;
		}
	}
}

void util_gfx_cursor_area_reset() {
	m_cursor_area.xs = 0;
	m_cursor_area.xe = GFX_WIDTH;
	m_cursor_area.ys = 0;
	m_cursor_area.ye = GFX_HEIGHT;
}

#ifdef DC801_EMBEDDED
// * Adapted for our custom ili9163 driver and Nordic from:
// * https://github.com/adafruit/Adafruit_ili9163/blob/master/examples/spitftbitmap/spitftbitmap.ino
void util_gfx_draw_bmp_file(const char *filename, uint8_t x, uint16_t y) {

	FIL bmp_file;
	int32_t width, height;	   	// W+H in pixels
	uint8_t depth;				// Bit depth (currently must be 24)
	uint32_t bmp_image_offset;        // Start of image data in file
	uint32_t rowSize;               // Not always = bmpWidth; may have padding
	uint8_t sdbuffer[3 * PIXEL_BUFFER_COUNT]; // pixel buffer (R+G+B per pixel)
	uint32_t buffidx = sizeof(sdbuffer); // Current position in sdbuffer
	bool flip = true;        // BMP is stored bottom-to-top
	int w, h, row, col;
	uint8_t r, g, b;
	FSIZE_t pos = 0;

	if ((x >= GFX_WIDTH) || (y >= GFX_HEIGHT)) {
		return;
	}

    uint32_t fsize = util_sd_file_size(filename);
    if (fsize == 0) {
        NRF_LOG_INFO("Can't stat %s", filename);
    }

	// Open requested file on SD card
	FRESULT result = f_open(&bmp_file, filename, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
	    NRF_LOG_INFO("Open %s failed", filename);
		return;
	}

	// Parse BMP header
	uint16_t magic = util_sd_read_16(&bmp_file);
	if (magic == 0x4D42) { // BMP signature

		util_sd_read_32(&bmp_file); // Read & ignore file size
		util_sd_read_32(&bmp_file); // Read & ignore creator bytes
		bmp_image_offset = util_sd_read_32(&bmp_file); // Start of image data
		util_sd_read_32(&bmp_file); // Read & ignore DIB header size

		// Read DIB header
		width = util_sd_read_32(&bmp_file);
		height = util_sd_read_32(&bmp_file);
		uint8_t planes = util_sd_read_16(&bmp_file);
		if (planes == 1) { // # planes -- must be '1'
			depth = util_sd_read_16(&bmp_file); // bits per pixel
			util_sd_read_32(&bmp_file); //Ignore compression, YOLO!
			// If bmpHeight is negative, image is in top-down order.
			// This is not canon but has been observed in the wild.
			if (height < 0) {
				height = -height;
				flip = false;
			}

			// Crop area to be loaded
			w = width;
			h = height;
			if ((x + w - 1) >= GFX_WIDTH)
				w = GFX_WIDTH - x;
			if ((y + h - 1) >= GFX_HEIGHT)
				h = GFX_HEIGHT - y;

			// Set TFT address window to clipped image bounds
			st7735_set_addr(x, y, x + w - 1, y + h - 1);

			//Handle 16-bit 565 bmp
			if (depth == 16) {
				// BMP rows are padded (if needed) to 4-byte boundary
				rowSize = (width * 2 + 3) & ~3;

				for (row = 0; row < h; row++) { // For each scanline...

					// Seek to start of scan line.  It might seem labor-
					// intensive to be doing this on every line, but this
					// method covers a lot of gritty details like cropping
					// and scanline padding.  Also, the seek only takes
					// place if the file position actually needs to change
					// (avoids a lot of cluster math in SD library).
					if (flip) // Bitmap is stored bottom-to-top order (normal BMP)
						pos = bmp_image_offset + (height - 1 - row) * rowSize;
					else
						// Bitmap is stored top-to-bottom
						pos = bmp_image_offset + row * rowSize;
					if (f_tell(&bmp_file) != pos) { // Need seek?
						f_lseek(&bmp_file, pos);
						buffidx = sizeof(sdbuffer); // Force buffer reload
					}

					//Populate the row buffer
					UINT count;
					f_read(&bmp_file, sdbuffer, rowSize, &count);
					buffidx = 0; // Set index to beginning

					for (uint16_t i = 0; i < rowSize; i += 2) {
						uint16_t temp = sdbuffer[i];
						sdbuffer[i] = sdbuffer[i + 1];
						sdbuffer[i + 1] = temp;
					}

					st7735_push_colors(sdbuffer, rowSize);
				} // end scanline
			}
			//Handle 24-bit RGB bmp
			else if (depth == 24) { // 0 = uncompressed
				// BMP rows are padded (if needed) to 4-byte boundary
				rowSize = (width * 3 + 3) & ~3;

				for (row = 0; row < h; row++) { // For each scanline...

					// Seek to start of scan line.  It might seem labor-
					// intensive to be doing this on every line, but this
					// method covers a lot of gritty details like cropping
					// and scanline padding.  Also, the seek only takes
					// place if the file position actually needs to change
					// (avoids a lot of cluster math in SD library).
					if (flip) // Bitmap is stored bottom-to-top order (normal BMP)
						pos = bmp_image_offset + (height - 1 - row) * rowSize;
					else
						// Bitmap is stored top-to-bottom
						pos = bmp_image_offset + row * rowSize;
					if (f_tell(&bmp_file) != pos) { // Need seek?
						f_lseek(&bmp_file, pos);
						buffidx = sizeof(sdbuffer); // Force buffer reload
					}

					for (col = 0; col < w; col++) { // For each pixel...
						// Time to read more pixel data?
						if (buffidx >= sizeof(sdbuffer)) { // Indeed
							UINT count;
							f_read(&bmp_file, sdbuffer, sizeof(sdbuffer),
									&count);
							buffidx = 0; // Set index to beginning
						}

						// Convert pixel from BMP to TFT format, push to display
						b = sdbuffer[buffidx++];
						g = sdbuffer[buffidx++];
						r = sdbuffer[buffidx++];
						st7735_push_color(st7735_color565(r, g, b));
					} // end pixel
				} // end scanline
			} // end goodBmp
		}
	}

	f_close(&bmp_file);
}
#endif

#ifdef DC801_DESKTOP
void util_gfx_draw_bmp_file(const char *filename, uint8_t x, uint16_t y) {

	FIL *bmp_file;
	int32_t width, height;	   	// W+H in pixels
	uint8_t depth;				// Bit depth (currently must be 24)
	uint32_t bmp_image_offset;        // Start of image data in file
	uint32_t rowSize;               // Not always = bmpWidth; may have padding
	uint8_t sdbuffer[3 * PIXEL_BUFFER_COUNT]; // pixel buffer (R+G+B per pixel)
	uint32_t buffidx = sizeof(sdbuffer); // Current position in sdbuffer
	bool flip = true;        // BMP is stored bottom-to-top
	int w, h, row, col;
	uint8_t r, g, b;
	FSIZE_t pos = 0;

	if ((x >= GFX_WIDTH) || (y >= GFX_HEIGHT)) {
		return;
	}

    uint32_t fsize = util_sd_file_size(filename);
    if (fsize == 0) {
        NRF_LOG_INFO("Can't stat %s", filename);
    }

	// Open requested file on SD card
	FRESULT result = f_open(&bmp_file, filename, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
	    NRF_LOG_INFO("Open %s failed", filename);
		return;
	}

	// Parse BMP header
	uint16_t magic = util_sd_read_16(bmp_file);
	if (magic == 0x4D42) { // BMP signature

		util_sd_read_32(bmp_file); // Read & ignore file size
		util_sd_read_32(bmp_file); // Read & ignore creator bytes
		bmp_image_offset = util_sd_read_32(bmp_file); // Start of image data
		util_sd_read_32(bmp_file); // Read & ignore DIB header size

		// Read DIB header
		width = util_sd_read_32(bmp_file);
		height = util_sd_read_32(bmp_file);
		uint8_t planes = util_sd_read_16(bmp_file);
		if (planes == 1) { // # planes -- must be '1'
			depth = util_sd_read_16(bmp_file); // bits per pixel
			util_sd_read_32(bmp_file); //Ignore compression, YOLO!
			// If bmpHeight is negative, image is in top-down order.
			// This is not canon but has been observed in the wild.
			if (height < 0) {
				height = -height;
				flip = false;
			}

			// Crop area to be loaded
			w = width;
			h = height;
			if ((x + w - 1) >= GFX_WIDTH)
				w = GFX_WIDTH - x;
			if ((y + h - 1) >= GFX_HEIGHT)
				h = GFX_HEIGHT - y;

			// Set TFT address window to clipped image bounds
			st7735_set_addr(x, y, x + w - 1, y + h - 1);

			//Handle 16-bit 565 bmp
			if (depth == 16) {
				// BMP rows are padded (if needed) to 4-byte boundary
				rowSize = (width * 2 + 3) & ~3;

				for (row = 0; row < h; row++) { // For each scanline...

					// Seek to start of scan line.  It might seem labor-
					// intensive to be doing this on every line, but this
					// method covers a lot of gritty details like cropping
					// and scanline padding.  Also, the seek only takes
					// place if the file position actually needs to change
					// (avoids a lot of cluster math in SD library).
					if (flip) // Bitmap is stored bottom-to-top order (normal BMP)
						pos = bmp_image_offset + (height - 1 - row) * rowSize;
					else
						// Bitmap is stored top-to-bottom
						pos = bmp_image_offset + row * rowSize;
					if (f_tell(bmp_file) != pos) { // Need seek?
						f_lseek(bmp_file, pos);
						buffidx = sizeof(sdbuffer); // Force buffer reload
					}

					//Populate the row buffer
					UINT count;
					f_read(bmp_file, sdbuffer, rowSize, &count);
					buffidx = 0; // Set index to beginning

					for (uint16_t i = 0; i < rowSize; i += 2) {
						uint16_t temp = sdbuffer[i];
						sdbuffer[i] = sdbuffer[i + 1];
						sdbuffer[i + 1] = temp;
					}

					st7735_push_colors(sdbuffer, rowSize);
				} // end scanline
			}
			//Handle 24-bit RGB bmp
			else if (depth == 24) { // 0 = uncompressed
				// BMP rows are padded (if needed) to 4-byte boundary
				rowSize = (width * 3 + 3) & ~3;

				for (row = 0; row < h; row++) { // For each scanline...

					// Seek to start of scan line.  It might seem labor-
					// intensive to be doing this on every line, but this
					// method covers a lot of gritty details like cropping
					// and scanline padding.  Also, the seek only takes
					// place if the file position actually needs to change
					// (avoids a lot of cluster math in SD library).
					if (flip) // Bitmap is stored bottom-to-top order (normal BMP)
						pos = bmp_image_offset + (height - 1 - row) * rowSize;
					else
						// Bitmap is stored top-to-bottom
						pos = bmp_image_offset + row * rowSize;
					if (f_tell(bmp_file) != pos) { // Need seek?
						f_lseek(bmp_file, pos);
						buffidx = sizeof(sdbuffer); // Force buffer reload
					}

					for (col = 0; col < w; col++) { // For each pixel...
						// Time to read more pixel data?
						if (buffidx >= sizeof(sdbuffer)) { // Indeed
							UINT count;
							f_read(bmp_file, sdbuffer, sizeof(sdbuffer),
									&count);
							buffidx = 0; // Set index to beginning
						}

						// Convert pixel from BMP to TFT format, push to display
						b = sdbuffer[buffidx++];
						g = sdbuffer[buffidx++];
						r = sdbuffer[buffidx++];
						st7735_push_color(st7735_color565(r, g, b));
					} // end pixel
				} // end scanline
			} // end goodBmp
		}
	}

	f_close(bmp_file);
}
#endif

void util_gfx_draw_bmp(bitmap_t *p_bitmap, uint16_t x, uint16_t y, uint16_t color) {
	int16_t i, j;
	uint16_t offset = 0;

	uint8_t b = p_bitmap->data[offset];
	offset++;
	int8_t m = 7;

	//Crop bitmap
	uint8_t w = MIN(p_bitmap->width, ST7735_WIDTH - x);
	uint8_t h = MIN(p_bitmap->height, ST7735_HEIGHT - y);

	//Walk through pixels one at a time drawing
	for (j = 0; j < h; j++) {
		for (i = 0; i < w; i++) {
			if ((b >> m) & 0x01) {
				st7735_draw_pixel(x + i, y + j, color);
			} else {
			}

			m--;
			if (m < 0) {
				m = 7;
				b = p_bitmap->data[offset];
				offset++;
			}
		}
	}
}

// Draw a circle at x, y with radius r and color.
// NOTE: Color is 16-bit (565)
void util_gfx_draw_circle(int16_t x0, int16_t y0, int16_t r, uint16_t color) {
	int16_t f = 1 - r;
	int16_t ddF_x = 1;
	int16_t ddF_y = -2 * r;
	int16_t x = 0;
	int16_t y = r;

	st7735_draw_pixel(x0, y0 + r, color);
	st7735_draw_pixel(x0, y0 - r, color);
	st7735_draw_pixel(x0 + r, y0, color);
	st7735_draw_pixel(x0 - r, y0, color);

	while (x < y) {
		if (f >= 0) {
			y--;
			ddF_y += 2;
			f += ddF_y;
		}
		x++;
		ddF_x += 2;
		f += ddF_x;

		st7735_draw_pixel(x0 + x, y0 + y, color);
		st7735_draw_pixel(x0 - x, y0 + y, color);
		st7735_draw_pixel(x0 + x, y0 - y, color);
		st7735_draw_pixel(x0 - x, y0 - y, color);
		st7735_draw_pixel(x0 + y, y0 + x, color);
		st7735_draw_pixel(x0 - y, y0 + x, color);
		st7735_draw_pixel(x0 + y, y0 - x, color);
		st7735_draw_pixel(x0 - y, y0 - x, color);
	}
}

void util_gfx_draw_line(int16_t x0, int16_t y0, int16_t x1, int16_t y1, uint16_t color) {

    //Simplify direction we're drawing the line in
    if (x0 > x1) {
        _swap_int16_t(x0, x1);
        _swap_int16_t(y0, y1);
    }

	//Horizontal line, draw fast
	if (y0 == y1) {
		util_gfx_fill_rect(x0, y0, x1 - x0, 1, color);
		return;
	} else if (x0 == x1) {
		util_gfx_fill_rect(x0, y0, 1, y1 - y0, color);
		return;
	}

	int16_t steep = abs(y1 - y0) > abs(x1 - x0);
	if (steep) {
		_swap_int16_t(x0, y0);
		_swap_int16_t(x1, y1);
	}

	int16_t dx, dy;
	dx = x1 - x0;
	dy = abs(y1 - y0);

	int16_t err = dx / 2;
	int16_t ystep;

	if (y0 < y1) {
		ystep = 1;
	} else {
		ystep = -1;
	}

	for (; x0 <= x1; x0++) {
		if (steep) {
			st7735_draw_pixel(y0, x0, color);
		} else {
			st7735_draw_pixel(x0, y0, color);
		}
		err -= dy;
		if (err < 0) {
			y0 += ystep;
			err += dx;
		}
	}
}

void util_gfx_draw_raw(int16_t x, int16_t y, uint16_t w, uint16_t h, uint8_t *p_raw) {

	//clip
	if (x < 0 || x > GFX_WIDTH - w || y < 0 || y > GFX_HEIGHT - h) {
		return;
	}

	//Hang out until LCD is free
	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
	st7735_set_addr(x, y, x + w - 1, y + h - 1);
	st7735_push_colors(p_raw, (w * h * 2));
	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
}

void util_gfx_draw_raw_int16(int16_t x, int16_t y, uint16_t w, uint16_t h, const uint16_t *p_raw) {

	//clip
	if (x < 0 || x > GFX_WIDTH - w || y < 0 || y > GFX_HEIGHT - h) {
		return;
	}

	//Hang out until LCD is free
	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
	//Walk through pixels one at a time drawing
		for (int j = 0; j < h; j++) {
			for (int i = 0; i < w; i++) {
				st7735_draw_pixel(x + i, y + j, p_raw[j*w+i]);
			}
		}
	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}
}

void util_gfx_draw_raw_async(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *p_raw) {

    //clip
    if (x < 0 || x > GFX_WIDTH - w || y < 0 || y > GFX_HEIGHT - h) {
        return;
    }

    //Hang out until LCD is free
    while (st7735_is_busy()) {
        APP_ERROR_CHECK(sd_app_evt_wait());
    }
    st7735_set_addr(x, y, x + w - 1, y + h - 1);
    st7735_push_colors_fast((uint8_t*)p_raw, (w * h * 2));
    //don't wait for it to finish
}

uint8_t util_gfx_draw_raw_file(const char *filename, int16_t x, int16_t y, uint16_t w, uint16_t h,
                               void (*p_frame_callback)(uint8_t frame, void *p_data),
                               bool loop,
                               void *data) {

#ifdef DC801_EMBEDDED
	FIL raw_file;
#endif

#ifdef DC801_DESKTOP
	FIL *raw_file;
#endif

	FRESULT result;
	int32_t bytecount;
	uint16_t chunk_size = 8 * 128 * 2;
	uint8_t sdbuffer[chunk_size];
	UINT count;
	uint16_t frames = 1;
	uint8_t retVal = USER_BUTTON_NONE;


	//Stat the file to determine frame count
	uint32_t fsize = util_sd_file_size(filename);
	if (fsize == 0) {
		NRF_LOG_INFO("Could not stat %s.", filename);
		return retVal;
	}


	//Determine how many frames are in the file, minimum of 1
	frames = MAX(fsize / w / h / 2, 1);

	// Open requested file on SD card
	result = f_open(&raw_file, filename, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
        NRF_LOG_INFO("Could not open %s.", filename);
		return retVal;
	}

	m_stop = false;
	do {
	#ifdef DC801_EMBEDDED
		result = f_lseek(&raw_file, 0);	//Ensure we're starting at beginning of file for first frame
	#endif

	#ifdef DC801_DESKTOP
		result = f_lseek(raw_file, 0);	//Ensure we're starting at beginning of file for first frame
	#endif
		if (result != FR_OK) {
            NRF_LOG_INFO("Error while seeking SD. Error code: %d", result);
            util_sd_error();
		}

		for (uint16_t i = 0; i < frames; i++) {
			//Hang out until LCD is free
            while (app_usbd_event_queue_process());
            while (st7735_is_busy()) {
                APP_ERROR_CHECK(sd_app_evt_wait());
			}

			// Set TFT address window to clipped image bounds
			st7735_set_addr(x, y, x + w - 1, y + h - 1);

			bytecount = w * h * 2;

			//Blast data to TFT
			while (bytecount > 0) {

				#ifdef DC801_DESKTOP
					if (application_quit != 0)
					{
						break;
					}
				#endif

                //Hang out until LCD is free
                while (st7735_is_busy()) {
                    APP_ERROR_CHECK(sd_app_evt_wait());
                }

				//Populate the row buffer
			#ifdef DC801_EMBEDDED
				result = f_read(&raw_file, sdbuffer, MIN(chunk_size, bytecount), &count);
			#endif

			#ifdef DC801_DESKTOP
				result = f_read(raw_file, sdbuffer, MIN(chunk_size, bytecount), &count);
			#endif

				//Check for error
				if (result != FR_OK) {
					printf("Failed to read file: %s, size: %d\n", filename, MIN(chunk_size, bytecount));
					printf("Read count: %d\n", count);
                    util_sd_error();
				}

                //Push the colors async
				APP_ERROR_CHECK(st7735_push_colors_fast(sdbuffer, count));

				bytecount -= count;
			}

			//frame complete, callback
			if (p_frame_callback != NULL) {
				p_frame_callback(i, data);
			}

			//if we're looping give them a way out
			retVal = getButton(false);
			if (retVal != USER_BUTTON_NONE || m_stop) {
				loop = false;
				break;
			}
		}

		#ifdef DC801_DESKTOP
			if (application_quit != 0)
			{
				break;
			}
		#endif

	} while (loop && !m_stop);

#ifdef DC801_EMBEDDED
	f_close(&raw_file);
#endif

#ifdef DC801_DESKTOP
	f_close(raw_file);
#endif

	//Hang out until LCD is free
	while (st7735_is_busy()) {
		APP_ERROR_CHECK(sd_app_evt_wait());
	}

	//All done, if looping button state will the button that caused it to quit, otherwise 0
	return retVal;
}

void util_gfx_draw_raw_file_stop() {
	m_stop = true;
}

void util_gfx_draw_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
	util_gfx_draw_line(x, y, x + w - 1, y, color);
	util_gfx_draw_line(x, y, x, y + h - 1, color);
	util_gfx_draw_line(x + w - 1, y, x + w - 1, y + h, color);
	util_gfx_draw_line(x, y + h - 1, x + w - 1, y + h - 1, color);
}

void util_gfx_draw_triangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1,
		int16_t x2, int16_t y2, uint16_t color) {
	util_gfx_draw_line(x0, y0, x1, y1, color);
	util_gfx_draw_line(x1, y1, x2, y2, color);
	util_gfx_draw_line(x2, y2, x0, y0, color);
}

void util_gfx_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
	st7735_fill_rect(x, y, w, h, color);
}

void util_gfx_fill_screen(uint16_t color) {
	st7735_fill_rect(0, 0, ST7735_WIDTH, ST7735_HEIGHT, color);
}

uint8_t util_gfx_font_height() {
	return __get_font().yAdvance;
}

// * Returns the width of a character for the current font, careful,  this is unreliable with non-fixed fonts
uint8_t util_gfx_font_width() {
	GFXfont font = __get_font();
	return font.glyph[0].xAdvance;
}

uint16_t util_gfx_color_get() {
	return m_color;
}

int16_t util_gfx_cursor_x_get() {
	return m_cursor_x;
}

int16_t util_gfx_cursor_y_get() {
	return m_cursor_y;
}

inline void util_gfx_invalidate() {
	m_valid_state = false;
}

inline void util_gfx_validate() {
	m_valid_state = true;
}

inline bool util_gfx_is_valid_state() {
	return m_valid_state;
}

#ifdef DC801_EMBEDDED
void util_gfx_load_raw(uint8_t *raw, char *filename, uint16_t size) {
	FIL raw_file;
	UINT count = 0;
	FRESULT result = f_open(&raw_file, filename, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
//		char message[128];
//		sprintf(message, "Could not open %s.", filename);
		//mbp_ui_error(message);
		return;
	}

	result = f_read(&raw_file, raw, size, &count);
	if (result != FR_OK) {
//		char message[128];
//		sprintf(message, "Could not read %s.", filename);
		//mbp_ui_error(message);
	}

	f_close(&raw_file);
}
#endif

#ifdef DC801_DESKTOP
void util_gfx_load_raw(uint8_t *raw, char *filename, uint16_t size) {
	FIL *raw_file;
	UINT count = 0;
	FRESULT result = f_open(&raw_file, filename, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
//		char message[128];
//		sprintf(message, "Could not open %s.", filename);
		//mbp_ui_error(message);
		return;
	}

	result = f_read(raw_file, raw, size, &count);
	if (result != FR_OK) {
//		char message[128];
//		sprintf(message, "Could not read %s.", filename);
		//mbp_ui_error(message);
	}

	f_close(raw_file);
}
#endif

void util_gfx_get_text_bounds(char *str, int16_t x, int16_t y, uint16_t *w, uint16_t *h) {
	uint8_t c; // Current character

	GFXfont font = __get_font();

	*w = *h = 0;

	GFXglyph glyph;

	uint8_t first = font.first;
	uint8_t last = font.last;
	uint8_t gw, gh, xa;
	int8_t xo, yo;
	int16_t minx = GFX_WIDTH;
	int16_t miny = GFX_HEIGHT;
	int16_t maxx = -1, maxy = -1, gx1, gy1, gx2, gy2;
	int16_t ya = font.yAdvance;

	//Walk through each character
	while ((c = *str++)) {
		if (c != '\n') { // Not a newline
			if (c != '\r') { // Not a carriage return, is normal char
				if ((c >= first) && (c <= last)) { // Char present in current font
					c -= first;
					glyph = font.glyph[c];
					gw = glyph.width;
					gh = glyph.height;
					xa = glyph.xAdvance;
					xo = glyph.xOffset;
					yo = glyph.yOffset;
					if (m_wrap && ((x + ((int16_t) xo + gw)) >= GFX_WIDTH)) {
						// Line wrap
						x = 0;  // Reset x to 0
						y += ya; // Advance y by 1 line
					}
					gx1 = x + xo;
					gy1 = y + yo;
					gx2 = gx1 + gw - 1;
					gy2 = gy1 + gh - 1;
					if (gx1 < minx)
						minx = gx1;
					if (gy1 < miny)
						miny = gy1;
					if (gx2 > maxx)
						maxx = gx2;
					if (gy2 > maxy)
						maxy = gy2;
					x += xa;
				}
			} // Carriage return = do nothing
		} else { // Newline
			x = 0;  // Reset x
			y += ya; // Advance y by 1 line
		}
	}
	// End of string

	if (maxx >= minx)
		*w = maxx - minx + 1;
	if (maxy >= miny)
		*h = maxy - miny + 1;
}

void util_gfx_init() {
	util_gfx_cursor_area_reset();
	util_gfx_fill_screen(COLOR_BLACK);
}

void util_gfx_print_char(char letter){
    GFXfont font = __get_font();

    __write_char(letter, font);
}

void util_gfx_print(const char *text) {
	GFXfont font = __get_font();

	for (uint16_t i = 0; i < strlen(text); i++) {
		__write_char(text[i], font);
	}
}

// Converts 32-bit RGB color to 565
uint16_t util_gfx_rgb_to_565(uint32_t rgb) {
	uint32_t c = ((0xF80000 & rgb) >> 8) | ((0x00FC00 & rgb) >> 5) | (0xF8 & rgb) >> 3;
	return (uint16_t) c;
}

void util_gfx_set_color(uint16_t color) {
	m_color = color;
}

void util_gfx_set_cursor(int16_t x, int16_t y) {
	m_cursor_x = x;
	m_cursor_y = y + (util_gfx_font_height() / 2);
}

void util_gfx_cursor_area_set(area_t area) {
	m_cursor_area = area;
}

void util_gfx_set_font(uint8_t font) {
	m_font = font;	//May need to do some range checking
}

void util_gfx_set_pixel(int16_t x, int16_t y, uint16_t color) {
	st7735_draw_pixel(x, y, color);
}

void util_gfx_set_wrap(bool wrap) {
	m_wrap = wrap;
}

*/