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
#define PLAYER_CHARACTER_NAME_STRING "mage"

//this is the color that will appear transparent when drawing tiles:
#define TRANSPARENCY_COLOR 0x0020

//this is used to note that no player entity was found within the 
//entities loaded into the map
#define NO_PLAYER -1

//this is a fudge factor to make animations look better on the desktop
//it's added to animation ticks every loop:
#define DESKTOP_TIME_FUDGE_FACTOR 20

//this contains the possible options for an entity PrimaryIdType value.
typedef enum {
    TILESET = 0,
    ANIMATION = 1,
    ENTITY_TYPE = 2
} MageEntityPrimaryIdType;

//this is the numerical translation for entity direction.
typedef enum{
    NORTH = 0,
    EAST = 1,
    SOUTH = 2,
    WEST = 3
} MageEntityAnimationDirection;

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
