#ifndef _MAGE_GAME_CONTROL
#define _MAGE_GAME_CONTROL

#include "mage_defines.h"
#include "mage_header.h"
#include "mage_map.h"
#include "mage_tileset.h"
#include "mage_animation.h"
#include "mage_entity_type.h"
#include "mage_geometry.h"

/*
The MageGameControl object handles several important tasks. It's basically the
core of the entire MAGE() game, and contains all the important variables that
track the state of the game.

MageGameControl's first important function is to read all relevant data from
the ROM chip into RAM, and also to have helper functions to read additional
ROM data on demand as needed when updating variables.

MageGameControl also tracks the state of all hackable entities in the game, and
interprets the data contained in the array when deciding what needs to be drawn
to the screen.

Finally, MageGameControl handles the actual act of updating the state of the
game based on input data and rendering it all to the screen every frame.
*/

class MageGameControl
{
private:
	//Stores the current map's index value
	uint32_t currentMapId;

	//these header objects store the header information for all datasets on the ROM,
	//including address offsets for each item, and the length of the item in memory.
	MageHeader mapHeader;
	MageHeader tilesetHeader;
	MageHeader animationHeader;
	MageHeader entityTypeHeader;
	MageHeader entityHeader;
	MageHeader geometryHeader;
	MageHeader scriptHeader;
	MageHeader dialogHeader;
	MageHeader stringHeader;
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

	//this is an array storing the most current data needed to draw entities
	//on the screen in their current animation state.
	std::unique_ptr<MageEntityRenderableData[]> entityRenderableData;

	//this is an array of all the geometry objects in the ROM
	std::unique_ptr<MageGeometry[]> geometries;

	//these two variables store the player's previous tilesetId and tileId
	//for use in keeping the camera centerd while hacking.
	uint16_t previousPlayerTilesetId;

	//a couple of state variables for tracking player movement:
	uint8_t mageSpeed;
	bool isMoving;
public:
	//this is the hackable array of entities that are on the current map
	//the data contained within is the data that can be hacked in the hex editor.
	std::unique_ptr<MageEntity[]> entities;

	//this is the index value of where the playerEntity is located within
	//the entities[] array and also the offset to it from hackableDataAddress
	int32_t playerEntityIndex;
	
	//this lets us make it so that inputs stop working for the player
	bool playerHasControl;
	bool isCollisionDebugOn;

	//when the MageGameControl object is created, it will populate all the above variables from ROM.
	MageGameControl();

	//returns the size in memory of the MageGameControl object.
	uint32_t Size() const;

	//this will return a specific MageTileset object by index.
	const MageTileset& Tile(uint32_t index) const;

	//this will return the current map object.
	MageMap& Map();

	//this will fill in an entity structure's data from ROM
	MageEntity LoadEntity(uint32_t address);

	//this takes map data by index and fills all the variables in the map object:
	void PopulateMapData(uint16_t index);

	//this will load a map to be the current map.
	void LoadMap(uint16_t index);

	//this will set a pointer to the playerEntity based on 
	//it's entityType matching a specific string
	void updatePointerToPlayerEntity(std::string name);

	//this handles inputs that apply in ALL game states. That includes when 
	//the hex editor is open, when it is closed, when in any menus, etc.
	void applyUniversalInputs();

	//this takes input information and moves the playerEntity around
	//If there is no playerEntity, it just moves the camera freely.
	void applyGameModeInputs();

	//this will check in the direction the player entity is facing and start
	//an on_interact script for an entity if any qualify.
	void handleEntityInteract();

	//this will render the map onto the screen.
	void DrawMap(uint8_t layer, int32_t camera_x, int32_t camera_y) const;

	//the functions below will validate specific properties to see if they are valid.
	//these are used to ensure that we don't get segfaults from using the hacked entity data.
	uint16_t getValidEntityId(uint16_t entityId);
	uint16_t getValidMapId(uint16_t mapId);
	uint16_t getValidPrimaryIdType(uint16_t primaryIdType);
	uint16_t getValidTilesetId(uint16_t tilesetId);
	uint16_t getValidTileId(uint16_t tileId, uint16_t tilesetId);
	uint16_t getValidAnimationId(uint16_t animationId);
	uint16_t getValidAnimationFrame(uint16_t animationFrame, uint16_t animationId);
	uint16_t getValidEntityTypeId(uint16_t entityTypeId);
	uint16_t getValidGlobalScriptId(uint16_t scriptId);
	uint8_t  getValidEntityTypeAnimationId(uint8_t entityTypeAnimationId, uint16_t entityTypeId);
	uint8_t  getValidEntityTypeDirection(uint8_t direction);
	MageGeometry* getValidGeometry(uint16_t mapLocalGeometryId);
	MageEntityRenderableData* getValidEntityRenderableData(uint8_t entityId);
	std::string getString(uint16_t stringId);
	uint32_t getImageAddress(uint16_t imageId);
	uint32_t getDialogAddress(uint16_t dialogId);

	//this returns the address offset for a specific script Id:
	uint32_t getScriptAddress(uint32_t scriptId);
	
	//this calculates the relevant info to be able to draw an entity based on the
	//current state of the data in MageGameControl and stores the info in entityRenderableData
	void updateEntityRenderableData(uint8_t index);

	//this will update the current entities based on the current state of their state variables
	void UpdateEntities(uint32_t deltaTime);

	//this will draw the entities over the current state of the screen
	void DrawEntities(int32_t cameraX, int32_t cameraY);

	//this will draw the current map's geometry over the current state of the screen
	void DrawGeometry(int32_t cameraX, int32_t cameraY);

	MageEntity* getValidEntity(int8_t entityId);

	MageTileset* getValidTileset(uint16_t tilesetId);
}; //class MageGameControl

#endif //_MAGE_GAME_CONTROL
