#include "FrameBuffer.h"
#include "EnginePanic.h"

#include <algorithm>

#ifdef DC801_EMBEDDED

#include "drv_ili9341.h"

#else

#include <SDL.h>
#include "shim_timer.h"
#include "shim_err.h"

#endif

//Cursor coordinates
static inline int16_t m_cursor_x = 0;
static inline int16_t m_cursor_y = 0;
static inline EntityRect m_cursor_area = { 0, 0, DrawWidth, DrawHeight };
static inline uint16_t m_color = COLOR_WHITE;
static inline bool m_wrap = true;
static inline volatile bool m_stop = false;


void FrameBuffer::clearScreen(uint16_t color)
{
   frame.fill(color);
}

void FrameBuffer::DrawFilledRect(int x, int y, int w, int h, uint16_t color)
{

#if DC801_EMBEDDED
   ili9341_fill_rect(screenX, screenY, w, h, color);
#else
   if ((x >= DrawWidth) || (y >= DrawHeight))
   {
      return;
   }

   // Clip to screen
   auto right = x + w;
   if (right >= DrawWidth) { right = DrawWidth - 1; }
   auto bottom = y + h;
   if (bottom >= DrawHeight) { bottom = DrawHeight - 1; }
   // X
   for (int i = x; i < right; i++)
   {
      // Y
      for (int j = y; j < bottom; j++)
      {
         setPixel(i, j, color);
      }
   }
#endif
}

void FrameBuffer::drawLine(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2, uint16_t color)
{
   if (x2 < x1)
   {
      std::swap(x1, x2);
      std::swap(y1, y2);
   }

   // optimization for vertical lines
   if (x1 == x2)
   {
      if (y2 < y1) { std::swap(y1, y2); }
      while (y1++ != y2)
      {
         setPixel(x1, y1, color);
      }
   }
   // optimization for horizontal lines
   else if (y1 == y2)
   {
      while (x1++ != x2)
      {
         setPixel(x1, y1, color);
      }
   }
   // Bresenham’s Line Generation Algorithm
   // with ability to draw downwards
   else
   {
      auto drawDownward = false;
      if (y2 < y1)
      {
         std::swap(y1, y2);
         drawDownward = true;
      }

      auto dx = x2 - x1;
      auto dy = y2 - y1;
      for (int p = 2 * dy - dx; x1 < x2; x1++)
      {
         if (p >= 0)
         {
            auto y = drawDownward ? DrawHeight - y1 : y1;
            setPixel(x1, y, color);
            y1++;
            p = p + 2 * dy - 2 * dx;
         }
         else
         {
            auto y = drawDownward ? DrawHeight - y1 : y1;
            setPixel(x1, y, color);
            p = p + 2 * dy;
         }
      }
   }
}

void FrameBuffer::__draw_char(int16_t x, int16_t y, unsigned char c, uint16_t color, uint16_t bg, GFXfont font)
{
   // Character is assumed previously filtered to eliminate
   // newlines, returns, non-printable characters, etc.
   // Calling with 'bad' characters of font may cause mayhem!

   c -= font.first;
   GFXglyph* glyph = &(font.glyph[c]);
   uint8_t* bitmap = font.bitmap;

   uint16_t bitmapOffset = glyph->bitmapOffset;
   uint8_t w = glyph->width;
   uint8_t h = glyph->height;

   int8_t xOffset = glyph->xOffset;
   int8_t yOffset = glyph->yOffset;
   uint8_t xx, yy, bits = 0, bit = 0;

   // NOTE: THERE IS NO 'BACKGROUND' COLOR OPTION ON CUSTOM FONTS.
   // THIS IS ON PURPOSE AND BY DESIGN. 

   int16_t yyy;
   for (yy = 0; yy < h; yy++)
   {
      for (xx = 0; xx < w; xx++)
      {
         if (!(bit++ & 7))
         {
            bits = bitmap[bitmapOffset++];
         }
         if (bits & 0x80)
         {
            yyy = y + yOffset + yy;
            if (yyy >= m_cursor_area.origin.y && yyy <= m_cursor_area.w)
            {
               setPixel(x + xOffset + xx, y + yOffset + yy, color);
            }
         }
         bits <<= 1;
      }
   }
}

void FrameBuffer::write_char(uint8_t c, GFXfont font)
{
   //If newline, move down a row
   if (c == '\n')
   {
      m_cursor_x = m_cursor_area.origin.x;
      m_cursor_y += font.yAdvance;
   }
   //Otherwise, print the character (ignoring carriage return)
   else if (c != '\r')
   {
      uint8_t first = font.first;

      //Valid char?
      if ((c >= first) && (c <= font.last))
      {
         uint8_t c2 = c - first;
         GFXglyph* glyph = &(font.glyph[c2]);

         uint8_t w = glyph->width;
         uint8_t h = glyph->height;

         if ((w > 0) && (h > 0))
         { // Is there an associated bitmap?
            int16_t xOffset = glyph->xOffset;

            if ((m_cursor_x + (xOffset + w)) >= m_cursor_area.w && m_wrap)
            {
               // Drawing character would go off right edge; wrap to new line
               m_cursor_x = m_cursor_area.origin.x;
               m_cursor_y += font.yAdvance;
            }

            __draw_char(m_cursor_x, m_cursor_y, c, m_color, COLOR_BLACK, font);
         }
         m_cursor_x += glyph->xAdvance;
      }
   }
}

void FrameBuffer::DrawText(const std::string_view& text, uint16_t color, uint16_t screenX, uint16_t screenY, bool clearBackground, GFXfont font)
{
   m_color = color;
   m_cursor_area.origin.x = screenX;
   m_cursor_x = m_cursor_area.origin.x;
   m_cursor_y = screenY + (font.yAdvance / 2);

   if (clearBackground)
   {
      DrawFilledRect(EntityPoint{ screenX,screenY }, font.glyph->width * text.size(), font.glyph->height * 2, COLOR_BLACK);
   }
   for (uint16_t i = 0; i < text.length() && text[i]; i++)
   {
      write_char(text[i], font);
   }
   m_cursor_area.origin.x = 0;
}

void FrameBuffer::drawTile(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags)
{
   auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
   auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tilesetId);

   auto ySourceMin = int32_t{ 0 };
   auto ySourceMax = int32_t{ tileset->TileHeight };
   auto xSourceMin = int32_t{ 0 };
   auto xSourceMax = int32_t{ tileset->TileWidth };
   auto iteratorX = int16_t{ 1 };
   auto iteratorY = int16_t{ 1 };

   if ((flags & RENDER_FLAGS_FLIP_X) || (flags & RENDER_FLAGS_FLIP_DIAG))
   {
      xSourceMin = tileset->TileWidth - 1;
      xSourceMax = -1;
      iteratorX = -1;
   }

   if ((flags & RENDER_FLAGS_FLIP_Y) || (flags & RENDER_FLAGS_FLIP_DIAG))
   {
      ySourceMin = tileset->TileHeight - 1;
      ySourceMax = -1;
      iteratorY = -1;
   }

   if (flags & RENDER_FLAGS_IS_GLITCHED)
   {
      xSourceMin = tileset->TileWidth - 1;
      xSourceMax = -1;
      iteratorX = -2;
      ySourceMin = tileset->TileHeight - 1;
      ySourceMax = -1;
      iteratorY = -2;
   }

   // offset to the start address of the tile
   const auto tiles = ROM()->GetReadPointerByIndex<MagePixel>(tilesetId);
   const auto tilePixels = std::span<const MagePixel>(&tiles[tileId * tileset->TileWidth * tileset->TileHeight], tileset->TileWidth * tileset->TileHeight);

   for (auto yTarget = tileDrawY; ySourceMin != ySourceMax; ySourceMin += iteratorY, yTarget++)
   {
      auto sourceRowPtr = &tilePixels[ySourceMin * tileset->TileWidth];

      if (yTarget < 0 || yTarget >= DrawHeight)
      {
         continue;
      }

      for (auto xSource = xSourceMin, xTarget = tileDrawX; xSource != xSourceMax; xSource += iteratorX, xTarget++)
      {
         if (xTarget < 0 || xTarget >= DrawWidth)
         {
            continue;
         }

         const auto& sourceColorIndex = sourceRowPtr[xSource];
         const auto color = colorPalette->get(sourceColorIndex);

         setPixel(xTarget, yTarget, color);
      }
   }

   // we can fit up to 254 bytes in a single transfer window, each color is 2 bytes, so we can do a max of 127 pixels/transfer
   // if (tileset->ImageWidth * target.h * sizeof(uint16_t) <= 254)
   // {
   //    std::array<uint16_t, 254 / sizeof(uint16_t)> tileBuffer{0};
   //    for (auto i = 0; i < tileBuffer.size(); i++)
   //    {
   //       auto& color = colorPalette->get(sourceTilePtr[i]);
   //       if (color != TRANSPARENCY_COLOR)
   //       {
   //          tileBuffer[i] = color;
   //       }
   //    }
   // }

   if (drawGeometry)
   {
      const auto tileDrawPoint = Vector2T{ tileDrawX, tileDrawY };
      auto geometry = tileset->GetGeometryForTile(tileId);
      if (geometry)
      {
         auto geometryPoints = geometry->FlipByFlags(flags, tileset->TileWidth, tileset->TileHeight);
         for (auto i = 0; i < geometryPoints.size(); i++)
         {
            const auto tileLinePointA = geometryPoints[i] + tileDrawPoint;
            const auto tileLinePointB = geometryPoints[(i + 1) % geometryPoints.size()] + tileDrawPoint;

            drawLine(tileLinePointA, tileLinePointB, COLOR_GREEN);
         }
      }
   }
   //blt();
}

void FrameBuffer::blt()
{
   // TODO FIXME: Moved this out of color palette lookup, think it might belong here, right before blitting the data
   // if (fadeFraction >= 1.0f)
   // {
   //    return fadeColorValue;
   // }
   // else if (fadeFraction > 0.0f)
   // {
   //    auto fadeColor = Color_565{ fadeColorValue };
   //    color.r = Util::lerp(color.r, fadeColor.r, fadeFraction);
   //    color.g = Util::lerp(color.g, fadeColor.g, fadeFraction);
   //    color.b = Util::lerp(color.b, fadeColor.b, fadeFraction);
   //    color.a = fadeFraction > 0.5f ? fadeColor.a : color.a;
   // }

#ifdef DC801_EMBEDDED 
   ili9341_set_addr(0, 0, DrawWidth - 1, DrawHeight - 1);

   const auto bytecount = 2 * FramebufferSize;
   ili9341_push_colors((uint8_t*)frame.data(), bytecount);
#else
   windowFrame->DrawLEDStates();
   windowFrame->GameBlt(frame.data());
#endif
}