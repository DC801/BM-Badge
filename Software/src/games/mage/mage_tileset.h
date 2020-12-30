/*
This class contains the MageTileset class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_TILESET_H
#define _MAGE_TILESET_H

#include "mage_defines.h"

class MageTileset
{
private:
	char name[17];
	uint16_t imageId;
	uint16_t imageWidth;
	uint16_t imageHeight;
	uint16_t tileWidth;
	uint16_t tileHeight;
	uint16_t cols;
	uint16_t rows;
	std::unique_ptr<uint8_t[]> tiles;

public:
	MageTileset() : name{""},
		imageId{0},
		imageWidth{0},
		imageHeight{0},
		tileWidth{0},
		tileHeight{0},
		cols{0},
		rows{0},
		tiles{std::make_unique<uint8_t[]>(1)}
	{ };

	MageTileset(uint32_t address);

	std::string Name() const;
	uint16_t ImageId() const;
	uint16_t ImageWidth() const;
	uint16_t ImageHeight() const;
	uint16_t TileWidth() const;
	uint16_t TileHeight() const;
	uint16_t Cols() const;
	uint16_t Rows() const;
	uint16_t Count() const;
	uint8_t Tileset(uint32_t index) const;
	uint32_t Size() const;
	bool Valid() const;
}; //class MageTileset

#endif //_MAGE_TILESET_H
