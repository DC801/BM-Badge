#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include "mage_defines.h"

class MageMap
{
private:
	char name[17];
	uint16_t tileWidth;
	uint16_t tileHeight;
	uint16_t width;
	uint16_t height;
	uint8_t layerCount;
	uint16_t entityCount;
	std::unique_ptr<uint16_t[]> entityGlobalIds;
	std::unique_ptr<uint32_t[]> mapLayerOffsets;

public:
	MageMap() : name{0},
		tileWidth{0},
		tileHeight{0},
		width{0},
		height{0},
		layerCount{0},
		entityCount{0},
		entityGlobalIds{std::make_unique<uint16_t[]>(1)},
		mapLayerOffsets{std::make_unique<uint32_t[]>(1)}
	{ };

	MageMap(uint32_t address);

	std::string Name() const;
	uint16_t TileWidth() const;
	uint16_t TileHeight() const;
	uint16_t Width() const;
	uint16_t Height() const;
	uint8_t LayerCount() const;
	uint16_t EntityCount() const;
	uint16_t EntityId(uint16_t num) const;
	uint32_t LayerOffset(uint16_t num) const;
	uint32_t Size() const;
}; //class MageMap

#endif //_MAGE_MAP_H
