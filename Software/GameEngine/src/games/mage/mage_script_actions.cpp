#include "mage_script_actions.h"

#include "EngineInput.h"
#include "FrameBuffer.h"
#include "mage_camera.h"
#include "mage_command_control.h"
#include "mage_dialog_control.h"
#include "mage_entity.h"
#include "mage_script_control.h"
#include "mage_script_state.h"

#include "mage_geometry.h"
#include "mage_hex.h"
#include "utility.h"

#define NO_JUMP_SCRIPT std::nullopt

const std::array<const MageScriptActions::ActionFunctionPointer, NUM_SCRIPT_ACTIONS> MageScriptActions::actionFunctions{
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

std::optional<uint16_t> MageScriptActions::null_action(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   //nullAction does nothing.
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_name(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t stringId;
      uint8_t entityId;
      uint8_t expectedBoolValue;
      uint8_t paddingG;
   } ActionCheckEntityName;
   auto argStruct = (ActionCheckEntityName*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto entityName = mapControl->Get<MageEntityData>(entityId).name;
      auto romString = stringLoader->getString(argStruct->stringId, entityName);

      int compare = strcmp(entityName, romString.c_str());
      bool identical = compare == 0;
      if (identical == (bool)argStruct->expectedBoolValue)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_x(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityX;
   auto argStruct = (ActionCheckEntityX*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.targetPosition.x == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_y(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityY;
   auto argStruct = (ActionCheckEntityY*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.targetPosition.y == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_interact_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedScript;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityInteractScript;
   auto argStruct = (ActionCheckEntityInteractScript*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.onInteractScriptId == argStruct->expectedScript);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_tick_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedScript;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityTickScript;
   auto argStruct = (ActionCheckEntityTickScript*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.onTickScriptId == argStruct->expectedScript);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t entityTypeId;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityType;
   auto argStruct = (ActionCheckEntityType*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = entity.primaryId == argStruct->entityTypeId && entity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE;

      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_primary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityPrimaryId;
   auto argStruct = (ActionCheckEntityPrimaryId*)args;
   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      uint16_t sizeLimit{ 1 };
      if (entity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE) { sizeLimit = ROM()->GetCount<MageEntityType>(); }
      else if (entity.primaryIdType == MageEntityPrimaryIdType::ANIMATION) { sizeLimit = ROM()->GetCount<MageAnimation>(); }
      else if (entity.primaryIdType == MageEntityPrimaryIdType::TILESET) { sizeLimit = ROM()->GetCount<MageTileset>(); }
      else { throw std::runtime_error{ "Primary Type Unknown" }; }

      bool identical = ((entity.primaryId % sizeLimit) == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_secondary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntitySecondaryId;
   auto argStruct = (ActionCheckEntitySecondaryId*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      uint16_t sizeLimit = 1;
      if (entity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE) { sizeLimit = 1; }
      if (entity.primaryIdType == MageEntityPrimaryIdType::ANIMATION) { sizeLimit = 1; }
      if (entity.primaryIdType == MageEntityPrimaryIdType::TILESET)
      {
         auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(entity.primaryId);
         sizeLimit = tileset->TileCount();
      }
      bool identical = ((entity.secondaryId % sizeLimit) == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_primary_id_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      MageEntityPrimaryIdType expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityPrimaryIdType;
   auto argStruct = (ActionCheckEntityPrimaryIdType*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.primaryIdType == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_current_animation(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityCurrentAnimation;
   auto argStruct = (ActionCheckEntityCurrentAnimation*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      auto identical = bool{ renderableData.currentAnimation == argStruct->expectedValue };
      if (identical == static_cast<bool>(argStruct->expectedBool))
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_current_frame(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityCurrentFrame;
   auto argStruct = (ActionCheckEntityCurrentFrame*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      bool identical = (renderableData.currentFrameIndex == argStruct->expectedValue);
      if (identical == static_cast<bool>(argStruct->expectedBool))
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_direction(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityDirection;
   auto argStruct = (ActionCheckEntityDirection*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.flags == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_glitched(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckEntityGlitched;
   auto argStruct = (ActionCheckEntityGlitched*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      if (entity.IsGlitched())
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_a(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateA;
   auto argStruct = (ActionCheckEntityHackableStateA*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.hackableStateA == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_b(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateB;
   auto argStruct = (ActionCheckEntityHackableStateB*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.hackableStateB == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_c(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateC;
   auto argStruct = (ActionCheckEntityHackableStateC*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.hackableStateC == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_d(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateD;
   auto argStruct = (ActionCheckEntityHackableStateD*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      bool identical = (entity.hackableStateD == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_a_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
   } ActionCheckEntityHackableStateAU2;
   auto argStruct = (ActionCheckEntityHackableStateAU2*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      uint16_t u2_value = *(uint16_t*)((uint8_t*)&entity.hackableStateA);
      bool identical = (u2_value == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_c_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
   } ActionCheckEntityHackableStateCU2;
   auto argStruct = (ActionCheckEntityHackableStateCU2*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      uint16_t u2_value = *(uint16_t*)((uint8_t*)&entity.hackableStateC);
      bool identical = (u2_value == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_hackable_state_a_u4(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t expectedValue;
      uint16_t successScriptId;
      uint8_t entityId;
   } ActionCheckEntityHackableStateAU4;
   auto argStruct = (ActionCheckEntityHackableStateAU4*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      uint32_t u4_value = *(uint32_t*)((uint8_t*)&entity.hackableStateA);
      if (u4_value == argStruct->expectedValue)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_entity_path(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
   } ActionCheckEntityPath;
   auto argStruct = (ActionCheckEntityPath*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      uint16_t pathId = *(uint16_t*)((uint8_t*)&entity.hackableStateA);
      bool identical = (pathId == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_save_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t saveFlagOffset;
      uint8_t expectedBoolValue;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckSaveFlag;
   auto argStruct = (ActionCheckSaveFlag*)args;
   auto& currentSave = ROM()->GetCurrentSave();
   uint16_t byteOffset = argStruct->saveFlagOffset / 8;
   uint8_t bitOffset = argStruct->saveFlagOffset % 8;
   uint8_t currentByteValue = currentSave.saveFlags[byteOffset];
   bool bitValue = (currentByteValue >> bitOffset) & 0x01u;

   if (bitValue == (bool)argStruct->expectedBoolValue)
   {
      return argStruct->successScriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_if_entity_is_in_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t geometryId;
      uint8_t entityId;
      uint8_t expectedBoolValue;
      uint8_t paddingG;
   } ActionCheckifEntityIsInGeometry;
   auto argStruct = (ActionCheckifEntityIsInGeometry*)args;
   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      auto geometry = mapControl->GetGeometry(argStruct->geometryId);

      bool colliding = geometry->IsPointInside(renderableData.center());
      if (colliding == (bool)argStruct->expectedBoolValue)
      {
         return argStruct->successScriptId;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_for_button_press(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t buttonId; //KEYBOARD_KEY enum value
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckForButtonPress;
   auto argStruct = (ActionCheckForButtonPress*)args;

   if (inputHandler->IsPressed((KeyPress)argStruct->buttonId))
   {
      return argStruct->successScriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_for_button_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t buttonId; //KEYBOARD_KEY enum value
      uint8_t expectedBoolValue;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckForButtonState;
   auto argStruct = (ActionCheckForButtonState*)args;
   if ((bool)(argStruct->expectedBoolValue) == inputHandler->IsPressed((KeyPress)argStruct->buttonId))
   {
      return argStruct->successScriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_warp_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t stringId;
      uint8_t expectedBoolValue;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckWarpState;
   auto argStruct = (ActionCheckWarpState*)args;
   auto& currentSave = ROM()->GetCurrentSave();

   bool doesWarpStateMatch = currentSave.warpState == argStruct->stringId;
   if (doesWarpStateMatch == (bool)(argStruct->expectedBoolValue))
   {
      return argStruct->successScriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::run_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t scriptId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionRunScript;
   auto argStruct = (ActionRunScript*)args;

   return argStruct->scriptId;
}

std::optional<uint16_t> MageScriptActions::blocking_delay(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionBlockingDelay;
   auto argStruct = (ActionBlockingDelay*)args;

   //If there's already a total number of steps to next action set, a delay is currently in progress:
   if (resumeState.totalSteps != 0)
   {
      //decrement the number of steps to the end of the delay:
      resumeState.remainingSteps--;
      //if we've reached the end:
      if (resumeState.remainingSteps <= 0)
      {
         //reset the variables and return, the delay is complete.
         resumeState.totalSteps = 0;
         resumeState.remainingSteps = 0;
         return NO_JUMP_SCRIPT;
      }
   }
   //a delay is not active, so we should start one:
   else
   {
      //always a single step for a blocking delay. On the next action call, (after rendering all current changes) it will continue.
      const uint16_t totalDelaySteps = 1;
      //also set the blocking delay time to the larger of the current blockingDelayTime, or argStruct->durationMs:
      if (inputHandler->blockingDelayTime < GameClock::duration{ argStruct->durationMs })
      {
         inputHandler->blockingDelayTime = GameClock::duration{ argStruct->durationMs };
      }
      //now set the resumeState variables:
      resumeState.totalSteps = totalDelaySteps;
      resumeState.remainingSteps = totalDelaySteps;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::non_blocking_delay(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionNonBlockingDelay;
   auto argStruct = (ActionNonBlockingDelay*)args;

   manageProgressOfAction(resumeState, argStruct->durationMs);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_name(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t stringId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityName;
   auto argStruct = (ActionSetEntityName*)args;

   std::string entityName = mapControl->Get<MageEntityData>(entityId).name;
   std::string romString = stringLoader->getString(argStruct->stringId, entityName);

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      for (int i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         entity.name[i] = romString[i];
         if (romString[i] == 0)
         {
            // fill in the remainder with null to keep the name data clean
            for (int j = i + 1; j < MAGE_ENTITY_NAME_LENGTH; j++)
            {
               entity.name[j] = 0;
            }
            break;
         }
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_x(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityX;
   auto argStruct = (ActionSetEntityX*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.targetPosition.x = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_y(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityY;
   auto argStruct = (ActionSetEntityY*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.targetPosition.y = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_interact_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t scriptId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityInteractScript;
   auto argStruct = (ActionSetEntityInteractScript*)args;
   auto sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.onInteractScriptId = argStruct->scriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_tick_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t scriptId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityTickScript;
   auto argStruct = (ActionSetEntityTickScript*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.onTickScriptId = argStruct->scriptId;
   }
   else
   {
      mapControl->SetOnTick(argStruct->scriptId);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t entityTypeId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityType;
   auto argStruct = (ActionSetEntityType*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.primaryId = argStruct->entityTypeId;
      entity.primaryIdType = MageEntityPrimaryIdType::ENTITY_TYPE;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_primary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityPrimaryId;
   auto argStruct = (ActionSetEntityPrimaryId*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.primaryId = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_secondary_id(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntitySecondaryId;
   auto argStruct = (ActionSetEntitySecondaryId*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.secondaryId = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_primary_id_type(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      MageEntityPrimaryIdType newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityPrimaryIdType;
   auto argStruct = (ActionSetEntityPrimaryIdType*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.primaryIdType = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_current_animation(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityCurrentAnimation;
   auto argStruct = (ActionSetEntityCurrentAnimation*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      renderableData.SetAnimation(argStruct->newValue);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_current_frame(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityCurrentFrame;
   auto argStruct = (ActionSetEntityCurrentFrame*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      renderableData.SetAnimation(argStruct->newValue);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_direction(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      MageEntityAnimationDirection direction;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityDirection;
   auto argStruct = (ActionSetEntityDirection*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.flags |= static_cast<uint8_t>(argStruct->direction);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_direction_relative(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      int8_t relativeDirection;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityDirectionRelative;
   auto argStruct = (ActionSetEntityDirectionRelative*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      auto newDirection = (entity.flags + argStruct->relativeDirection) % NUM_DIRECTIONS;
      entity.flags |= static_cast<uint8_t>(newDirection);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_direction_target_entity(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t targetEntityId;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityDirectionTargetEntity;
   auto argStruct = (ActionSetEntityDirectionTargetEntity*)args;

   int16_t targetEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->targetEntityId, entityId);
   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX && targetEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      auto targetEntityCenter = mapControl->getRenderableDataByMapLocalId(targetEntityIndex).center();
      auto sourceEntityCenter = renderableData.center();
      renderableData.renderFlags |= sourceEntityCenter.getRelativeDirection(targetEntityCenter);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_direction_target_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t geometryId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityDirectionTargetGeometry;
   auto argStruct = (ActionSetEntityDirectionTargetGeometry*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      auto geometry = mapControl->GetGeometry(argStruct->geometryId);
      auto relativeDirection = renderableData.center().getRelativeDirection(geometry->GetPoint(0));
      renderableData.renderFlags |= relativeDirection;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_glitched(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t entityId;
      uint8_t isGlitched;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityGlitched;
   auto argStruct = (ActionSetEntityGlitched*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.SetGlitched(argStruct->isGlitched);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_a(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateA;
   auto argStruct = (ActionSetEntityHackableStateA*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.hackableStateA = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_b(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateB;
   auto argStruct = (ActionSetEntityHackableStateB*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.hackableStateB = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_c(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateC;
   auto argStruct = (ActionSetEntityHackableStateC*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.hackableStateC = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_d(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t newValue;
      uint8_t entityId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateD;
   auto argStruct = (ActionSetEntityHackableStateD*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      entity.hackableStateD = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_a_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateAU2;
   auto argStruct = (ActionSetEntityHackableStateAU2*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      *(uint16_t*)((uint8_t*)&entity.hackableStateA) = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_c_u2(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateCU2;
   auto argStruct = (ActionSetEntityHackableStateCU2*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      *(uint16_t*)((uint8_t*)&entity.hackableStateC) = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_hackable_state_a_u4(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t newValue;
      uint8_t entityId;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateAU4;
   auto argStruct = (ActionSetEntityHackableStateAU4*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      *(uint32_t*)((uint8_t*)&entity.hackableStateA) = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_path(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t newValue;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityPath;
   auto argStruct = (ActionSetEntityPath*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      *(uint16_t*)((uint8_t*)&entity.hackableStateA) = argStruct->newValue;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_save_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t saveFlagOffset;
      uint8_t newBoolValue;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetSaveFlag;
   auto argStruct = (ActionSetSaveFlag*)args;
   auto currentSave = ROM()->GetCurrentSaveCopy();
   uint16_t byteOffset = argStruct->saveFlagOffset / 8;
   uint8_t bitOffset = argStruct->saveFlagOffset % 8;
   uint8_t currentByteValue = currentSave.saveFlags[byteOffset];

   if (argStruct->newBoolValue)
   {
      currentByteValue |= 0x01u << bitOffset;
   }
   else
   {
      // tilde operator inverts all the bits on a byte; Bitwise NOT
      currentByteValue &= ~(0x01u << bitOffset);
   }
   currentSave.saveFlags[byteOffset] = currentByteValue;
   const_cast<MageROM*>(ROM())->SetCurrentSave(currentSave);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_player_control(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t playerHasControl;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetPlayerControl;
   auto argStruct = (ActionSetPlayerControl*)args;
   //TODO FIXME: playerHasControl = argStruct->playerHasControl;
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_map_tick_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t scriptId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetMapTickScript;
   auto argStruct = (ActionSetMapTickScript*)args;

   mapControl->SetOnTick(argStruct->scriptId);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_hex_cursor_location(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t byteAddress;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetHexCursorLocation;
   auto argStruct = (ActionSetHexCursorLocation*)args;

   hexEditor->SetCursorOffset(argStruct->byteAddress);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_warp_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t stringId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetWarpState;
   auto argStruct = (ActionSetWarpState*)args;
   auto currentSave = ROM()->GetCurrentSaveCopy();

   currentSave.warpState = argStruct->stringId;
   const_cast<MageROM*>(ROM())->SetCurrentSave(currentSave);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_hex_editor_state(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t state;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetHexEditorState;
   auto argStruct = (ActionSetHexEditorState*)args;

   hexEditor->setHexEditorOn(argStruct->state);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_hex_editor_dialog_mode(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t state;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetHexEditorDialogMode;
   auto argStruct = (ActionSetHexEditorDialogMode*)args;

   if (hexEditor->getHexDialogState() != (bool)argStruct->state)
   {
      hexEditor->toggleHexDialog();
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_hex_editor_control(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t playerHasHexEditorControl;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetHexEditorControl;
   auto argStruct = (ActionSetHexEditorControl*)args;
   hexEditor->playerHasHexEditorControl = argStruct->playerHasHexEditorControl;
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_hex_editor_control_clipboard(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t playerHasClipboardControl;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetHexEditorControlClipboard;
   auto argStruct = (ActionSetHexEditorControlClipboard*)args;
   hexEditor->SetPlayerHasClipboardControl(argStruct->playerHasClipboardControl);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::load_map(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t mapId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionLoadMap;
   auto argStruct = (ActionLoadMap*)args;
   mapControl->mapLoadId = argStruct->mapId;
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::show_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t dialogId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionShowDialog;
   auto argStruct = (ActionShowDialog*)args;

   if (resumeState.totalSteps == 0)
   {
      auto& entity = mapControl->Get<MageEntityData>(entityId);
      //debug_print("Opening dialog %d\n", argStruct->dialogId);
      dialogControl->load(argStruct->dialogId, entity.name);
      resumeState.totalSteps = 1;
   }
   else if (!dialogControl->isOpen())
   {
      // will be 0 any time there is no response; no jump
      resumeState.totalSteps = 0;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::play_entity_animation(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t entityId;
      uint8_t animationId;
      uint8_t playCount;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionPlayEntityAnimation;
   auto argStruct = (ActionPlayEntityAnimation*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      if (resumeState.totalSteps == 0)
      {
         resumeState.totalSteps = argStruct->playCount;
         resumeState.remainingSteps = argStruct->playCount;
         renderableData.SetAnimation(argStruct->animationId);
         renderableData.UpdateFrom(entity);
      }
      else if (renderableData.currentFrameIndex == 0 && resumeState.geometry.currentSegmentIndex == renderableData.frameCount - 1)
      {
         // we just reset to 0
         // the previously rendered frame was the last in the animation
         resumeState.remainingSteps--;
         if (resumeState.remainingSteps == 0)
         {
            resumeState.totalSteps = 0;
            renderableData.SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
            renderableData.UpdateFrom(entity);
         }
      }
      // this is just a quick and dirty place to hold on to
      // the last frame that was rendered for this entity
      resumeState.geometry.currentSegmentIndex = renderableData.currentFrameIndex;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::teleport_entity_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t geometryId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionTeleportEntityToGeometry;
   auto argStruct = (ActionTeleportEntityToGeometry*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);

      auto geometry = mapControl->GetGeometry(argStruct->geometryId);
      auto point = geometry->GetPoint(0);

      //auto offsetPoint = EntityPoint{ entity.targetPosition.x, entity.targetPosition.y } + point;
      entity.targetPosition = point;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::walk_entity_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t geometryId;
      uint8_t entityId;
   } ActionWalkEntityToGeometry;
   auto argStruct = (ActionWalkEntityToGeometry*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      auto geometry = mapControl->GetGeometry(argStruct->geometryId);

      if (resumeState.totalSteps == 0)
      {
         //points we're interpolating between are from the entity location to the target location
         resumeState.geometry.pointA = { entity.targetPosition.x, entity.targetPosition.y };
         resumeState.geometry.pointB = geometry->GetPoint(0) - resumeState.geometry.pointA - renderableData.center();
         entity.flags |= resumeState.geometry.pointA.getRelativeDirection(resumeState.geometry.pointB);
         renderableData.SetAnimation(MAGE_WALK_ANIMATION_INDEX);
      }
      auto progress = manageProgressOfAction(resumeState, argStruct->durationMs);
      entity.targetPosition = resumeState.geometry.pointA.lerp(resumeState.geometry.pointB, progress);
      if (progress >= 1.0f)
      {
         renderableData.SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
         resumeState.totalSteps = 0;
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::walk_entity_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t geometryId;
      uint8_t entityId;
   } ActionWalkEntityAlongGeometry;
   auto argStruct = (ActionWalkEntityAlongGeometry*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex == NO_PLAYER_INDEX)
   {
      return NO_JUMP_SCRIPT;
   }

   auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
   auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
   auto geometry = mapControl->GetGeometry(argStruct->geometryId);

   entity.targetPosition = geometry->GetPoint(0);

   // handle single point geometries
   if (geometry->GetPointCount() == 1)
   {
      resumeState.totalSteps = 1;
      renderableData.UpdateFrom(entity);
      return NO_JUMP_SCRIPT;
   }

   // and for everything else...
   if (resumeState.totalSteps == 0)
   {
      const auto totalDelaySteps = uint16_t(std::chrono::milliseconds{ argStruct->durationMs } / MinTimeBetweenRenders);
      //now set the resumeState variables:
      resumeState.totalSteps = totalDelaySteps;
      resumeState.remainingSteps = totalDelaySteps;
      resumeState.geometry.length = geometry->GetPathLength();
      resumeState.geometry.lengthOfPreviousSegments = 0;
      resumeState.geometry.currentSegmentIndex = 0;
      resumeState.geometry.pointA = geometry->GetPoint(resumeState.geometry.currentSegmentIndex);
      resumeState.geometry.pointB = geometry->GetPoint(resumeState.geometry.currentSegmentIndex + 1);
      entity.flags |= resumeState.geometry.pointA.getRelativeDirection(resumeState.geometry.pointB);
      renderableData.SetAnimation(MAGE_WALK_ANIMATION_INDEX);
      return NO_JUMP_SCRIPT;
   }
   resumeState.remainingSteps--;

   if (resumeState.remainingSteps > 0)
   {
      return NO_JUMP_SCRIPT;
   }

   const auto sanitizedCurrentSegmentIndex = uint16_t{ geometry->GetLoopableGeometrySegmentIndex(resumeState.geometry.currentSegmentIndex) };
   const auto totalProgress = float{ getProgressOfAction(resumeState) };
   const auto currentProgressLength = float{ resumeState.geometry.length * totalProgress };
   const auto currentSegmentLength = float{ geometry->GetSegmentLength(sanitizedCurrentSegmentIndex) };
   const auto lengthAtEndOfCurrentSegment = float{ resumeState.geometry.lengthOfPreviousSegments + currentSegmentLength };
   const auto progressBetweenPoints = float{ (currentProgressLength - resumeState.geometry.lengthOfPreviousSegments)
       / (lengthAtEndOfCurrentSegment - resumeState.geometry.lengthOfPreviousSegments) };

   if (progressBetweenPoints > 1)
   {
      resumeState.geometry.lengthOfPreviousSegments += currentSegmentLength;
      resumeState.geometry.currentSegmentIndex++;
      /*sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeState.geometry.currentSegmentIndex);
      currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
      lengthAtEndOfCurrentSegment = resumeState.geometry.lengthOfPreviousSegments + currentSegmentLength;
      progressBetweenPoints = (currentProgressLength - resumeState.geometry.lengthOfPreviousSegments)
          / (lengthAtEndOfCurrentSegment - resumeState.geometry.lengthOfPreviousSegments);*/
      resumeState.geometry.pointA = geometry->GetPoint(resumeState.geometry.currentSegmentIndex);
      resumeState.geometry.pointB = geometry->GetPoint(resumeState.geometry.currentSegmentIndex + 1);
      entity.flags |= resumeState.geometry.pointA.getRelativeDirection(resumeState.geometry.pointB);
   }

   entity.targetPosition = resumeState.geometry.pointA.lerp(resumeState.geometry.pointB, progressBetweenPoints);
   if (resumeState.remainingSteps == 0)
   {
      resumeState.totalSteps = 0;
      renderableData.SetAnimation(MAGE_IDLE_ANIMATION_INDEX);
   }
   renderableData.UpdateFrom(entity);

   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::loop_entity_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t geometryId;
      uint8_t entityId;
   } ActionLoopEntityAlongGeometry;
   auto argStruct = (ActionLoopEntityAlongGeometry*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);
      auto geometry = mapControl->GetGeometry(argStruct->geometryId);

      // handle single point geometries
      if (geometry->GetPointCount() == 1)
      {
         resumeState.totalSteps = 1;
         entity.targetPosition = geometry->GetPoint(0) - renderableData.center() - entity.targetPosition;
         renderableData.UpdateFrom(entity);
         return NO_JUMP_SCRIPT;
      }

      // and for everything else...
      if (resumeState.totalSteps == 0)
      {
         const auto totalDelaySteps = uint16_t(std::chrono::milliseconds{ argStruct->durationMs } / MinTimeBetweenRenders);
         //now set the resumeState variables:
         resumeState.totalSteps = totalDelaySteps;
         resumeState.remainingSteps = totalDelaySteps;
         resumeState.geometry.length = /*(geometry->GetTypeId() == MageGeometryType::Polyline)
             ? geometry->GetPathLength() * 2
             : */geometry->GetPathLength();
         resumeState.geometry.lengthOfPreviousSegments = 0;
         resumeState.geometry.currentSegmentIndex = 0;
         resumeState.geometry.pointA = geometry->GetPoint(resumeState.geometry.currentSegmentIndex);
         resumeState.geometry.pointB = geometry->GetPoint(resumeState.geometry.currentSegmentIndex + 1);
         entity.flags |= resumeState.geometry.pointA.getRelativeDirection(resumeState.geometry.pointB);
         renderableData.SetAnimation(MAGE_WALK_ANIMATION_INDEX);
      }

      if (resumeState.remainingSteps == 0)
      {
         resumeState.remainingSteps = resumeState.totalSteps;

         resumeState.geometry.lengthOfPreviousSegments = 0;
         resumeState.geometry.currentSegmentIndex = 0;
         resumeState.geometry.pointA = geometry->GetPoint(resumeState.geometry.currentSegmentIndex);
         resumeState.geometry.pointB = geometry->GetPoint(resumeState.geometry.currentSegmentIndex + 1);
         entity.flags |= resumeState.geometry.pointA.getRelativeDirection(resumeState.geometry.pointB);
      }
      resumeState.remainingSteps--;
      uint16_t sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeState.geometry.currentSegmentIndex);
      const auto totalProgress = getProgressOfAction(resumeState);
      const auto currentProgressLength = resumeState.geometry.length * totalProgress;
      const auto currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
      const auto lengthAtEndOfCurrentSegment = resumeState.geometry.lengthOfPreviousSegments + currentSegmentLength;
      const auto progressBetweenPoints = (currentProgressLength - resumeState.geometry.lengthOfPreviousSegments)
         / (lengthAtEndOfCurrentSegment - resumeState.geometry.lengthOfPreviousSegments);

      if (progressBetweenPoints > 1.0f)
      {
         resumeState.geometry.lengthOfPreviousSegments += currentSegmentLength;
         resumeState.geometry.currentSegmentIndex++;

         sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeState.geometry.currentSegmentIndex);

         //currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
         //lengthAtEndOfCurrentSegment = resumeState.geometry.lengthOfPreviousSegments + currentSegmentLength;
         //progressBetweenPoints = (currentProgressLength - resumeState.geometry.lengthOfPreviousSegments)
         //    / (lengthAtEndOfCurrentSegment - resumeState.geometry.lengthOfPreviousSegments);


         resumeState.geometry.pointA = geometry->GetPoint(resumeState.geometry.currentSegmentIndex);
         resumeState.geometry.pointB = geometry->GetPoint(resumeState.geometry.currentSegmentIndex + 1);
         entity.flags |= resumeState.geometry.pointA.getRelativeDirection(resumeState.geometry.pointB);
      }
      entity.targetPosition = resumeState.geometry.pointA.lerp(resumeState.geometry.pointB, progressBetweenPoints);
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_camera_to_follow_entity(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t entityId;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetCameraToFollowEntity;
   auto argStruct = (ActionSetCameraToFollowEntity*)args;
   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   auto& renderableData = mapControl->Get<RenderableData>(sourceEntityIndex);
   frameBuffer->camera.setFollowEntity(&renderableData);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::teleport_camera_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t geometryId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionTeleportCameraToGeometry;
   auto argStruct = (ActionTeleportCameraToGeometry*)args;

   auto geometry = mapControl->GetGeometry(argStruct->geometryId);
   frameBuffer->camera.setFollowEntity(NoPlayer);
   const auto midScreen = EntityPoint{ DrawWidth / 2, DrawHeight / 2 };
   frameBuffer->camera.position.x = geometry->GetPoint(0).x - midScreen.x;
   frameBuffer->camera.position.y = geometry->GetPoint(0).y - midScreen.y;
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::pan_camera_to_entity(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint8_t entityId;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionPanCameraToEntity;
   auto argStruct = (ActionPanCameraToEntity*)args;

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      auto& renderableData = mapControl->getRenderableDataByMapLocalId(sourceEntityIndex);

      if (resumeState.totalSteps == 0)
      {
         frameBuffer->camera.setFollowEntity(NoPlayer);
         //this is the points we're interpolating between
         // TODO: subtract the tile corner's offset so that geometry is c
         //resumeState.geometry.pointA = frameBuffer->camera.position;
      }
      auto progress = manageProgressOfAction(resumeState, argStruct->durationMs);
      // yes, this is intentional;
      // if the entity is moving, pan will continue to the entity
      resumeState.geometry.pointB = { (uint16_t)(renderableData.center().x - DrawWidth / 2), (uint16_t)(renderableData.center().y - DrawHeight / 2) };
      auto betweenPoint = resumeState.geometry.pointA.lerp(resumeState.geometry.pointB, progress);
      frameBuffer->camera.position.x = betweenPoint.x;
      frameBuffer->camera.position.y = betweenPoint.y;
      if (progress >= 1.0f)
      {
         // Moved the camera there, may as well follow the entity now.
         frameBuffer->camera.setFollowEntity(&mapControl->Get<RenderableData>(sourceEntityIndex));
      }
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::pan_camera_to_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t geometryId;
      uint8_t paddingG;
   } ActionPanCameraToGeometry;
   auto argStruct = (ActionPanCameraToGeometry*)args;

   auto& entity = mapControl->Get<MageEntityData>(entityId);
   auto geometry = mapControl->GetGeometry(argStruct->geometryId);

   if (resumeState.totalSteps == 0)
   {
      frameBuffer->camera.setFollowEntity(NoPlayer);
      //this is the points we're interpolating between
      resumeState.geometry.pointA = {
         frameBuffer->camera.position.x,
         frameBuffer->camera.position.y,
      };
      resumeState.geometry.pointB = geometry->GetPoint(0) - (uint16_t)(DrawWidth / 2);
   }
   auto progress = manageProgressOfAction(resumeState, argStruct->durationMs);

   auto betweenPoint = resumeState.geometry.pointA.lerp(resumeState.geometry.pointB, progress);
   frameBuffer->camera.position.x = betweenPoint.x;
   frameBuffer->camera.position.y = betweenPoint.y;
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::pan_camera_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t geometryId;
      uint8_t paddingG;
   } ActionPanCameraAlongGeometry;
   auto argStruct = (ActionPanCameraAlongGeometry*)args;

   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::loop_camera_along_geometry(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t geometryId;
      uint8_t paddingG;
   } ActionLoopCameraAlongGeometry;
   auto argStruct = (ActionLoopCameraAlongGeometry*)args;

   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_screen_shake(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t durationMs;
      uint16_t frequency;
      uint8_t amplitude;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetScreenShake;
   auto argStruct = (ActionSetScreenShake*)args;

   auto progress = manageProgressOfAction(resumeState, argStruct->durationMs);

   if (progress < 1.0f)
   {
      frameBuffer->camera.shaking = true;
      frameBuffer->camera.shakeAmplitude = argStruct->amplitude;
      frameBuffer->camera.shakePhase = (progress * (float)argStruct->frequency) / 1000.0f;
   }
   else
   {
      frameBuffer->camera.shaking = false;
      frameBuffer->camera.shakeAmplitude = 0;
      frameBuffer->camera.shakePhase = 0;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::screen_fade_out(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t color;
      uint8_t paddingG;
   } ActionScreenFadeOut;
   auto argStruct = (ActionScreenFadeOut*)args;

   auto progress = manageProgressOfAction(resumeState, argStruct->durationMs);

   frameBuffer->SetFade(argStruct->color, progress);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::screen_fade_in(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint32_t durationMs;
      uint16_t color;
      uint8_t paddingG;
   } ActionScreenFadeIn;

   auto argStruct = (ActionScreenFadeIn*)args;
   auto progress = manageProgressOfAction(resumeState, argStruct->durationMs);
   frameBuffer->SetFade(argStruct->color, 1.0f - progress);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::mutate_variable(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t value;
      uint8_t variableId;
      MageMutateOperation operation;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionMutateVariable;

   // I wanted to log some stats on how well our random function worked
   // on desktop and hardware after the new random seed changes.
   // Works really well on both. Can use this again if we need.
   //if(argStruct->operation == RNG) {
   //	uint16_t samples = 65000;
   //	uint16_t testVar = 0;
   //	uint16_t range = argStruct->value + 1; // to make verify it only goes 0~(n-1), not 0~n
   //	uint16_t values[range];
   //	for (int i = 0; i < range; ++i) {
   //		values[i] = 0;
   //	}
   //	for (int i = 0; i < samples; ++i) {
   //		mutate(
   //			argStruct->operation,
   //			&testVar,
   //			argStruct->value
   //);
   //		values[testVar] += 1;
   //	}
   //	for (int i = 0; i < range; ++i) {
   //		debug_print(
   //			"%05d: %05d",
   //			i,
   //			values[i]
   //);
   //	}
   //}
   auto argStruct = (ActionMutateVariable*)args;
   auto currentSave = ROM()->GetCurrentSaveCopy();
   mutate(argStruct->operation, currentSave.scriptVariables[argStruct->variableId], argStruct->value);
   const_cast<MageROM*>(ROM())->SetCurrentSave(currentSave);

   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::mutate_variables(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t variableId;
      uint8_t sourceId;
      MageMutateOperation operation;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionMutateVariables;
   auto argStruct = (ActionMutateVariables*)args;
   auto currentSave = ROM()->GetCurrentSaveCopy();
   mutate(argStruct->operation, currentSave.scriptVariables[argStruct->variableId], currentSave.scriptVariables[argStruct->sourceId]);
   const_cast<MageROM*>(ROM())->SetCurrentSave(currentSave);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::copy_variable(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t variableId;
      uint8_t entityId;
      MageEntityFieldOffset field;
      uint8_t inbound;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCopyVariable;
   auto argStruct = (ActionCopyVariable*)args;
   auto currentSave = ROM()->GetCurrentSaveCopy();
   auto currentValue = &currentSave.scriptVariables[argStruct->variableId];

   int16_t sourceEntityIndex = mapControl->GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, entityId);
   if (sourceEntityIndex != NO_PLAYER_INDEX)
   {
      auto& entity = mapControl->Get<MageEntityData>(sourceEntityIndex);
      auto& variableValue = currentSave.scriptVariables[argStruct->variableId];
      uint8_t* fieldValue = ((uint8_t*)&entity) + (uint8_t)argStruct->field;

      switch (argStruct->field)
      {
      case MageEntityFieldOffset::x:
      case MageEntityFieldOffset::y:
      case MageEntityFieldOffset::onInteractScriptId:
      case MageEntityFieldOffset::onTickScriptId:
      case MageEntityFieldOffset::primaryId:
      case MageEntityFieldOffset::secondaryId:
         if (argStruct->inbound)
         {
            variableValue = (uint16_t)*fieldValue;
         }
         else
         {
            uint16_t* destination = (uint16_t*)fieldValue;
            *destination = variableValue;
         }
         break;
      case MageEntityFieldOffset::primaryIdType:
      case MageEntityFieldOffset::currentAnimation:
      case MageEntityFieldOffset::currentFrame:
      case MageEntityFieldOffset::direction:
      case MageEntityFieldOffset::hackableStateA:
      case MageEntityFieldOffset::hackableStateB:
      case MageEntityFieldOffset::hackableStateC:
      case MageEntityFieldOffset::hackableStateD:
         if (argStruct->inbound)
         {
            variableValue = (uint8_t)*fieldValue;
         }
         else
         {
            *fieldValue = variableValue % 256;
         }
         break;
      default: debug_print("copyVariable received an invalid field: %d", argStruct->field);
      }
   }
   const_cast<MageROM*>(ROM())->SetCurrentSave(currentSave);
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_variable(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t value;
      uint8_t variableId;
      MageCheckComparison comparison;
      uint8_t expectedBool;
   } ActionCheckVariable;
   auto argStruct = (ActionCheckVariable*)args;
   auto& currentSave = ROM()->GetCurrentSave();
   uint16_t variableValue = currentSave.scriptVariables[argStruct->variableId];
   bool comparison = compare(argStruct->comparison, variableValue, argStruct->value);
   if (comparison == (bool)argStruct->expectedBool)
   {
      return argStruct->successScriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_variables(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t variableId;
      uint8_t sourceId;
      MageCheckComparison comparison;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckVariables;
   auto argStruct = (ActionCheckVariables*)args;

   auto& currentSave = ROM()->GetCurrentSave();
   uint16_t variableValue = currentSave.scriptVariables[argStruct->variableId];
   uint16_t sourceValue = currentSave.scriptVariables[argStruct->sourceId];
   bool comparison = compare(
      argStruct->comparison,
      variableValue,
      sourceValue);
   if (comparison == (bool)argStruct->expectedBool)
   {
      return argStruct->successScriptId;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::slot_save(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t paddingA;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSlotSave;
   auto argStruct = (ActionSlotSave*)args;
   // In the case that someone hacks an on_tick script to save, we don't want it
   // just burning through 8 ROM writes per second, our chip would be fried in a
   // matter on minutes. So how do we counter? Throw up a "Save Completed" dialog
   // that FORCES user interaction to advance from. A player encountering like 10
   // of these dialogs right in a row should hopefully get the hint and reset
   // their board to get out of that dialog lock. Better to protect the player
   // with an annoying confirm dialog than allowing them to quietly burn through
   // the ROM chip's 10000 write cycles.
   if (resumeState.totalSteps == 0)
   {
      auto playerEntity = mapControl->getPlayerEntityData();
      auto currentSave = ROM()->GetCurrentSaveCopy();
      if (playerEntity)
      {
         auto playerName = playerEntity->name;
         for (auto i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
         {
            // copy the player name and fill remaining space with 0
            if (playerName[i])
            {
               currentSave.name[i] = playerName[i];
            }
            else
            {
               while (i < MAGE_ENTITY_NAME_LENGTH)
               {
                  currentSave.name[i++] = 0;
               }
            }
         }
         //TODO FIXME: 
         // ROM()->WriteSaveSlot(currentSaveIndex, currentSave.get());
         // readSaveFromRomIntoRam(currentSaveIndex);

      }
      //debug_print("Opening dialog %d\n", argStruct->dialogId);
      dialogControl->StartModalDialog("Save complete.");
      resumeState.totalSteps = 1;
      const_cast<MageROM*>(ROM())->SetCurrentSave(currentSave);
   }
   else if (!dialogControl->isOpen())
   {
      resumeState.totalSteps = 0;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::slot_load(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t slotIndex;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSlotLoad;
   auto argStruct = (ActionSlotLoad*)args;
   auto& currentSave = ROM()->GetCurrentSave();
   //delaying until next tick allows for displaying of an error message on read before resuming
   if (resumeState.totalSteps == 0)
   {
      const_cast<MageROM*>(ROM())->LoadSaveSlot(argStruct->slotIndex);
      mapControl->mapLoadId = currentSave.currentMapId;
      mapControl->Load();
      resumeState.totalSteps = 1;
   }
   else if (!dialogControl->isOpen())
   {
      resumeState.totalSteps = 0;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::slot_erase(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t slotIndex;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSlotErase;
   auto argStruct = (ActionSlotErase*)args;
   // In the case that someone hacks an on_tick script to save, we don't want it
   // just burning through 8 ROM writes per second, our chip would be fried in a
   // matter on minutes. So how do we counter? Throw up a "Save Completed" dialog
   // that FORCES user interaction to advance from. A player encountering like 10
   // of these dialogs right in a row should hopefully get the hint and reset
   // their board to get out of that dialog lock. Better to protect the player
   // with an annoying confirm dialog than allowing them to quietly burn through
   // the ROM chip's 10000 write cycles.
   if (resumeState.totalSteps == 0)
   {
      // TODO FIXME:
      // setCurrentSaveToFreshState();

      // do rom writes
      //copyNameToAndFromPlayerAndSave(true);
      //auto playerName = mapControl->getPlayerEntityData()->name;
      //memcpy(currentSave.name, playerName.c_str(), MAGE_ENTITY_NAME_LENGTH < playerName.length() ? MAGE_ENTITY_NAME_LENGTH : playerName.length());
      //ROM()->WriteSaveSlot(argStruct->slotIndex, &currentSave);
      const_cast<MageROM*>(ROM())->LoadSaveSlot(argStruct->slotIndex);

      //debug_print("Opening dialog %d\n", argStruct->dialogId);
      dialogControl->StartModalDialog("Save erased.");
      resumeState.totalSteps = 1;
   }
   else if (!dialogControl->isOpen())
   {
      resumeState.totalSteps = 0;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_connect_serial_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t serialDialogId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetConnectSerialDialog;
   ActionSetConnectSerialDialog* argStruct = (ActionSetConnectSerialDialog*)args;
   commandControl->connectSerialDialogId = argStruct->serialDialogId;
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::show_serial_dialog(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t serialDialogId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionShowSerialDialog;
   auto argStruct = (ActionShowSerialDialog*)args;
   if (resumeState.totalSteps == 0)
   {
      commandControl->showSerialDialog(argStruct->serialDialogId);
      if (commandControl->isInputTrapped)
      {
         resumeState.totalSteps = 1;
      }
   }
   else if (!commandControl->isInputTrapped)
   {
      resumeState.totalSteps = 0;
   }
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::inventory_get(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t itemId;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionInventoryGet;
   auto argStruct = (ActionInventoryGet*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::inventory_drop(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t itemId;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionInventoryDrop;
   auto argStruct = (ActionInventoryDrop*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_inventory(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t itemId;
      uint8_t expectedBool;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckInventory;
   auto argStruct = (ActionCheckInventory*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_map_look_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t scriptId;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetMapLookScript;
   auto argStruct = (ActionSetMapLookScript*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_entity_look_script(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t scriptId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityLookScript;
   auto argStruct = (ActionSetEntityLookScript*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_teleport_enabled(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t value;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetTeleportEnabled;
   auto argStruct = (ActionSetTeleportEnabled*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_map(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t mapId;
      uint8_t expectedBool;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckMap;
   auto argStruct = (ActionCheckMap*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::set_ble_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint8_t bleFlagOffset;
      uint8_t newBoolValue;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetBleFlag;
   auto argStruct = (ActionSetBleFlag*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

std::optional<uint16_t> MageScriptActions::check_ble_flag(const uint8_t* args, MageScriptState& resumeState, uint8_t entityId)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t bleFlagOffset;
      uint8_t expectedBoolValue;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckBleFlag;
   auto argStruct = (ActionCheckBleFlag*)args;
   // TODO: implement this
   return NO_JUMP_SCRIPT;
}

float MageScriptActions::manageProgressOfAction(MageScriptState& resumeState, uint32_t durationMs) const
{
   resumeState.remainingSteps--;
   if (resumeState.totalSteps == 0)
   {
      const auto totalDelaySteps = uint16_t(std::chrono::milliseconds{ durationMs } / MinTimeBetweenRenders);
      resumeState.totalSteps = totalDelaySteps;
      resumeState.remainingSteps = totalDelaySteps;
   }

   if (resumeState.remainingSteps <= 0)
   {
      resumeState.totalSteps = 0;
      resumeState.remainingSteps = 0;
   }
   return resumeState.totalSteps - resumeState.remainingSteps;
}

void MageScriptActions::mutate(MageMutateOperation operation, uint16_t& destination, uint16_t value)
{
   //protect against division by 0 errors
   uint16_t safeValue = value == 0 ? 1 : value;
   switch (operation)
   {
   case MageMutateOperation::SET: destination = value; break;
   case MageMutateOperation::ADD: destination += value; break;
   case MageMutateOperation::SUB: destination -= value; break;
   case MageMutateOperation::DIV: destination /= safeValue; break;
   case MageMutateOperation::MUL: destination *= value; break;
   case MageMutateOperation::MOD: destination %= safeValue; break;
   case MageMutateOperation::RNG: destination = rand() % safeValue; break;
   default: debug_print(
      "mutateVariable received an invalid operation: %d",
      operation);
   }
}

bool MageScriptActions::compare(MageCheckComparison comparison, uint16_t a, uint16_t b)
{
   switch (comparison)
   {
   case LT: return a < b;
   case LTEQ: return a <= b;
   case EQ: return a == b;
   case GTEQ: return a >= b;
   case GT: return a > b;
   default:
      debug_print("checkComparison received an invalid comparison: %d", comparison);
      return false;
   }
}
