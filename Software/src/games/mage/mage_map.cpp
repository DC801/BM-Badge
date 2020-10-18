#include "mage_map.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageMap::MageMap(uint32_t address)
{
	uint32_t size = 0;
	uint32_t tilesPerLayer = 0;

	// Read name
	if (EngineROM_Read(address, 16, (uint8_t *)name) != 16)
	{
		goto MageMap_Error;
	}

	name[16] = 0; // Null terminate
	address += 16;

	if (EngineROM_Read(address, sizeof(tileWidth), (uint8_t *)&tileWidth) != sizeof(tileWidth))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&tileWidth);
	address += sizeof(tileWidth);

	if (EngineROM_Read(address, sizeof(tileHeight), (uint8_t *)&tileHeight) != sizeof(tileHeight))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&tileHeight);
	address += sizeof(tileHeight);

	if (EngineROM_Read(address, sizeof(width), (uint8_t *)&width) != sizeof(width))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&width);
	address += sizeof(width);

	if (EngineROM_Read(address, sizeof(height), (uint8_t *)&height) != sizeof(height))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&height);
	address += sizeof(height);
	tilesPerLayer = width * height;

	if (EngineROM_Read(address, sizeof(layerCount), &layerCount) != sizeof(layerCount))
	{
		goto MageMap_Error;
	}

	address += sizeof(layerCount) + sizeof(uint8_t); // Padding

	if (EngineROM_Read(address, sizeof(entityCount), (uint8_t *)&entityCount) != sizeof(entityCount))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&entityCount);
	address += sizeof(entityCount);

	entityGlobalIds = std::make_unique<uint16_t[]>(entityCount);
	size = sizeof(uint16_t) * entityCount;

	if (EngineROM_Read(address, size, (uint8_t *)entityGlobalIds.get()) != size)
	{
		goto MageMap_Error;
	}
	address += size;

	convert_endian_u2_buffer(entityGlobalIds.get(), entityCount);
	if (entityCount % 2)
	{
		address += sizeof(uint16_t); // Padding
	}

	mapLayerOffsets = std::make_unique<uint32_t[]>(layerCount);

	for (uint32_t i = 0; i < layerCount; i++)
	{
		mapLayerOffsets[i] = address;
		address += tilesPerLayer * (sizeof(uint16_t) + (2 * sizeof(uint8_t)));
	}

	return;

MageMap_Error:
	ENGINE_PANIC("Failed to read map data");
}

std::string MageMap::Name() const
{
	return std::string(name);
}

uint16_t MageMap::TileWidth() const
{
	return tileWidth;
}

uint16_t MageMap::TileHeight() const
{
	return tileHeight;
}

uint16_t MageMap::Width() const
{
	return width;
}

uint16_t MageMap::Height() const
{
	return height;
}

uint8_t MageMap::LayerCount() const
{
	return layerCount;
}

uint16_t MageMap::EntityCount() const
{
	return entityCount;
}

uint16_t MageMap::EntityId(uint16_t num) const
{
	if (!entityGlobalIds) return 0;

	if (entityCount > num)
	{
		return entityGlobalIds[num];
	}

	return 0;
}

uint32_t MageMap::LayerOffset(uint16_t num) const
{
	if (!mapLayerOffsets) return 0;

	if (layerCount > num)
	{
		return mapLayerOffsets[num];
	}

	return 0;
}

uint32_t MageMap::Size() const
{
	return sizeof(name) +
		sizeof(tileWidth) +
		sizeof(tileHeight) +
		sizeof(width) +
		sizeof(height) +
		sizeof(layerCount) +
		sizeof(entityCount) +
		(entityCount * sizeof(uint16_t)) +
		(layerCount * sizeof(uint32_t));
}
