#include "mage_tileset.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageTileset::MageTileset(uint32_t address)
{
	uint32_t tileCount = 0;

	if (EngineROM_Read(address, 16, (uint8_t *)name) != 16)
	{
		goto MageTileset_Error;
	}

	name[16] = 0; // Null terminate
	address += 16;

	if (EngineROM_Read(address, sizeof(imageId), (uint8_t *)&imageId) != sizeof(imageId))
	{
		goto MageTileset_Error;
	}

	imageId = convert_endian_u2_value(imageId);
	address += sizeof(imageId);

	if (EngineROM_Read(address, sizeof(imageWidth), (uint8_t *)&imageWidth) != sizeof(imageWidth))
	{
		goto MageTileset_Error;
	}

	imageWidth = convert_endian_u2_value(imageWidth);
	address += sizeof(imageWidth);

	if (EngineROM_Read(address, sizeof(imageHeight), (uint8_t *)&imageHeight) != sizeof(imageHeight))
	{
		goto MageTileset_Error;
	}

	imageHeight = convert_endian_u2_value(imageHeight);
	address += sizeof(imageHeight);

	if (EngineROM_Read(address, sizeof(tileWidth), (uint8_t *)&tileWidth) != sizeof(tileWidth))
	{
		goto MageTileset_Error;
	}

	tileWidth = convert_endian_u2_value(tileWidth);
	address += sizeof(tileWidth);

	if (EngineROM_Read(address, sizeof(tileHeight), (uint8_t *)&tileHeight) != sizeof(tileHeight))
	{
		goto MageTileset_Error;
	}

	tileHeight = convert_endian_u2_value(tileHeight);
	address += sizeof(tileHeight);

	if (EngineROM_Read(address, sizeof(cols), (uint8_t *)&cols) != sizeof(cols))
	{
		goto MageTileset_Error;
	}

	cols = convert_endian_u2_value(cols);
	address += sizeof(cols);

	if (EngineROM_Read(address, sizeof(rows), (uint8_t *)&rows) != sizeof(rows))
	{
		goto MageTileset_Error;
	}

	rows = convert_endian_u2_value(rows);
	address += sizeof(rows);
	tileCount = rows * cols;
	tiles = std::make_unique<uint8_t[]>(tileCount);

	if (EngineROM_Read(address, tileCount, (uint8_t *)tiles.get()) != tileCount)
	{
		goto MageTileset_Error;
	}

	return;

MageTileset_Error:
	ENGINE_PANIC("Failed to load tileset data");
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

uint8_t MageTileset::Tile(uint32_t index) const
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
