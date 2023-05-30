#ifndef SOFTWARE_MAGE_COLOR_PALETTE_H
#define SOFTWARE_MAGE_COLOR_PALETTE_H

#include <memory>
#include "mage_rom.h"
#include "utility.h"

class FrameBuffer;
class MageGameEngine;

#define COLOR_PALETTE_INTEGRITY_STRING_LENGTH 2048
#define COLOR_PALETTE_NAME_LENGTH 31
#define COLOR_PALETTE_NAME_SIZE COLOR_PALETTE_NAME_LENGTH + 1

//this is the color that will appear transparent when drawing tiles:
#define TRANSPARENCY_COLOR	0x0020


struct Color_565
{
   Color_565(uint16_t color) noexcept
      : r((color & 0b0000000011111000) >> 3),
      g((color & 0b1100000000000000) >> 14 | (color & 0b111) << 2),
      b((color & 0b0001111100000000) >> 8),
      a((color & 0b0010000000000000) >> 13)
   {}
   operator uint16_t() { return r << 11 | g << 6 | a << 5| b ; }

   uint8_t r : 5;
   uint8_t g : 5;
   uint8_t a : 1;
   uint8_t b : 5;
};

class MageColorPalette
{
public:
   const uint16_t& get(uint8_t colorIndex) const
   {
      
      return colorData[colorIndex % colorCount];
   }

private:
   char name[COLOR_PALETTE_NAME_SIZE]{ 0 };
   uint8_t colorCount{ 0 };
   const uint16_t* colorData{ (const uint16_t*)(&colorCount + 2) };
};

#endif //SOFTWARE_MAGE_COLOR_PALETTE_H
