#include "mage_tileset.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "convert_endian.h"

extern std::unique_ptr<EngineRom> EngineROM;

MageTileset::MageTileset(uint8_t index, uint32_t address)
{
	offset = address;
	#ifndef DC801_EMBEDDED
	EngineROM->Read(
		offset,
		16,
		(uint8_t *)name,
		"Failed to load MageTileset property 'name'"
	);
	name[TILESET_NAME_SIZE] = 0; // Null terminate
	#endif

	offset += TILESET_NAME_SIZE;

	EngineROM->Read(
		offset,
		sizeof(imageId),
		(uint8_t *)&imageId,
		"Failed to load MageTileset property 'imageId'"
	);
	imageId = ROM_ENDIAN_U2_VALUE(imageId);
	offset += sizeof(imageId);

	EngineROM->Read(
		offset,
		sizeof(imageWidth),
		(uint8_t *)&imageWidth,
		"Failed to load MageTileset property 'imageWidth'"
	);
	imageWidth = ROM_ENDIAN_U2_VALUE(imageWidth);
	offset += sizeof(imageWidth);

	EngineROM->Read(
		offset,
		sizeof(imageHeight),
		(uint8_t *)&imageHeight,
		"Failed to load MageTileset property 'imageHeight'"
	);
	imageHeight = ROM_ENDIAN_U2_VALUE(imageHeight);
	offset += sizeof(imageHeight);

	EngineROM->Read(
		offset,
		sizeof(tileWidth),
		(uint8_t *)&tileWidth,
		"Failed to load MageTileset property 'tileWidth'"
	);
	tileWidth = ROM_ENDIAN_U2_VALUE(tileWidth);
	offset += sizeof(tileWidth);

	EngineROM->Read(
		offset,
		sizeof(tileHeight),
		(uint8_t *)&tileHeight,
		"Failed to load MageTileset property 'tileHeight'"
	);
	tileHeight = ROM_ENDIAN_U2_VALUE(tileHeight);
	offset += sizeof(tileHeight);

	EngineROM->Read(
		offset,
		sizeof(cols),
		(uint8_t *)&cols,
		"Failed to load MageTileset property 'cols'"
	);
	cols = ROM_ENDIAN_U2_VALUE(cols);
	offset += sizeof(cols);

	EngineROM->Read(
		offset,
		sizeof(rows),
		(uint8_t *)&rows,
		"Failed to load MageTileset property 'rows'"
	);
	rows = ROM_ENDIAN_U2_VALUE(rows);
	offset += sizeof(rows);

	offset += sizeof(uint16_t); // u2 padding before the geometry IDs

	if(!Valid()) {
		char errorString[256] = "";
		sprintf(
			errorString,
			"Invalid Tileset detected!\n"
				"	Tileset index is: %d\n"
				"	Tileset address is: %d",
			index,
			address
		);
		ENGINE_PANIC(errorString);
	}
}

uint16_t MageTileset::ImageId() const
{
	return imageId;
}

uint16_t MageTileset::ImageWidth() const
{
	return imageWidth;
}

uint16_t MageTileset::ImageHeight() const
{
	return imageHeight;
}

uint16_t MageTileset::TileWidth() const
{
	return tileWidth;
}

uint16_t MageTileset::TileHeight() const
{
	return tileHeight;
}

uint16_t MageTileset::Cols() const
{
	return cols;
}

uint16_t MageTileset::Rows() const
{
	return rows;
}

uint16_t MageTileset::Tiles() const
{
	return rows*cols;
}

uint32_t MageTileset::Size() const {
	return (
		sizeof(offset) +
		sizeof(imageId) +
		sizeof(imageWidth) +
		sizeof(imageHeight) +
		sizeof(tileWidth) +
		sizeof(tileHeight) +
		sizeof(cols) +
		sizeof(rows)
	);
}

bool MageTileset::Valid() const
{
	if (imageWidth < 1) return false;
	if (imageHeight < 1) return false;
	if (tileWidth < 1) return false;
	if (tileHeight < 1) return false;
	if (cols < 1) return false;
	if (rows < 1) return false;

	return true;
}

uint16_t MageTileset::getLocalGeometryIdByTileIndex(uint16_t tileIndex) const
{
	uint16_t globalGeometryId = 0;
	EngineROM->Read(
		offset + tileIndex * sizeof(globalGeometryId),
		sizeof(globalGeometryId),
		(uint8_t *)&globalGeometryId,
		"Failed to load MageTileset property 'globalGeometryIds'"
	);
	globalGeometryId = ROM_ENDIAN_U2_VALUE(globalGeometryId);
	return globalGeometryId;
}
