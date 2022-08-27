/*
This class contains the MageTileset class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_TILESET_H
#define _MAGE_TILESET_H

#include "mage_defines.h"

#define TILESET_NAME_SIZE 16

class MageTileset
{
private:
	#ifndef DC801_EMBEDDED
	char name[TILESET_NAME_SIZE + 1];
	#endif
	uint32_t offset;
	uint16_t imageId;
	uint16_t imageWidth;
	uint16_t imageHeight;
	uint16_t tileWidth;
	uint16_t tileHeight;
	uint16_t cols;
	uint16_t rows;

public:

	MageTileset() :
		#ifndef DC801_EMBEDDED
		name{""},
		#endif
		offset{0},
		imageId{0},
		imageWidth{0},
		imageHeight{0},
		tileWidth{0},
		tileHeight{0},
		cols{0},
		rows{0}
{ };

	MageTileset(uint8_t index, uint32_t address);
	uint16_t ImageId() const;
	uint16_t ImageWidth() const;
	uint16_t ImageHeight() const;
	uint16_t TileWidth() const;
	uint16_t TileHeight() const;
	uint16_t Cols() const;
	uint16_t Rows() const;
	uint16_t Tiles() const;
	uint32_t Size() const;
	bool Valid() const;

	uint16_t getLocalGeometryIdByTileIndex(uint16_t tileIndex) const;
}; //class MageTileset

#endif //_MAGE_TILESET_H
