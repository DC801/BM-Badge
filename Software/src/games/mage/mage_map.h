/*
This class contains the MageMap class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_defines.h"

class MageMap
{
private:
	char name[17];
	uint16_t tileWidth;
	uint16_t tileHeight;
	uint16_t cols;
	uint16_t rows;
	uint16_t onLoad;
	uint16_t onTick;
	uint8_t layerCount;
	uint16_t entityCount;
	uint16_t geometryCount;
	uint16_t scriptCount;
	std::unique_ptr<uint16_t[]> entityGlobalIds;
	std::unique_ptr<uint16_t[]> geometryGlobalIds;
	std::unique_ptr<uint16_t[]> scriptGlobalIds;
	std::unique_ptr<uint32_t[]> mapLayerOffsets;

public:
	MageMap() : name{0},
		tileWidth{0},
		tileHeight{0},
		cols{0},
		rows{0},
		onLoad{0},
		onTick{0},
		layerCount{0},
		entityCount{0},
		geometryCount{0},
		scriptCount{0},
		entityGlobalIds{std::make_unique<uint16_t[]>(1)},
		geometryGlobalIds{std::make_unique<uint16_t[]>(1)},
		scriptGlobalIds{std::make_unique<uint16_t[]>(1)},
		mapLayerOffsets{std::make_unique<uint32_t[]>(1)}
	{ };

	MageMap(uint32_t address);

	uint32_t Size() const;
	std::string Name() const;
	uint16_t TileWidth() const;
	uint16_t TileHeight() const;
	uint16_t Cols() const;
	uint16_t Rows() const;
	uint16_t getMapLocalMapOnLoadScriptId() const;
	uint16_t getMapLocalMapOnTickScriptId() const;
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
	uint32_t LayerOffset(uint16_t num) const;
	//this sets the map's onLoad and onTick script value.
	void setOnLoad(uint16_t scriptId);
	void setOnTick(uint16_t scriptId);
}; //class MageMap

#endif //_MAGE_MAP_H
