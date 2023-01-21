#include "mage_color_palette.h"
#include "modules/sd.h"
#include "FrameBuffer.h"
#include "EnginePanic.h"
#include "convert_endian.h"
#include "utility.h"

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif // EMSCRIPTEN

MageColorPalette::MageColorPalette(uint32_t& address)
{
#ifndef DC801_EMBEDDED
   // Read name only if we're on Desktop,
   // Embedded don't got RAM for that
   ROM()->Read(name, address, COLOR_PALETTE_NAME_LENGTH);
#else
   // Regardless of reading/storing it, ALWAYS increment past it
   address += COLOR_PALETTE_NAME_LENGTH;
#endif

   // Read colorCount
   ROM()->Read(colorCount, address);
   address += 1; // padding
   address += colorCount * sizeof(uint16_t); // colors in palette
   if ((colorCount + 1) % 2)
   {
      address += 2; //alignment
   }
}

