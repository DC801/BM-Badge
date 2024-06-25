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

#include <chrono>
#include "shim_timer.h"
using namespace std::chrono;

static inline const auto DrawWidth = 320;
static inline const auto DrawHeight = 240;
static inline const auto FramebufferSize = DrawWidth * DrawHeight;

<<<<<<< HEAD
#define ENGINE_VERSION 12
=======
static inline const auto MapGoDirectionNameLength = 12;
>>>>>>> scriptFixes

static inline const auto MAGE_COLLISION_SPOKE_COUNT = 6;

//this is the most unique entities that can be in any map.
static inline const auto MAX_ENTITIES_PER_MAP = 64;


//this is used to note that no player entity was found within the
//entities loaded into the map
static inline const auto NoPlayer = nullptr;
static inline const auto NO_PLAYER_INDEX = 255;

//this is a value used to indicate that an action's calling entity was
//the map, and not actually one of the entities on the map.
static inline const auto MAGE_MAP_ENTITY = 255;
static inline const auto MAGE_ENTITY_SELF = 254;
static inline const auto MAGE_ENTITY_PLAYER = 253;
static inline const auto MAGE_ENTITY_PATH = 65535;

//these are the failover values that the game will use when an invalid hacked entity state is found:
static inline const auto MAGE_TILESET_FAILOVER_ID = 0;
static inline const auto MAGE_TILE_FAILOVER_ID = 0;
static inline const auto MAGE_ANIMATION_DURATION_FAILOVER_VALUE = 0;
static inline const auto MAGE_FRAME_COUNT_FAILOVER_VALUE = 0;
static inline const auto MAGE_RENDER_FLAGS_FAILOVER_VALUE = 0;

//these are the agreed-upon indices for entity_type entity animations
//If you import entities that don't use this convention, their animations may
//not work as intended.
enum class PlayerAnimation
{
   Idle,
   Walk,
   Action,
   Invalid // enums always fill 
};

static inline const auto MAGE_IDLE_ANIMATION_INDEX = 0;
static inline const auto MAGE_WALK_ANIMATION_INDEX = 1;
static inline const auto MAGE_ACTION_ANIMATION_INDEX = 2;

//this is how many bytes of arguments each script action has.
//all actions will have this many bytes, even if some are not used by a particular action
static inline const auto MAGE_NUM_ACTION_ARGS = 7;

//these variables are reserved script and action IDs used to indicate when a script or action should not do anything.
#define MAGE_NO_SCRIPT std::nullopt
#define MAGE_NO_MAP (-1)
#define MAGE_NULL_SCRIPT 0
#define MAGE_NULL_ACTION 0

struct GameClock
{
   using rep = uint32_t;
   using period = std::milli;
   using duration = std::chrono::duration<rep, period>;
   using time_point = std::chrono::time_point<GameClock>;

   static time_point now() noexcept
   {
      auto now_ms = std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::system_clock::now());
      auto epochTime = now_ms.time_since_epoch().count();
      return time_point{ std::chrono::milliseconds{now_ms.time_since_epoch().count()} };
   }
};

// 100px/sec, 1000ms/sec, 30frames/sec, 3px/frame or 6px/frame
// this is how many ms must have passed before the main game loop will run again:
// typical values:
// 60fps: ~16ms
// 30fps: ~33ms
// 24fps: ~41ms
static inline const auto TargetFPS = 30;
static inline const auto MinTimeBetweenRenders = GameClock::duration{ 1000 } / TargetFPS ;
static inline const auto MinTimeBetweenUIInput = GameClock::duration{ 1000 };
static inline const auto IntegrationStepSize = MinTimeBetweenRenders/3;


#ifdef DC801_EMBEDDED
// RTC for NRF52840:
// PRESCALER = round(32768 Hz / [target FPS (Hz)]) - 1
static inline const auto RtcPrescaler = std::round(32768 / TargetFPS) - 1;
#endif

<<<<<<< HEAD
// color palette corruption detection - requires much ram, can only be run on desktop
#ifdef DC801_DESKTOP
#define LOG_COLOR_PALETTE_CORRUPTION(value) MageGame->verifyAllColorPalettes((value));
#endif //DC801_DESKTOP
#ifdef DC801_EMBEDDED
#define LOG_COLOR_PALETTE_CORRUPTION(value) //(value)
#endif //DC801_EMBEDDED

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
	pathId = 28,
	onLookScriptId = 30
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
#define RENDER_FLAGS_RELATIVE_DIRECTION		0b00110000
#define RENDER_FLAGS_FLIP_X					0b00000100
#define RENDER_FLAGS_FLIP_Y					0b00000010
#define RENDER_FLAGS_FLIP_DIAG				0b00000001
#define RENDER_FLAGS_FLIP_MASK				0b00000111
#define RENDER_FLAGS_DIRECTION_MASK			0b00000011

//this is a structure to hold information about the currently executing scripts so they can resume
typedef struct{
	//indicated whether or not an active script is running on this MageScriptState
	bool scriptIsRunning;
	bool scriptIsPaused;
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
	uint16_t pathId;
	uint16_t onLookScriptId;
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
=======
//these are used for setting player speed
//speed is in x/y pixels per update tick
static inline const auto RunSpeed = uint16_t{ 3 };
static inline const auto WalkSpeed = uint16_t{ 2 };
>>>>>>> scriptFixes

#endif //_MAGE_DEFINES_H
