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
#define DEFAULT_MAP 0

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

//this is how many bytes of arguments each script action has.
//all actions will have this many bytes, even if some are not used by a particular action
#define MAGE_NUM_ACTION_ARGS 7

//these variables are reserved script and action IDs used to indicate when a script or action should not do anything.
#define MAGE_NULL_SCRIPT 0
#define MAGE_NULL_ACTION 0

//this is how many ms must have passed before the main game loop will run again:
//typical values: 
//60fps: ~16ms
//30fps: ~33ms
//24fps: ~41ms
#ifndef DC801_DESKTOP
#define MAGE_MIN_MILLIS_BETWEEN_FRAMES 41
#else
#define MAGE_MIN_MILLIS_BETWEEN_FRAMES 16
#endif

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

//this contains all the possible script actions by actionTypeId value.
//these enum values match the data generated in the binary,
//so don't change any numbering unless you fix the binary generation as well.
//don't add more than 255 actions, or it will break the binary file.
typedef enum{
	NULL_ACTION = 0,
	CHECK_ENTITY_BYTE,
	CHECK_SAVE_FLAG,
	CHECK_IF_ENTITY_IS_IN_GEOMETRY,
	CHECK_FOR_BUTTON_PRESS,
	CHECK_FOR_BUTTON_STATE,
	RUN_SCRIPT,
	COMPARE_ENTITY_NAME,
	BLOCKING_DELAY,
	NON_BLOCKING_DELAY,
	SET_PAUSE_STATE,
	SET_ENTITY_BYTE,
	SET_SAVE_FLAG,
	SET_PLAYER_CONTROL,
	SET_ENTITY_INTERACT_SCRIPT,
	SET_ENTITY_TICK_SCRIPT,
	SET_MAP_TICK_SCRIPT,
	SET_ENTITY_TYPE,
	SET_ENTITY_DIRECTION,
	SET_HEX_CURSOR_LOCATION,
	SET_HEX_BIT,
	UNLOCK_HAX_CELL,
	LOCK_HAX_CELL,
	SET_HEX_EDITOR_STATE,
	SET_HEX_EDITOR_DIALOG_MODE,
	LOAD_MAP,
	SHOW_DIALOG,
	SET_RENDERABLE_FONT,
	TELEPORT_ENTITY_TO_GEOMETRY,
	WALK_ENTITY_TO_GEOMETRY,
	WALK_ENTITY_ALONG_GEOMETRY,
	LOOP_ENTITY_ALONG_GEOMETRY,
	SET_CAMERA_TO_FOLLOW_ENTITY,
	TELEPORT_CAMERA_TO_GEOMETRY,
	PAN_CAMERA_TO_GEOMETRY,
	PAN_CAMERA_ALONG_GEOMETRY,
	LOOP_CAMERA_ALONG_GEOMETRY,
	SET_SCREEN_SHAKE,
	SCREEN_FADE_OUT,
	SCREEN_FADE_IN,
	PLAY_SOUND_CONTINUOUS,
	PLAY_SOUND_INTERRUPT,
	//this tracks the number of actions we're at:
	NUM_ACTIONS
} MageScriptActionTypeId;

//this is a structure to hold information about the currently executing scripts so they can resume
typedef struct{
	//indicated whether or not an active script is running on this MageScriptState
	bool scriptIsRunning;
	//the script Id to resume - this is a global scriptId number value
	uint16_t scriptId;
	//the action index to resume from - this is the action index for the script above, NOT a global actionTypeId.
	uint16_t actionOffset;
	//the number of loops until the next action in the script is to run
	uint16_t loopsToNextAction;
	//the total number of loops from the start of the action until the next action
	uint16_t totalLoopsToNextAction;
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
    char name[12];
    uint16_t x;
    uint16_t y;
    uint16_t onInteractScriptId;
    uint16_t onTickScriptId;
    uint16_t primaryId;
    uint16_t secondaryId;
    uint8_t primaryIdType;
    uint8_t currentAnimation;
    uint8_t currentFrame;
    uint8_t direction;
    uint8_t hackableStateA;
    uint8_t hackableStateB;
    uint8_t hackableStateC;
    uint8_t hackableStateD;
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

//below here are all the structures for interpreting the MageScriptAction binary data.
//Each action on the binary has 7 bytes of argument data, and these structs allow you
//to read all 7 bytes into the struct and get valid named arguments.
//for arguments larger than uint8_t, endian conversion will be needed.

typedef struct {
	uint8_t paddingA;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionNullAction;

typedef struct {
	uint16_t successScriptId;
	uint8_t entityId;
	uint8_t byteOffset;
	uint8_t expectedValue;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionCheckEntityByte;

typedef struct {
	uint16_t successScriptId;
	uint8_t saveFlagOffset;
	uint8_t expectedBoolValue;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionCheckSaveFlag;

typedef struct {
	uint16_t GeometryId;
	uint16_t successScriptId;
	uint8_t entityId;
	uint8_t expectedBoolValue;
	uint8_t paddingG;
} ActionCheckifEntityIsInGeometry;

typedef struct {
	uint16_t successScriptId;
	uint8_t buttonId; //KEYBOARD_KEY enum value
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionCheckForButtonPress;

typedef struct {
	uint16_t successScriptId;
	uint8_t buttonId; //KEYBOARD_KEY enum value
	uint8_t expectedBoolValue;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionCheckForButtonState;

typedef struct {
	uint16_t scriptId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionRunScript;

typedef struct {
	uint16_t stringId;
	uint16_t successScriptId;
	uint8_t entityId;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionCompareEntityName;

typedef struct {
	uint32_t delayTime; //in ms
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionBlockingDelay;

typedef struct {
	uint32_t delayTime; //in ms
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionNonBlockingDelay;

typedef struct {
	uint8_t state;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetPauseState;

typedef struct {
	uint8_t entityId;
	uint8_t byteOffset;
	uint8_t newValue;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetEntityByte;

typedef struct {
	uint8_t saveFlagOffset;
	uint8_t newBoolValue;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetSaveFlag;

typedef struct {
	uint8_t playerHasControl;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetPlayerControl;

typedef struct {
	uint16_t scriptId;
	uint8_t entityId;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetEntityInteractScript;

typedef struct {
	uint16_t scriptId;
	uint8_t entityId;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetEntityTickScript;

typedef struct {
	uint16_t scriptId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetMapTickScript;

typedef struct {
	uint16_t primaryId;
	uint16_t secondaryId;
	uint8_t primaryIdType;
	uint8_t entityId;
	uint8_t paddingG;
} ActionSetEntityType;

typedef struct {
	uint8_t entityId;
	uint8_t direction; //MageEntityAnimationDirection enum value
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetEntityDirection;

typedef struct {
	uint16_t byteAddress;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetHexCursorLocation;

typedef struct {
	uint8_t bitmask;
	uint8_t state;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetHexBit;

typedef struct {
	uint8_t cellOffset;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionUnlockHaxCell;

typedef struct {
	uint8_t cellOffset;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionLockHaxCell;

typedef struct {
	uint8_t state;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetHexEditorState;

typedef struct {
	uint8_t state;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetHexEditorDialogMode;

typedef struct {
	uint16_t mapId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionLoadMap;

typedef struct {
	uint16_t dialogId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionShowDialog;

typedef struct {
	uint8_t fontId;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetRenderableFont;

typedef struct {
	uint16_t geometryId;
	uint8_t entityId;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionTeleportEntityToGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint16_t geometryId;
	uint8_t entityId;
} ActionWalkEntityToGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint16_t geometryId;
	uint8_t entityId;
} ActionWalkEntityAlongGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint16_t geometryId;
	uint8_t entityId;
} ActionLoopEntityAlongGeometry;

typedef struct {
	uint8_t entityId;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionSetCameraToFollowEntity;

typedef struct {
	uint16_t geometryId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionTeleportCameraToGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint16_t geometryId;
	uint8_t paddingG;
} ActionPanCameraToGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint16_t geometryId;
	uint8_t paddingG;
} ActionPanCameraAlongGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint16_t geometryId;
	uint8_t paddingG;
} ActionLoopCameraAlongGeometry;

typedef struct {
	uint32_t duration; //in ms
	uint8_t amplitude;
	uint8_t frequency;
	uint8_t paddingG;
} ActionSetScreenShake;

typedef struct {
	uint32_t duration; //in ms
	uint16_t color;
	uint8_t paddingG;
} ActionScreenFadeOut;

typedef struct {
	uint32_t duration; //in ms
	uint16_t color;
	uint8_t paddingG;
} ActionScreenFadeIn;

typedef struct {
	uint16_t soundId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionPlaySoundContinuous;

typedef struct {
	uint16_t soundId;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
} ActionPlaySoundInterrupt;

#endif //_MAGE_DEFINES_H