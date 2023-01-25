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


#ifdef IS_BIG_ENDIAN
struct Color_565
{
   uint8_t r : 5;
   uint8_t g : 5;
   uint8_t alpha : 1;
   uint8_t b : 5;
};
#else
struct Color_565
{
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

class MageColorPalette
{
public:
   MageColorPalette() noexcept = default;
   MageColorPalette(uint32_t& offset);
   uint16_t colorAt(uint8_t colorIndex, uint16_t fadeColor, float fadeFraction = 0.0f) const
   {
      auto sourceColor = ((const uint16_t*)&colorCount + 2)[colorIndex % colorCount];

      if (fadeFraction >= 1.0f)
      {
         return fadeColor;
      }
      else if (fadeFraction > 0.0f)
      {
         auto fadeColorUnion = ColorUnion{ fadeColor };
         auto colorUnion = ColorUnion{ sourceColor };
         colorUnion.c.r = Util::lerp(colorUnion.c.r, fadeColorUnion.c.r, fadeFraction);
         colorUnion.c.g = Util::lerp(colorUnion.c.g, fadeColorUnion.c.g, fadeFraction);
         colorUnion.c.b = Util::lerp(colorUnion.c.b, fadeColorUnion.c.b, fadeFraction);
         colorUnion.c.alpha = fadeFraction > 0.5f ? fadeColorUnion.c.alpha : colorUnion.c.alpha;
         return colorUnion.i;
      }
      return sourceColor;
   }

private:
   char name[COLOR_PALETTE_NAME_SIZE]{ 0 };
   uint8_t colorCount{ 0 };
};

#endif //SOFTWARE_MAGE_COLOR_PALETTE_H
