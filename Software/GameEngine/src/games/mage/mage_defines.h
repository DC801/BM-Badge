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


#endif //_MAGE_DEFINES_H
