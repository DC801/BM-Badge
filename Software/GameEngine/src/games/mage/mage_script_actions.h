#ifndef _MAGE_SCRIPT_ACTIONS_H
#define _MAGE_SCRIPT_ACTIONS_H

#include "mage_defines.h"
#include "mage.h"
#include "mage_game_control.h"
#include "mage_hex.h"
#include "mage_script_control.h"

//this contains all the possible script actions by actionTypeId value.
//these enum values match the data generated in the binary,
//so don't change any numbering unless you fix the binary generation as well.
//don't add more than 255 actions, or it will break the binary file.
//!!!!!!!!!!!!!!! WARNING !!!!!!!!!!!!!!!
//IF YOU WANT TO ADD ACTIONS, YOU MUST UPDATE THE FOLLOWING FILES AS WELL!!
//	add enum for the MageScriptActionTypeId, right here in this file
//	add struct for the action arguments, lower in this file
//	add entry in `actionFunctions` the constructor of `Software/src/games/mage/mage_script_control.cpp`
//	add action handler function in `Software/src/games/mage/mage_script_control.(cpp/h)`
//	add action encoder function in `SD_Card/MAGE/editor/js/scripts.js`
//	add entry in actionNames array in `SD_Card/MAGE/editor/js/scripts.js`
//	add action_type enum in `SD_Card/MAGE/mage_dat.ksy`
//	bump the version number in the #define ENGINE_VERSION in this file
//	bump the version number in `engine_version` in the `SD_Card/MAGE/mage_dat.ksy`
//	bump the version number in `ENGINE_VERSION` in the `SD_Card/MAGE/editor/js/common.js`
typedef enum : uint8_t {
	NULL_ACTION = 0,
	CHECK_ENTITY_NAME,
	CHECK_ENTITY_X,
	CHECK_ENTITY_Y,
	CHECK_ENTITY_INTERACT_SCRIPT,
	CHECK_ENTITY_TICK_SCRIPT,
	CHECK_ENTITY_LOOK_SCRIPT,
	CHECK_ENTITY_TYPE,
	CHECK_ENTITY_PRIMARY_ID,
	CHECK_ENTITY_SECONDARY_ID,
	CHECK_ENTITY_PRIMARY_ID_TYPE,
	CHECK_ENTITY_CURRENT_ANIMATION,
	CHECK_ENTITY_CURRENT_FRAME,
	CHECK_ENTITY_DIRECTION,
	CHECK_ENTITY_GLITCHED,
	CHECK_ENTITY_PATH,
	CHECK_SAVE_FLAG,
	CHECK_IF_ENTITY_IS_IN_GEOMETRY,
	CHECK_FOR_BUTTON_PRESS,
	CHECK_FOR_BUTTON_STATE,
	CHECK_WARP_STATE,
	RUN_SCRIPT,
	BLOCKING_DELAY,
	NON_BLOCKING_DELAY,
	SET_ENTITY_NAME,
	SET_ENTITY_X,
	SET_ENTITY_Y,
	SET_ENTITY_INTERACT_SCRIPT,
	SET_ENTITY_TICK_SCRIPT,
	SET_ENTITY_TYPE,
	SET_ENTITY_PRIMARY_ID,
	SET_ENTITY_SECONDARY_ID,
	SET_ENTITY_PRIMARY_ID_TYPE,
	SET_ENTITY_CURRENT_ANIMATION,
	SET_ENTITY_CURRENT_FRAME,
	SET_ENTITY_DIRECTION,
	SET_ENTITY_DIRECTION_RELATIVE,
	SET_ENTITY_DIRECTION_TARGET_ENTITY,
	SET_ENTITY_DIRECTION_TARGET_GEOMETRY,
	SET_ENTITY_GLITCHED,
	SET_ENTITY_PATH,
	SET_SAVE_FLAG,
	SET_PLAYER_CONTROL,
	SET_MAP_TICK_SCRIPT,
	SET_HEX_CURSOR_LOCATION,
	SET_WARP_STATE,
	SET_HEX_EDITOR_STATE,
	SET_HEX_EDITOR_DIALOG_MODE,
	SET_HEX_EDITOR_CONTROL,
	SET_HEX_EDITOR_CONTROL_CLIPBOARD,
	LOAD_MAP,
	SHOW_DIALOG,
	PLAY_ENTITY_ANIMATION,
	TELEPORT_ENTITY_TO_GEOMETRY,
	WALK_ENTITY_TO_GEOMETRY,
	WALK_ENTITY_ALONG_GEOMETRY,
	LOOP_ENTITY_ALONG_GEOMETRY,
	SET_CAMERA_TO_FOLLOW_ENTITY,
	TELEPORT_CAMERA_TO_GEOMETRY,
	PAN_CAMERA_TO_ENTITY,
	PAN_CAMERA_TO_GEOMETRY,
	PAN_CAMERA_ALONG_GEOMETRY,
	LOOP_CAMERA_ALONG_GEOMETRY,
	SET_SCREEN_SHAKE,
	SCREEN_FADE_OUT,
	SCREEN_FADE_IN,
	MUTATE_VARIABLE,
	MUTATE_VARIABLES,
	COPY_VARIABLE,
	CHECK_VARIABLE,
	CHECK_VARIABLES,
	SLOT_SAVE,
	SLOT_LOAD,
	SLOT_ERASE,
	SET_CONNECT_SERIAL_DIALOG,
	SHOW_SERIAL_DIALOG,
	SET_MAP_LOOK_SCRIPT,
	SET_ENTITY_LOOK_SCRIPT,
	SET_TELEPORT_ENABLED,
	CHECK_MAP,
	SET_BLE_FLAG,
	CHECK_BLE_FLAG,
	SET_SERIAL_DIALOG_CONTROL,
	REGISTER_SERIAL_DIALOG_COMMAND,
	REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT,
	UNREGISTER_SERIAL_DIALOG_COMMAND,
	UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT,
	SET_ENTITY_MOVEMENT_RELATIVE,
	CHECK_DIALOG_OPEN,
	CHECK_SERIAL_DIALOG_OPEN,
	CHECK_DEBUG_MODE,
	CLOSE_DIALOG,
	CLOSE_SERIAL_DIALOG,
	SET_LIGHTS_CONTROL,
	SET_LIGHTS_STATE,
	GOTO_ACTION_INDEX,
	SET_SCRIPT_PAUSE,
	//this tracks the number of actions we're at:
	NUM_ACTIONS
} MageScriptActionTypeId;

//the functions below here are the action functions. These are going to be
//called directly by scripts, and preform their actions based on arguments read from ROM

//each action has an action logic type, depending on how it will need to interact with the rest of the game loop:
//I   = instant, will execute and immediately proceed to the next action
//NB  = non-blocking, will use loopsToNextAction and totalLoopsToNextAction to run the action until it is completed
//NBC = non-blocking continuous, will never proceed to another action, and will begin the same action again forever until the mapLocalScriptId is changed
//B   = blocking, will pause all game actions until complete.
//I+C = scripts that may call another mapLocalScriptId, discarding any actions that occur after them in the current script
//NB+C= non-blocking + check, MAY block the continuation of that script until the user has provided input of some type. These actions may also branch via mapLocalScriptId, OR continue to the next action in the current script.
//I've noted the blocking state of actions below on the line above the action:

//Action Logic Type: I
void action_null_action(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_name(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_x(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_y(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_interact_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_tick_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_look_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_type(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_primary_id(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_secondary_id(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_primary_id_type(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_current_animation(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_current_frame(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_direction(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_glitched(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_path(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_save_flag(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_if_entity_is_in_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_for_button_press(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_for_button_state(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_warp_state(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_run_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: B
void action_blocking_delay(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_non_blocking_delay(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_name(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_x(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_y(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_interact_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_tick_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_type(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_primary_id(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_secondary_id(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_primary_id_type(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_current_animation(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_current_frame(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_direction(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_direction_relative(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_direction_target_entity(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_direction_target_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_glitched(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_path(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_save_flag(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_player_control(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_map_tick_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_hex_cursor_location(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_warp_state(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_hex_editor_state(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_hex_editor_dialog_mode(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_hex_editor_control(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_hex_editor_control_clipboard(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I (loadMap will stop all other scripts immediately, loading a new map with new scripts)
void action_load_map(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB+C (
//  note showDialog will render over the main game loop and not return player control until the dialog is concluded
//  and MAY branch script execution if that dialog presents choices that the user can select from
//)
void action_show_dialog(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_play_entity_animation(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_teleport_entity_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_walk_entity_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_walk_entity_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NBC
void action_loop_entity_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_camera_to_follow_entity(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_teleport_camera_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_pan_camera_to_entity(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_pan_camera_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_pan_camera_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NBC
void action_loop_camera_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_set_screen_shake(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_screen_fade_out(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_screen_fade_in(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_mutate_variable(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_mutate_variables(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB
void action_copy_variable(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_variable(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_variables(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_slot_save(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_slot_load(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_slot_erase(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_connect_serial_dialog(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: NB+C (
//  showSerialDialog will send a message out over serial
//  and MAY not return serial control until after a serial response is input
//  and depending on whether the response matches one of the correct responses,
//  MAY branch script execution
//  OR resume current script flow
//)
void action_show_serial_dialog(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_map_look_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_look_script(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_teleport_enabled(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: C
void action_check_map(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_ble_flag(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: C
void action_check_ble_flag(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_serial_dialog_control(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_register_serial_dialog_command(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_register_serial_dialog_command_argument(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_unregister_serial_dialog_command(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_unregister_serial_dialog_command_argument(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_movement_relative(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_dialog_open(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_serial_dialog_open(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_debug_mode(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_close_dialog(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_close_serial_dialog(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_lights_control(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_lights_state(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_goto_action_index(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_script_pause(uint8_t * args, MageScriptState * resumeStateStruct);

//typedef for the array of function pointers to script action functions:
typedef void(*ActionFunctionPointer)(uint8_t * args, MageScriptState * resumeStateStruct);

//the actual array of action functions:
extern ActionFunctionPointer actionFunctions[MageScriptActionTypeId::NUM_ACTIONS];

uint16_t getUsefulGeometryIndexFromActionGeometryId(
	uint16_t geometryId,
	MageEntity *entity
);
Point offsetPointRelativeToEntityCenter(
	const MageEntityRenderableData *renderable,
	const MageEntity *entity,
	const Point *geometryPoint
);
MageEntityAnimationDirection getRelativeDirection(
	const Point &pointA,
	const Point &pointB
);
void setEntityPositionToPoint(
	MageEntity *entity,
	const Point &point
);
float getProgressOfAction(const MageScriptState *resumeStateStruct);
float manageProgressOfAction(
	MageScriptState *resumeStateStruct,
	uint32_t duration
);
uint16_t getLoopableGeometryPointIndex(
	MageGeometry *geometry,
	uint8_t index
);
uint16_t getLoopableGeometrySegmentIndex(
	MageGeometry *geometry,
	uint8_t segmentIndex
);
void setResumeStatePointsAndEntityDirection(
	MageScriptState *resumeStateStruct,
	MageEntityRenderableData *renderable,
	MageEntity *entity,
	MageGeometry *geometry,
	uint16_t pointAIndex,
	uint16_t pointBIndex
);
void initializeEntityGeometryPath(
	MageScriptState *resumeStateStruct,
	MageEntityRenderableData *renderable,
	MageEntity *entity,
	MageGeometry *geometry
);
int16_t getUsefulEntityIndexFromActionEntityId(
	uint8_t entityId,
	int16_t callingEntityId
);

typedef enum : uint8_t {
	SET = 0,
	ADD,
	SUB,
	DIV,
	MUL,
	MOD,
	RNG
} MageMutateOperation;

typedef enum : uint8_t {
	LT = 0,
	LTEQ,
	EQ,
	GTEQ,
	GT
} MageCheckComparison;

void mutate(
	MageMutateOperation operation,
	uint16_t *destination,
	uint16_t value
);

bool compare(
	MageCheckComparison comparison,
	uint16_t a,
	uint16_t b
);

bool getButtonStateFromButtonArray(
	uint8_t buttonId,
	ButtonStates *buttonStates
) ;

#endif //_MAGE_SCRIPT_ACTIONS_H
