#include "mage_map.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageMap::MageMap(uint32_t address)
{
	uint32_t size = 0;
	uint32_t tilesPerLayer = 0;

	// Read name
	EngineROM_Read(
		address,
		16,
		(uint8_t *)name,
		"Failed to read Map property 'name'"
	);
	name[16] = 0; // Null terminate
	address += 16;

	//read tileWidth
	EngineROM_Read(
		address,
		sizeof(tileWidth),
		(uint8_t *)&tileWidth,
		"Failed to read Map property 'tileWidth'"
	);
	tileWidth = ROM_ENDIAN_U2_VALUE(tileWidth);
	address += sizeof(tileWidth);

	//read tileHeight
	EngineROM_Read(
		address,
		sizeof(tileHeight),
		(uint8_t *)&tileHeight,
		"Failed to read Map property 'tileHeight'"
	);
	tileHeight = ROM_ENDIAN_U2_VALUE(tileHeight);
	address += sizeof(tileHeight);

	//read cols
	EngineROM_Read(
		address,
		sizeof(cols),
		(uint8_t *)&cols,
		"Failed to read Map property 'cols'"
	);
	cols = ROM_ENDIAN_U2_VALUE(cols);
	address += sizeof(cols);

	//read rows
	EngineROM_Read(
		address,
		sizeof(rows),
		(uint8_t *)&rows,
		"Failed to read Map property 'rows'"
	);
	rows = ROM_ENDIAN_U2_VALUE(rows);
	address += sizeof(rows);
	tilesPerLayer = cols * rows;

	//read onLoad
	EngineROM_Read(
		address,
		sizeof(onLoad),
		(uint8_t *)&onLoad,
		"Failed to read Map property 'onLoad'"
	);
	onLoad = ROM_ENDIAN_U2_VALUE(onLoad);
	address += sizeof(onLoad);

	//read onTick
	EngineROM_Read(
		address,
		sizeof(onTick),
		(uint8_t *)&onTick,
		"Failed to read Map property 'onTick'"
	);
	onTick = ROM_ENDIAN_U2_VALUE(onTick);
	address += sizeof(onTick);

	//read onLook
	EngineROM_Read(
		address,
		sizeof(onLook),
		(uint8_t *)&onLook,
		"Failed to read Map property 'onLook'"
	);
	onLook = ROM_ENDIAN_U2_VALUE(onLook);
	address += sizeof(onLook);

	//read layerCount
	EngineROM_Read(
		address,
		sizeof(layerCount),
		&layerCount,
		"Failed to read Map property 'layerCount'"
	);
	address += sizeof(layerCount);

	//read playerEntityIndex
	EngineROM_Read(
		address,
		sizeof(playerEntityIndex),
		&playerEntityIndex,
		"Failed to read Map property 'playerEntityIndex'"
	);
	address += sizeof(playerEntityIndex);

	//read entityCount
	EngineROM_Read(
		address,
		sizeof(entityCount),
		(uint8_t *)&entityCount,
		"Failed to read Map property 'entityCount'"
	);
	entityCount = ROM_ENDIAN_U2_VALUE(entityCount);
	address += sizeof(entityCount);

	//read geometryCount
	EngineROM_Read(
		address,
		sizeof(geometryCount),
		(uint8_t *)&geometryCount,
		"Failed to read Map property 'geometryCount'"
	);
	geometryCount = ROM_ENDIAN_U2_VALUE(geometryCount);
	address += sizeof(geometryCount);

	//read scriptCount
	EngineROM_Read(
		address,
		sizeof(scriptCount),
		(uint8_t *)&scriptCount,
		"Failed to read Map property 'scriptCount'"
	);
	scriptCount = ROM_ENDIAN_U2_VALUE(scriptCount);
	address += sizeof(scriptCount);

	//read goDirectionCount
	EngineROM_Read(
		address,
		sizeof(goDirectionCount),
		(uint8_t *)&goDirectionCount,
		"Failed to read Map property 'goDirectionCount'"
	);
	address += sizeof(goDirectionCount);

	address += sizeof(uint8_t); // padding

	//read entityGlobalIds
	entityGlobalIds = std::make_unique<uint16_t[]>(entityCount);
	size = sizeof(uint16_t) * entityCount;
	EngineROM_Read(
		address,
		size,
		(uint8_t *)entityGlobalIds.get(),
		"Failed to read Map property 'entityGlobalIds'"
	);
	ROM_ENDIAN_U2_BUFFER(entityGlobalIds.get(), entityCount);
	address += size;

	//read geometryGlobalIds
	geometryGlobalIds = std::make_unique<uint16_t[]>(geometryCount);
	size = sizeof(uint16_t) * geometryCount;
	EngineROM_Read(
		address,
		size,
		(uint8_t *)geometryGlobalIds.get(),
		"Failed to read Map property 'geometryGlobalIds'"
	);
	ROM_ENDIAN_U2_BUFFER(geometryGlobalIds.get(), geometryCount);
	address += size;

	//read entityGlobalIds
	scriptGlobalIds = std::make_unique<uint16_t[]>(scriptCount);
	size = sizeof(uint16_t) * scriptCount;
	EngineROM_Read(
		address,
		size,
		(uint8_t *)scriptGlobalIds.get(),
		"Failed to read Map property 'scriptGlobalIds'"
	);
	ROM_ENDIAN_U2_BUFFER(scriptGlobalIds.get(), scriptCount);
	address += size;

	//read goDirections
	goDirections = std::make_unique<MapGoDirection[]>(goDirectionCount);
	size = sizeof(MapGoDirection) * goDirectionCount;
	EngineROM_Read(
		address,
		size,
		(uint8_t *)goDirections.get(),
		"Failed to read Map property 'goDirections'"
	);
	for (int i = 0; i < goDirectionCount; ++i) {
		ROM_ENDIAN_U2_VALUE(&goDirections[i].mapLocalScriptId);
	}
	address += size;

	//padding to align with uint32_t memory spacing:
	if ((entityCount + geometryCount + scriptCount) % 2)
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
		sizeof(onLook) +
		sizeof(layerCount) +
		sizeof(entityCount) +
		sizeof(geometryCount) +
		sizeof(scriptCount) +
		sizeof(goDirectionCount) +
		(entityCount * sizeof(uint16_t)) +
		(geometryCount * sizeof(uint16_t)) +
		(scriptCount * sizeof(uint16_t)) +
		(goDirectionCount * sizeof(MapGoDirection)) +
		(layerCount * sizeof(uint32_t));
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

uint8_t MageMap::LayerCount() const
{
	return layerCount;
}

uint8_t MageMap::EntityCount() const
{
	return entityCount;
}

uint16_t MageMap::GeometryCount() const
{
	return geometryCount;
}

uint16_t MageMap::ScriptCount() const
{
	return scriptCount;
}

uint16_t MageMap::getGlobalEntityId(uint16_t mapLocalEntityId) const
{
	if (!entityGlobalIds) return 0;
	return entityGlobalIds[mapLocalEntityId % entityCount];
}

uint16_t MageMap::getGlobalGeometryId(uint16_t mapLocalGeometryId) const
{
	if (!geometryGlobalIds) return 0;
	return geometryGlobalIds[mapLocalGeometryId % geometryCount];
}

uint16_t MageMap::getGlobalScriptId(uint16_t mapLocalScriptId) const
{
	if (!scriptGlobalIds) return 0;
	return scriptGlobalIds[mapLocalScriptId % scriptCount];
}

std::string MageMap::getDirectionNames() const
{
	std::string result = "";
	for (int i = 0; i < goDirectionCount; ++i) {
		result += "\t";
		result += goDirections[i].name;
	}
	return result;
}

uint16_t MageMap::getDirectionScriptId(const std::string directionName) const {
	uint16_t result = 0;
	for (int i = 0; i < goDirectionCount; i++) {
		MapGoDirection direction = goDirections[i];
		if (!strcmp(direction.name, directionName.c_str())) {
			result = direction.mapLocalScriptId;
			break;
		}
	}
	return result;
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

uint8_t MageMap::getMapLocalPlayerEntityIndex() {
	return playerEntityIndex;
}
