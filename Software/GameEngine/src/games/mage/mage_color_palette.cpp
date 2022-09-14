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

MageColorPalette::MageColorPalette(
	std::shared_ptr<EngineROM> ROM, 
	uint32_t address) noexcept
{
#ifndef DC801_EMBEDDED
	// Read name only if we're on Desktop,
	// Embedded don't got RAM for that
	ROM->Read(
		address,
		COLOR_PALETTE_NAME_LENGTH,
		(uint8_t *)name,
		"Failed to read ColorPalette.name"
	);
	name[32] = 0; //manually set to null
#endif
	// Regardless of reading/storing it, ALWAYS increment past it
	address += COLOR_PALETTE_NAME_LENGTH;

	// Read colorCount
	ROM->Read(
		address,
		sizeof(colorCount),
		(uint8_t *)&colorCount,
		"Failed to read ColorPalette.colorCount"
	);
	address += sizeof(colorCount);
	address += 1; // padding

	// Construct array
	colors = std::make_unique<uint16_t[]>(colorCount);
	// The encoder writes these colors BigEndian because the Screen's
	// data format is also BigEndian, so just don't convert these.
	ROM->Read(
		address,
		colorCount * sizeof(uint16_t),
		(uint8_t *)colors.get(),
		"Failed to read ColorPalette.colors"
	);

	#ifndef DC801_EMBEDDED
	generatePaletteIntegrityString(colorIntegrityString);
	//debug_print(
	//	"%s ROM:%s",
	//	name,
	//	colorIntegrityString
	//);
	#endif //DC801_DESKTOP
}

MageColorPalette::MageColorPalette(
	FrameBuffer* frameBuffer,
	MageColorPalette *sourcePalette,
	uint16_t transparentColor,
	uint16_t fadeColor,
	float fadeFraction
) {
	uint16_t sourceColor;
	colorCount = sourcePalette->colorCount;
	colors = std::make_unique<uint16_t[]>(colorCount);
	if(
		fadeFraction >= 1.0f
	) {
		for (int i = 0; i < sourcePalette->colorCount; ++i) {
			sourceColor = sourcePalette->colors[i];
			colors[i] = sourceColor == transparentColor
				? sourceColor
				: SCREEN_ENDIAN_U2_VALUE(fadeColor);
		}
	} else if (
		fadeFraction != 0.0f
	) {
		for (int i = 0; i < sourcePalette->colorCount; ++i) {
			sourceColor = sourcePalette->colors[i];
			if(sourceColor != transparentColor) {
				colors[i] = SCREEN_ENDIAN_U2_VALUE(
					frameBuffer->applyFadeColor(
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

#ifndef DC801_EMBEDDED
void MageColorPalette::generatePaletteIntegrityString(
	char *targetString
) {
	for (int i = 0; i < colorCount; ++i) {
		sprintf(
			targetString + (7 * i),
			" 0x%04x",
			colors[i]
		);
	}
}

void MageColorPalette::verifyColors(
	const char* errorTriggerDescription
) {
	char currentString[COLOR_PALETTE_INTEGRITY_STRING_LENGTH];
	generatePaletteIntegrityString(currentString);
	if (strcmp(colorIntegrityString, currentString) != 0) {
		debug_print(
			"COLOR PALETTE CORRUPTION DETECTED"
		);
		debug_print(
			"%s A:%s",
			name,
			colorIntegrityString
		);
		debug_print(
			"%s B:%s",
			name,
			currentString
		);
		char corruptionLabel[256];
		sprintf(
			corruptionLabel,
			"COLOR PALETTE CORRUPTION DETECTED AFTER:\n%s",
			errorTriggerDescription
		);
		ENGINE_PANIC(corruptionLabel);
	}
}
#endif //DC801_DESKTOP
