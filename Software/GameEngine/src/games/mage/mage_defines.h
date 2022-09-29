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

#include "EngineROM.h"
#include "mage_tileset.h"
#include "mage_animation.h"
#include <stdint.h>
#include <memory>
#include <utility>
#include <string>
#include <optional>

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
#define MAGE_NO_SCRIPT std::nullopt
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

typedef enum : uint8_t
{
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
typedef enum : uint8_t
{
   TILESET = 0,
   ANIMATION = 1,
   ENTITY_TYPE = 2
} MageEntityPrimaryIdType;
#define NUM_PRIMARY_ID_TYPES 3

#define RENDER_FLAGS_IS_GLITCHED_MASK		0b01111111
#define RENDER_FLAGS_IS_GLITCHED			0b10000000
#define RENDER_FLAGS_IS_DEBUG				0b01000000
#define RENDER_FLAGS_FLIP_X					0b00000100
#define RENDER_FLAGS_FLIP_Y					0b00000010
#define RENDER_FLAGS_FLIP_DIAG				0b00000001
#define RENDER_FLAGS_FLIP_MASK				0b00000111
#define RENDER_FLAGS_DIRECTION_MASK			0b00000011
#define NUM_DIRECTIONS 4


//this is a point in 2D space.
struct Point
{
   int32_t x{ 0 };
   int32_t y{ 0 };

   float VectorLength() const
   {
      return sqrt((x * x) + (y * y));
   };

   constexpr float DotProduct(Point b) const
   {
      return (float)x * (float)b.x
         + (float)y * (float)b.y;
   };
};

struct Rect
{
   int32_t x{ 0 };
   int32_t y{ 0 };
   int32_t w{ 0 };
   int32_t h{ 0 };

   constexpr bool Overlaps(Rect& other) const
   {
      return x <= (other.x + other.w)
         && (x + w) >= other.x
         && y <= (other.y + other.h)
         && (y + h) >= other.y;
   }
};


//this is a structure to hold information about the currently executing scripts so they can resume
struct MageScriptState
{
   MageScriptState() noexcept = default;

   MageScriptState(
      uint16_t scriptId,
      bool scriptIsRunning,
      bool isGlobalExecutionScope = false
   ) noexcept
      :currentScriptId(scriptId),
      scriptIsRunning(scriptIsRunning),
      isGlobalExecutionScope(isGlobalExecutionScope)
   {}

   //indicated whether or not an active script is running on this MageScriptState
   bool scriptIsRunning{ false };
   bool isGlobalExecutionScope{ false };
   //the script Id to resume, scope determined by isGlobalExecutionScope
   // - if false, should be treated as mapLocalScriptId
   // - if true, should be treated as globalScriptId
   uint16_t currentScriptId{ 0 };
   //the action index to resume from - this is the action index for the script above, NOT a global actionTypeId.
   uint16_t actionOffset{ 0 };
   //the number of loops until the next action in the script is to run
   uint16_t loopsToNextAction{ 0 };
   //the total number of loops from the start of the action until the next action
   uint16_t totalLoopsToNextAction{ 0 };

   //the below should probably be factored out into another struct at some point
   //used to store state various geometry things
   Point pointA{ 0,0 };
   Point pointB{ 0,0 };
   float length{ 0.0f };
   float lengthOfPreviousSegments{ 0.0f };
   uint8_t currentSegmentIndex{ 0 };
};

struct MageSaveGame
{
   const std::string identifier = EngineROM::SaveIdentifierString;
   uint32_t engineVersion{ ENGINE_VERSION };
   uint32_t scenarioDataCRC32{ 0 };
   uint32_t saveDataLength{ sizeof(MageSaveGame) };
   char name[MAGE_ENTITY_NAME_LENGTH]{ DEFAULT_PLAYER_NAME };
   //this stores the byte offsets for the hex memory buttons:
   uint8_t memOffsets[MAGE_NUM_MEM_BUTTONS]{
      MageEntityField::x,
      MageEntityField::y,
      MageEntityField::primaryId, // entityType
      MageEntityField::direction,
   };
   uint16_t currentMapId{ DEFAULT_MAP };
   uint16_t warpState{ MAGE_NO_WARP_STATE };
   uint8_t clipboard[1]{ 0 };
   uint8_t clipboardLength{ 0 };
   uint8_t paddingA{ 0 };
   uint8_t paddingB{ 0 };
   uint8_t paddingC{ 0 };
   uint8_t saveFlags[MAGE_SAVE_FLAG_BYTE_COUNT] = { 0 };
   uint16_t scriptVariables[MAGE_SCRIPT_VARIABLE_COUNT] = { 0 };
};

#endif //_MAGE_DEFINES_H
