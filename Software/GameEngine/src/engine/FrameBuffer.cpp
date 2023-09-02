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
static inline Rect m_cursor_area = { 0, 0, DrawWidth, DrawHeight };
static inline uint16_t m_color = COLOR_WHITE;
static inline bool m_wrap = true;
static inline volatile bool m_stop = false;


void FrameBuffer::clearScreen(uint16_t color)
{
   minXChange = 0;
   maxXChange = DrawWidth - 1;
   minYChange = 0;
   maxYChange = DrawHeight - 1;

   frame.fill(color);
}

void FrameBuffer::fillRect(int x, int y, int w, int h, uint16_t color)
{

#if DC801_EMBEDDED
   ili9341_fill_rect(x, y, w, h, color);
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

   minXChange = std::min<int>(minXChange, x1);
   maxXChange = std::max<int>(maxXChange, x2);
   minYChange = std::min<int>(minYChange, y1);
   maxYChange = std::max<int>(maxYChange, y2);

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
   // Character is assumed previously filtered by write() to eliminate
   // newlines, returns, non-printable characters, etc.  Calling drawChar()
   // directly with 'bad' characters of font may cause mayhem!

   c -= font.first;
   GFXglyph* glyph = &(font.glyph[c]);
   uint8_t* bitmap = font.bitmap;

   uint16_t bo = glyph->bitmapOffset;
   uint8_t w = glyph->width;
   uint8_t h = glyph->height;

   int8_t xo = glyph->xOffset;
   int8_t yo = glyph->yOffset;
   uint8_t xx, yy, bits = 0, bit = 0;

   minXChange = std::min<int>(minXChange, x);
   maxXChange = std::max<int>(maxXChange, x + w);
   minYChange = std::min<int>(minYChange, y);
   maxYChange = std::max<int>(maxYChange, y + h);

   // NOTE: THERE IS NO 'BACKGROUND' COLOR OPTION ON CUSTOM FONTS.
   // THIS IS ON PURPOSE AND BY DESIGN. 

   int16_t yyy;
   for (yy = 0; yy < h; yy++)
   {
      for (xx = 0; xx < w; xx++)
      {
         if (!(bit++ & 7))
         {
            bits = bitmap[bo++];
         }
         if (bits & 0x80)
         {
            yyy = y + yo + yy;
            if (yyy >= m_cursor_area.origin.y && yyy <= m_cursor_area.w)
            {
               setPixel(x + xo + xx, y + yo + yy, color);
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
            int16_t xo = glyph->xOffset;

            if ((m_cursor_x + (xo + w)) >= m_cursor_area.w && m_wrap)
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

void FrameBuffer::printMessage(std::string text, GFXfont font, uint16_t color, int x, int y)
{
   m_color = color;
   m_cursor_area.origin.x = x;
   m_cursor_x = m_cursor_area.origin.x;
   m_cursor_y = y + (font.yAdvance / 2);

   for (uint16_t i = 0; text[i] && i < text.length(); i++)
   {
      write_char(text[i], font);
   }
   m_cursor_area.origin.x = 0;
}
//
//void FrameBuffer::regionBlt(const Point& drawPoint, int w, int h) const
//{
//   ili9341_set_addr(drawPoint.x, drawPoint.y, drawPoint.x + w, drawPoint.y + h);
//   ili9341_push_colors((uint8_t*)&frame[DrawWidth * drawPoint.y + drawPoint.x], w * h);
//}

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
      // ili9341_set_addr(minXChange, minYChange, maxXChange, maxYChange);
   ili9341_set_addr(0, 0, DrawWidth - 1, DrawHeight - 1);

   const auto bytecount = 2 * FramebufferSize;// (maxXChange - minXChange + 1 + maxYChange - minYChange + 1);
   ili9341_push_colors((uint8_t*)frame.data(), bytecount);
#else
   windowFrame->GameBlt(frame.data());
#endif
}