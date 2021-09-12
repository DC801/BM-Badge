/*
This class contains the MageMap class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_defines.h"

typedef struct {
	char name[MAP_GO_DIRECTION_NAME_LENGTH];
	uint16_t mapLocalScriptId;
	uint16_t padding;
} MapGoDirection;

class MageMap
{
public:
	char name[17];
	uint16_t tileWidth;
	uint16_t tileHeight;
	uint16_t cols;
	uint16_t rows;
	uint16_t onLoad;
	uint16_t onTick;
	uint16_t onLook;
	uint8_t layerCount;
	uint8_t playerEntityIndex;
	uint16_t entityCount;
	uint16_t geometryCount;
	uint16_t scriptCount;
	uint8_t goDirectionCount;
	std::unique_ptr<uint16_t[]> entityGlobalIds;
	std::unique_ptr<uint16_t[]> geometryGlobalIds;
	std::unique_ptr<uint16_t[]> scriptGlobalIds;
	std::unique_ptr<MapGoDirection[]> goDirections;
	std::unique_ptr<uint32_t[]> mapLayerOffsets;

	MageMap() : name{0},
		tileWidth{0},
		tileHeight{0},
		cols{0},
		rows{0},
		onLoad{0},
		onTick{0},
		onLook{0},
		layerCount{0},
		playerEntityIndex{0},
		entityCount{0},
		geometryCount{0},
		scriptCount{0},
		goDirectionCount{0},
		entityGlobalIds{std::make_unique<uint16_t[]>(1)},
		geometryGlobalIds{std::make_unique<uint16_t[]>(1)},
		scriptGlobalIds{std::make_unique<uint16_t[]>(1)},
		goDirections{std::make_unique<MapGoDirection[]>(1)},
		mapLayerOffsets{std::make_unique<uint32_t[]>(1)}
	{ };

	MageMap(uint32_t address);

	uint32_t Size() const;
	std::string Name() const;
	uint16_t TileWidth() const;
	uint16_t TileHeight() const;
	uint16_t Cols() const;
	uint16_t Rows() const;
	uint8_t LayerCount() const;
	uint8_t EntityCount() const;
	uint16_t GeometryCount() const;
	uint16_t ScriptCount() const;
	//this returns a global entityId from the local entity index
	uint16_t getGlobalEntityId(uint16_t mapLocalEntityId) const;
	//this returns a global geometryId from the local geometry index
	uint16_t getGlobalGeometryId(uint16_t mapLocalGeometryId) const;
	//the returns a global mapLocalScriptId from the local script index
	uint16_t getGlobalScriptId(uint16_t mapLocalScriptId) const;
	std::string getDirectionNames() const;
	uint16_t getDirectionScriptId(std::string directionName) const;
	uint32_t LayerOffset(uint16_t num) const;

	uint8_t getMapLocalPlayerEntityIndex();
}; //class MageMap

#endif //_MAGE_MAP_H
