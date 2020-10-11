#ifndef _MAGE_ROM_H
#define _MAGE_ROM_H

#include <memory>
#include <string>
#include "mage.h"

class MageHeader
{
private:
	uint32_t counts;
	std::unique_ptr<uint32_t[]> offsets;
	std::unique_ptr<uint32_t[]> lengths;

public:
	MageHeader() : counts{0},
		offsets{std::make_unique<uint32_t[]>(1)},
		lengths{std::make_unique<uint32_t[]>(1)}
	{ };

	MageHeader(uint32_t address);

	uint32_t count() const;
	uint32_t offset(uint8_t num) const;
	uint32_t length(uint8_t num) const;
	uint32_t size() const;
	bool valid() const;
}; //class MageHeader

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

class MageTileset
{
private:
	char name[17];
	uint16_t imageIndex;
	uint16_t imageWidth;
	uint16_t imageHeight;
	uint16_t tileWidth;
	uint16_t tileHeight;
	uint16_t cols;
	uint16_t rows;
	std::unique_ptr<uint8_t[]> tiles;

public:
	MageTileset() : name{""},
		imageIndex{0},
		imageWidth{0},
		imageHeight{0},
		tileWidth{0},
		tileHeight{0},
		cols{0},
		rows{0},
		tiles{std::make_unique<uint8_t[]>(1)}
	{ };

	MageTileset(uint32_t address);

	std::string Name() const;
	uint16_t ImageIndex() const;
	uint16_t ImageWidth() const;
	uint16_t ImageHeight() const;
	uint16_t TileWidth() const;
	uint16_t TileHeight() const;
	uint16_t Cols() const;
	uint16_t Rows() const;
	uint8_t Tile(uint32_t index) const;
	uint32_t Size() const;
	bool Valid() const;
}; //class MageTileset

class MageAnimationFrame
{
private:
	uint16_t tileIndex;
	uint16_t duration;
public:
	MageAnimationFrame() : tileIndex{0},
		duration{0}
	{};

	MageAnimationFrame(uint32_t address);

	uint16_t TileIndex() const;
	uint16_t Duration() const;
}; //class MageAnimationFrame


class MageAnimation
{
private:
	uint16_t tilesetIndex;
	uint16_t frameCount;

	std::unique_ptr<MageAnimationFrame[]> animationFrames;
public:
	MageAnimation() : tilesetIndex{0},
		frameCount{0},
		animationFrames{std::make_unique<MageAnimationFrame[]>(frameCount)}
	{};

	MageAnimation(uint32_t address);

	uint16_t TilesetIndex() const;
	uint16_t FrameCount() const;
	MageAnimationFrame AnimationFrame(uint32_t index) const;
}; //class MageAnimation

class MageRom
{
private:
	uint32_t mapIndex;
	uint32_t currentMapIndex;

	MageHeader mapHeader;
	MageHeader tileHeader;
	MageHeader animationHeader;
	MageHeader entityTypeHeader;
	MageHeader entityHeader;
	MageHeader imageHeader;

	MageMap map;
	std::unique_ptr<MageTileset[]> tiles;
public:
	MageRom();

	uint32_t Size() const;
	const MageTileset& Tile(uint32_t index) const;
	const MageMap& Map() const;
	void LoadMap();
	void DrawMap(uint8_t layer, int32_t camera_x, int32_t camera_y) const;
}; //class MageRom

extern MageDataMemoryAddresses dataMemoryAddresses;
// extern MageTileset *allTilesets;
extern uint32_t mapIndex;
extern uint32_t currentMapIndex;
// extern MageMap currentMap;
// extern MageTileset *currentMapTilesets;
extern MageEntity *currentMapEntities;
extern uint16_t *currentMapEntityFrameTicks;
extern MageAnimationFrame *currentMapEntityFrames;
extern MageEntity **currentMapEntitiesSortedByRenderOrder;
extern uint8_t *data;

uint32_t load_data_headers();

/*void load_tilesets_headers(
	MageTileset *tilesetPointer,
	uint32_t tilesetIndex
);*/

void load_all_tilesets();
void load_map_headers(uint32_t incomingMapIndex);
void correct_entity_type_endians();
void correct_animation_endians();
void correct_entity_endians();

MageEntityType* get_entity_type_by_index(uint8_t index);
uint16_t* get_image_by_index(uint8_t index);
// MageTileset* get_tileset_by_id(uint8_t index);

#endif //_MAGE_ROM_H
