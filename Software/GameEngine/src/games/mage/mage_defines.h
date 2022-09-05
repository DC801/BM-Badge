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

#include <stdint.h>
#include <memory>
#include <utility>
#include <string>

//this is the path to the game.dat file on the SD card.
//if an SD card is inserted with game.dat in this location
//and its header hash is different from the one in the ROM chip
//it will automatically be loaded.
#define MAGE_GAME_DAT_PATH "MAGE/game.dat"

#define ENGINE_VERSION 3

#define MAP_GO_DIRECTION_NAME_LENGTH 12

//this is the most unique entities that can be in any map.
#define MAX_ENTITIES_PER_MAP 64

//this is the map that will load at the start of the game:
#define DEFAULT_MAP 0

#define DEFAULT_PLAYER_NAME "Bub"

//this is used to note that no player entity was found within the
//entities loaded into the map
#define NO_PLAYER 255

//this is a value used to indicate that an action's calling entity was
//the map, and not actually one of the entities on the map.
#define MAGE_MAP_ENTITY 255

//this is a value used in the entityId in actions that refers to the
//entity the script is running on.
#define MAGE_ENTITY_SELF 254

//this is a value used in the entityId in actions that refers to the
//current playerEntityId for the MageGameControl object.
#define MAGE_ENTITY_PLAYER 253

//this is a value used in the entityId in actions that refers to the
//current playerEntityId for the MageGameControl object.
#define MAGE_ENTITY_PATH 65535

//these are the failover values that the game will use when an invalid hacked entity state is found:
#define MAGE_TILESET_FAILOVER_ID 0
#define MAGE_TILE_FAILOVER_ID 0
#define MAGE_ANIMATION_DURATION_FAILOVER_VALUE 0
#define MAGE_FRAME_COUNT_FAILOVER_VALUE 0
#define MAGE_RENDER_FLAGS_FAILOVER_VALUE 0

//these are used for setting player speed
//speed is in x/y units per update
#define MAGE_RUNNING_SPEED 200
#define MAGE_WALKING_SPEED 100

//these are the agreed-upon indices for entity_type entity animations
//If you import entities that don't use this convention, their animations may
//not work as intended.
#define MAGE_IDLE_ANIMATION_INDEX 0
#define MAGE_WALK_ANIMATION_INDEX 1
#define MAGE_ACTION_ANIMATION_INDEX 2

//this is how many bytes of arguments each script action has.
//all actions will have this many bytes, even if some are not used by a particular action
#define MAGE_NUM_ACTION_ARGS 7

#define MAGE_NUM_MEM_BUTTONS 4

//this is the number of chars that are used in the entity struct as part of the entity name
#define MAGE_ENTITY_NAME_LENGTH 12
#define MAGE_SAVE_FLAG_COUNT 2048
#define MAGE_SAVE_FLAG_BYTE_COUNT (MAGE_SAVE_FLAG_COUNT / 8)
#define MAGE_SCRIPT_VARIABLE_COUNT 256

//these variables are reserved script and action IDs used to indicate when a script or action should not do anything.
#define MAGE_NO_SCRIPT (-1)
#define MAGE_NO_MAP (-1)
#define MAGE_NO_WARP_STATE ((uint16_t)-1)
#define MAGE_NULL_SCRIPT 0
#define MAGE_NULL_ACTION 0

//this is how many ms must have passed before the main game loop will run again:
//typical values:
//60fps: ~16ms
//30fps: ~33ms
//24fps: ~41ms
#ifdef DC801_EMBEDDED
#define MAGE_MIN_MILLIS_BETWEEN_FRAMES 90
#else
#define MAGE_MIN_MILLIS_BETWEEN_FRAMES (1000 / 24)
#endif

#define DESKTOP_SAVE_FILE_PATH "MAGE/save_games/"

	//size of chunk to be read/written when writing game.dat to ROM per loop
#define ENGINE_ROM_SD_CHUNK_READ_SIZE 65536

//This is the smallest page we know how to erase on our chip,
//because the smaller values provided by nordic are incorrect,
//and this is the only one that has worked for us so far
//262144 bytes = 256KB
#define ENGINE_ROM_ERASE_PAGE_SIZE 262144

//size of largest single Write data that can be sent at one time:
//make sure that ENGINE_ROM_SD_CHUNK_READ_SIZE is evenly divisible by this
//or you'll lose data.
#define ENGINE_ROM_WRITE_PAGE_SIZE 512

//this 'identifier' will appear at the start of game.dat.
//it is used to verify that the binary file is formatted correctly.
#define ENGINE_ROM_GAME_IDENTIFIER_STRING {'M','A','G','E','G','A','M','E'}

//this is the 'magic string' that will appear at the start of game.dat.
//it is used to verify that the binary file is formatted correctly.
#define ENGINE_ROM_SAVE_IDENTIFIER_STRING {'M','A','G','E','S','A','V','E'}

//this is the length of the 'identifier' at the start of the game.dat file:
#define ENGINE_ROM_IDENTIFIER_STRING_LENGTH 8

//this is the length of the 'engine rom version number' at the start of the game.dat file:
//it is to determine if the game rom is compatible with the engine version
#define ENGINE_ROM_VERSION_NUMBER_LENGTH 4

//this is the length of the crc32 that follows the magic string in game.dat
//it is used to let us check if we need to re-flash the ROM chip with the file on
//the SD card.
#define ENGINE_ROM_CRC32_LENGTH 4

//this is the length of the scenario data from the 0 address to the end
#define ENGINE_ROM_GAME_LENGTH 4

#define ENGINE_ROM_START_OF_CRC_OFFSET (ENGINE_ROM_IDENTIFIER_STRING_LENGTH + ENGINE_ROM_VERSION_NUMBER_LENGTH)

#define ENGINE_ROM_MAGIC_HASH_LENGTH (ENGINE_ROM_START_OF_CRC_OFFSET + ENGINE_ROM_CRC32_LENGTH + ENGINE_ROM_GAME_LENGTH)

//this is all the bytes on our ROM chip. We aren't able to write more than this
//to the ROM chip, as there are no more bytes on it. Per the datasheet, there are 32MB,
//which is defined as 2^25 bytes available for writing.
//We are also subtracting ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE for save data and the end of rom
#define ENGINE_ROM_SAVE_GAME_SLOTS 3
#define ENGINE_ROM_QSPI_CHIP_SIZE 33554432
#define ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE (ENGINE_ROM_ERASE_PAGE_SIZE * ENGINE_ROM_SAVE_GAME_SLOTS)
#define ENGINE_ROM_MAX_DAT_FILE_SIZE (ENGINE_ROM_QSPI_CHIP_SIZE - ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE)
#define ENGINE_ROM_SAVE_OFFSET (ENGINE_ROM_MAX_DAT_FILE_SIZE)

//This is a return code indicating that the verification was successful
//it needs to be a negative number, as the Verify function returns
//the failure address which is a uint32_t and can include 0
#define ENGINE_ROM_VERIFY_SUCCESS -1


typedef enum : uint8_t {
	x = 12,
	y = 14,
	onInteractScriptId = 16,
	onTickScriptId = 18,
	primaryId = 20,
	secondaryId = 22,
	primaryIdType = 24,
	currentAnimation = 25,
	currentFrame = 26,
	direction = 27,
	hackableStateA = 28,
	hackableStateB = 29,
	hackableStateC = 30,
	hackableStateD = 31
} MageEntityField;

//this contains the possible options for an entity PrimaryIdType value.
typedef enum : uint8_t {
	TILESET = 0,
	ANIMATION = 1,
	ENTITY_TYPE = 2,
	NUM_PRIMARY_ID_TYPES
} MageEntityPrimaryIdType;

//this is the numerical translation for entity direction.
typedef enum : uint8_t{
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
	NUM_DIRECTIONS,
} MageEntityAnimationDirection;

#define RENDER_FLAGS_IS_GLITCHED_MASK		0b01111111
#define RENDER_FLAGS_IS_GLITCHED			0b10000000
#define RENDER_FLAGS_IS_DEBUG				0b01000000
#define RENDER_FLAGS_FLIP_X					0b00000100
#define RENDER_FLAGS_FLIP_Y					0b00000010
#define RENDER_FLAGS_FLIP_DIAG				0b00000001
#define RENDER_FLAGS_FLIP_MASK				0b00000111
#define RENDER_FLAGS_DIRECTION_MASK			0b00000011


//this is a point in 2D space.
typedef struct
{
	int32_t x;
	int32_t y;
} Point;


//this is a structure to hold information about the currently executing scripts so they can resume
typedef struct{
	//indicated whether or not an active script is running on this MageScriptState
	bool scriptIsRunning;
	bool isGlobalExecutionScope;
	//the script Id to resume, scope determined by isGlobalExecutionScope
	// - if false, should be treated as mapLocalScriptId
	// - if true, should be treated as globalScriptId
	uint16_t currentScriptId;
	//the action index to resume from - this is the action index for the script above, NOT a global actionTypeId.
	uint16_t actionOffset;
	//the number of loops until the next action in the script is to run
	uint16_t loopsToNextAction;
	//the total number of loops from the start of the action until the next action
	uint16_t totalLoopsToNextAction;

	//the below should probably be factored out into another struct at some point
	//used to store state various geometry things
	Point pointA;
	Point pointB;
	float length;
	float lengthOfPreviousSegments;
	uint8_t currentSegmentIndex;
} MageScriptState;


//this is the structure of a MageEntity. All hackable info is contained within.
//the complete current entity state can be determined with only this info and
//the MageGame class interpreting the ROM data.
typedef struct {
	char name[MAGE_ENTITY_NAME_LENGTH]; // bob's club
	uint16_t x; // put the sheep back in the pen, rake in the lake
	uint16_t y;
	uint16_t onInteractScriptId;
	uint16_t onTickScriptId;
	uint16_t primaryId;
	uint16_t secondaryId;
	MageEntityPrimaryIdType primaryIdType;
	uint8_t currentAnimation;
	uint8_t currentFrame;
	MageEntityAnimationDirection direction;
	uint8_t hackableStateA;
	uint8_t hackableStateB;
	uint8_t hackableStateC;
	uint8_t hackableStateD;
} MageEntity;

typedef struct MageSaveGame {
	char identifier[ENGINE_ROM_IDENTIFIER_STRING_LENGTH] = ENGINE_ROM_SAVE_IDENTIFIER_STRING;
	uint32_t engineVersion = ENGINE_VERSION;
	uint32_t scenarioDataCRC32;
	uint32_t saveDataLength = sizeof(MageSaveGame);
	char name[MAGE_ENTITY_NAME_LENGTH] = DEFAULT_PLAYER_NAME;
	//this stores the byte offsets for the hex memory buttons:
	uint8_t memOffsets[MAGE_NUM_MEM_BUTTONS] = {
		MageEntityField::x,
		MageEntityField::y,
		MageEntityField::primaryId, // entityType
		MageEntityField::direction,
	};
	uint16_t currentMapId = DEFAULT_MAP;
	uint16_t warpState = MAGE_NO_WARP_STATE;
	uint8_t clipboard[sizeof(MageEntity)] = {0};
	uint8_t clipboardLength = 1;
	uint8_t paddingA;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t saveFlags[MAGE_SAVE_FLAG_BYTE_COUNT] = {0};
	uint16_t scriptVariables[MAGE_SCRIPT_VARIABLE_COUNT] = {0};
} MageSaveGame;

typedef struct {
	int32_t x;
	int32_t y;
	int32_t w;
	int32_t h;
} Rect;

//this is info needed to render entities that can be determined
//at run time from the MageEntity class info.
typedef struct {
	Rect hitBox;
	Rect interactBox;
	Point center;
	uint16_t currentFrameTicks;
	uint16_t tilesetId;
	uint16_t lastTilesetId;
	uint16_t tileId;
	uint32_t duration;
	uint16_t frameCount;
	uint8_t renderFlags;
	bool isInteracting;
} MageEntityRenderableData;

#endif //_MAGE_DEFINES_H
