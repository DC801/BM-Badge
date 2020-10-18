#ifndef _MAGE_GAME_CONTROL
#define _MAGE_GAME_CONTROL

#include "mage_defines.h"
#include "mage_header.h"
#include "mage_map.h"
#include "mage_tileset.h"
#include "mage_animation.h"
#include "mage_entity_type.h"

class MageGameControl
{
private:
	//Stores the current map's index value
	uint32_t currentMapId;

	//these header objects store the header information for all datasets on the ROM,
	//including address offsets for each item, and the length of the item in memory.
	MageHeader mapHeader;
	MageHeader tileHeader;
	MageHeader animationHeader;
	MageHeader entityTypeHeader;
	MageHeader entityHeader;
	MageHeader imageHeader;

	//this is where the current map data from the ROM is stored.
	MageMap map;

	//this is an array of the tileset data on the ROM.
	//each entry is an indexed tileset.
	std::unique_ptr<MageTileset[]> tilesets;

	//this is an array of the animation data on the ROM
	//each entry is an indexed animation.
	std::unique_ptr<MageAnimation[]> animations;

	//this is an array of the entity types on the ROM
	//each entry is an indexed entity type.
	std::unique_ptr<MageEntityType[]> entityTypes;

	//this is an arrya storing the most current data needed to draw entities
	//on the screen in their current animation state.
	std::unique_ptr<MageEntityRenderableData[]> entityRenderableData;
public:
	//this is the hackable array of entities that are on the current map
	//the data contained within is the data that can be hacked in the hex editor.
	std::unique_ptr<MageEntity[]> entities;

	//this is the index value of where the playerEntity is located within
	//the entities[] array and also the offset to it from hackableDataAddress
	int32_t playerEntityIndex;

	//when the MageRom is created, it will populate all the above variables from ROM.
	MageGameControl();

	//returns the size in memory of the MageRom object.
	uint32_t Size() const;

	//this will return a specific MageTileset object by index.
	const MageTileset& Tile(uint32_t index) const;

	//this will return the current map object.
	const MageMap& Map() const;

	//this will fill in an entity structure's data from ROM
	MageEntity LoadEntity(uint32_t address);

	//this will load a map to be the current map.
	void LoadMap(uint16_t index);

	//this will set a pointer to the playerEntity based on 
	//it's entityType matching a specific string
	void GetPointerToPlayerEntity(std::string name);

	//this will render the map onto the screen.
	void DrawMap(uint8_t layer, int32_t camera_x, int32_t camera_y) const;

	//this calculates the relevant info to be able to draw an entity based on the
	//current state of the data in MageRom and stores the info in entityRenderableData
	void getEntityRenderableData(uint32_t index);

	//this will update the current entities based on the current frame data
	void UpdateEntities(uint32_t deltaTime);

	//this will draw the entities over the current state of the screen
	void DrawEntities(int32_t cameraX, int32_t cameraY);

}; //class MageGameControl

#endif //_MAGE_GAME_CONTROL
