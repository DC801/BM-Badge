#ifndef SOFTWARE_MAGE_COLOR_PALETTE_H
#define SOFTWARE_MAGE_COLOR_PALETTE_H

#include <memory>
#include "EngineROM.h"

class FrameBuffer;
class MageGameEngine;

#define COLOR_PALETTE_INTEGRITY_STRING_LENGTH 2048
#define COLOR_PALETTE_NAME_LENGTH 32
#define COLOR_PALETTE_NAME_SIZE COLOR_PALETTE_NAME_LENGTH + 1

class MageColorPalette
{
public:
   MageColorPalette() noexcept = default;
   MageColorPalette(std::shared_ptr<EngineROM> ROM, uint32_t& address) noexcept;
   MageColorPalette(
      const FrameBuffer* frameBuffer,
      const MageColorPalette* sourcePalette,
      uint16_t fadeColor,
      float fadeFraction);

   uint16_t colorAt(uint16_t colorIndex) const { return colors[colorIndex % colors.size()]; };
private:
#ifndef DC801_EMBEDDED
   char name[COLOR_PALETTE_NAME_SIZE]{ 0 };
   char colorIntegrityString[COLOR_PALETTE_INTEGRITY_STRING_LENGTH]{ 0 };
#endif
   std::vector<uint16_t> colors{};
};

#endif //SOFTWARE_MAGE_COLOR_PALETTE_H
