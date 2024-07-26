#ifndef _MAGE_SCRIPT_ACTIONS_H
#define _MAGE_SCRIPT_ACTIONS_H

#include "EngineInput.h"
#include "FrameBuffer.h"
#include "mage_rom.h"
#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_geometry.h"
#include "mage_script_actions.h"
#include "mage_script_state.h"

// structs/classes that this class depends on, forward defined:
struct RenderableData;
class MageCommandControl;
class MageDialogControl;
class MapControl;
class MageGameEngine;
class MageHexEditor;
class MageEntity;
class StringLoader;

using OnTickScript = TaggedType<MageScriptState, struct OnTick>;
using OnInteractScript = TaggedType<MageScriptState, struct OnInteract>;
using OnLookScript = TaggedType<MageScriptState, struct OnLook>;

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
//	add type enum in `SD_Card/MAGE/mage_dat.ksy`
//	bump the version number in the #define ENGINE_VERSION in this file
//	bump the version number in `engine_version` in the `SD_Card/MAGE/mage_dat.ksy`
//	bump the version number in `ENGINE_VERSION` in the `SD_Card/MAGE/editor/js/common.js`
typedef enum : uint8_t
{
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
   REGISTER_SERIAL_DIALOG_COMMAND_ALIAS,
   UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS,
   SET_SERIAL_DIALOG_COMMAND_VISIBILITY
} MageScriptActionTypeId;

//this tracks the number of actions we're at
static const inline uint8_t NUM_SCRIPT_ACTIONS = 100;

class MageScriptActions
{
   friend class MageScriptControl;
public:
   MageScriptActions(std::shared_ptr<EngineInput> inputHandler, std::shared_ptr<FrameBuffer> frameBuffer,
      std::shared_ptr<MapControl> mapControl, std::shared_ptr<MageDialogControl> dialogControl,
      std::shared_ptr<MageCommandControl> commandControl, std::shared_ptr<MageHexEditor> hexEditor, std::shared_ptr<StringLoader> stringLoader) noexcept
      : inputHandler(inputHandler), 
      frameBuffer(frameBuffer),
      mapControl(mapControl),
      dialogControl(dialogControl),
      commandControl(commandControl),
      hexEditor(hexEditor),
      stringLoader(stringLoader)
   {}

private:

   //the functions below here are the action functions. These are going to be
   //called directly by scripts, and preform their actions based on arguments read from ROM
   //each action has an action logic type, depending on how it will need to interact with the rest of the game loop:
   //I   = instant, will execute and immediately proceed to the next action
   //NB  = non-blocking, will use remainingSteps and totalSteps to run the action until it is completed
   //NBC = non-blocking continuous, will never proceed to another action, and will begin the same action again forever until the mapLocalScriptId is changed
   //B   = blocking, will pause all game actions until complete.
   //I+C = scripts that may call another mapLocalScriptId, discarding any actions that occur after them in the current script
   //NB+C= non-blocking + check, MAY block the continuation of that script until the user has provided input of some type. These actions may also branch via mapLocalScriptId, OR continue to the next action in the current script.
   //I've noted the blocking state of actions below on the line above the action:

      //Action Logic Type: I
   std::optional<uint16_t> null_action(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I+C
   std::optional<uint16_t> check_entity_name(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_x(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_y(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_interact_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_tick_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_look_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_primary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_secondary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_primary_id_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_current_animation(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_current_frame(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_direction(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_glitched(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_a(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_b(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_c(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_d(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_a_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_c_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_hackable_state_a_u4(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_entity_path(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_save_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_if_entity_is_in_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_for_button_press(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_for_button_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_warp_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> run_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: B
   std::optional<uint16_t> blocking_delay(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> non_blocking_delay(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_name(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_x(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_y(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_interact_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_tick_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_primary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_secondary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_primary_id_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_current_animation(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_current_frame(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_direction(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_direction_relative(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_direction_target_entity(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_direction_target_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_glitched(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_a(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_b(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_c(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_d(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_a_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_c_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_hackable_state_a_u4(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_entity_path(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_save_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_player_control(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_map_tick_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_hex_cursor_location(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_warp_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_hex_editor_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_hex_editor_dialog_mode(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_hex_editor_control(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_hex_editor_control_clipboard(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I (loadMap will stop all other scripts immediately, loading a new map with new scripts)
   std::optional<uint16_t> load_map(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB+C (
   //  note showDialog will render over the main game loop and not return player control until the dialog is concluded
   //  and MAY branch script execution if that dialog presents choices that the user can select from
   //)
   std::optional<uint16_t> show_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> play_entity_animation(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> teleport_entity_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> walk_entity_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> walk_entity_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NBC
   std::optional<uint16_t> loop_entity_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> set_camera_to_follow_entity(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> teleport_camera_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> pan_camera_to_entity(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> pan_camera_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> pan_camera_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NBC
   std::optional<uint16_t> loop_camera_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB
   std::optional<uint16_t> set_screen_shake(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> screen_fade_out(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> screen_fade_in(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> mutate_variable(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> mutate_variables(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> copy_variable(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I+C
   std::optional<uint16_t> check_variable(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I+C
   std::optional<uint16_t> check_variables(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> slot_save(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> slot_load(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> slot_erase(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_connect_serial_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: NB+C (
   //  showSerialDialog will send a message out over serial
   //  and MAY not return serial control until after a serial response is input
   //  and depending on whether the response matches one of the correct responses,
   //  MAY branch script execution
   //  OR resume current script flow
   //)
   std::optional<uint16_t> show_serial_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> inventory_get(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> inventory_drop(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_inventory(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_map_look_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_entity_look_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_teleport_enabled(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: C
   std::optional<uint16_t> check_map(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_ble_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_ble_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_serial_dialog_control(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> register_serial_dialog_command(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> register_serial_dialog_command_argument(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> unregister_serial_dialog_command(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> unregister_serial_dialog_command_argument(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_entity_movement_relative(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I+C
   std::optional<uint16_t> check_dialog_open(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_serial_dialog_open(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> check_debug_mode(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> close_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> close_serial_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_lights_control(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_lights_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> goto_action_index(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_script_pause(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   //Action Logic Type: I
   std::optional<uint16_t> register_serial_dialog_command_alias(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> unregister_serial_dialog_command_alias(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);
   std::optional<uint16_t> set_serial_dialog_command_visibility(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);

   constexpr float getProgressOfAction(const MageScriptState& resumeState) const
   {
      return 1.0f - (float)resumeState.remainingSteps / (float)resumeState.totalSteps;
   }
   float manageProgressOfAction(MageScriptState& resumeState, uint32_t duration) const;

   enum class MageMutateOperation : uint8_t
   {
      SET = 0,
      ADD,
      SUB,
      DIV,
      MUL,
      MOD,
      RNG
   };

   enum MageCheckComparison : uint8_t
   {
      LT = 0,
      LTEQ,
      EQ,
      GTEQ,
      GT
   };

   void mutate(MageMutateOperation operation, uint16_t& destination, uint16_t value);
   bool compare(MageCheckComparison comparison, uint16_t a, uint16_t b);

   //typedef for the array of function pointers to script action functions:
   typedef std::optional<uint16_t>(MageScriptActions::*ActionFunctionPointer)(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);

   static const std::array<const ActionFunctionPointer, NUM_SCRIPT_ACTIONS> actionFunctions;

private:
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<MageDialogControl> dialogControl;
   std::shared_ptr<EngineInput> inputHandler;
   std::shared_ptr<MageCommandControl> commandControl;
   std::shared_ptr<MageHexEditor> hexEditor;
   std::shared_ptr<FrameBuffer> frameBuffer;
   std::shared_ptr<StringLoader> stringLoader;

   std::optional<uint16_t> handleJump(bool shouldJump, uint8_t flags, uint16_t destination, MageScriptState& resumeState);
};


//typedef for the array of function pointers to script action functions:
typedef void(*ActionFunctionPointer)(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);

//the actual array of action functions:
extern ActionFunctionPointer actionFunctions[NUM_SCRIPT_ACTIONS];

typedef enum : uint8_t
{
   SET = 0,
   ADD,
   SUB,
   DIV,
   MUL,
   MOD,
   RNG
} MageMutateOperation;

typedef enum : uint8_t
{
   LT = 0,
   LTEQ,
   EQ,
   GTEQ,
   GT
} MageCheckComparison;

#endif //_MAGE_SCRIPT_ACTIONS_H
