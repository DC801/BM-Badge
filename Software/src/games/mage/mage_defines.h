/*
This is intended to be a shared header file with common formats used in all the
MAGE() game functions. It contains common constants and structured used
throughout the MAGE() game code, and should be included in all future header
files as a way to consolidate redundant definitions and externs showing up all
over the code base.

Note: Do NOT try to include this in the "common.h" header file used outside of
the MAGE() game, as the use of c++ standard libraries will cause issues with
all of the old code used as the foundation of this badge.
*/

#ifndef _MAGE_DEFINES_H
#define _MAGE_DEFINES_H

#include "common.h"
#include <memory>
#include <utility>
#include <string>

//this is the most unique entities that can be in any map.
#define MAX_ENTITIES_PER_MAP 32

//this is the map that will load at the start of the game:
#define DEFAULT_MAP 1

//this is the string to match to determine which entity is the player
//don't make it more than 16 characters long!
#define PLAYER_CHARACTER_NAME_STRING "goose"

//this is the color that will appear transparent when drawing tiles:
#define TRANSPARENCY_COLOR 0x0020

//this is used to note that no player entity was found within the 
//entities loaded into the map
#define NO_PLAYER -1

//this is a fudge factor to make animations look better on the desktop
//it's added to animation ticks every loop:
#define DESKTOP_TIME_FUDGE_FACTOR 50

//these are the failover values that the game will use when an invalid hacked entity state is found:
#define MAGE_TILESET_FAILOVER_ID 0
#define MAGE_TILE_FAILOVER_ID 0
#define MAGE_ANIMATION_DURATION_FAILOVER_VALUE 0
#define MAGE_FRAME_COUNT_FAILOVER_VALUE 0
#define MAGE_RENDER_FLAGS_FAILOVER_VALUE 0

//these are used for setting player speed
//speed is in x/y units per update
#define MAGE_RUNNING_SPEED 5
#define MAGE_WALKING_SPEED 1

//these are the agreed-upon indices for entity_type entity animations
//If you import entities that don't use this convention, their animations may
//not work as intended.
#define MAGE_IDLE_ANIMATION_INDEX 0
#define MAGE_WALK_ANIMATION_INDEX 1
#define MAGE_ACTION_ANIMATION_INDEX 2

//this contains the possible options for an entity PrimaryIdType value.
typedef enum {
	TILESET = 0,
	ANIMATION = 1,
	ENTITY_TYPE = 2,
	NUM_PRIMARY_ID_TYPES
} MageEntityPrimaryIdType;

//this is the numerical translation for entity direction.
typedef enum{
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
	NUM_DIRECTIONS
} MageEntityAnimationDirection;

//this contains all the possible script actions by actionId value.
//we've only explicitly defined action 0 as NULL_ACTION, and left the others to self-enumerate.
//this allows adding new actions later without needing to manually renumber everything.
//don't add more than 255 actions, or it will break the binary file.
typedef enum{
	NULL_ACTION = 0,
	//Logic and Flow Control Actions:
	CHECK_ENTITY_BYTE,
	CHECK_SAVE_FLAG,
	CHECK_IF_ENTITY_IS_IN_GEOMETRY,
	CHECK_FOR_BUTTON_PRESS,
	CHECK_DIALOG_RESPONSE,
	COMPARE_ENTITY_NAME,
	DELAY,
	NON_BLOCKING_DELAY,
	PAUSE_GAME_STATE,
	//Game State Effecting Actions:
	SET_ENTITY_BYTE,
	SET_SAVE_FLAG,
	SET_PLAYER_CONTROL,
	SET_ENTITY_INTERACT_SCRIPT,
	SET_ENTITY_TICK_SCRIPT,
	SET_MAP_TICK_SCRIPT,
	SET_ENTITY_TYPE,
	SET_HEX_CURSOR_LOCATION,
	SET_HEX_BIT,
	//Display effecting Actions:
	LOAD_MAP,
	SCREEN_SHAKE,
	SCREEN_FADE_OUT,
	SCREEN_FADE_IN,
	SHOW_DIALOG,
	SET_RENDERABLE_FONT,
	MOVE_ENTITY_TO_POINT,
	MOVE_ENTITY_ALONG_GEOMETRY,
	LOOP_ENTITY_ALONG_GEOMETRY,
	SET_ENTITY_DIRECTION,
	SET_CAMERA_POSITION,
	MOVE_CAMERA_ALONG_GEOMETRY,
	LOOP_CAMERA_ALONG_GEOMETRY,
	SET_HEX_EDITOR_STATE,
	SET_HEX_EDITOR_DIALOG_MODE,
	UNLOCK_HAX_CELL,
	LOCK_HAX_CELL,
	//this tracks the number of actions we're at:
	NUM_ACTIONS
} MageScriptAction;

//this is a structure to hold information about the currently executing scripts so they can be resumed
typedef struct{
	uint16_t scriptId; //the script Id to resume
	uint16_t actionId; //the action Id to resume
	uint32_t timeToNextAction; //the number of millis until the next action in the script is to run;
} MageScriptState;

//this is a point in 2D space.
typedef struct {
	int32_t x;
	int32_t y;
} Point;

//this is the structure of a MageEntity. All hackable info is contained within.
//the complete current entity state can be determined with only this info and
//the MageGame class interpreting the ROM data.
typedef struct {
	char name[16];
	uint16_t primaryId;
	uint16_t secondaryId;
	uint16_t scriptId;
	uint16_t x;
	uint16_t y;
	uint8_t primaryIdType;
	uint8_t currentAnimation;
	uint8_t currentFrame;
	uint8_t direction;
	uint8_t hackableState;
	uint8_t padding;
} MageEntity;

//this is info needed to render entities that can be determined 
//at run time from the MageEntity class info.
typedef struct {
	uint16_t currentFrameTicks;
	uint16_t tilesetId;
	uint16_t tileId;
	uint32_t duration;
	uint16_t frameCount;
	uint8_t renderFlags;
} MageEntityRenderableData;

#endif //_MAGE_DEFINES_H
