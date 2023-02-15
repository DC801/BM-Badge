#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#include "games/mage/mage_rom.h"
#include "games/mage/mage_color_palette.h"
#include "games/mage/mage_geometry.h"
#include "EngineWindowFrame.h"
#include "adafruit/gfxfont.h"
#include "modules/gfx.h"
#include "convert_endian.h"
#include <array>
#include <stdint.h>
#include "utility.h"

#define RGB(r, g, b) (uint16_t)((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))
class MageColorPalette;
class MageGameEngine;


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

typedef struct {
	int16_t width;
	int16_t height;
} bounds_t;

typedef struct {
	int16_t x;
	int16_t y;
} cursor_t;

class FrameBuffer {
public:
	constexpr void ResetFade() { fadeFraction = 0.0f; }
	constexpr void SetFade(uint16_t color, float progress)
	{
		fadeColor = color;
		fadeFraction = progress;
		if (progress < 1.0f)
		{
			isFading = true;
		}
	}

	void clearScreen(uint16_t color);
	constexpr void drawPixel(int x, int y, uint16_t color) 
	{ 
		if (x < 0 || x >= ScreenWidth
		 || y < 0 || y >= ScreenHeight
		 || color == TRANSPARENCY_COLOR) 
		{ return; }

		frame[y * ScreenWidth + x] = color;
	}

	inline void drawLine(const Point& p1, const Point& p2, uint16_t color)
	{
		drawLine(p1.x, p1.y, p2.x, p2.y, color);
	}
	void drawLine(int x1, int y1, int x2, int y2, uint16_t color);

	inline void drawPoint(const Point& p, uint8_t size, uint16_t color)
	{
		const auto topLeft = p - size;
		const auto bottomRight = p + size;
		const auto bottomLeft = Point{ p.x - size, p.y + size };
      const auto topRight = Point{ p.x + size, p.y - size };
		drawLine(topLeft, bottomRight, color);
		drawLine(bottomLeft, topRight, color);
	}

	// pixels: pointer to first pixel of image in ROM, unmodifiable
	// colorPalette: translate indexed image colors, unmodifiable
	// target: where to draw on the screen
	// source: coordinates to offset into base image
	// source_width: total width of base image
	// flags: render flags
	void drawChunkWithFlags(const MagePixels* pixels, const MageColorPalette* colorPalette, Rect&& target, uint16_t source_width, uint8_t flags = 0);

	inline void fillRect(const Point& p, int w, int h, uint16_t color)
	{
		fillRect(p.x, p.y, w, h, color);
	}

	void fillRect(int x, int y, int w, int h, uint16_t color)
	{
		if ((x >= ScreenWidth) || (y >= ScreenHeight))
		{
			return;
		}

		// Clip to screen
		auto right = x + w;
		if (right >= ScreenWidth) { right = ScreenWidth - 1; }
		auto bottom = y + h;
		if (bottom >= ScreenHeight) { bottom = ScreenHeight - 1; }
		// X
		for (int i = x; i < right; i++)
		{
			// Y
			for (int j = y; j < bottom; j++)
			{
				drawPixel(i, j, color);
			}
		}
	}

	inline void drawRect(const Rect& r, uint16_t color)
	{
		auto x = r.origin.x;
		auto y = r.origin.y;
		// top
		drawLine(x, y, x + r.w, y, color);
		// left
		drawLine(x, y, x, y + r.h, color);
		// right
		drawLine(x + r.w, y, x + r.w, y + r.h, color);
		// bottom
		drawLine(x, y + r.h, x + r.w, y + r.h, color);
	}


	void write_char(uint8_t c, GFXfont font);
	void printMessage(std::string text, GFXfont font, uint16_t color, int x, int y);

	void setTextArea(area_t *area);
	void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, bounds_t *bounds);
	void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, area_t *near, bounds_t *bounds);
	void blt(ButtonState button);

private:
	std::unique_ptr<EngineWindowFrame> windowFrame{std::make_unique<EngineWindowFrame>()};

	//variables used for screen fading
	float fadeFraction{ 0.0f };
	bool isFading{ false };
	uint16_t fadeColor{ 0 };

  static inline std::array<uint16_t, FramebufferSize> frame{0};
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
