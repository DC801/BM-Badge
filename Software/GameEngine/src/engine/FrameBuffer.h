#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#include <stdint.h>

#define WIDTH		320
#define HEIGHT		240
#define HALF_WIDTH	160
#define HALF_HEIGHT	120
const uint32_t FRAMEBUFFER_SIZE = HEIGHT * WIDTH;

#define RGB(r, g, b) (uint16_t)((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))
class MageColorPalette;
class MageGameEngine;

#include "adafruit/gfxfont.h"
#include "modules/gfx.h"
#include "games/mage/mage_defines.h"
#include "games/mage/mage.h"
#include "convert_endian.h"

#ifdef IS_BIG_ENDIAN
struct Color_565 {
	uint8_t r:5;
	uint8_t g:5;
	uint8_t alpha:1;
	uint8_t b:5;
};
#else
struct Color_565 {
	uint8_t b : 5;
	uint8_t alpha : 1;
	uint8_t g : 5;
	uint8_t r : 5;
};
#endif

union ColorUnion
{
	uint16_t i;
	Color_565 c;
};

union RenderFlags {
	uint8_t i;
	struct
	{
		bool diagonal : 1;
		bool vertical : 1;
		bool horizontal : 1;
		bool paddingA : 1;
		bool paddingB : 1;
		bool paddingC : 1;
		bool debug : 1;
		bool glitched : 1;
	};
};

// Color definitions
#define COLOR_BLACK			0x0000	/*   0,   0,   0 */
#define COLOR_BROWN			0x9B26
#define COLOR_NAVY			0x000F	/*   0,   0, 128 */
#define COLOR_DARKBLUE		0x18E8
#define COLOR_DARKGREEN		0x03E0	/*   0, 128,   0 */
#define COLOR_DARKCYAN		0x03EF	/*   0, 128, 128 */
#define COLOR_MAROON		0x7800	/* 128,   0,   0 */
#define COLOR_PURPLE		0x780F	/* 128,   0, 128 */
#define COLOR_OLIVE			0x7BE0	/* 128, 128,   0 */
#define COLOR_LIGHTBLUE		0xB6FF	/* #B4DEFF */
#define COLOR_LIGHTGREY		0xC618	/* 192, 192, 192 */
#define COLOR_DARKGREY		0x7BEF	/* 128, 128, 128 */
#define COLOR_BLUE			0x001F	/*   0,   0, 255 */
#define COLOR_GREEN			0x07E0	/*   0, 255,   0 */
#define COLOR_CYAN			0x07FF	/*   0, 255, 255 */
#define COLOR_RED			0xF800	/* 255,   0,   0 */
#define COLOR_DARKRED		0x8000	/* 120,   0,   0 */
#define COLOR_MAGENTA		0xF81F	/* 255,   0, 255 */
#define COLOR_YELLOW		0xFFE0	/* 255, 255,   0 */
#define COLOR_WHITE			0xFFFF	/* 255, 255, 255 */
#define COLOR_ORANGE		0xFD20	/* 255, 165,   0 */
#define COLOR_GREENYELLOW	0xAFE5	/* 173, 255,  47 */
#define COLOR_PINK			0xFB56
#define COLOR_NEONPURPLE	0xFD5F
#define COLOR_BSOD			0x03DA

//this is the color that will appear transparent when drawing tiles:
#define TRANSPARENCY_COLOR	0x0020

typedef struct {
	int16_t width;
	int16_t height;
} bounds_t;

typedef struct {
	int16_t x;
	int16_t y;
} cursor_t;

struct Rectangle
{
	int16_t x{ 0 };
	int16_t y{ 0 };
	uint16_t width{ 0 };
	uint16_t height{ 0 };
};

class FrameBuffer {
public:
	FrameBuffer(MageGameEngine*  gameEngine) noexcept
		: gameEngine(gameEngine)
	{}
	void clearScreen(uint16_t color);
	void drawPixel(int x, int y, uint16_t color) 
	{ 
		if (x >= WIDTH)
		{
			x = WIDTH - 1;
		}
		if (y >= HEIGHT)
		{
			y = HEIGHT - 1;
		}

		frame[y * WIDTH + x] = SCREEN_ENDIAN_U2_VALUE(color); 
	}

	template <typename T>
	static T lerp(T a, T b, float progress) { return (T)((b - a) * progress) + a; }
	
	static Point lerpPoints(Point a, Point b, float progress);
	uint16_t applyFadeColor(uint16_t color) const;
	void drawLine(int x1, int y1, int x2, int y2, uint16_t color);
	void drawPoint(int x, int y, uint8_t size, uint16_t color);

	void drawChunkWithFlags(
		uint32_t address, //address of first pixel of image in ROM
		MageColorPalette *colorPaletteFaded, //color palette to lookup image colors from
		int32_t x, //x coordinate of destination pixel on screen
		int32_t y, //y coordinate of destination pixel on screen
		uint16_t tile_width, //width of tile being drawn
		uint16_t tile_height, //height of tile being drawn
		uint16_t source_x, //coordinates in source image
		uint16_t source_y, //coordinates in source image
		uint16_t pitch, //width of source image
		uint16_t transparent_color, //565 encoded color value
		uint8_t flags //render flags
	);

	void fillRect(int x, int y, int w, int h, uint16_t color);
	void drawRect(int x, int y, int w, int h, uint16_t color);

	void write_char(uint8_t c, GFXfont font);
	void printMessage(const char *text, GFXfont font, uint16_t color, int x, int y);

	void setTextArea(area_t *area);
	void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, bounds_t *bounds);
	void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, area_t *near, bounds_t *bounds);
	void blt();


	//variables used for screen fading
	float fadeFraction{ 0.0f };
	bool isFading{ false };
	uint16_t fadeColor{ 0 };
private:
	MageGameEngine*  gameEngine;

	uint16_t frame[FRAMEBUFFER_SIZE]{ 0 };
	void __draw_char(
		int16_t x,
		int16_t y,
		unsigned char c,
		uint16_t color,
		uint16_t bg,
		GFXfont font
	);
};


#endif //FRAMEBUFFER_H
