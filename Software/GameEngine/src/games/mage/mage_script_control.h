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

//these are the types of scripts that can be on a map or entity:
typedef enum : uint8_t
{
   ON_LOAD = 0,
   ON_TICK,
   ON_INTERACT,
   ON_LOOK,
   ON_COMMAND,
   NUM_SCRIPT_TYPES
} MageScriptType;

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
      MageScriptState mapLoad;
      MageScriptState mapTick;
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
      &MageScriptActions::action_null_action,
      &MageScriptActions::action_check_entity_name,
      &MageScriptActions::action_check_entity_x,
      &MageScriptActions::action_check_entity_y,
      &MageScriptActions::action_check_entity_interact_script,
      &MageScriptActions::action_check_entity_tick_script,
      &MageScriptActions::action_check_entity_type,
      &MageScriptActions::action_check_entity_primary_id,
      &MageScriptActions::action_check_entity_secondary_id,
      &MageScriptActions::action_check_entity_primary_id_type,
      &MageScriptActions::action_check_entity_current_animation,
      &MageScriptActions::action_check_entity_current_frame,
      &MageScriptActions::action_check_entity_direction,
      &MageScriptActions::action_check_entity_glitched,
      &MageScriptActions::action_check_entity_hackable_state_a,
      &MageScriptActions::action_check_entity_hackable_state_b,
      &MageScriptActions::action_check_entity_hackable_state_c,
      &MageScriptActions::action_check_entity_hackable_state_d,
      &MageScriptActions::action_check_entity_hackable_state_a_u2,
      &MageScriptActions::action_check_entity_hackable_state_c_u2,
      &MageScriptActions::action_check_entity_hackable_state_a_u4,
      &MageScriptActions::action_check_entity_path,
      &MageScriptActions::action_check_save_flag,
      &MageScriptActions::action_check_if_entity_is_in_geometry,
      &MageScriptActions::action_check_for_button_press,
      &MageScriptActions::action_check_for_button_state,
      &MageScriptActions::action_check_warp_state,
      &MageScriptActions::action_run_script,
      &MageScriptActions::action_blocking_delay,
      &MageScriptActions::action_non_blocking_delay,
      &MageScriptActions::action_set_entity_name,
      &MageScriptActions::action_set_entity_x,
      &MageScriptActions::action_set_entity_y,
      &MageScriptActions::action_set_entity_interact_script,
      &MageScriptActions::action_set_entity_tick_script,
      &MageScriptActions::action_set_entity_type,
      &MageScriptActions::action_set_entity_primary_id,
      &MageScriptActions::action_set_entity_secondary_id,
      &MageScriptActions::action_set_entity_primary_id_type,
      &MageScriptActions::action_set_entity_current_animation,
      &MageScriptActions::action_set_entity_current_frame,
      &MageScriptActions::action_set_entity_direction,
      &MageScriptActions::action_set_entity_direction_relative,
      &MageScriptActions::action_set_entity_direction_target_entity,
      &MageScriptActions::action_set_entity_direction_target_geometry,
      &MageScriptActions::action_set_entity_glitched,
      &MageScriptActions::action_set_entity_hackable_state_a,
      &MageScriptActions::action_set_entity_hackable_state_b,
      &MageScriptActions::action_set_entity_hackable_state_c,
      &MageScriptActions::action_set_entity_hackable_state_d,
      &MageScriptActions::action_set_entity_hackable_state_a_u2,
      &MageScriptActions::action_set_entity_hackable_state_c_u2,
      &MageScriptActions::action_set_entity_hackable_state_a_u4,
      &MageScriptActions::action_set_entity_path,
      &MageScriptActions::action_set_save_flag,
      &MageScriptActions::action_set_player_control,
      &MageScriptActions::action_set_map_tick_script,
      &MageScriptActions::action_set_hex_cursor_location,
      &MageScriptActions::action_set_warp_state,
      &MageScriptActions::action_set_hex_editor_state,
      &MageScriptActions::action_set_hex_editor_dialog_mode,
      &MageScriptActions::action_set_hex_editor_control,
      &MageScriptActions::action_set_hex_editor_control_clipboard,
      &MageScriptActions::action_load_map,
      &MageScriptActions::action_show_dialog,
      &MageScriptActions::action_play_entity_animation,
      &MageScriptActions::action_teleport_entity_to_geometry,
      &MageScriptActions::action_walk_entity_to_geometry,
      &MageScriptActions::action_walk_entity_along_geometry,
      &MageScriptActions::action_loop_entity_along_geometry,
      &MageScriptActions::action_set_camera_to_follow_entity,
      &MageScriptActions::action_teleport_camera_to_geometry,
      &MageScriptActions::action_pan_camera_to_entity,
      &MageScriptActions::action_pan_camera_to_geometry,
      &MageScriptActions::action_pan_camera_along_geometry,
      &MageScriptActions::action_loop_camera_along_geometry,
      &MageScriptActions::action_set_screen_shake,
      &MageScriptActions::action_screen_fade_out,
      &MageScriptActions::action_screen_fade_in,
      &MageScriptActions::action_mutate_variable,
      &MageScriptActions::action_mutate_variables,
      &MageScriptActions::action_copy_variable,
      &MageScriptActions::action_check_variable,
      &MageScriptActions::action_check_variables,
      &MageScriptActions::action_slot_save,
      &MageScriptActions::action_slot_load,
      &MageScriptActions::action_slot_erase,
      &MageScriptActions::action_set_connect_serial_dialog,
      &MageScriptActions::action_show_serial_dialog,
      &MageScriptActions::action_inventory_get,
      &MageScriptActions::action_inventory_drop,
      &MageScriptActions::action_check_inventory,
      &MageScriptActions::action_set_map_look_script,
      &MageScriptActions::action_set_entity_look_script,
      &MageScriptActions::action_set_teleport_enabled,
      &MageScriptActions::action_check_map,
      &MageScriptActions::action_set_ble_flag,
      &MageScriptActions::action_check_ble_flag,
   };

   void initializeScriptsOnMapLoad();
   constexpr void SetEntityInteractResumeState(uint16_t entityIndex, const MageScriptState&& state) { entityInteractResumeStates[entityIndex] = state; }

   //these functions will call the appropriate script processing for their script type:
   void handleMapOnLoadScript(bool isFirstRun);
   void handleMapOnTickScript();
   void handleCommandScript(MageScriptState& resumeState);
   void handleEntityOnTickScript(uint8_t filteredEntityId);
   void handleEntityOnInteractScript(uint8_t filteredEntityId);

   void tickScripts();

private:
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<MageHexEditor> hexEditor;
   //variables for tracking suspended script states:
   MageScriptState entityInteractResumeStates[MAX_ENTITIES_PER_MAP]{ };
   MageScriptState entityTickResumeStates[MAX_ENTITIES_PER_MAP]{ };
   std::unique_ptr<MageScriptActions> scriptActions;

   //this will process a script based on the state of the resumeStateStruct passed to it.
   //it should only be called from the 
   void processScript(MageScriptState& resumeState, uint8_t mapLocalEntityId, MageScriptType scriptType);

   //this will run through the actions in a script from the state stores in resumeState
   //if a jumpScriptId is called by an action, it will return without processing any further actions.
   void processActionQueue(MageScriptState& resumeState, MageScriptType scriptType);

   //this will get action arguments from ROM memory and call
   //a function based on the ActionTypeId 
   void runAction(uint32_t argumentMemoryAddress, MageScriptState& resumeState);

}; //MageScriptControl

#endif //_MAGE_SCRIPT_CONTROL_H
