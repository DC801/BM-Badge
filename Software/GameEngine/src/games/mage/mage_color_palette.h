#ifndef SOFTWARE_MAGE_COLOR_PALETTE_H
#define SOFTWARE_MAGE_COLOR_PALETTE_H

#include <memory>
#define COLOR_PALETTE_INTEGRITY_STRING_LENGTH 2048
#define COLOR_PALETTE_NAME_LENGTH 32
#define COLOR_PALETTE_NAME_SIZE COLOR_PALETTE_NAME_LENGTH + 1

class MageColorPalette
{
public:
	#ifdef DC801_DESKTOP
	char name[COLOR_PALETTE_NAME_SIZE];
	char colorIntegrityString[COLOR_PALETTE_INTEGRITY_STRING_LENGTH];
	#endif //DC801_DESKTOP
	uint8_t colorCount;
	std::unique_ptr<uint16_t[]> colors;

	MageColorPalette() :
		#ifdef DC801_DESKTOP
		name {0},
		colorIntegrityString {0},
		#endif //DC801_DESKTOP
		colorCount {0},
		colors{std::make_unique<uint16_t[]>(colorCount)}
	{};

	MageColorPalette(uint32_t address);

	MageColorPalette(
		MageColorPalette *sourcePalette,
		uint16_t transparentColor,
		uint16_t fadeColor,
		float fadeFraction
	);

	uint32_t size() const;

	#ifdef DC801_DESKTOP
	void generatePaletteIntegrityString(char *targetString);

	void verifyColors(const char* errorTriggerDescription);
	#endif //DC801_DESKTOP
};

#endif //SOFTWARE_MAGE_COLOR_PALETTE_H
