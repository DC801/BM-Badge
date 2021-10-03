#ifndef _MAGE_SCRIPT_ACTIONS_H
#define _MAGE_SCRIPT_ACTIONS_H

#include "mage_defines.h"
#include "mage.h"
#include "mage_game_control.h"
#include "mage_hex.h"
#include "mage_script_control.h"


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
void action_check_entity_hackable_state_a(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_hackable_state_b(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_hackable_state_c(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_hackable_state_d(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_hackable_state_a_u2(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_hackable_state_c_u2(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I+C
void action_check_entity_hackable_state_a_u4(uint8_t * args, MageScriptState * resumeStateStruct);
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
void action_set_entity_hackable_state_a(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_hackable_state_b(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_hackable_state_c(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_hackable_state_d(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_hackable_state_a_u2(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_hackable_state_c_u2(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_set_entity_hackable_state_a_u4(uint8_t * args, MageScriptState * resumeStateStruct);
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
void action_inventory_get(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_inventory_drop(uint8_t * args, MageScriptState * resumeStateStruct);
//Action Logic Type: I
void action_check_inventory(uint8_t * args, MageScriptState * resumeStateStruct);
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
