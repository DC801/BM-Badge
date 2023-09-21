#ifndef _MAGE_SCRIPT_CONTROL_H
#define _MAGE_SCRIPT_CONTROL_H

#include <stdint.h>
#include <optional>
#include <memory>
#include "mage_hex.h"
#include "mage_map.h"
#include "mage_script_actions.h"
#include "mage_script_state.h"

#define SCRIPT_NAME_LENGTH 32
#define COMMAND_STATES_COUNT 5

class MageScriptControl
{
public:
   MageScriptControl() noexcept = default;
   MageScriptControl(std::shared_ptr<MapControl> mapControl, 
      std::shared_ptr<MageHexEditor> hexEditor,
      std::unique_ptr<MageScriptActions>&& scriptActions) noexcept
   : mapControl(mapControl), 
      hexEditor(hexEditor),
      scriptActions(std::move(scriptActions))
   {}

   //the jumpScriptId variable is used by some actions to indicate that a script should
   //end and immediately begin running a new script.
   //it should be set to MAGE_NO_SCRIPT unless a new script should be run immediately.
   std::optional<uint16_t> jumpScriptId{ MAGE_NO_SCRIPT };

   //this is a variable that tracks which entity called an action.
   //If the action was called by the map, the value will be MAGE_MAP_ENTITY.
   //most actions will not do anything if an action that uses MAGE_ENTITY_SELF is called from the map's scripts.
   uint8_t currentEntityId{ MAGE_MAP_ENTITY };

   //these functions return the specified MageScriptState struct:
   struct resumeStatesStruct
   {
      MageScriptState commandLook;
      MageScriptState commandGo;
      MageScriptState commandUse;
      MageScriptState commandGet;
      MageScriptState commandDrop;
   } resumeStates{ };

   MageScriptState* commandStates[COMMAND_STATES_COUNT] = {
      &resumeStates.commandLook,
      &resumeStates.commandGo,
      &resumeStates.commandGet,
      &resumeStates.commandDrop,
      &resumeStates.commandUse,
   };

   //typedef for the array of function pointers to script action functions:
   typedef std::optional<uint16_t> (MageScriptActions::* ActionFunctionPointer)(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId);

   ActionFunctionPointer actionFunctions[NUM_SCRIPT_ACTIONS] = {
      &MageScriptActions::null_action,
      &MageScriptActions::check_entity_name,
      &MageScriptActions::check_entity_x,
      &MageScriptActions::check_entity_y,
      &MageScriptActions::check_entity_interact_script,
      &MageScriptActions::check_entity_tick_script,
      &MageScriptActions::check_entity_type,
      &MageScriptActions::check_entity_primary_id,
      &MageScriptActions::check_entity_secondary_id,
      &MageScriptActions::check_entity_primary_id_type,
      &MageScriptActions::check_entity_current_animation,
      &MageScriptActions::check_entity_current_frame,
      &MageScriptActions::check_entity_direction,
      &MageScriptActions::check_entity_glitched,
      &MageScriptActions::check_entity_hackable_state_a,
      &MageScriptActions::check_entity_hackable_state_b,
      &MageScriptActions::check_entity_hackable_state_c,
      &MageScriptActions::check_entity_hackable_state_d,
      &MageScriptActions::check_entity_hackable_state_a_u2,
      &MageScriptActions::check_entity_hackable_state_c_u2,
      &MageScriptActions::check_entity_hackable_state_a_u4,
      &MageScriptActions::check_entity_path,
      &MageScriptActions::check_save_flag,
      &MageScriptActions::check_if_entity_is_in_geometry,
      &MageScriptActions::check_for_button_press,
      &MageScriptActions::check_for_button_state,
      &MageScriptActions::check_warp_state,
      &MageScriptActions::run_script,
      &MageScriptActions::blocking_delay,
      &MageScriptActions::non_blocking_delay,
      &MageScriptActions::set_entity_name,
      &MageScriptActions::set_entity_x,
      &MageScriptActions::set_entity_y,
      &MageScriptActions::set_entity_interact_script,
      &MageScriptActions::set_entity_tick_script,
      &MageScriptActions::set_entity_type,
      &MageScriptActions::set_entity_primary_id,
      &MageScriptActions::set_entity_secondary_id,
      &MageScriptActions::set_entity_primary_id_type,
      &MageScriptActions::set_entity_current_animation,
      &MageScriptActions::set_entity_current_frame,
      &MageScriptActions::set_entity_direction,
      &MageScriptActions::set_entity_direction_relative,
      &MageScriptActions::set_entity_direction_target_entity,
      &MageScriptActions::set_entity_direction_target_geometry,
      &MageScriptActions::set_entity_glitched,
      &MageScriptActions::set_entity_hackable_state_a,
      &MageScriptActions::set_entity_hackable_state_b,
      &MageScriptActions::set_entity_hackable_state_c,
      &MageScriptActions::set_entity_hackable_state_d,
      &MageScriptActions::set_entity_hackable_state_a_u2,
      &MageScriptActions::set_entity_hackable_state_c_u2,
      &MageScriptActions::set_entity_hackable_state_a_u4,
      &MageScriptActions::set_entity_path,
      &MageScriptActions::set_save_flag,
      &MageScriptActions::set_player_control,
      &MageScriptActions::set_map_tick_script,
      &MageScriptActions::set_hex_cursor_location,
      &MageScriptActions::set_warp_state,
      &MageScriptActions::set_hex_editor_state,
      &MageScriptActions::set_hex_editor_dialog_mode,
      &MageScriptActions::set_hex_editor_control,
      &MageScriptActions::set_hex_editor_control_clipboard,
      &MageScriptActions::load_map,
      &MageScriptActions::show_dialog,
      &MageScriptActions::play_entity_animation,
      &MageScriptActions::teleport_entity_to_geometry,
      &MageScriptActions::walk_entity_to_geometry,
      &MageScriptActions::walk_entity_along_geometry,
      &MageScriptActions::loop_entity_along_geometry,
      &MageScriptActions::set_camera_to_follow_entity,
      &MageScriptActions::teleport_camera_to_geometry,
      &MageScriptActions::pan_camera_to_entity,
      &MageScriptActions::pan_camera_to_geometry,
      &MageScriptActions::pan_camera_along_geometry,
      &MageScriptActions::loop_camera_along_geometry,
      &MageScriptActions::set_screen_shake,
      &MageScriptActions::screen_fade_out,
      &MageScriptActions::screen_fade_in,
      &MageScriptActions::mutate_variable,
      &MageScriptActions::mutate_variables,
      &MageScriptActions::copy_variable,
      &MageScriptActions::check_variable,
      &MageScriptActions::check_variables,
      &MageScriptActions::slot_save,
      &MageScriptActions::slot_load,
      &MageScriptActions::slot_erase,
      &MageScriptActions::set_connect_serial_dialog,
      &MageScriptActions::show_serial_dialog,
      &MageScriptActions::inventory_get,
      &MageScriptActions::inventory_drop,
      &MageScriptActions::check_inventory,
      &MageScriptActions::set_map_look_script,
      &MageScriptActions::set_entity_look_script,
      &MageScriptActions::set_teleport_enabled,
      &MageScriptActions::check_map,
      &MageScriptActions::set_ble_flag,
      &MageScriptActions::check_ble_flag,
   };

   void handleCommandScript(MageScriptState& resumeState);

   void tickScripts();

   //this will process a script based on the state of the resumeStateStruct passed to it.
   //it should only be called from the 
   void processScript(MageScriptState& resumeState, uint8_t mapLocalEntityId, MageScriptType scriptType);

private:
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<MageHexEditor> hexEditor;
   //variables for tracking suspended script states:
   //MageScriptState entityInteractResumeStates[MAX_ENTITIES_PER_MAP]{ };
   //MageScriptState entityTickResumeStates[MAX_ENTITIES_PER_MAP]{ };
   std::unique_ptr<MageScriptActions> scriptActions;


}; //MageScriptControl

#endif //_MAGE_SCRIPT_CONTROL_H
