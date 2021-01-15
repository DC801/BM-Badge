#ifndef SOFTWARE_MAGE_COLOR_PALETTE_H
#define SOFTWARE_MAGE_COLOR_PALETTE_H

#include <memory>

class MageColorPalette
{
public:
	uint8_t colorCount;
	std::unique_ptr<uint16_t[]> colors;

	MageColorPalette() :
		colorCount {0},
		colors{std::make_unique<uint16_t[]>(colorCount)}
	{};

	MageColorPalette(uint32_t address);

	uint32_t size() const;
};

#endif //SOFTWARE_MAGE_COLOR_PALETTE_H
