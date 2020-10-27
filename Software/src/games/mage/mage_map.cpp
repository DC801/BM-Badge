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

	tileWidth = convert_endian_u2_value(tileWidth);
	address += sizeof(tileWidth);

	if (EngineROM_Read(address, sizeof(tileHeight), (uint8_t *)&tileHeight) != sizeof(tileHeight))
	{
		goto MageMap_Error;
	}

	tileHeight = convert_endian_u2_value(tileHeight);
	address += sizeof(tileHeight);

	if (EngineROM_Read(address, sizeof(cols), (uint8_t *)&cols) != sizeof(cols))
	{
		goto MageMap_Error;
	}

	cols = convert_endian_u2_value(cols);
	address += sizeof(cols);

	if (EngineROM_Read(address, sizeof(rows), (uint8_t *)&rows) != sizeof(rows))
	{
		goto MageMap_Error;
	}

	rows = convert_endian_u2_value(rows);
	address += sizeof(rows);
	tilesPerLayer = cols * rows;

	if (EngineROM_Read(address, sizeof(onLoad), (uint8_t *)&onLoad) != sizeof(onLoad))
	{
		goto MageMap_Error;
	}

	onLoad = convert_endian_u2_value(onLoad);
	address += sizeof(onLoad);

	if (EngineROM_Read(address, sizeof(onTick), (uint8_t *)&onTick) != sizeof(onTick))
	{
		goto MageMap_Error;
	}

	onTick = convert_endian_u2_value(onTick);
	address += sizeof(onTick);

	if (EngineROM_Read(address, sizeof(layerCount), &layerCount) != sizeof(layerCount))
	{
		goto MageMap_Error;
	}

	address += sizeof(layerCount) + sizeof(uint8_t); // Padding

	if (EngineROM_Read(address, sizeof(entityCount), (uint8_t *)&entityCount) != sizeof(entityCount))
	{
		goto MageMap_Error;
	}
	entityCount = convert_endian_u2_value(entityCount);
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

uint16_t MageMap::Cols() const
{
	return cols;
}

uint16_t MageMap::Rows() const
{
	return rows;
}

uint16_t MageMap::OnLoad() const
{
	return onLoad;
}

uint16_t MageMap::OnTick() const
{
	return onTick;
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
		sizeof(cols) +
		sizeof(rows) +
		sizeof(onLoad) +
		sizeof(onTick) +
		sizeof(layerCount) +
		sizeof(entityCount) +
		(entityCount * sizeof(uint16_t)) +
		(layerCount * sizeof(uint32_t));
}
