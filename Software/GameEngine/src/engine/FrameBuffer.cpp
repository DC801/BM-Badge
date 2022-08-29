#include "main.h"
#include "utility.h"
#include "convert_endian.h"
#include "FrameBuffer.h"
#include "modules/sd.h"
#include "config/custom_board.h"
#include "EnginePanic.h"
#include "EngineROM.h"

#include "adafruit/gfxfont.h"

#include <algorithm>

#ifndef DC801_EMBEDDED
#include <SDL.h>
#include "shim_timer.h"
#include "shim_err.h"
#include "EngineWindowFrame.h"
#endif

#ifndef min
#define min(a,b) ((a)<(b)?(a):(b))
#endif

#ifndef max
#define max(a,b) ((a)>(b)?(a):(b))
#endif

#define MAX_ROM_CONTINUOUS_COLOR_DATA_READ_LENGTH 64

//Cursor coordinates
static int16_t m_cursor_x = 0;
static int16_t m_cursor_y = 0;
static area_t m_cursor_area = { 0, 0, WIDTH, HEIGHT };
static uint16_t m_color = COLOR_WHITE;
static bool m_wrap = true;
static volatile bool m_stop = false;

uint16_t frame[FRAMEBUFFER_SIZE];
FrameBuffer canvas;

FrameBuffer* p_canvas(void) { return &canvas; }

FrameBuffer::FrameBuffer() {
	fadeFraction = 0.0f;
	isFading = false;
	fadeColor = 0x0000;
}
FrameBuffer::~FrameBuffer() {}

void FrameBuffer::clearScreen(uint16_t color) {
	for (uint32_t i = 0; i < FRAMEBUFFER_SIZE; ++i)
	{
		frame[i] = SCREEN_ENDIAN_U2_VALUE(color);
	}
}

void FrameBuffer::drawPixel(int x, int y, uint16_t color) {
	frame[y * WIDTH + x] = SCREEN_ENDIAN_U2_VALUE(color);
}

void FrameBuffer::drawHorizontalLine(int x1, int y, int x2, uint16_t color) {
	int s1 = min(x1, x2);
	int s2 = max(x1, x2);
	if (y < 0 || y >= HEIGHT) { return; }
	for (int x = s1; x <= s2; ++x) {
		if (
			x >= 0
			&& x < WIDTH
			) {
			frame[x + (y * WIDTH)] = SCREEN_ENDIAN_U2_VALUE(color);
		}
	}
}

void FrameBuffer::drawVerticalLine(int x, int y1, int y2, uint16_t color) {
	int s1 = min(y1, y2);
	int s2 = max(y1, y2);
	if (x < 0 || x >= WIDTH) { return; }
	for (int y = s1; y <= s2; ++y) {
		if (
			y >= 0
			&& y < HEIGHT
			) {
			frame[x + (y * WIDTH)] = SCREEN_ENDIAN_U2_VALUE(color);
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t* data)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i = x; i < (x + w); ++i)
		{
			frame[j * WIDTH + i] = data[idx++];
		}
	}

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t* data, uint16_t transparent_color)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i = x; i < (x + w); ++i)
		{
			uint16_t c = data[idx++];

			if (c != SCREEN_ENDIAN_U2_VALUE(transparent_color))
			{
				frame[j * WIDTH + i] = c;
			}
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t* data)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i = x; i < (x + w); ++i)
		{
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];

			frame[j * WIDTH + i] = ((uint16_t)d1 << 8) | d2;
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t* data, uint16_t transparent_color)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i = x; i < (x + w); ++i)
		{
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];
			uint16_t c = ((uint16_t)d1 << 8) | d2;

			if (c != SCREEN_ENDIAN_U2_VALUE(transparent_color))
			{
				frame[j * WIDTH + i] = c;
			}
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t* data, int fx, int fy, int pitch)
{
	for (int i = 0, idx = pitch * fy + fx; i < h; ++i, idx += pitch)
	{
		memcpy(&frame[(y + i) * WIDTH + x], &data[idx], sizeof(uint16_t) * w);
	}
}

void FrameBuffer::drawImage(
	int x,
	int y,
	int w,
	int h,
	const uint16_t* data,
	int fx,
	int fy,
	int pitch,
	uint16_t transparent_color
) {
	int32_t current_x = 0;
	int32_t current_y = 0;
	for (int offsetY = 0; (offsetY < h) && (current_y < HEIGHT); ++offsetY)
	{
		current_y = offsetY + y;
		current_x = 0;
		for (int offsetX = 0; (offsetX < w) && (current_x < WIDTH); ++offsetX)
		{
			current_x = offsetX + x;
			if (
				current_x >= 0
				&& current_x < WIDTH
				&& current_y >= 0
				&& current_y < HEIGHT
				)
			{
				uint16_t color = data[pitch * (fy + offsetY) + offsetX + fx];
				if (color != SCREEN_ENDIAN_U2_VALUE(transparent_color))
				{
					frame[(current_y * WIDTH) + current_x] = color;
				}
			}
		}
	}
}

void FrameBuffer::drawImageWithFlags(
	int x,
	int y,
	int w,
	int h,
	const uint16_t* data,
	int fx,
	int fy,
	int pitch,
	uint16_t transparent_color,
	uint8_t flags
) {
	int32_t current_x = 0;
	int32_t current_y = 0;
	uint32_t sprite_x = 0;
	uint32_t sprite_y = 0;
	uint32_t source_x = 0;
	uint32_t source_y = 0;
	bool flip_x = flags & FLIPPED_HORIZONTALLY_FLAG;
	bool flip_y = flags & FLIPPED_VERTICALLY_FLAG;
	bool flip_diag = flags & FLIPPED_DIAGONALLY_FLAG;
	for (int offset_y = 0; (offset_y < h) && (current_y < HEIGHT); ++offset_y)
	{
		current_y = offset_y + y;
		current_x = 0;
		for (int offset_x = 0; (offset_x < w) && (current_x < WIDTH); ++offset_x)
		{
			current_x = offset_x + x;
			if (
				current_x >= 0
				&& current_x < WIDTH
				&& current_y >= 0
				&& current_y < HEIGHT
				)
			{
				source_x = flip_diag ? offset_y : offset_x;
				source_y = flip_diag ? offset_x : offset_y;
				sprite_x = flip_x
					? fx + (w - source_x - 1)
					: fx + source_x;
				sprite_y = flip_y
					? fy + (h - source_y - 1)
					: fy + source_y;
				uint16_t color = data[(pitch * sprite_y) + sprite_x];
				if (color != SCREEN_ENDIAN_U2_VALUE(transparent_color))
				{
					frame[(current_y * WIDTH) + current_x] = color;
				}
			}
		}
	}
}

void FrameBuffer::drawChunkWithFlags(
	uint32_t address,
	MageColorPalette* colorPaletteOriginal,
	int32_t screen_x, // top-left corner of screen coordinates to draw at
	int32_t screen_y, // top-left corner of screen coordinates to draw at
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x, // top-left corner of source image coordinates to READ FROM
	uint16_t source_y, // top-left corner of source image coordinates to READ FROM
	uint16_t pitch, // The width of the source image in pixels
	uint16_t transparent_color,
	uint8_t flags
)
{
	MageColorPalette colorPaletteFaded;
	MageColorPalette* colorPalette = colorPaletteOriginal;
	RenderFlagsUnion flagSplit;
	flagSplit.i = flags;
	bool flip_x = flagSplit.f.horizontal;
	bool flip_y = flagSplit.f.vertical;
	bool flip_diag = flagSplit.f.diagonal;
	bool glitched = flagSplit.f.glitched;
	transparent_color = SCREEN_ENDIAN_U2_VALUE(transparent_color);

	if (glitched) {
		screen_x += tile_width * 0.125;
		tile_width *= 0.75;
	}

	if (
		screen_x + tile_width < 0 ||
		screen_x >= WIDTH ||
		screen_y + tile_width < 0 ||
		screen_y >= HEIGHT
		) {
		return;
	}

	auto pixels = std::make_unique<uint8_t[]>(tile_width * tile_height);

	EngineROM_Read(
		address + ((source_y * pitch) + source_x),
		tile_width * tile_height,
		pixels.get(),
		"Failed to read pixel data"
	);

	if (fadeFraction != 0) {
		colorPaletteFaded = MageColorPalette(
			colorPaletteOriginal,
			transparent_color,
			fadeColor,
			fadeFraction
		);
		colorPalette = &colorPaletteFaded;
	}

	if (flip_x == false && flip_y == false && flip_diag == false) {
		tileToBufferNoXNoYNoZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == true && flip_y == false && flip_diag == false) {
		tileToBufferYesXNoYNoZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == false && flip_y == true && flip_diag == false) {
		tileToBufferNoXYesYNoZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == true && flip_y == true && flip_diag == false) {
		tileToBufferYesXYesYNoZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == false && flip_y == false && flip_diag == true) {
		tileToBufferNoXNoYYesZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == true && flip_y == false && flip_diag == true) {
		tileToBufferYesXNoYYesZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == false && flip_y == true && flip_diag == true) {
		tileToBufferNoXYesYYesZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
	else if (flip_x == true && flip_y == true && flip_diag == true) {
		tileToBufferYesXYesYYesZ(
			pixels.get(),
			colorPalette,
			screen_x,
			screen_y,
			tile_width,
			tile_height,
			source_x,
			source_y,
			pitch,
			transparent_color
		);
	}
}

void FrameBuffer::tileToBufferNoXNoYNoZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = -screen_x;
		d.x = tile_width;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = 0;
		d.x = WIDTH - screen_x;
		screen_x_start = screen_x;
	}
	else {
		a.x = 0;
		d.x = tile_width;
		screen_x_start = screen_x;
	}

	if (screen_y < 0) {
		a.y = -screen_y;
		d.y = tile_height;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = 0;
		d.y = HEIGHT - screen_y;
		screen_y_start = screen_y;
	}
	else {
		a.y = 0;
		d.y = tile_height;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = d.y - a.y;
	uint16_t num_cols = d.x - a.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.x + col) + //x
				((a.y + row) * tile_width) //y
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferYesXNoYNoZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = screen_x + tile_width;
		d.x = 0;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = tile_width;
		d.x = (screen_x + tile_width) - WIDTH;
		screen_x_start = screen_x;
	}
	else {
		a.x = tile_width;
		d.x = 0;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = -screen_y;
		d.y = tile_height;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = 0;
		d.y = HEIGHT - screen_y;
		screen_y_start = screen_y;
	}
	else {
		a.y = 0;
		d.y = tile_height;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = d.y - a.y;
	uint16_t num_cols = a.x - d.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.x - (col + 1)) + //x (+1 to get back to zero-index)
				((a.y + row) * tile_width) //y
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferNoXYesYNoZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = -screen_x;
		d.x = tile_width;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = 0;
		d.x = WIDTH - screen_x;
		screen_x_start = screen_x;
	}
	else {
		a.x = 0;
		d.x = tile_width;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = screen_y + tile_height;
		d.y = 0;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = tile_height;
		d.y = (screen_y + tile_height) - HEIGHT;
		screen_y_start = screen_y;
	}
	else {
		a.y = tile_height;
		d.y = 0;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = a.y - d.y;
	uint16_t num_cols = d.x - a.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.x + col) + //x
				((a.y - (row + 1)) * tile_width) //y (+1 to get back to zero-index)
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferYesXYesYNoZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = screen_x + tile_width;
		d.x = 0;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = tile_width;
		d.x = (screen_x + tile_width) - WIDTH;
		screen_x_start = screen_x;
	}
	else {
		a.x = tile_width;
		d.x = 0;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = screen_y + tile_height;
		d.y = 0;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = tile_height;
		d.y = (screen_y + tile_height) - HEIGHT;
		screen_y_start = screen_y;
	}
	else {
		a.y = tile_height;
		d.y = 0;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = a.y - d.y;
	uint16_t num_cols = a.x - d.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.x - (col + 1)) + //x (+1 to get back to zero-index)
				((a.y - (row + 1)) * tile_width) //y (+1 to get back to zero-index)
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferNoXNoYYesZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = -screen_x;
		d.x = tile_width;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = 0;
		d.x = WIDTH - screen_x;
		screen_x_start = screen_x;
	}
	else {
		a.x = 0;
		d.x = tile_width;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = -screen_y;
		d.y = tile_height;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = 0;
		d.y = HEIGHT - screen_y;
		screen_y_start = screen_y;
	}
	else {
		a.y = 0;
		d.y = tile_height;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = d.y - a.y;
	uint16_t num_cols = d.x - a.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.y + row) + //transposed x
				((a.x + col) * tile_width) //transposed y
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferYesXNoYYesZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = screen_x + tile_width;
		d.x = 0;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = tile_width;
		d.x = (screen_x + tile_width) - WIDTH;
		screen_x_start = screen_x;
	}
	else {
		a.x = tile_width;
		d.x = 0;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = -screen_y;
		d.y = tile_height;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = 0;
		d.y = HEIGHT - screen_y;
		screen_y_start = screen_y;
	}
	else {
		a.y = 0;
		d.y = tile_height;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = d.y - a.y;
	uint16_t num_cols = a.x - d.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.y + row) + //transposed x
				((a.x - (col + 1)) * tile_width) //transposed y (+1 to get back to zero-index)
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferNoXYesYYesZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = -screen_x;
		d.x = tile_width;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = 0;
		d.x = WIDTH - screen_x;
		screen_x_start = screen_x;
	}
	else {
		a.x = 0;
		d.x = tile_width;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = screen_y + tile_height;
		d.y = 0;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = tile_height;
		d.y = (screen_y + tile_height) - HEIGHT;
		screen_y_start = screen_y;
	}
	else {
		a.y = tile_height;
		d.y = 0;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = a.y - d.y;
	uint16_t num_cols = d.x - a.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.y - (row + 1)) + //transposed x (+1 to get back to zero-index)
				((a.x + col) * tile_width) //transposed y
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index % colorPalette->colorCount];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::tileToBufferYesXYesYYesZ(
	uint8_t* pixels,
	MageColorPalette* colorPalette,
	int32_t screen_x,
	int32_t screen_y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	uint16_t pitch,
	uint16_t transparent_color
) {
	uint16_t color = transparent_color;
	int32_t screen_x_start = 0;
	int32_t screen_y_start = 0;
	uint32_t screen_index = 0;
	uint32_t tile_index = 0;
	Point a = { 0,0 };
	Point d = { 0,0 };
	if (screen_x < 0) {
		a.x = screen_x + tile_width;
		d.x = 0;
		screen_x_start = 0;
	}
	else if (screen_x + tile_width >= WIDTH) {
		a.x = tile_width;
		d.x = (screen_x + tile_width) - WIDTH;
		screen_x_start = screen_x;
	}
	else {
		a.x = tile_width;
		d.x = 0;
		screen_x_start = screen_x;
	}
	if (screen_y < 0) {
		a.y = screen_y + tile_height;
		d.y = 0;
		screen_y_start = 0;
	}
	else if (screen_y + tile_height >= HEIGHT) {
		a.y = tile_height;
		d.y = (screen_y + tile_height) - HEIGHT;
		screen_y_start = screen_y;
	}
	else {
		a.y = tile_height;
		d.y = 0;
		screen_y_start = screen_y;
	}
	uint16_t num_rows = a.y - d.y;
	uint16_t num_cols = a.x - d.x;
	for (uint16_t row = 0; row < num_rows; row++) {
		for (uint16_t col = 0; col < num_cols; col++) {
			screen_index = (
				(screen_x_start + col) + //x
				((screen_y_start + row) * WIDTH) //y
				);
			tile_index = (
				(a.y - (row + 1)) + //transposed x (+1 to get back to zero-index)
				((a.x - (col + 1)) * tile_width) //transposed y (+1 to get back to zero-index)
				);
			uint8_t color_index = pixels[tile_index];
			color = colorPalette->colors[color_index];
			if (color != transparent_color) {
				frame[screen_index] = color;
			}
		}
	}
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch) {
	const size_t bufferSize = w * h;
	auto buf = std::make_unique<uint16_t[]>(bufferSize);
	FILE* fd = fopen(filename, "rb");
	fseek(fd, (pitch * fy + fx) * sizeof(uint16_t), SEEK_SET);

	for (int i = 0; i < h; ++i)
	{
		size_t size = fread(&buf[i * w], sizeof(uint16_t), w, fd);
		fseek(fd, (pitch - w) * sizeof(uint16_t), SEEK_CUR);
	}

	fclose(fd);
	ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
	drawImage(x, y, w, h, buf.get());
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t transparent_color) {
	const size_t bufferSize = w * h;
	auto buf = std::make_unique<uint16_t[]>(bufferSize);

	FILE* fd = fopen(filename, "rb");
	fseek(fd, (pitch * fy + fx) * sizeof(uint16_t), SEEK_SET);

	for (int i = 0; i < h; ++i)
	{
		size_t size = fread(&buf[i * w], sizeof(uint16_t), w, fd);
		fseek(fd, (pitch - w) * sizeof(uint16_t), SEEK_CUR);
	}

	fclose(fd);

	ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
	drawImage(x, y, w, h, buf.get(), transparent_color);
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename)
{
	const size_t bufferSize = w * h;
	auto buf = std::make_unique<uint16_t[]>(bufferSize);

	uint32_t offset = 0;
	m_stop = false;

	FILE* file = fopen(filename, "rb");

	if (file == NULL)
	{
		debug_print("Can't load file %s\n", filename);
		return;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		debug_print("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		debug_print("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		debug_print("Could not stat %s.\n", filename);
		return;
	}

	for (uint16_t i = 0; i < frames; i++)
	{
		retval = fseek(file, offset, SEEK_SET);

		if (retval != 0)
		{
			debug_print("Failed to seek the file %s\n", filename);
			fclose(file);
			return;
		}

		size_t read = fread(buf.get(), sizeof(uint8_t), size, file);

		if (read != size)
		{
			debug_print("Failed to read file %s\n", filename);
			fclose(file);
			return;
		}

		ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
		canvas.drawImage(x, y, w, h, buf.get());
		canvas.blt();

		uint8_t retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}

		offset += size;
		nrf_delay_us(7500);
	}

	fclose(file);

	ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
	canvas.drawImage(x, y, w, h, buf.get());
	canvas.blt();
	return;
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, void (*p_callback)(uint8_t frame, void* p_data), void* data)
{
	const size_t bufferSize = w * h;
	auto buf = std::make_unique<uint16_t[]>(bufferSize);

	uint32_t offset = 0;
	m_stop = false;

	FILE* file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		debug_print("Can't load file %s\n", filename);
		return;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		debug_print("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		debug_print("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		debug_print("Could not stat %s.\n", filename);
		return;
	}

	for (uint16_t i = 0; i < frames; i++)
	{
		retval = fseek(file, offset, SEEK_SET);

		if (retval != 0)
		{
			debug_print("Failed to seek the file %s\n", filename);
			fclose(file);
			return;
		}

		size_t read = fread(buf.get(), sizeof(uint8_t), size, file);

		if (read != size)
		{
			debug_print("Failed to read file %s\n", filename);
			fclose(file);
			return;
		}

		ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
		canvas.drawImage(x, y, w, h, buf.get());
		canvas.blt();

		if (p_callback != NULL)
		{
			p_callback(i, data);
		}

		uint8_t retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}

		offset += size;
		nrf_delay_us(7500);
	}

	fclose(file);
}

uint8_t FrameBuffer::drawLoopImageFromFile(int x, int y, int w, int h, const char* filename)
{
	const size_t bufferSize = w * h;
	auto buf = std::make_unique<uint16_t[]>(bufferSize);
	uint8_t retVal = USER_BUTTON_NONE;
	m_stop = false;

	FILE* file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		debug_print("Can't load file %s\n", filename);
		return 0;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		debug_print("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		debug_print("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		debug_print("Could not stat %s.\n", filename);
		return 0;
	}

	retval = fseek(file, 0, SEEK_SET);

	if (retval != 0)
	{
		debug_print("Failed to get file size: (seek start) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	if (size == 0)
	{
		debug_print("Could not stat %s.\n", filename);
		return 0;
	}

	do
	{
		uint32_t offset = 0;

		for (uint16_t i = 0; i < frames; i++)
		{
			retval = fseek(file, offset, SEEK_SET);

			if (retval != 0)
			{
				debug_print("Failed to seek the file %s\n", filename);
				fclose(file);
				return 0;
			}

			size_t read = fread(buf.get(), sizeof(uint8_t), size, file);

			if (read != size)
			{
				debug_print("Failed to read file %s\n", filename);
				fclose(file);
				return 0;
			}

			ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
			canvas.drawImage(x, y, w, h, buf.get());
			canvas.blt();

			uint8_t retVal = getButton(false);
			if (retVal != USER_BUTTON_NONE || m_stop)
			{
				break;
			}

			offset += size;
			nrf_delay_us(7500);
		}

		//if we're looping give them a way out
		retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}

#ifndef DC801_EMBEDDED
		if (application_quit != 0)
		{
			break;
		}
#endif

		nrf_delay_ms(10);
	} while (m_stop == false);

	fclose(file);
	return retVal;
}

uint8_t FrameBuffer::drawLoopImageFromFile(int x, int y, int w, int h, const char* filename, void (*p_callback)(uint8_t frame, void* p_data), void* data)
{
	size_t bufferSize = w * h;
	auto buf = std::make_unique<uint16_t[]>(bufferSize);
	uint8_t retVal = USER_BUTTON_NONE;
	m_stop = false;

	FILE* file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		debug_print("Can't load file %s\n", filename);
		return 0;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		debug_print("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		debug_print("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	size_t size = (size_t)tell_size;
	if (sizeof(uint16_t) * w * h < size) { size = sizeof(uint16_t) * w * h; }
	uint16_t frames = 1;
	if (frames < tell_size / w / h / sizeof(uint16_t)) { frames = tell_size / w / h / sizeof(uint16_t); }

	if (size == 0)
	{
		debug_print("Could not stat %s.\n", filename);
		return 0;
	}

	retval = fseek(file, 0, SEEK_SET);

	if (retval != 0)
	{
		debug_print("Failed to get file size: (seek start) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	if (size == 0)
	{
		debug_print("Could not stat %s.\n", filename);
		return 0;
	}

	do
	{
		uint32_t offset = 0;

		for (uint16_t i = 0; i < frames; i++)
		{
			retval = fseek(file, offset, SEEK_SET);

			if (retval != 0)
			{
				debug_print("Failed to seek the file %s\n", filename);
				fclose(file);
				return 0;
			}

			size_t read = fread(buf.get(), sizeof(uint8_t), size, file);

			if (read != size)
			{
				debug_print("Failed to read file %s\n", filename);
				fclose(file);
				return 0;
			}

			ROM_ENDIAN_U2_BUFFER(buf.get(), bufferSize);
			canvas.drawImage(x, y, w, h, buf.get());
			canvas.blt();

			if (p_callback != NULL)
			{
				p_callback(i, data);
			}

			uint8_t retVal = getButton(false);
			if (retVal != USER_BUTTON_NONE || m_stop)
			{
				break;
			}

			offset += size;
			nrf_delay_us(7500);
		}

		//if we're looping give them a way out
		retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}

#ifndef DC801_EMBEDDED
		if (application_quit != 0)
		{
			break;
		}
#endif

		nrf_delay_ms(10);
	} while (m_stop == false);

	fclose(file);
	return retVal;
}

void FrameBuffer::drawStop()
{
	m_stop = true;
}

void FrameBuffer::fillRect(int x, int y, int w, int h, uint16_t color)
{
	if ((x >= WIDTH) || (y >= HEIGHT))
	{
		debug_print("Rectangle off the screen\n");
		return;
	}

	// Clip to screen
	auto right = x + w;
	if (x + w > WIDTH) { right = WIDTH; }
	auto bottom = y + h;
	if (y + h > HEIGHT) { bottom = HEIGHT; }
	// X
	for (int i = x; i < right; i++)
	{
		// Y
		for (int j = y; j < bottom; j++)
		{
			int index = i + (WIDTH * j);
			frame[index] = SCREEN_ENDIAN_U2_VALUE(color);
		}
	}
}

void FrameBuffer::drawRect(int x, int y, int w, int h, uint16_t color) {
	drawHorizontalLine(x, y, x + w, color);
	drawHorizontalLine(x, y + h, x + w, color);
	drawVerticalLine(x, y, y + h, color);
	drawVerticalLine(x + w, y, y + h, color);
}

void FrameBuffer::drawTriangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2, uint16_t color)
{
	color = SCREEN_ENDIAN_U2_VALUE(color);
	drawLine(x0, y0, x1, y1, color);
	drawLine(x1, y1, x2, y2, color);
	drawLine(x2, y2, x0, y0, color);
}

float FrameBuffer::lerp(float a, float b, float progress) {
	return ((b - a) * progress) + a;
}

uint8_t FrameBuffer::lerp(uint8_t a, uint8_t b, float progress) {
	return ((b - a) * progress) + a;
}

Point FrameBuffer::lerpPoints(Point a, Point b, float progress) {
	Point point = {
		(int32_t)lerp((float)a.x, (float)b.x, progress),
		(int32_t)lerp((float)a.y, (float)b.y, progress),
	};
	return point;
}

uint16_t FrameBuffer::applyFadeColor(uint16_t color) {
	uint16_t result = color;
	if (fadeFraction) {
		auto fadeColorUnion = ColorUnion{};
		auto colorUnion = ColorUnion{};
		fadeColorUnion.i = fadeColor;
		colorUnion.i = result;
		colorUnion.c.r = FrameBuffer::lerp(colorUnion.c.r, fadeColorUnion.c.r, fadeFraction);
		colorUnion.c.g = FrameBuffer::lerp(colorUnion.c.g, fadeColorUnion.c.g, fadeFraction);
		colorUnion.c.b = FrameBuffer::lerp(colorUnion.c.b, fadeColorUnion.c.b, fadeFraction);
		colorUnion.c.alpha = FrameBuffer::lerp(colorUnion.c.alpha, fadeColorUnion.c.alpha, fadeFraction);
		result = colorUnion.i;
	}
	return result;
}

void FrameBuffer::drawLine(int x1, int y1, int x2, int y2, uint16_t color) {
	int dx = x2 - x1;
	int dy = y2 - y1;
	uint32_t length = ceil(sqrtf((float)((dx * dx) + (dy * dy))));
	int x;
	int y;
	float progress;
	for (uint32_t i = 0; i <= length; i++)
	{
		progress = ((float)i) / length;
		x = round(lerp((float)x1, (float)x2, progress));
		y = round(lerp((float)y1, (float)y2, progress));
		if ( // crop to screen bounds
			x >= 0
			&& x < WIDTH
			&& y >= 0
			&& y < HEIGHT
			) {
			frame[x + (y * WIDTH)] = SCREEN_ENDIAN_U2_VALUE(color);
		}
	}
}


void FrameBuffer::drawPoint(int x, int y, uint8_t size, uint16_t color) {
	drawLine(
		x - size,
		y - size,
		x + size,
		y + size,
		color
	);
	drawLine(
		x - size,
		y + size,
		x + size,
		y - size,
		color
	);
}

void FrameBuffer::fillCircle(int x, int y, int radius, uint16_t color) {
	int rad2 = radius * radius;

	for (int j = (y - radius);j <= (y + radius); ++j)
	{
		int yd = fabs(y - j);
		int radx2 = rad2 - yd * yd;

		for (int i = (x - radius);i <= (x + radius); ++i)
		{
			int xd = fabs(x - i);
			int dist2 = xd * xd;

			if (dist2 <= radx2)
			{
				frame[i + j * WIDTH] = SCREEN_ENDIAN_U2_VALUE(color);
			}
		}
	}
}

void FrameBuffer::mask(int px, int py, int rad1, int rad2, int rad3)
{
	int minx = px - rad3;
	int maxx = px + rad3;

	int miny = py - rad3;
	int maxy = py + rad3;

	for (int y = 0; y < HEIGHT; ++y)
	{
		for (int x = 0; x < WIDTH; ++x)
		{
			if ((x < minx) || (x > maxx) || (y < miny) || (y > maxy))
			{
				frame[x + y * WIDTH] = 0;
			}
			else
			{
				int dx = abs(x - px);
				int dy = abs(y - py);

				int dist = (dx * dx) + (dy * dy);

				if (dist > (rad3 * rad3))
				{
					frame[x + y * WIDTH] = 0;
				}
				else if (dist > (rad2 * rad2))
				{
					frame[x + y * WIDTH] = (frame[x + y * WIDTH] >> 2) & SCREEN_ENDIAN_U2_VALUE(0xF9E7); // ???
				}
				else if (dist > (rad1 * rad1))
				{
					frame[x + y * WIDTH] = (frame[x + y * WIDTH] >> 1) & SCREEN_ENDIAN_U2_VALUE(0xFBEF); // ???
				}
			}
		}
	}
}

static void __draw_char(
	int16_t x,
	int16_t y,
	unsigned char c,
	uint16_t color,
	uint16_t bg,
	GFXfont font
) {

	// Character is assumed previously filtered by write() to eliminate
	// newlines, returns, non-printable characters, etc.  Calling drawChar()
	// directly with 'bad' characters of font may cause mayhem!

	c -= font.first;
	GFXglyph* glyph = &(font.glyph[c]);
	uint8_t* bitmap = font.bitmap;

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
					canvas.drawPixel(x + xo + xx, y + yo + yy, SCREEN_ENDIAN_U2_VALUE(color));
				}
			}
			bits <<= 1;
		}
	}
}

void FrameBuffer::write_char(uint8_t c, GFXfont font) {
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
			GFXglyph* glyph = &(font.glyph[c2]);

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

void FrameBuffer::printMessage(const char* text, GFXfont font, uint16_t color, int x, int y)
{
	m_color = SCREEN_ENDIAN_U2_VALUE(color);
	m_cursor_area.xs = x;
	m_cursor_x = m_cursor_area.xs;
	m_cursor_y = y + (font.yAdvance / 2);

	// this prevents crashing if the first character of the string is null
	if (text[0] != '\0') {
		for (uint16_t i = 0; i < strlen(text); i++)
		{
			write_char(text[i], font);
		}
	}
	m_cursor_area.xs = 0;
}

void FrameBuffer::getCursorPosition(cursor_t* cursor)
{
	cursor->x = m_cursor_x;
	cursor->y = m_cursor_y;
}

void FrameBuffer::setTextArea(area_t* area)
{
	m_cursor_area = *area;
}

void FrameBuffer::getTextBounds(GFXfont font, const char* text, int16_t x, int16_t y, bounds_t* bounds)
{
	getTextBounds(font, text, x, y, NULL, bounds);
}

void FrameBuffer::getTextBounds(GFXfont font, const char* text, int16_t x, int16_t y, area_t* near, bounds_t* bounds)
{
	bounds->width = 0;
	bounds->height = 0;

	if (near != NULL)
	{
		m_cursor_area = *near;
	}

	GFXglyph glyph;

	uint8_t c;
	uint8_t first = font.first;
	uint8_t last = font.last;

	uint8_t gw, gh, xa;
	int8_t xo, yo;

	int16_t minx = WIDTH;
	int16_t miny = HEIGHT;

	int16_t maxx = -1;
	int16_t maxy = -1;

	int16_t gx1, gy1, gx2, gy2;
	int16_t ya = font.yAdvance;

	// Walk the string
	while ((c = *text++))
	{
		if ((c != '\n') && (c != '\r'))
		{
			if ((c >= first) && (c <= last))
			{
				c -= first;
				glyph = font.glyph[c];

				gw = glyph.width;
				gh = glyph.height;

				xa = glyph.xAdvance;
				xo = glyph.xOffset;
				yo = glyph.yOffset;

				if (m_wrap && ((x + ((int16_t)xo + gw)) >= WIDTH))
				{
					// Line wrap
					x = 0;
					y += ya;
				}

				gx1 = x + xo;
				gy1 = y + yo;
				gx2 = gx1 + gw - 1;
				gy2 = gy1 + gh - 1;

				if (gx1 < minx)
				{
					minx = gx1;
				}

				if (gy1 < miny)
				{
					miny = gy1;
				}

				if (gx2 > maxx)
				{
					maxx = gx2;
				}

				if (gy2 > maxy)
				{
					maxy = gy2;
				}

				x += xa;
			}
		}
		else if (c == '\n')
		{
			x = 0;
			y += ya;
		}
	}

	if (maxx >= minx)
	{
		bounds->width = maxx - minx + 1;
	}

	if (maxy >= miny)
	{
		bounds->height = maxy - miny + 1;
	}
}

uint8_t FrameBuffer::getFontHeight(GFXfont font)
{
	return font.yAdvance;
}

void draw_raw_async(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t* p_raw)
{
	//clip
	if ((x < 0) || (x > WIDTH - w) || (y < 0) || (y > HEIGHT - h))
	{
		return;
	}
#ifdef DC801_EMBEDDED
	while (ili9341_is_busy()) {
		//wait for previous transfer to complete before starting a new one
	}
	ili9341_set_addr(x, y, x + w - 1, y + h - 1);
	uint32_t bytecount = w * h * 2;
	ili9341_push_colors((uint8_t*)p_raw, bytecount);
#endif
	/*
	//Blast data to TFT
	while (bytecount > 0) {

		uint32_t count = MIN(320*80*2, bytecount);

		ili9341_push_colors((uint8_t*)p_raw, count);

		p_raw += count / 2; //convert to uint16_t count
		bytecount -= count;
	}
	//don't wait for it to finish
	*/
}

void FrameBuffer::blt()
{
#ifdef DC801_EMBEDDED
	draw_raw_async(0, 0, WIDTH, HEIGHT, frame);
#else
	EngineWindowFrameGameBlt(frame);
#endif
}
