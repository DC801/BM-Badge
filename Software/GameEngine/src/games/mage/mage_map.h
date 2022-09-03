/*
This class contains the MageMap class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_defines.h"
#include "EngineROM.h"

typedef struct {
	char name[MAP_GO_DIRECTION_NAME_LENGTH];
	uint16_t mapLocalScriptId;
	uint16_t padding;
} MapGoDirection;

class MageMap
{
public:
	char name[17];
	uint16_t tileWidth{0};
	uint16_t tileHeight{0};
	uint16_t cols{0};
	uint16_t rows{0};
	uint16_t onLoad{0};
	uint16_t onTick{0};
	uint16_t onLook{0};
	uint8_t layerCount{0};
	uint8_t playerEntityIndex{0};
	uint16_t entityCount{0};
	uint16_t geometryCount{0};
	uint16_t scriptCount{0};
	uint8_t goDirectionCount{ 0 };
	std::unique_ptr<uint16_t[]> entityGlobalIds{ std::make_unique<uint16_t[]>(1) };
	std::unique_ptr<uint16_t[]> geometryGlobalIds{ std::make_unique<uint16_t[]>(1) };
	std::unique_ptr<uint16_t[]> scriptGlobalIds{ std::make_unique<uint16_t[]>(1) };
	std::unique_ptr<MapGoDirection[]> goDirections{ std::make_unique<MapGoDirection[]>(1) };
	std::unique_ptr<uint32_t[]> mapLayerOffsets{ std::make_unique<uint32_t[]>(1) };

	MageMap(std::shared_ptr<EngineROM> ROM, uint32_t address);

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
private:
	std::shared_ptr<EngineROM> ROM;
}; //class MageMap

#endif //_MAGE_MAP_H
