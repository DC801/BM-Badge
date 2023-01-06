#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#include "games/mage/mage_rom.h"
#include "EngineWindowFrame.h"
#include "adafruit/gfxfont.h"
#include "modules/gfx.h"
#include "convert_endian.h"
#include <array>
#include <stdint.h>

#define RGB(r, g, b) (uint16_t)((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))
class MageColorPalette;
class MageGameEngine;


//this is the numerical translation for entity direction.
enum MageEntityAnimationDirection : uint8_t
{
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
};

namespace Util {
	template <typename T>
	static inline T lerp(T a, T b, float progress) { return (T)((b - a) * progress) + a; }
};

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

#define RENDER_FLAGS_IS_GLITCHED_MASK		0b01111111
#define RENDER_FLAGS_IS_GLITCHED			0b10000000
#define RENDER_FLAGS_IS_DEBUG				0b01000000
#define RENDER_FLAGS_FLIP_X					0b00000100
#define RENDER_FLAGS_FLIP_Y					0b00000010
#define RENDER_FLAGS_FLIP_DIAG				0b00000001
#define RENDER_FLAGS_FLIP_MASK				0b00000111
#define RENDER_FLAGS_DIRECTION_MASK			0b00000011
#define NUM_DIRECTIONS 4

struct RenderFlags
{
	RenderFlags(const RenderFlags& flags) noexcept
	{
		rf.i = flags.rf.i;
	}

	RenderFlags(const uint8_t& flags) noexcept
	{
		rf.i = flags;
	}

	inline void updateDirectionAndPreserveFlags(uint8_t desired)
	{
		rf.i = (rf.i & RENDER_FLAGS_DIRECTION_MASK)
			| (rf.i & (RENDER_FLAGS_IS_DEBUG | RENDER_FLAGS_IS_GLITCHED));
	}

	operator uint8_t()
	{
		return rf.i;
	}

	union rf_u
	{
		uint8_t i;
		struct rf_t
		{
			uint8_t diagonal : 1;
			uint8_t vertical : 1;
			uint8_t horizontal : 1;
			uint8_t paddingA : 1;
			uint8_t paddingB : 1;
			uint8_t paddingC : 1;
			uint8_t debug : 1;
			uint8_t glitched : 1;
		} d;
	} rf;

	


};


//this is a point in 2D space.
struct Point
{
	int32_t x{ 0 };
	int32_t y{ 0 };

	float VectorLength() const
	{
		return sqrt((x * x) + (y * y));
	};

	constexpr float DotProduct(Point b) const
	{
		return (float)x * (float)b.x
			+ (float)y * (float)b.y;
	};

	Point lerp(Point b, float progress) const
	{
		Point point = Point{
			Util::lerp(x, b.x, progress),
			Util::lerp(y, b.y, progress)
		};
		return point;
	}

	void flipByFlags(RenderFlags flags, uint16_t width, uint16_t height)
	{
		if (flags.rf.i != 0)
		{
			RenderFlags flagsUnion = { flags };
			if (flagsUnion.rf.d.diagonal)
			{
				auto xTemp = x;
				x = y;
				y = xTemp;
			}
			if (flagsUnion.rf.d.horizontal)
			{
				x = width - x;
			}
			if (flagsUnion.rf.d.vertical)
			{
				y = height - y;
			}
		}
	}

	Point& operator-=(const Point& rhs)
	{
		this->x -= rhs.x;
		this->y -= rhs.y;
		return *this;
	}

	friend Point operator-(Point lhs, const Point& rhs)
	{
		lhs -= rhs;
		return lhs;
	}

	Point& operator-=(const uint8_t& scale)
	{
		this->x -= scale;
		this->y -= scale;
		return *this;
	}

	friend Point operator-(Point lhs, const uint8_t& scale)
	{
		lhs -= scale;
		return lhs;
	}

	Point operator-()
	{
		return Point{ -x, -y };
	}

	Point& operator+=(const Point& rhs)
	{
		this->x += rhs.x;
		this->y += rhs.y;
		return *this;
	}

	friend Point operator+(Point lhs, const Point& rhs)
	{
		lhs += rhs;
		return lhs;
	}

	Point& operator+=(const uint8_t& shift)
	{
		this->x += shift;
		this->y += shift;
		return *this;
	}

	friend Point operator+(Point lhs, const uint8_t& shift)
	{
		lhs += shift;
		return lhs;
	}

	friend bool operator==(Point lhs, const Point& rhs)
	{
		return lhs.x == rhs.x && lhs.y == rhs.y;
	}

	MageEntityAnimationDirection getRelativeDirection(const Point& target) const
	{
		float angle = atan2f(target.y - y, target.x - x);
		float absoluteAngle = abs(angle);
		MageEntityAnimationDirection direction = SOUTH;
		if (absoluteAngle > 2.356194)
		{
			direction = WEST;
		}
		else if (absoluteAngle < 0.785398)
		{
			direction = EAST;
		}
		else if (angle < 0)
		{
			direction = NORTH;
		}
		else if (angle > 0)
		{
			direction = SOUTH;
		}
		return direction;
	}
};

struct Rect
{
	Point origin;
	int32_t w{ 0 };
	int32_t h{ 0 };

	constexpr bool Overlaps(Rect& other) const
	{
		return origin.x <= other.origin.x + other.w
			&& origin.x + w >= other.origin.x
			&& origin.y <= other.origin.y + other.h
			&& origin.y + h >= other.origin.y;
	}
};


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
		if (x < 0 || x >= WIDTH) { return; }
		if (y < 0 || y >= HEIGHT) { return; }

		frame[y * WIDTH + x] = color; 
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

	// address: first pixel of image in ROM
	// colorPalette: translate indexed image colors
	// target: where to draw on the screen
	// source: coordinates to offset into base image
	// source_width: total width of base image
	// flags: render flags
	void drawChunkWithFlags(uint32_t address,  const MageColorPalette* colorPalette, Rect target, Point source, uint16_t source_width, uint8_t flags);

	inline void fillRect(const Point& p, int w, int h, uint16_t color)
	{
		fillRect(p.x, p.y, w, h, color);
	}
	void fillRect(int x, int y, int w, int h, uint16_t color)
	{

		if ((x >= WIDTH) || (y >= HEIGHT))
		{
			return;
		}

		// Clip to screen
		auto right = x + w;
		if (right >= WIDTH) { right = WIDTH - 1; }
		auto bottom = y + h;
		if (bottom >= HEIGHT) { bottom = HEIGHT - 1; }
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

	inline void drawRect(const Rect& p, uint16_t color)
	{
		drawRect(p.origin.x, p.origin.y, p.w, p.h, color);
	}

	inline void drawRect(const Point& p, int w, int h, uint16_t color)
	{
		drawRect(p.x, p.y, w, h, color);
	}
	void drawRect(int x, int y, int w, int h, uint16_t color);

	void write_char(uint8_t c, GFXfont font);
	void printMessage(std::string text, GFXfont font, uint16_t color, int x, int y);

	void setTextArea(area_t *area);
	void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, bounds_t *bounds);
	void getTextBounds(GFXfont font, const char *text, int16_t x, int16_t y, area_t *near, bounds_t *bounds);
	void blt(ButtonState button);

private:
	std::unique_ptr<EngineWindowFrame> windowFrame{};

	//variables used for screen fading
	float fadeFraction{ 0.0f };
	bool isFading{ false };
	uint16_t fadeColor{ 0 };

  static inline std::array<uint16_t, FRAMEBUFFER_SIZE> frame{0};
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
