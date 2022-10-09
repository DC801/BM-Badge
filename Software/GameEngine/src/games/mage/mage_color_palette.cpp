#include "mage_color_palette.h"
#include "modules/sd.h"
#include "FrameBuffer.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "convert_endian.h"
#include "utility.h"

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif // EMSCRIPTEN

MageColorPalette::MageColorPalette(std::shared_ptr<EngineROM> ROM, uint32_t& address) noexcept
{
#ifndef DC801_EMBEDDED
   // Read name only if we're on Desktop,
   // Embedded don't got RAM for that
   ROM->Read(name, address, COLOR_PALETTE_NAME_LENGTH);
#else
   // Regardless of reading/storing it, ALWAYS increment past it
   address += COLOR_PALETTE_NAME_LENGTH;
#endif

   // Read colorCount
   ROM->Read(&colorCount, address);
   address += 1; // padding

   // Construct array
   colors = std::make_unique<uint16_t[]>(colorCount);

   // The encoder writes these colors BigEndian because the Screen's
   // data format is also BigEndian, so just don't convert these.
   ROM->Read(colors.get(), address, colorCount);

#ifndef DC801_EMBEDDED
   for (int i = 0; i < colorCount; ++i)
   {
      sprintf(colorIntegrityString + (7 * i), " 0x%04x", colors[i]);
   }
#endif //DC801_DESKTOP
}

MageColorPalette::MageColorPalette(
   const FrameBuffer* frameBuffer,
   const MageColorPalette* sourcePalette,
   uint16_t transparentColor,
   uint16_t fadeColor,
   float fadeFraction
)
{
   uint16_t sourceColor;
   colorCount = sourcePalette->colorCount;
   colors = std::make_unique<uint16_t[]>(colorCount);
   if (fadeFraction >= 1.0f)
   {
      for (int i = 0; i < sourcePalette->colorCount; ++i)
      {
         sourceColor = sourcePalette->colors[i];
         colors[i] = sourceColor == transparentColor
            ? sourceColor
            : SCREEN_ENDIAN_U2_VALUE(fadeColor);
      }
   }
   else if (fadeFraction > 0.0f)
   {
      for (int i = 0; i < sourcePalette->colorCount; ++i)
      {
         sourceColor = sourcePalette->colors[i];
         if (sourceColor != transparentColor)
         {
            colors[i] = frameBuffer->applyFadeColor(sourceColor);
         }
         else
         {
            colors[i] = sourceColor;
         }
      }
   }
}