#include "mage_color_palette.h"
#include "modules/sd.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageColorPalette::MageColorPalette(uint32_t address)
{
	uint32_t colorsSize;
	address += 32; // name
	// Read colorCount
	EngineROM_Read(
		address,
		sizeof(colorCount),
		(uint8_t *)&colorCount,
		"Failed to read ColorPalette property 'colorCount'"
	);

	//increment address
	address += sizeof(colorCount);
	address += 1; // padding

	// Construct array
	colors = std::make_unique<uint16_t[]>(colorCount);
	// Read colors
	colorsSize = colorCount * sizeof(uint16_t);
	// The encoder writes these colors BigEndian because the Screen's
	// data format is also BigEndian, so just don't convert these.
	EngineROM_Read(
		address,
		colorsSize,
		(uint8_t *)colors.get(),
		"Failed to read ColorPalette property 'colors'"
	);

	return;
}

uint32_t MageColorPalette::size() const
{
	uint32_t size = (
		sizeof(colorCount) +
		(sizeof(colorCount) * sizeof(uint16_t))
	);
	return size;
}
