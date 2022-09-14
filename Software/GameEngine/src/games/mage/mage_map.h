/*
This class contains the MageMap class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_defines.h"
#include "EngineROM.h"

#include <vector>

class MageMap
{
	friend class MageGameControl;
	struct GoDirection
	{
		char name[MAP_GO_DIRECTION_NAME_LENGTH]{ 0 };
		uint16_t mapLocalScriptId{ 0 };
		uint16_t padding{ 0 };
	};
public:
	MageMap(std::shared_ptr<EngineROM> ROM, uint32_t address);

	std::string Name() const
	{
		return std::string(name);
	}

	uint16_t TileWidth() const
	{
		return tileWidth;
	}

	uint16_t TileHeight() const
	{
		return tileHeight;
	}

	uint16_t Cols() const
	{
		return cols;
	}

	uint16_t Rows() const
	{
		return rows;
	}

	uint8_t LayerCount() const
	{
		return layerCount;
	}

	uint8_t EntityCount() const
	{
		return entityCount;
	}

	uint16_t GeometryCount() const
	{
		return geometryCount;
	}

	uint16_t ScriptCount() const
	{
		return scriptCount;
	}

	//this returns a global entityId from the local entity index
	uint16_t getGlobalEntityId(uint16_t mapLocalEntityId) const;
	//this returns a global geometryId from the local geometry index
	uint16_t getGlobalGeometryId(uint16_t mapLocalGeometryId) const;
	//the returns a global mapLocalScriptId from the local script index
	uint16_t getGlobalScriptId(uint16_t mapLocalScriptId) const;

	uint8_t getFilteredEntityId(uint8_t mapLocalEntityId) const
	{
		return filteredMapLocalEntityIds[mapLocalEntityId % MAX_ENTITIES_PER_MAP];
	}

	uint8_t getMapLocalEntityId(uint8_t filteredEntityId) const
	{
		return mapLocalEntityIds[filteredEntityId % MAX_ENTITIES_PER_MAP];
	}

	std::string getDirectionNames() const;
	uint16_t getDirectionScriptId(std::string directionName) const;
	uint32_t LayerOffset(uint16_t num) const;
	uint8_t getPlayerEntityIndex();

	constexpr uint16_t GetOnLoad() const { return onLoad; }
	constexpr uint16_t GetOnLook() const { return onLook; }
	constexpr uint16_t GetOnTick() const { return onTick; }
	constexpr void SetOnLook(uint16_t lookId) { onLook = lookId; }
	constexpr void SetOnTick(uint16_t tickId) { onTick = tickId; }
private:
	std::shared_ptr<EngineROM> ROM;

	uint8_t filteredMapLocalEntityIds[MAX_ENTITIES_PER_MAP]{ NO_PLAYER };
	uint8_t mapLocalEntityIds[MAX_ENTITIES_PER_MAP]{ NO_PLAYER };

	char name[17];
	uint16_t tileWidth{ 0 };
	uint16_t tileHeight{ 0 };
	uint16_t cols{ 0 };
	uint16_t rows{ 0 };
	uint16_t onLoad{ 0 };
	uint16_t onTick{ 0 };
	uint16_t onLook{ 0 };
	uint8_t layerCount{ 0 };
	uint8_t playerEntityIndex{ 0 };
	uint16_t entityCount{ 0 };
	uint16_t geometryCount{ 0 };
	uint16_t scriptCount{ 0 };
	std::vector<uint16_t> entityGlobalIds;
	std::vector<uint16_t> geometryGlobalIds;
	std::vector<uint16_t> scriptGlobalIds;
	std::vector<GoDirection> goDirections;
	std::vector<uint32_t> mapLayerOffsets;

}; //class MageMap

#endif //_MAGE_MAP_H
