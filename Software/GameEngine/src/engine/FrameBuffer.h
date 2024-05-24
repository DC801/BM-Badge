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
#include "DesktopWindowOutput.h"
#endif

class MageGameEngine;

// Color definitions
inline static const auto COLOR_BLACK = 0x0000;/*   0,   0,   0 */
inline static const auto COLOR_BROWN = 0x269B;
inline static const auto COLOR_NAVY = 0x0F00; /*   0,   0, 128 */
inline static const auto COLOR_DARKBLUE = 0xE818;
inline static const auto COLOR_DARKGREEN = 0xE003;/*   0, 128,   0 */
inline static const auto COLOR_DARKCYAN = 0xEF03;/*   0, 128, 128 */
inline static const auto COLOR_MAROON = 0x0078;/* 128,   0,   0 */
inline static const auto COLOR_PURPLE = 0x0F78;/* 128,   0, 128 */
inline static const auto COLOR_OLIVE = 0xE07B;/* 128, 128,   0 */
inline static const auto COLOR_LIGHTBLUE = 0xFFB6;/* #B4DEFF */
inline static const auto COLOR_LIGHTGREY = 0x18C6;/* 192, 192, 192 */
inline static const auto COLOR_DARKGREY = 0xEF7B;/* 128, 128, 128 */
inline static const auto COLOR_BLUE = 0x1F00;/*   0,   0, 255 */
inline static const auto COLOR_GREEN = 0xE007;/*   0, 255,   0 */
inline static const auto COLOR_CYAN = 0xFF07;/*   0, 255, 255 */
inline static const auto COLOR_RED = 0x00F8;/* 255,   0,   0 */
inline static const auto COLOR_DARKRED = 0x0080;/* 120,   0,   0 */
inline static const auto COLOR_MAGENTA = 0x1FF8;/* 255,   0, 255 */
inline static const auto COLOR_YELLOW = 0xE0FF;/* 255, 255,   0 */
inline static const auto COLOR_WHITE = 0xFFFF;/* 255, 255, 255 */
inline static const auto COLOR_ORANGE = 0x20FD;/* 255, 165,   0 */
inline static const auto COLOR_GREENYELLOW = 0xE5AF;/* 173, 255,  47 */
inline static const auto COLOR_PINK = 0x56FB;
inline static const auto COLOR_NEONPURPLE = 0x5FFD;
inline static const auto COLOR_BSOD = 0xDA03;


struct MageTileset
{
   static inline const auto TilesetNameLength = 16;
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
   FrameBuffer(std::unique_ptr<DesktopWindowOutput> windowFrame) noexcept
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

   inline void DrawTileWorldCoords(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags = uint8_t{ 0 })
   {
      drawTile(tilesetId, tileId, tileDrawX - camera.position.x, tileDrawY - camera.position.y, flags);
   }

   inline void DrawTileScreenCoords(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags = uint8_t{ 0 })
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


   void DrawText(const std::string_view& text, uint16_t color, uint16_t screenX, uint16_t screenY, bool clearBackground = false, GFXfont font = Monaco9);

   void blt();
   constexpr uint16_t* getFrameDataPtr()
   {
      return frame.data();
   }

   inline void ToggleDrawGeometry() { drawGeometry = !drawGeometry; }

   MageCamera camera{};
private:
#ifndef DC801_EMBEDDED
   std::unique_ptr<DesktopWindowOutput> windowFrame;
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
