#include "main.h"
#include "utility.h"
#include "FrameBuffer.h"
#include "modules/sd.h"
#include "config/custom_board.h"
#include "EnginePanic.h"
#include "EngineROM.h"

#include "adafruit/gfxfont.h"

#ifdef DC801_DESKTOP
	#include "shim_timer.h"
	#include "EngineWindowFrame.h"
	#include <SDL.h>
#endif

#ifndef min
#define min(a,b) ((a)<(b)?(a):(b))
#endif

#ifndef max
#define max(a,b) ((a)>(b)?(a):(b))
#endif

//Cursor coordinates
static int16_t m_cursor_x = 0;
static int16_t m_cursor_y = 0;
static area_t m_cursor_area = { 0, 0, WIDTH, HEIGHT };
static uint16_t m_color = COLOR_WHITE;
static bool m_wrap = true;
static volatile bool m_stop = false;

uint16_t frame[FRAMEBUFFER_SIZE];
FrameBuffer canvas;

extern "C" {
	FrameBuffer *p_canvas()
	{
		return &canvas;
	}
}

FrameBuffer::FrameBuffer() {}
FrameBuffer::~FrameBuffer() {}

void FrameBuffer::clearScreen(uint16_t color) {
	for (uint32_t i = 0; i < FRAMEBUFFER_SIZE; ++i)
	{
		frame[i] = color;
	}
}

void FrameBuffer::drawPixel(int x, int y, uint16_t color) {
	frame[y * WIDTH + x] = color;
}

void FrameBuffer::drawHorizontalLine(int x1, int y, int x2, uint16_t color) {
	int s1 = min(x1, x2);
	int s2 = max(x1, x2);
	if (y < 0 || y > HEIGHT) { return; }
	for (int x=s1; x <= s2; ++x)
	{
		int32_t dest = y * WIDTH + x;
		if (
			x >= 0
			&& x < WIDTH
			&& dest >= 0
			&& dest < (int32_t)FRAMEBUFFER_SIZE
		) {
			frame[dest]=color;
		}
	}
}

void FrameBuffer::drawVerticalLine(int x, int y1, int y2, uint16_t color) {
	int s1 = min(y1, y2);
	int s2 = max(y1, y2);
	if (x < 0 || x > WIDTH) { return; }
	for (int y=s1; y <= s2; ++y)
	{
		int32_t dest = y * WIDTH + x;
		if (
			y >= 0
			&& y < HEIGHT
			&& dest >= 0
			&& dest < (int32_t)FRAMEBUFFER_SIZE
		) {
			frame[dest] = color;
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data)
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

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, uint16_t transparent_color)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i=x; i < (x + w); ++i)
		{
			uint16_t c = data[idx++];

			if (c != transparent_color)
			{
				frame[j*WIDTH+i] = c;
			}
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i = x; i < (x + w); ++i)
		{
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];

			frame[j * WIDTH + i] = ((uint16_t) d1 << 8) | d2;
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data, uint16_t transparent_color)
{
	int idx = 0;

	for (int j = y; j < (y + h); ++j)
	{
		for (int i = x; i < (x + w); ++i)
		{
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];
			uint16_t c = ((uint16_t) d1 << 8) | d2;

			if (c != transparent_color)
			{
				frame[j * WIDTH + i] = c;
			}
		}
	}
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch)
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
	const uint16_t *data,
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
				if (color != transparent_color)
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
	const uint16_t *data,
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
	bool flip_x    = flags & FLIPPED_HORIZONTALLY_FLAG;
	bool flip_y    = flags & FLIPPED_VERTICALLY_FLAG;
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
				if (color != transparent_color)
				{
					frame[(current_y * WIDTH) + current_x] = color;
				}
			}
		}
	}
}

#define MAX_RUN 128
void FrameBuffer::drawChunkWithFlags(
	uint32_t address,
	int x,
	int y,
	uint16_t tile_width,
	uint16_t tile_height,
	uint16_t source_x,
	uint16_t source_y,
	int16_t pitch,
	uint16_t transparent_color,
	uint8_t flags
)
{
	uint16_t tile_x = 0;
	uint16_t tile_y = 0;
	uint16_t write_x = 0;
	uint16_t write_y = 0;
	int16_t dest_x = 0;
	int16_t dest_y = 0;
	uint16_t colors[MAX_RUN] = {};
	uint32_t location = 0;
	uint32_t bytes_to_read = 0;

	bool flip_x    = flags & FLIPPED_HORIZONTALLY_FLAG;
	bool flip_y    = flags & FLIPPED_VERTICALLY_FLAG;
	bool flip_diag = flags & FLIPPED_DIAGONALLY_FLAG;
	if (
		(x > WIDTH) ||
		(y > HEIGHT) ||
		((x + tile_width) < 0) ||
		((y + tile_height) < 0) ||
		((tile_width != tile_height) && flip_diag) // can't transpose non-squares
	)
	{
		return;
	}

	Rectangle writeRect = Rectangle(
		MAX(x, 0),
		MAX(y, 0),
		MIN(tile_width, MIN(tile_width + x, WIDTH - x)),
		MIN(tile_height, MIN(tile_height + y, HEIGHT - y))
	);

	// FOR ALL OF THE SCENARIOS WHERE THE READ COORDINATE STARTS ON-SCREEN,
	// THE READ COORDINATES -MUST NOT- TO BE SHIFTED!!!

	// EXTREMELY CURSED BOOLEAN ALGEBRA
	// - Do not touch
	uint16_t transposed_width = flip_diag ? writeRect.height : writeRect.width;
	uint16_t transposed_height = flip_diag ? writeRect.width : writeRect.height;
	uint16_t offset_x = MAX(-x, 0);
	uint16_t offset_y = MAX(-y, 0);
	uint16_t transposed_offset_x = flip_diag ? offset_y : offset_x;
	uint16_t transposed_offset_y = flip_diag ? offset_x : offset_y;
	int32_t inverse_transposed_offset_x = tile_width - transposed_width - transposed_offset_x;
	int32_t inverse_transposed_offset_y = tile_height - transposed_height - transposed_offset_y;
	Rectangle readRect = Rectangle(
		source_x + (((!flip_x && flip_y && flip_diag) || (flip_x && !flip_diag)|| (flip_x && flip_y && flip_diag)) ? inverse_transposed_offset_x : transposed_offset_x),
		source_y + (((!flip_y && flip_x && flip_diag) || (flip_y && !flip_diag)|| (flip_y && flip_x && flip_diag)) ? inverse_transposed_offset_y : transposed_offset_y),
		transposed_width,
		transposed_height
	);

	uint16_t pixels_to_read_per_run = MIN(readRect.width, MAX_RUN);
	uint16_t remaining_pixels_this_row = readRect.width;
	uint16_t pixels_to_read_now = 0;
	uint16_t color = 0;
	// These loops represent source coordinate space, not destination space
	for (tile_y = 0; tile_y < readRect.height; ++tile_y)
	{
		location = address + ((((readRect.y + tile_y) * pitch) + readRect.x) * sizeof(uint16_t));
		bytes_to_read = pixels_to_read_per_run * sizeof(uint16_t);
		if (EngineROM_Read(location, bytes_to_read, (uint8_t *)&colors) != bytes_to_read)
		{
			printf("Failed to read pixel data\n");
			return;
		}
		convert_endian_u2_buffer(colors, pixels_to_read_per_run);
		tile_x = 0;
		while (tile_x < readRect.width)
		{
			if(tile_x > pixels_to_read_per_run)
			{
				remaining_pixels_this_row = readRect.width - tile_x;
				location = address + ((((readRect.y + tile_y) * pitch) + readRect.x + tile_x) * sizeof(uint16_t));
				pixels_to_read_now = MIN(remaining_pixels_this_row, MAX_RUN);
				bytes_to_read = pixels_to_read_now * sizeof(uint16_t);
				if (EngineROM_Read(location, bytes_to_read, (uint8_t *)&colors) != bytes_to_read)
				{
					printf("Failed to read pixel data\n");
					return;
				}
				convert_endian_u2_buffer(colors, pixels_to_read_now);
			}
			write_x = ((flip_diag) ? (tile_y) : (tile_x));
			write_y = ((flip_diag) ? (tile_x) : (tile_y));
			dest_x = writeRect.x + (flip_x ? (writeRect.width - 1) - write_x : write_x);
			dest_y = writeRect.y + (flip_y ? (writeRect.height - 1) - write_y : write_y);
			color = colors[tile_x % pixels_to_read_per_run];
			if (color != transparent_color)
			{
				frame[(dest_y * WIDTH) + dest_x] = color;
			}
			tile_x++;
		}
	}
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch) {
	size_t bufferSize = w*h;
	uint16_t buf[bufferSize];
	FILE *fd = fopen(filename, "rb");
	fseek(fd, (pitch*fy+fx)*sizeof(uint16_t), SEEK_SET);

	for (int i=0; i<h; ++i)
	{
		size_t size = fread(&buf[i*w], sizeof(uint16_t), w, fd);
		fseek(fd, (pitch-w)*sizeof(uint16_t), SEEK_CUR);
	}

	fclose(fd);
	convert_endian_u2_buffer(buf, bufferSize);
	drawImage(x, y, w, h, buf);
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t transparent_color) {
	size_t bufferSize = w*h;
	uint16_t buf[bufferSize];

	FILE *fd = fopen(filename, "rb");
	fseek(fd, (pitch*fy+fx)*sizeof(uint16_t), SEEK_SET);

	for (int i=0; i<h; ++i)
	{
		size_t size = fread(&buf[i*w], sizeof(uint16_t), w, fd);
		fseek(fd, (pitch-w)*sizeof(uint16_t), SEEK_CUR);
	}

	fclose(fd);

	convert_endian_u2_buffer(buf, bufferSize);
	drawImage(x, y, w, h, buf, transparent_color);
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char *filename)
{
	size_t bufferSize = w * h;
	uint16_t buf[bufferSize];
	uint32_t offset = 0;
	m_stop = false;

	FILE *file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		printf("Can't load file %s\n", filename);
		return;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		printf("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		printf("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
		return;
	}

	for (uint16_t i = 0; i < frames; i++)
	{
		retval = fseek(file, offset, SEEK_SET);

		if (retval != 0)
		{
			printf("Failed to seek the file %s\n", filename);
			fclose(file);
			return;
		}

		size_t read = fread(buf, sizeof(uint8_t), size, file);

		if (read != size)
		{
			printf("Failed to read file %s\n", filename);
			fclose(file);
			return;
		}

		convert_endian_u2_buffer(buf, bufferSize);
		canvas.drawImage(x, y, w, h, buf);
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

	convert_endian_u2_buffer(buf, bufferSize);
	canvas.drawImage(x, y, w, h, buf);
	canvas.blt();
	return;
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char *filename, void (*p_callback)(uint8_t frame, void *p_data), void *data)
{
	size_t bufferSize = w * h;
	uint16_t buf[bufferSize];
	uint32_t offset = 0;
	m_stop = false;

	FILE *file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		printf("Can't load file %s\n", filename);
		return;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		printf("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		printf("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
		return;
	}

	for (uint16_t i = 0; i < frames; i++)
	{
		retval = fseek(file, offset, SEEK_SET);

		if (retval != 0)
		{
			printf("Failed to seek the file %s\n", filename);
			fclose(file);
			return;
		}

		size_t read = fread(buf, sizeof(uint8_t), size, file);

		if (read != size)
		{
			printf("Failed to read file %s\n", filename);
			fclose(file);
			return;
		}

		convert_endian_u2_buffer(buf, bufferSize);
		canvas.drawImage(x, y, w, h, buf);
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

uint8_t FrameBuffer::drawLoopImageFromFile(int x, int y, int w, int h, const char *filename)
{
	size_t bufferSize = w * h;
	uint16_t buf[bufferSize];
	uint8_t retVal = USER_BUTTON_NONE;
	m_stop = false;

	FILE *file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		printf("Can't load file %s\n", filename);
		return 0;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		printf("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		printf("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
		return 0;
	}

	retval = fseek(file, 0, SEEK_SET);

	if (retval != 0)
	{
		printf("Failed to get file size: (seek start) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
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
				printf("Failed to seek the file %s\n", filename);
				fclose(file);
				return 0;
			}

			size_t read = fread(buf, sizeof(uint8_t), size, file);

			if (read != size)
			{
				printf("Failed to read file %s\n", filename);
				fclose(file);
				return 0;
			}

			convert_endian_u2_buffer(buf, bufferSize);
			canvas.drawImage(x, y, w, h, buf);
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

	#ifdef DC801_DESKTOP
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

uint8_t FrameBuffer::drawLoopImageFromFile(int x, int y, int w, int h, const char *filename, void (*p_callback)(uint8_t frame, void *p_data), void *data)
{
	size_t bufferSize = w * h;
	uint16_t buf[bufferSize];
	uint8_t retVal = USER_BUTTON_NONE;
	m_stop = false;

	FILE *file;

	file = fopen(filename, "rb");

	if (file == NULL)
	{
		printf("Can't load file %s\n", filename);
		return 0;
	}

	int retval = fseek(file, 0, SEEK_END);

	if (retval != 0)
	{
		printf("Failed to get file size: (seek end) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	long tell_size = ftell(file);

	if (tell_size == -1)
	{
		printf("Failed to get file size: (ftell) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	size_t size = min((size_t)tell_size, sizeof(uint16_t) * w * h);
	uint16_t frames = MAX(tell_size / w / h / sizeof(uint16_t), 1);

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
		return 0;
	}

	retval = fseek(file, 0, SEEK_SET);

	if (retval != 0)
	{
		printf("Failed to get file size: (seek start) on file: %s\n", filename);
		fclose(file);
		return 0;
	}

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
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
				printf("Failed to seek the file %s\n", filename);
				fclose(file);
				return 0;
			}

			size_t read = fread(buf, sizeof(uint8_t), size, file);

			if (read != size)
			{
				printf("Failed to read file %s\n", filename);
				fclose(file);
				return 0;
			}

			convert_endian_u2_buffer(buf, bufferSize);
			canvas.drawImage(x, y, w, h, buf);
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

	#ifdef DC801_DESKTOP
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
		printf("Rectangle off the screen\n");
		return;
	}

	// Clip to screen
	if ((x + w) > WIDTH)
	{
		w = WIDTH - x;
	}

	if ((y + h) > HEIGHT)
	{
		h = HEIGHT - y;
	}

	// X
	for (int i = x; i < (x + w); i++)
	{
		// Y
		for (int j = y; j < (y + h); j++)
		{
			int index = i + (WIDTH * j);
			frame[index] = color;
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
	drawLine(x0, y0, x1, y1, color);
	drawLine(x1, y1, x2, y2, color);
	drawLine(x2, y2, x0, y0, color);
}

float FrameBuffer::lerp(float a, float b, float progress) {
	return ((b - a) * progress) + a;
}

void FrameBuffer::drawLine(int x1, int y1, int x2, int y2, uint16_t color) {
	int dx = x2 - x1;
	int dy = y2 - y1;
	uint32_t length = ceil(sqrtf((float) ((dx * dx) + (dy * dy))));
	int x;
	int y;
	float progress;
	for(uint32_t i = 0; i <= length; i++)
	{
		progress = ((float) i) / length;
		x = round(lerp((float) x1, (float) x2, progress));
		y = round(lerp((float) y1, (float) y2, progress));
		if ( // crop to screen bounds
			x > 0
			&& x < WIDTH
			&& y > 0
			&& y < HEIGHT
		) {
			frame[x + (y * WIDTH)] = color;
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

void FrameBuffer::fillCircle(int x, int y, int radius, uint16_t color){
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
				frame[i + j * WIDTH] = color;
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
					frame[x + y * WIDTH] = (frame[x + y * WIDTH] >> 2) & 0xF9E7;
				}
				else if (dist > (rad1 * rad1))
				{
					frame[x + y * WIDTH] = (frame[x + y * WIDTH] >> 1) & 0xFBEF;
				}
			}
		}
	}
}

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
					//util_gfx_set_pixel(x + xo + xx, y + yo + yy, color);
					canvas.drawPixel(    x + xo + xx, y + yo + yy, color);
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

void FrameBuffer::printMessage(const char *text, GFXfont font, uint16_t color, int x, int y)
{
	m_color = color;
	m_cursor_area.xs = x;
	m_cursor_x = m_cursor_area.xs;
	m_cursor_y = y + (font.yAdvance / 2);

	for (uint16_t i = 0; i < strlen(text); i++)
	{
		write_char(text[i], font);
	}
	m_cursor_area.xs = 0;
}

void FrameBuffer::getCursorPosition(cursor_t *cursor)
{
	cursor->x = m_cursor_x;
	cursor->y = m_cursor_y;
}

void FrameBuffer::setTextArea(area_t *area)
{
	m_cursor_area = *area;
}

void FrameBuffer::getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, bounds_t *bounds)
{
	getTextBounds(font, text, x, y, NULL, bounds);
}

void FrameBuffer::getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, area_t *near, bounds_t *bounds)
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

void draw_raw_async(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *p_raw)
{
	//clip
    if ((x < 0) || (x > WIDTH - w) || (y < 0) || (y > HEIGHT - h))
	{
        return;
    }
    ili9341_set_addr(x, y, x + w - 1, y + h - 1);
	uint32_t bytecount = w * h * 2;

	//Blast data to TFT
	while (bytecount > 0) {
		
		uint32_t count = MIN(320*80*2, bytecount);

		//Hang out until LCD is free
		while (ili9341_is_busy()) 
		{
			APP_ERROR_CHECK(sd_app_evt_wait());
		}

		ili9341_push_colors_fast((uint8_t*)p_raw, count);

		p_raw += count / 2; //convert to uint16_t count
		bytecount -= count;
	}
    //don't wait for it to finish
}

void FrameBuffer::blt()
{
	#ifdef DC801_DESKTOP
		EngineWindowFrameGameBlt(frame);
	#endif
	#ifdef DC801_EMBEDDED
		for (uint32_t i=0; i< FRAMEBUFFER_SIZE; ++i)
		{
			frame[i] = ((frame[i] >> 8) & 0xff) | ((frame[i] & 0xff) << 8);
		}

		draw_raw_async(0, 0, WIDTH, HEIGHT, frame);
	#endif
}
