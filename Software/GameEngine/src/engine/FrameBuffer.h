#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#include <array>
#include <stdint.h>
#include "adafruit/gfxfont.h"
#include "fonts/Monaco9.h"

#include "games/mage/mage_camera.h"
#include "games/mage/mage_rom.h"
#include "games/mage/mage_color_palette.h"
#include "games/mage/mage_geometry.h"
#include "utility.h"

#ifdef DC801_EMBEDDED
#include "modules/drv_ili9341.h"
#else
#include "EngineWindowFrame.h"
#endif

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


struct MageTileset
{
   constexpr uint16_t TileCount() const { return Rows * Cols; }

   const MageGeometry* GetGeometryForTile(uint16_t tileIndex) const
   {
      auto geometriesPtr = (uint16_t*)((uint8_t*)&Rows + sizeof(uint16_t));

      if (tileIndex >= Cols * Rows || !geometriesPtr[tileIndex]) { return nullptr; }
      auto geometryIndex = geometriesPtr[tileIndex];

      return ROM()->GetReadPointerByIndex<MageGeometry>(geometryIndex - 1);
   }

   char     Name[TilesetNameLength]{ 0 };
   uint16_t ImageId{ 0 };
   uint16_t ImageWidth{ 0 };
   uint16_t ImageHeight{ 0 };
   uint16_t TileWidth{ 0 };
   uint16_t TileHeight{ 0 };
   uint16_t Cols{ 0 };
   uint16_t Rows{ 0 };
};

struct AnimationDirection
{
   uint16_t typeId{ 0 };
   uint8_t type{ 0 };
   uint8_t renderFlags{ 0 };
};

struct MagePortrait
{
   char portrait[32];
   char padding[3]{ 0 };
   uint8_t emoteCount{ 0 };

   const AnimationDirection* getEmoteById(uint8_t emoteId) const
   {
      auto animationPtr = (const AnimationDirection*)((uint8_t*)&emoteCount + sizeof(uint8_t));
      return &animationPtr[emoteId % emoteCount];
   }
};

class FrameBuffer
{
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

   inline void DrawTileWorldCoords(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags = 0)
   {
      drawTile(tilesetId, tileId, tileDrawX - camera.positionX, tileDrawY - camera.positionY, flags);
   }

   inline void DrawTileScreenCoords(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags = 0)
   {
      drawTile(tilesetId, tileId, tileDrawX, tileDrawY, flags);
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

   inline void DrawFilledRect(const EntityPoint& p, int w, int h, uint16_t color)
   {
      DrawFilledRect(p.x, p.y, w, h, color);
   }

   void DrawFilledRect(int x, int y, int w, int h, uint16_t color);

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


   void DrawText(const std::string_view& text, uint16_t color, int x, int y, GFXfont font = Monaco9);

   void blt();
   constexpr uint16_t* getFrameDataPtr()
   {
      return frame.data();
   }

   inline void ToggleDrawGeometry() { drawGeometry = !drawGeometry; }

   MageCamera camera{};
private:
#ifndef DC801_EMBEDDED
   std::unique_ptr<EngineWindowFrame> windowFrame;
   std::array<uint16_t, FramebufferSize> frame{};
#endif
   bool drawGeometry{ false };

   int minXChange{ DrawWidth }, maxXChange{ -1 }, minYChange{ DrawHeight }, maxYChange{ -1 };

   //variables used for screen fading
   float fadeFraction{ 0.0f };
   bool isFading{ false };
   uint16_t fadeColor{ 0 };

   void drawTile(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags);
   void write_char(uint8_t c, GFXfont font);
   void __draw_char(int16_t x, int16_t y, unsigned char c, uint16_t color, uint16_t bg, GFXfont font);
};


#endif //FRAMEBUFFER_H
