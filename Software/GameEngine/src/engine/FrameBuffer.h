#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#include <array>
#include <stdint.h>
#include "adafruit/gfxfont.h"

#include "games/mage/mage_rom.h"
#include "games/mage/mage_color_palette.h"
#include "games/mage/mage_geometry.h"
#include "utility.h"

#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#else
#include "EngineWindowFrame.h"
#endif

static const inline auto DrawWidth = uint16_t{ 320 };
static const inline auto DrawHeight = uint16_t{ 240 };
static const inline uint32_t FramebufferSize = DrawWidth * DrawHeight;

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

class FrameBuffer
{
   friend class ScreenManager;
public:
   FrameBuffer(std::unique_ptr<EngineWindowFrame> windowFrame) noexcept
      : windowFrame(std::move(windowFrame))
   {}

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
   inline void setPixel(uint16_t x, uint16_t y, uint16_t color)
   {
      if (x < 0 || x >= DrawWidth
         || y < 0 || y >= DrawHeight
         || color == TRANSPARENCY_COLOR)
      {
         return;
      }

      minXChange = std::min<int>(minXChange, x);
      maxXChange = std::max<int>(maxXChange, x);

      minYChange = std::min<int>(minYChange, y);
      maxYChange = std::max<int>(maxYChange, y);

      frame[y * DrawWidth + x] = (color >> 8) | (color << 8);
   }

   inline void drawLine(const EntityPoint& p1, const EntityPoint& p2, uint16_t color)
   {
      drawLine(p1.x, p1.y, p2.x, p2.y, color);
   }

   void drawLine(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2, uint16_t color);

   inline void fillRect(const EntityPoint& p, int w, int h, uint16_t color)
   {
      fillRect(p.x, p.y, w, h, color);
   }

   void fillRect(int x, int y, int w, int h, uint16_t color);

   inline void drawRect(const EntityRect& r, uint16_t color)
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
   void printMessage(const std::string_view& text, GFXfont font, uint16_t color, int x, int y);

   void blt();
   constexpr uint16_t* getFrameDataPtr()
   {
      return frame.data();
   }

private:
#ifndef DC801_EMBEDDED
   std::unique_ptr<EngineWindowFrame> windowFrame;
#endif
   std::array<uint16_t, FramebufferSize> frame{};

   int minXChange{ DrawWidth }, maxXChange{ -1 }, minYChange{ DrawHeight }, maxYChange{ -1 };

   //variables used for screen fading
   float fadeFraction{ 0.0f };
   bool isFading{ false };
   uint16_t fadeColor{ 0 };

   void __draw_char(int16_t x, int16_t y, unsigned char c, uint16_t color, uint16_t bg, GFXfont font);
};


#endif //FRAMEBUFFER_H
