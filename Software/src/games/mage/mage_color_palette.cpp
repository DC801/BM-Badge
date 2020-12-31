#include "mage_color_palette.h"
#include "modules/sd.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageColorPalette::MageColorPalette(uint32_t address)
{
	uint32_t colorsSize;
	address += 32; // name
	// Read colorCount
	if (EngineROM_Read(address, sizeof(colorCount), (uint8_t *)&colorCount) != sizeof(colorCount))
	{
		goto MageColorPalette_Error;
	}

	//increment address
	address += sizeof(colorCount);
	address += 1; // padding

	// Construct array
	colors = std::make_unique<uint16_t[]>(colorCount);
	// Read colors
	colorsSize = colorCount * sizeof(uint16_t);
	if (EngineROM_Read(address, colorsSize, (uint8_t *)colors.get()) != colorsSize)
	{
		goto MageColorPalette_Error;
	}
	convert_endian_u2_buffer(colors.get(), colorCount);

	return;

MageColorPalette_Error:
	ENGINE_PANIC("Failed to read Color Palette data");
}

uint32_t MageColorPalette::size() const
{
	uint32_t size = (
		sizeof(colorCount) +
		(sizeof(colorCount) * sizeof(uint16_t))
	);
	return size;
}
