#include "mage_color_palette.h"
#include "modules/sd.h"
#include "EngineROM.h"
#include "FrameBuffer.h"

extern FrameBuffer *mage_canvas;

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
}

uint32_t MageColorPalette::size() const
{
	uint32_t size = (
		sizeof(colorCount) +
		(colorCount * sizeof(uint16_t))
	);
	return size;
}

MageColorPalette::MageColorPalette(
	MageColorPalette *sourcePalette,
	uint16_t transparentColor,
	uint16_t fadeColor,
	float fadeFraction
) {
	uint16_t sourceColor;
	colorCount = sourcePalette->colorCount;
	colors = std::make_unique<uint16_t[]>(colorCount);
	if(
		fadeFraction == 1.0f
	) {
		for (int i = 0; i < sourcePalette->colorCount; ++i) {
			sourceColor = sourcePalette->colors[i];
			colors[i] = sourceColor == transparentColor
				? sourceColor
				: fadeColor;
		}
	} else if (
		fadeFraction != 0.0f
	) {
		for (int i = 0; i < sourcePalette->colorCount; ++i) {
			sourceColor = sourcePalette->colors[i];
			if(sourceColor != transparentColor) {
				colors[i] = SCREEN_ENDIAN_U2_VALUE(
					mage_canvas->applyFadeColor(
						SCREEN_ENDIAN_U2_VALUE(
							sourceColor
						)
					)
				);
			} else {
				colors[i] = sourceColor;
			}
		}
	}
}
