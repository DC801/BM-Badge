#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#ifdef __cplusplus
#include <cstdint>
#endif

#include "adafruit/gfxfont.h"

#define WIDTH		320
#define HEIGHT		240
#define HALF_WIDTH	160
#define HALF_HEIGHT	120
const uint32_t FRAMEBUFFER_SIZE = HEIGHT * WIDTH;

#define RGB(r, g, b) ((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))

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
#define COLOR_DARKRED       0x8000      /* 120,   0,   0 */
#define COLOR_MAGENTA	 	0xF81F      /* 255,   0, 255 */
#define COLOR_YELLOW 	 	0xFFE0      /* 255, 255,   0 */
#define COLOR_WHITE   		0xFFFF      /* 255, 255, 255 */
#define COLOR_ORANGE   		0xFD20      /* 255, 165,   0 */
#define COLOR_GREENYELLOW 	0xAFE5      /* 173, 255,  47 */
#define COLOR_PINK        	0xFB56
#define COLOR_NEONPURPLE	0xFD5F

#define COLOR_BSOD			0x03DA

typedef struct {
    int16_t width;
    int16_t height;
} bounds_t;

typedef struct {
    int16_t x;
    int16_t y;
} cursor_t;

//this is a point in 2D space.
typedef struct {
	int32_t x;
	int32_t y;
} Point;

class Rectangle
{
public:
	int16_t x;
	int16_t y;
	uint16_t width;
	uint16_t height;

	Rectangle() :
		x{0},
		y{0},
		width{0},
		height{0} {}

	Rectangle(
		int16_t x,
		int16_t y,
		uint16_t width,
		uint16_t height
	) :
		x{x},
		y{y},
		width{width},
		height{height} {}
};

#ifdef __cplusplus
class FrameBuffer {
public:
    FrameBuffer();
    ~FrameBuffer();


    void clearScreen(uint16_t color);

    void drawPixel(int x, int y, uint16_t color);

    static float lerp(float a, float b, float progress);
    void drawLine(int x1, int y1, int x2, int y2, uint16_t color);
    void drawPoint(int x, int y, uint8_t size, uint16_t color);
    void drawHorizontalLine(int x1, int y, int x2, uint16_t color);
    void drawVerticalLine(int x, int y1, int y2, uint16_t color);

    void drawImage(int x, int y, int w, int h, const uint16_t *data);
    void drawImage(int x, int y, int w, int h, const uint16_t *data, uint16_t transparent_color);
    void drawImage(int x, int y, int w, int h, const uint8_t *data);
    void drawImage(int x, int y, int w, int h, const uint8_t *data, uint16_t transparent_color);
    void drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch);
    void drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch, uint16_t transparent_color);

#define FLIPPED_HORIZONTALLY_FLAG 0x04
#define FLIPPED_VERTICALLY_FLAG   0x02
#define FLIPPED_DIAGONALLY_FLAG   0x01
    void drawImageWithFlags(
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
    );

	void drawChunkWithFlags(
        uint32_t address, //address of first pixel of image in ROM
        int x, //x coordinate of destination pixel on screen
        int y, //y coordinate of destination pixel on screen
        uint16_t tile_width, //width of tile being drawn
        uint16_t tile_height, //height of tile being drawn
        uint16_t source_x, //coordinates in source image
        uint16_t source_y, //coordinates in source image
        int16_t pitch, //width of source image
        uint16_t transparent_color, //565 encoded color value
        uint8_t flags //render flags
	);

    void drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch);
    void drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t transparent_color);

    void drawImageFromFile(int x, int y, int w, int h, const char *filename);
    void drawImageFromFile(int x, int y, int w, int h, const char *filename, void (*p_callback)(uint8_t frame, void *p_data), void *data);
    uint8_t drawLoopImageFromFile(int x, int y, int w, int h, const char *filename);
    uint8_t drawLoopImageFromFile(int x, int y, int w, int h, const char *filename, void (*p_callback)(uint8_t frame, void *p_data), void *data);
    void drawStop();

    void drawBitmapFromFile(const char *filename);
    void drawBitmapFromFile(int x, int y, int w, int h, const char *filename);

    void fillCircle(int x, int y, int radius, uint16_t color);

    void fillRect(int x, int y, int w, int h, uint16_t color);
    void drawRect(int x, int y, int w, int h, uint16_t color);

    void drawTriangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2, uint16_t color);

    void mask(int px, int py, int rad1, int rad2, int rad3);
    void write_char(uint8_t c, GFXfont font);
    void printMessage(const char *text, GFXfont font, uint16_t color, int x, int y);

    void setTextArea(area_t *area);
    void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, bounds_t *bounds);
    void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, area_t *near, bounds_t *bounds);
    uint8_t getFontHeight(GFXfont font);
    uint8_t getFontWidth(GFXfont font);
    void getCursorPosition(cursor_t *cursor);

    void blt();

};

extern FrameBuffer canvas;
#endif

#ifdef __cplusplus
extern "C" {
#endif
FrameBuffer *p_canvas(void);
#ifdef __cplusplus
}
#endif


#endif //FRAMEBUFFER_H
