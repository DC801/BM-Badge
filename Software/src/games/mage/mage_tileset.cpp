#include "mage_tileset.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageTileset::MageTileset(uint32_t address)
{
	uint32_t tileCount = 0;

	EngineROM_Read(
		address,
		16,
		(uint8_t *)name,
		"Failed to load MageTileset property 'name'"
	);

	name[16] = 0; // Null terminate
	address += 16;

	EngineROM_Read(
		address,
		sizeof(imageId),
		(uint8_t *)&imageId,
		"Failed to load MageTileset property 'imageId'"
	);
	imageId = convert_endian_u2_value(imageId);
	address += sizeof(imageId);

	EngineROM_Read(
		address,
		sizeof(imageWidth),
		(uint8_t *)&imageWidth,
		"Failed to load MageTileset property 'imageWidth'"
	);
	imageWidth = convert_endian_u2_value(imageWidth);
	address += sizeof(imageWidth);

	EngineROM_Read(
		address,
		sizeof(imageHeight),
		(uint8_t *)&imageHeight,
		"Failed to load MageTileset property 'imageHeight'"
	);
	imageHeight = convert_endian_u2_value(imageHeight);
	address += sizeof(imageHeight);

	EngineROM_Read(
		address,
		sizeof(tileWidth),
		(uint8_t *)&tileWidth,
		"Failed to load MageTileset property 'tileWidth'"
	);
	tileWidth = convert_endian_u2_value(tileWidth);
	address += sizeof(tileWidth);

	EngineROM_Read(
		address,
		sizeof(tileHeight),
		(uint8_t *)&tileHeight,
		"Failed to load MageTileset property 'tileHeight'"
	);
	tileHeight = convert_endian_u2_value(tileHeight);
	address += sizeof(tileHeight);

	EngineROM_Read(
		address,
		sizeof(cols),
		(uint8_t *)&cols,
		"Failed to load MageTileset property 'cols'"
	);
	cols = convert_endian_u2_value(cols);
	address += sizeof(cols);

	EngineROM_Read(
		address,
		sizeof(rows),
		(uint8_t *)&rows,
		"Failed to load MageTileset property 'rows'"
	);
	rows = convert_endian_u2_value(rows);
	address += sizeof(rows);

	tileCount = rows * cols;
	tiles = std::make_unique<uint8_t[]>(tileCount);

	EngineROM_Read(
		address,
		tileCount,
		(uint8_t *)tiles.get(),
		"Failed to load MageTileset property 'tiles'"
	);

	return;
}

std::string MageTileset::Name() const
{
	return std::string(name);
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

uint16_t MageTileset::Count() const
{
	return rows*cols;
}

uint8_t MageTileset::Tileset(uint32_t index) const
{
	if (!tiles) return 0;

	uint32_t tileCount = rows * cols;

	if (tileCount > index)
	{
		return tiles[index];
	}

	return 0;
}

uint32_t MageTileset::Size() const
{
	return 16 + (sizeof(uint16_t) * 7) + (rows * cols);
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
