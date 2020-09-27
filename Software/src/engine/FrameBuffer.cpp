#ifdef DC801_EMBEDDED

#include "FrameBuffer.h"
#include <cmath>
#include <cstring>
#include <fcntl.h>

#include "common.h"

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
	FrameBuffer *p_canvas(void)
	{
		return &canvas;
	}
}

FrameBuffer::FrameBuffer() {}
FrameBuffer::~FrameBuffer() {}

void FrameBuffer::clearScreen(uint16_t color) {
	for (int i=0; i<FRAMEBUFFER_SIZE; ++i)
		frame[i] = color;
}

void FrameBuffer::drawPixel(int x, int y, uint16_t color) {
	frame[y*WIDTH+x] = color;
}

void FrameBuffer::drawHorizontalLine(int x1, int y, int x2, uint16_t color) {
	int s1 = min(x1, x2);
	int s2 = max(x1, x2);
	for (int i=s1; i<=s2; ++i)
		frame[y*WIDTH+i]=color;
}
void FrameBuffer::drawVerticalLine(int x, int y1, int y2, uint16_t color) {
	int s1 = min(y1, y2);
	int s2 = max(y1, y2);
	for (int i=s1; i<=s2; ++i)
		frame[i*WIDTH+x]=color;
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data) {
	int idx=0;
    for (int j = y; j<y+h; ++j)
		for (int i=x; i<x+w; ++i)
			frame[j*WIDTH+i] = data[idx++];
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, uint16_t tansparent_color) {
	int idx=0;
    for (int j = y; j<y+h; ++j)
		for (int i=x; i<x+w; ++i) {
			uint16_t c = data[idx++];
			if (c != tansparent_color)
				frame[j*WIDTH+i] = c;
		}

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data) {
	int idx=0;
    for (int j = y; j<y+h; ++j) {
		for (int i=x; i<x+w; ++i) {
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];
			frame[j*WIDTH+i] = ((uint16_t) d1 << 8) | d2;
		}
    }
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data, uint16_t tansparent_color) {
	int idx=0;
    for (int j = y; j<y+h; ++j){
		for (int i=x; i<x+w; ++i) {
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];
			uint16_t c = ((uint16_t) d1 << 8) | d2;
			if (c != tansparent_color){
				frame[j*WIDTH+i] = c;
			}
		}
    }
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch) {
    for (int i=0, idx = pitch*fy+fx; i<h; ++i, idx+=pitch) {
        memcpy(&frame[(y+i)*WIDTH + x], &data[idx], sizeof(uint16_t) * w);
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
    uint16_t tansparent_color
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
                if (color != tansparent_color)
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
    uint16_t tansparent_color,
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
                if (color != tansparent_color)
                {
                    frame[(current_y * WIDTH) + current_x] = color;
                }
            }
        }
    }
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch) {

    FIL file;

    FRESULT result = f_open(&file, filename, FA_READ | FA_OPEN_EXISTING);
    if (result != FR_OK) {
        printf("Can't load file %s\n", filename);
        return;
    }

    f_lseek(&file, (pitch*fy+fx)*sizeof(uint16_t));
    for (int i=0; i<h; ++i) {
        UINT bytesread=0;
        f_read(&file, &frame[(y+i)*WIDTH + x], sizeof(uint16_t) * w, &bytesread);
        FSIZE_t at = f_tell(&file);
        f_lseek(&file, at + ((pitch-w)*sizeof(uint16_t)));
    }
    f_close(&file);

    /*
    FILE *fd = fopen(filename, "rb");
    fseek(fd, (pitch*fy+fx)*sizeof(uint16_t), SEEK_SET);
    for (int i=0; i<h; ++i) {
        fread(&frame[(y+i)*WIDTH + x], sizeof(uint16_t), w, fd);
        fseek(fd, (pitch-w)*sizeof(uint16_t), SEEK_CUR);
    }
    fclose(fd);*/
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t tansparent_color) {
    uint16_t buf[w*h];

    FIL file;

    FRESULT result = f_open(&file, filename, FA_READ | FA_OPEN_EXISTING);
    if (result != FR_OK) {
        printf("Can't load file %s\n", filename);
        return;
    }

    f_lseek(&file, (pitch*fy+fx)*sizeof(uint16_t));
    for (int i=0; i<h; ++i) {
        UINT bytesread=0;
        f_read(&file, &buf[i*w], sizeof(uint16_t) * w, &bytesread);
        FSIZE_t at = f_tell(&file);
        f_lseek(&file, at + ((pitch-w)*sizeof(uint16_t)));
    }
    f_close(&file);
    /*
    FILE *fd = fopen(filename, "rb");
    fseek(fd, (pitch*fy+fx)*sizeof(uint16_t), SEEK_SET);
    for (int i=0; i<h; ++i) {
        fread(&buf[i*w], sizeof(uint16_t), w, fd);
        fseek(fd, (pitch-w)*sizeof(uint16_t), SEEK_CUR);
    }
    fclose(fd);*/

    drawImage(x, y, w, h, buf, tansparent_color);
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char *filename)
{
	uint16_t buf[w*h];

	FIL file;

	uint32_t size = util_sd_file_size(filename);
	// Limit size to assumed size
	size = min(size, sizeof(uint16_t) * (w*h));

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
		return;
	}

	FRESULT result = f_open(&file, filename, FA_READ | FA_OPEN_EXISTING);

	if (result != FR_OK)
	{
		printf("Can't load file %s\n", filename);
		return;
	}

	unsigned int read = 0;
	result = f_read(&file, buf, size, &read);

	if (result != FR_OK)
	{
		printf("Failed to read file %s\n", filename);
		f_close(&file);
		return;
	}

	f_close(&file);

	drawImage(x, y, w, h, buf);
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char *filename, void (*p_callback)(uint8_t frame, void *p_data), void *data)
{
	uint16_t buf[w * h];
	m_stop = false;

	FIL file;

	uint32_t size = util_sd_file_size(filename);
	size = min(size, sizeof(uint16_t) * w * h);

	if (size == 0)
	{
		printf("Could not stat %s.\n", filename);
		return;
	}

	uint16_t frames = MAX(size / w / h / 2, 1);
	FRESULT result = f_open(&file, filename, FA_READ | FA_OPEN_EXISTING);

	if (result != FR_OK)
	{
		printf("Can't load file %s\n", filename);
		return;
	}

	for (uint16_t i = 0; i < frames; i++)
	{
		result = f_lseek(&file, 0);

		if (result != FR_OK)
		{
			printf("Failed to seek the file %s\n", filename);
			f_close(&file);
			return;
		}

		unsigned int read = 0;
		result = f_read(&file, buf, size, &read);

		if (result != FR_OK)
		{
			printf("Failed to read file %s\n", filename);
			f_close(&file);
			return;
		}

		canvas.drawImage(x, y, w, h, buf);

		if (p_callback != NULL)
		{
			p_callback(i, data);
		}

		uint8_t retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}
	}

	f_close(&file);
}

uint8_t FrameBuffer::drawLoopImageFromFile(int x, int y, int w, int h, const char *filename)
{
	uint8_t retVal = USER_BUTTON_NONE;
	m_stop = false;

	do
	{
		drawImageFromFile(x, y, w, h, filename);

		//if we're looping give them a way out
		retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}
	} while (m_stop == false);

	return retVal;
}

uint8_t FrameBuffer::drawLoopImageFromFile(int x, int y, int w, int h, const char *filename, void (*p_callback)(uint8_t frame, void *p_data), void *data)
{
	uint8_t retVal = USER_BUTTON_NONE;
	m_stop = false;

	do
	{
		drawImageFromFile(x, y, w, h, filename, p_callback, data);

		//if we're looping give them a way out
		retVal = getButton(false);
		if (retVal != USER_BUTTON_NONE || m_stop)
		{
			break;
		}
	} while (m_stop == false);

	return retVal;
}

void FrameBuffer::drawStop()
{
	m_stop = true;
}

void FrameBuffer::drawBitmapFromFile(const char *filename)
{
	FIL bmp_file;
	int32_t width, height;	   	// W+H in pixels
	uint8_t depth;				// Bit depth (currently must be 24)
	uint32_t bmp_image_offset;        // Start of image data in file
	uint32_t rowSize;               // Not always = bmpWidth; may have padding
	uint8_t sdbuffer[3 * 128]; // pixel buffer (R+G+B per pixel)
	uint32_t buffidx = sizeof(sdbuffer); // Current position in sdbuffer
	bool flip = true;        // BMP is stored bottom-to-top
	int w, h, row, col;
	uint8_t r, g, b;
	FSIZE_t pos = 0;

    uint32_t fsize = util_sd_file_size(filename);

	if (fsize == 0)
	{
        NRF_LOG_INFO("Can't stat %s", filename);
    }

	// Open requested file on SD card
	FRESULT result = f_open(&bmp_file, filename, FA_READ | FA_OPEN_EXISTING);

	if (result != FR_OK)
	{
	    NRF_LOG_INFO("Open %s failed", filename);
		return;
	}

	// Parse BMP header
	uint16_t magic = util_sd_read_16(&bmp_file);

	if (magic == 0x4D42) // BMP signature
	{
		util_sd_read_32(&bmp_file); // Read & ignore file size
		util_sd_read_32(&bmp_file); // Read & ignore creator bytes
		bmp_image_offset = util_sd_read_32(&bmp_file); // Start of image data
		util_sd_read_32(&bmp_file); // Read & ignore DIB header size

		// Read DIB header
		width = util_sd_read_32(&bmp_file);
		height = util_sd_read_32(&bmp_file);
		uint8_t planes = util_sd_read_16(&bmp_file);

		if (planes == 1) // # planes -- must be '1'
		{
			depth = util_sd_read_16(&bmp_file); // bits per pixel
			util_sd_read_32(&bmp_file); //Ignore compression, YOLO!

			// If bmpHeight is negative, image is in top-down order.
			// This is not canon but has been observed in the wild.
			if (height < 0)
			{
				height = -height;
				flip = false;
			}

			// Crop area to be loaded
			w = width;
			h = height;

			if ((w - 1) >= WIDTH)
			{
				w = WIDTH;
			}

			if ((h - 1) >= HEIGHT)
			{
				h = HEIGHT;
			}

			// Set TFT address window to clipped image bounds
			st7735_set_addr(0, 0, w - 1, h - 1);

			//Handle 16-bit 565 bmp
			if (depth == 16)
			{
				// BMP rows are padded (if needed) to 4-byte boundary
				rowSize = (width * 2 + 3) & ~3;

				for (row = 0; row < h; row++) // For each scanline...
				{
					// Seek to start of scan line.  It might seem labor-
					// intensive to be doing this on every line, but this
					// method covers a lot of gritty details like cropping
					// and scanline padding.  Also, the seek only takes
					// place if the file position actually needs to change
					// (avoids a lot of cluster math in SD library).
					if (flip) // Bitmap is stored bottom-to-top order (normal BMP)
					{
						pos = bmp_image_offset + (height - 1 - row) * rowSize;
					}
					else
					{
						// Bitmap is stored top-to-bottom
						pos = bmp_image_offset + row * rowSize;
					}

					if (f_tell(&bmp_file) != pos) { // Need seek?
						f_lseek(&bmp_file, pos);
						buffidx = sizeof(sdbuffer); // Force buffer reload
					}

					//Populate the row buffer
					UINT count;
					f_read(&bmp_file, sdbuffer, rowSize, &count);
					buffidx = 0; // Set index to beginning

					for (uint16_t i = 0; i < rowSize; i += 2)
					{
						uint16_t temp = sdbuffer[i];
						sdbuffer[i] = sdbuffer[i + 1];
						sdbuffer[i + 1] = temp;
					}

					st7735_push_colors(sdbuffer, rowSize);
				} // end scanline
			}
			//Handle 24-bit RGB bmp
			else if (depth == 24) // 0 = uncompressed
			{
				// BMP rows are padded (if needed) to 4-byte boundary
				rowSize = (width * 3 + 3) & ~3;

				for (row = 0; row < h; row++) // For each scanline...
				{
					// Seek to start of scan line.  It might seem labor-
					// intensive to be doing this on every line, but this
					// method covers a lot of gritty details like cropping
					// and scanline padding.  Also, the seek only takes
					// place if the file position actually needs to change
					// (avoids a lot of cluster math in SD library).
					if (flip) // Bitmap is stored bottom-to-top order (normal BMP)
					{
						pos = bmp_image_offset + (height - 1 - row) * rowSize;
					}
					else
					{
						// Bitmap is stored top-to-bottom
						pos = bmp_image_offset + row * rowSize;
					}

					if (f_tell(&bmp_file) != pos) // Need seek?
					{
						f_lseek(&bmp_file, pos);
						buffidx = sizeof(sdbuffer); // Force buffer reload
					}

					for (col = 0; col < w; col++) // For each pixel...
					{
						// Time to read more pixel data?
						if (buffidx >= sizeof(sdbuffer)) // Indeed
						{
							UINT count;
							f_read(&bmp_file, sdbuffer, sizeof(sdbuffer), &count);
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

void FrameBuffer::fillRect(int x, int y, int w, int h, uint16_t color){
	for (int j = y; j<y+h; ++j)
		for (int i=x; i<x+w; ++i)
			frame[j*WIDTH+i] = color;
}

void FrameBuffer::drawRect(int x, int y, int w, int h, uint16_t color) {
	drawHorizontalLine(x,y+h,x+w,color);
	drawHorizontalLine(x,y+h,x+w,color);
    drawVerticalLine(x,y,y+h,color);
    drawVerticalLine(x+w,y,y+h,color);
}

void FrameBuffer::drawTriangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2, uint16_t color)
{
	drawLine(x0, y0, x1, y1, color);
	drawLine(x1, y1, x2, y2, color);
	drawLine(x2, y2, x0, y0, color);
}

void FrameBuffer::drawLine(int x1, int y1, int x2, int y2, uint16_t color) {
	int dx=x2-x1;
	int dy=y2-y1;
	int y=y1;
	int p=2*dy-dx;

	for(int x=x1; x<x2; ++x) {
		frame[x+y*WIDTH]=color;
		if(p>=0) {
			y++;
			p+=2*dy-2*dx;
		}
		else {
			p+=2*dy;
		}
	}
}

void FrameBuffer::fillCircle(int x, int y, int radius, uint16_t color){
	int rad2=radius*radius;
	for (int j=y-radius;j<=y+radius; ++j) {
		int yd = fabs(y-j);
		int radx2 = rad2 - yd*yd;
		for (int i=x-radius;i<=x+radius; ++i) {
			int xd = fabs(x-i);
			int dist2 = xd*xd;
			if (dist2<=radx2)
				frame[i+j*WIDTH] = color;
		}
	}

}

void FrameBuffer::mask(int px, int py, int rad1, int rad2, int rad3) {
    int minx=px-rad3, maxx=px+rad3;
    int miny=py-rad3, maxy=py+rad3;
    for (int y=0; y<HEIGHT; ++y)
        for (int x=0; x<WIDTH; ++x) {
            if ((x<minx) || (x>maxx) || (y<miny) || (y>maxy))
                frame[x+y*WIDTH] = 0;
            else {
                int dx = abs(x-px);
                int dy = abs(y-py);
                int dist = dx*dx+dy*dy;
                if (dist > rad3*rad3)
                    frame[x+y*WIDTH] = 0;
                else if (dist > rad2*rad2)
                    frame[x+y*WIDTH] = (frame[x+y*WIDTH] >> 2) & 0xF9E7;
                else if (dist > rad1*rad1)
                    frame[x+y*WIDTH] = (frame[x+y*WIDTH] >> 1) & 0xFBEF;
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

void FrameBuffer::printMessage(const char *text, GFXfont font, uint16_t color, int x, int y) {
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
	while (c = *text++)
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

uint8_t FrameBuffer::getFontWidth(GFXfont font)
{
	return font.glyph[0].xAdvance;
}

void FrameBuffer::getCursorPosition(cursor_t *cursor)
{
	cursor->x = m_cursor_x;
	cursor->y = m_cursor_y;
}

void draw_raw_async(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *p_raw)
{
	//clip
    if ((x < 0) || (x > WIDTH - w) || (y < 0) || (y > HEIGHT - h))
	{
        return;
    }

    //Hang out until LCD is free
    while (st7735_is_busy())
	{
        APP_ERROR_CHECK(sd_app_evt_wait());
    }

    st7735_set_addr(x, y, x + w - 1, y + h - 1);
    st7735_push_colors_fast((uint8_t*)p_raw, (w * h * 2));
    //don't wait for it to finish
}

void FrameBuffer::blt() {

	for (int i=0; i< FRAMEBUFFER_SIZE; ++i)
	{
		frame[i] = ((frame[i] >> 8) & 0xff) | ((frame[i] & 0xff) << 8);
	}

	draw_raw_async(0, 0, WIDTH, HEIGHT, frame);
}

#endif
