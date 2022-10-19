#include "mage_script_actions.h"
#include "mage_entity_type.h"
#include "EngineInput.h"
#include "mage_script_control.h"
#include "mage_dialog_control.h"
#include "mage_command_control.h"
#include "convert_endian.h"
#include "utility.h"

void MageScriptActions::Run(uint8_t actionId, uint8_t* args, MageScriptState* resumeStateStruct)
{
   auto action = actionFunctions[actionId];
   (this->*action)(args, resumeStateStruct);
}

int16_t MageScriptActions::GetUsefulEntityIndexFromActionEntityId(uint8_t entityId, int16_t callingEntityId)
{
   int16_t entityIndex = entityId;
   if (entityIndex == MAGE_ENTITY_SELF)
   {
      entityIndex = callingEntityId;
   }
   else if (entityIndex == MAGE_ENTITY_PLAYER)
   {
      entityIndex = gameEngine->gameControl->playerEntityIndex;
   }
   if (entityIndex == MAGE_MAP_ENTITY)
   {
      //target is the map itself, leave the value alone
   }
   else if (entityIndex >= gameEngine->gameControl->Map()->FilteredEntityCount())
   {
      //if it targets one of the debug entities filtered off the end of the list,
      //treat it like it's not there:
      entityIndex = NO_PLAYER;
   }
   return entityIndex;
}


void MageScriptActions::action_null_action(uint8_t* args, MageScriptState* resumeStateStruct)
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
   } ActionNullAction;
   //nullAction does nothing.
}

void MageScriptActions::action_check_entity_name(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t stringId;
      uint8_t entityId;
      uint8_t expectedBoolValue;
      uint8_t paddingG;
   } ActionCheckEntityName;
   auto* argStruct = (ActionCheckEntityName*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      std::string romString = gameEngine->gameControl->getString(argStruct->stringId, gameEngine->scriptControl->currentEntityId);
      std::string entityName = gameEngine->gameControl->getEntityNameStringById(entityIndex);
      // DO NOT try to do an == comparison on these two C++ strings because
      // the extra null values at the end of the entity name cause fail
      int compare = strcmp(entityName.c_str(), romString.c_str());
      bool identical = compare == 0;
      if (identical == (bool)argStruct->expectedBoolValue)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_x(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityX;
   auto* argStruct = (ActionCheckEntityX*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->location.x == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_y(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityY;
   auto* argStruct = (ActionCheckEntityY*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->location.y == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_interact_script(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedScript;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityInteractScript;
   auto* argStruct = (ActionCheckEntityInteractScript*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->onInteractScriptId == argStruct->expectedScript);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_tick_script(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedScript;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityTickScript;
   auto* argStruct = (ActionCheckEntityTickScript*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->onTickScriptId == argStruct->expectedScript);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_type(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t entityTypeId;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityType;
   auto* argStruct = (ActionCheckEntityType*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t sanitizedEntityTypeId = gameEngine->gameControl->getValidEntityTypeId(entity->primaryId);
      bool identical = (
         sanitizedEntityTypeId == argStruct->entityTypeId &&
         entity->primaryIdType == ENTITY_TYPE
         );
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_primary_id(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityPrimaryId;
   auto* argStruct = (ActionCheckEntityPrimaryId*)args;
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, gameEngine->scriptControl->currentEntityId);
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t sizeLimit{ 1 };
      uint8_t sanitizedPrimaryType = entity->primaryIdType % NUM_PRIMARY_ID_TYPES;

      if (sanitizedPrimaryType == MageEntityPrimaryIdType::ENTITY_TYPE) { sizeLimit = gameEngine->gameControl->entityTypes.size(); }
      else if (sanitizedPrimaryType == MageEntityPrimaryIdType::ANIMATION) { sizeLimit = gameEngine->gameControl->animations.size(); }
      else if (sanitizedPrimaryType == MageEntityPrimaryIdType::TILESET) { sizeLimit = gameEngine->gameControl->tileManager->getTilesetCount(); }
      else { throw std::runtime_error{ "Sanitized Primary Type Unknown" }; }

      bool identical = ((entity->primaryId % sizeLimit) == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_secondary_id(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntitySecondaryId;
   auto* argStruct = (ActionCheckEntitySecondaryId*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t sizeLimit = 1;
      uint8_t sanitizedPrimaryType = entity->primaryIdType % NUM_PRIMARY_ID_TYPES;
      if (sanitizedPrimaryType == MageEntityPrimaryIdType::ENTITY_TYPE) { sizeLimit = 1; }
      if (sanitizedPrimaryType == MageEntityPrimaryIdType::ANIMATION) { sizeLimit = 1; }
      if (sanitizedPrimaryType == MageEntityPrimaryIdType::TILESET)
      {
         auto tileset = gameEngine->gameControl->tileManager->GetTileset(entity->primaryId);
         sizeLimit = tileset->Tiles();
      }
      bool identical = ((entity->secondaryId % sizeLimit) == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_primary_id_type(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityPrimaryIdType;
   auto* argStruct = (ActionCheckEntityPrimaryIdType*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint8_t sanitizedPrimaryType = entity->primaryIdType % NUM_PRIMARY_ID_TYPES;
      bool identical = (sanitizedPrimaryType == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_current_animation(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityCurrentAnimation;
   auto* argStruct = (ActionCheckEntityCurrentAnimation*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->currentAnimation == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_current_frame(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityCurrentFrame;
   auto* argStruct = (ActionCheckEntityCurrentFrame*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->currentFrameIndex == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_direction(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityDirection;
   auto* argStruct = (ActionCheckEntityDirection*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->direction == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_glitched(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionCheckEntityGlitched*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      if (entity->direction & RENDER_FLAGS_IS_GLITCHED)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_a(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateA;
   auto* argStruct = (ActionCheckEntityHackableStateA*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->hackableStateA == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_b(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateB;
   auto* argStruct = (ActionCheckEntityHackableStateB*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->hackableStateB == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_c(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateC;
   auto* argStruct = (ActionCheckEntityHackableStateC*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->hackableStateC == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_d(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint8_t entityId;
      uint8_t expectedValue;
      uint8_t expectedBool;
      uint8_t paddingG;
   } ActionCheckEntityHackableStateD;
   auto* argStruct = (ActionCheckEntityHackableStateD*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      bool identical = (entity->hackableStateD == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_a_u2(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
   } ActionCheckEntityHackableStateAU2;
   auto* argStruct = (ActionCheckEntityHackableStateAU2*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t u2_value = ROM_ENDIAN_U2_VALUE(
         *(uint16_t*)((uint8_t*)&entity->hackableStateA)
      );
      bool identical = (u2_value == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_c_u2(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
   } ActionCheckEntityHackableStateCU2;
   auto* argStruct = (ActionCheckEntityHackableStateCU2*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t u2_value = ROM_ENDIAN_U2_VALUE(
         *(uint16_t*)((uint8_t*)&entity->hackableStateC)
      );
      bool identical = (u2_value == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_hackable_state_a_u4(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t expectedValue;
      uint16_t successScriptId;
      uint8_t entityId;
   } ActionCheckEntityHackableStateAU4;
   auto* argStruct = (ActionCheckEntityHackableStateAU4*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->expectedValue = ROM_ENDIAN_U4_VALUE(argStruct->expectedValue);
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint32_t u4_value = ROM_ENDIAN_U4_VALUE(
         *(uint32_t*)((uint8_t*)&entity->hackableStateA)
      );
      if (u4_value == argStruct->expectedValue)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_entity_path(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t expectedValue;
      uint8_t entityId;
      uint8_t expectedBool;
   } ActionCheckEntityPath;
   auto* argStruct = (ActionCheckEntityPath*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t pathId = ROM_ENDIAN_U2_VALUE(
         *(uint16_t*)((uint8_t*)&entity->hackableStateA)
      );
      bool identical = (pathId == argStruct->expectedValue);
      if (identical == (bool)argStruct->expectedBool)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_save_flag(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t saveFlagOffset;
      uint8_t expectedBoolValue;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckSaveFlag;
   auto* argStruct = (ActionCheckSaveFlag*)args;
   //endianness conversion for arguments larger than 1 byte:
         uint16_t byteOffset = argStruct->saveFlagOffset / 8;
   uint8_t bitOffset = argStruct->saveFlagOffset % 8;
   uint8_t currentByteValue = gameEngine->gameControl->currentSave.saveFlags[byteOffset];
   bool bitValue = (currentByteValue >> bitOffset) & 0x01u;

   if (bitValue == (bool)argStruct->expectedBoolValue)
   {
      gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
   }
}

void MageScriptActions::action_check_if_entity_is_in_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t geometryId;
      uint8_t entityId;
      uint8_t expectedBoolValue;
      uint8_t paddingG;
   } ActionCheckifEntityIsInGeometry;
   auto* argStruct = (ActionCheckifEntityIsInGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, gameEngine->scriptControl->currentEntityId);
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);

      bool colliding = geometry->isPointInGeometry(renderable->center);
      if (colliding == (bool)argStruct->expectedBoolValue)
      {
         gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
      }
   }
}

void MageScriptActions::action_check_for_button_press(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionCheckForButtonPress*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   auto button_activated = gameEngine->inputHandler->GetButtonActivatedState((KeyPress)argStruct->buttonId);
   if (button_activated)
   {
      gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
   }
}

void MageScriptActions::action_check_for_button_state(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionCheckForButtonState*)args;
   //endianness conversion for arguments larger than 1 byte:
      auto button_state = gameEngine->inputHandler->GetButtonState((KeyPress)argStruct->buttonId);
   if (button_state == (bool)(argStruct->expectedBoolValue))
   {
      gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
   }
}

void MageScriptActions::action_check_warp_state(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t stringId;
      uint8_t expectedBoolValue;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckWarpState;
   auto* argStruct = (ActionCheckWarpState*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   bool doesWarpStateMatch = gameEngine->gameControl->currentSave.warpState == argStruct->stringId;
   if (doesWarpStateMatch == (bool)(argStruct->expectedBoolValue))
   {
      gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
   }
}

void MageScriptActions::action_run_script(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionRunScript*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   gameEngine->scriptControl->jumpScriptId = argStruct->scriptId;
}

void MageScriptActions::action_blocking_delay(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionBlockingDelay;
   auto* argStruct = (ActionBlockingDelay*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

   //If there's already a total number of loops to next action set, a delay is currently in progress:
   if (resumeStateStruct->totalLoopsToNextAction != 0)
   {
      //decrement the number of loops to the end of the delay:
      resumeStateStruct->loopsToNextAction--;
      //if we've reached the end:
      if (resumeStateStruct->loopsToNextAction <= 0)
      {
         //reset the variables and return, the delay is complete.
         resumeStateStruct->totalLoopsToNextAction = 0;
         resumeStateStruct->loopsToNextAction = 0;
         return;
      }
   }
   //a delay is not active, so we should start one:
   else
   {
      //always a single loop for a blocking delay. On the next action call, (after rendering all current changes) it will continue.
      uint16_t totalDelayLoops = 1;
      //also set the blocking delay time to the larger of the current blockingDelayTime, or argStruct->duration:
      gameEngine->scriptControl->blockingDelayTime = (gameEngine->scriptControl->blockingDelayTime < argStruct->duration)
         ? argStruct->duration
         : gameEngine->scriptControl->blockingDelayTime;
      //now set the resumeStateStruct variables:
      resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
      resumeStateStruct->loopsToNextAction = totalDelayLoops;
   }
}

void MageScriptActions::action_non_blocking_delay(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionNonBlockingDelay;
   auto* argStruct = (ActionNonBlockingDelay*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

   manageProgressOfAction(
      resumeStateStruct,
      argStruct->duration
   );
}

void MageScriptActions::action_set_entity_name(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityName*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   //get the string from the stringId:
   std::string romString = gameEngine->gameControl->getString(argStruct->stringId, gameEngine->scriptControl->currentEntityId);
   //Get the entity:
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      //simple loop to set the name:
      for (int i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         entity->name[i] = romString[i];
         if (romString[i] == 00)
         {
            // if we have hit one null, fill in the remainder with null too
            for (int j = i + 1; j < MAGE_ENTITY_NAME_LENGTH; j++)
            {
               entity->name[j] = 00;
            }
            break;
         }
      }
   }
}

void MageScriptActions::action_set_entity_x(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityX*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->location.x = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_y(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityY*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->location.y = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_interact_script(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityInteractScript*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   gameEngine->scriptControl->setEntityScript(
      argStruct->scriptId,
      GetUsefulEntityIndexFromActionEntityId(
         argStruct->entityId,
         gameEngine->scriptControl->currentEntityId
      ),
      ON_INTERACT
   );
}

void MageScriptActions::action_set_entity_tick_script(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityTickScript*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   gameEngine->scriptControl->setEntityScript(
      argStruct->scriptId,
      entityIndex,
      ON_TICK
   );
}

void MageScriptActions::action_set_entity_type(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityType*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->primaryId = argStruct->entityTypeId;
      entity->primaryIdType = ENTITY_TYPE;
   }
}

void MageScriptActions::action_set_entity_primary_id(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityPrimaryId*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->primaryId = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_secondary_id(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntitySecondaryId*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->secondaryId = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_primary_id_type(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityPrimaryIdType*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->primaryIdType = (MageEntityPrimaryIdType)(argStruct->newValue % NUM_PRIMARY_ID_TYPES);
   }
}

void MageScriptActions::action_set_entity_current_animation(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityCurrentAnimation*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, gameEngine->scriptControl->currentEntityId);
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      entity->currentAnimation = argStruct->newValue;
      entity->currentFrameIndex = 0;
      renderable->currentFrameTicks = 0;
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_current_frame(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityCurrentFrame*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      entity->currentFrameIndex = argStruct->newValue;
      renderable->currentFrameTicks = 0;
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_direction(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityDirection*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->direction = gameEngine->gameControl->updateDirectionAndPreserveFlags(
         argStruct->direction,
         entity->direction
      );
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_direction_relative(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityDirectionRelative*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->direction = gameEngine->gameControl->updateDirectionAndPreserveFlags(
         (MageEntityAnimationDirection)((entity->direction + argStruct->relativeDirection + NUM_DIRECTIONS) % NUM_DIRECTIONS),
         entity->direction
      );
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_direction_target_entity(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityDirectionTargetEntity*)args;

   int16_t targetEntityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->targetEntityId,
      gameEngine->scriptControl->currentEntityId
   );
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (
      entityIndex != NO_PLAYER
      && targetEntityIndex != NO_PLAYER
      )
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      MageEntity* targetEntity = gameEngine->gameControl->getEntityByMapLocalId(targetEntityIndex);
      auto renderable = entity->getRenderableData();
      auto targetRenderable = targetEntity->getRenderableData();
      entity->direction = gameEngine->gameControl->updateDirectionAndPreserveFlags(
         getRelativeDirection(
            renderable->center,
            targetRenderable->center
         ),
         entity->direction
      );
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_direction_target_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t targetGeometryId;
      uint8_t entityId;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityDirectionTargetGeometry;
   auto* argStruct = (ActionSetEntityDirectionTargetGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      auto geometry = gameEngine->gameControl->getGeometry(argStruct->targetGeometryId);

      entity->direction = gameEngine->gameControl->updateDirectionAndPreserveFlags(
         getRelativeDirection(
            renderable->center,
            geometry->getPoints()[0]
         ),
         entity->direction
      );
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_glitched(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityGlitched*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->direction = (MageEntityAnimationDirection)(
         (entity->direction & RENDER_FLAGS_IS_GLITCHED_MASK)
         | (argStruct->isGlitched * RENDER_FLAGS_IS_GLITCHED)
         );
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_entity_hackable_state_a(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityHackableStateA*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->hackableStateA = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_hackable_state_b(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityHackableStateB*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->hackableStateB = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_hackable_state_c(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityHackableStateC*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->hackableStateC = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_hackable_state_d(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityHackableStateD*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      entity->hackableStateD = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_hackable_state_a_u2(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityHackableStateAU2*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      *(uint16_t*)((uint8_t*)&entity->hackableStateA) = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_hackable_state_c_u2(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityHackableStateCU2*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      *(uint16_t*)((uint8_t*)&entity->hackableStateC) = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_hackable_state_a_u4(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t newValue;
      uint8_t entityId;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetEntityHackableStateAU4;
   auto* argStruct = (ActionSetEntityHackableStateAU4*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->newValue = ROM_ENDIAN_U4_VALUE(argStruct->newValue);

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, gameEngine->scriptControl->currentEntityId);
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      *(uint32_t*)((uint8_t*)&entity->hackableStateA) = argStruct->newValue;
   }
}

void MageScriptActions::action_set_entity_path(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityPath*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      *(uint16_t*)((uint8_t*)&entity->hackableStateA) = argStruct->newValue;
   }
}

void MageScriptActions::action_set_save_flag(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetSaveFlag*)args;
      uint16_t byteOffset = argStruct->saveFlagOffset / 8;
   uint8_t bitOffset = argStruct->saveFlagOffset % 8;
   uint8_t currentByteValue = gameEngine->gameControl->currentSave.saveFlags[byteOffset];

   if (argStruct->newBoolValue)
   {
      currentByteValue |= 0x01u << bitOffset;
   }
   else
   {
      // tilde operator inverts all the bits on a byte; Bitwise NOT
      currentByteValue &= ~(0x01u << bitOffset);
   }
   gameEngine->gameControl->currentSave.saveFlags[byteOffset] = currentByteValue;
}

void MageScriptActions::action_set_player_control(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetPlayerControl*)args;
   gameEngine->gameControl->playerHasControl = argStruct->playerHasControl;
}

void MageScriptActions::action_set_map_tick_script(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetMapTickScript*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   gameEngine->scriptControl->setEntityScript(
      argStruct->scriptId,
      MAGE_MAP_ENTITY,
      ON_TICK
   );
}

void MageScriptActions::action_set_hex_cursor_location(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetHexCursorLocation*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   gameEngine->hexEditor->setHexCursorLocation(argStruct->byteAddress);
}

void MageScriptActions::action_set_warp_state(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetWarpState*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   gameEngine->gameControl->currentSave.warpState = argStruct->stringId;
}

void MageScriptActions::action_set_hex_editor_state(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetHexEditorState*)args;

   if (gameEngine->hexEditor->isHexEditorOn() != (bool)argStruct->state)
   {
      gameEngine->hexEditor->toggleHexEditor();
   }
}

void MageScriptActions::action_set_hex_editor_dialog_mode(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetHexEditorDialogMode*)args;

   if (gameEngine->hexEditor->getHexDialogState() != (bool)argStruct->state)
   {
      gameEngine->hexEditor->toggleHexDialog();
   }
}

void MageScriptActions::action_set_hex_editor_control(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetHexEditorControl*)args;
   gameEngine->gameControl->playerHasHexEditorControl = argStruct->playerHasHexEditorControl;
}

void MageScriptActions::action_set_hex_editor_control_clipboard(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint8_t playerHasHexEditorControlClipboard;
      uint8_t paddingB;
      uint8_t paddingC;
      uint8_t paddingD;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetHexEditorControlClipboard;
   auto* argStruct = (ActionSetHexEditorControlClipboard*)args;
   gameEngine->gameControl->playerHasHexEditorControlClipboard = argStruct->playerHasHexEditorControlClipboard;
}

void MageScriptActions::action_load_map(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionLoadMap*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   gameEngine->scriptControl->mapLoadId = argStruct->mapId;
}

void MageScriptActions::action_show_dialog(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionShowDialog*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      //debug_print("Opening dialog %d\n", argStruct->dialogId);
      gameEngine->gameControl->dialogControl->load(argStruct->dialogId, gameEngine->scriptControl->currentEntityId);
      resumeStateStruct->totalLoopsToNextAction = 1;
   }
   else if (!gameEngine->gameControl->dialogControl->isOpen())
   {
      // will be 0 any time there is no response; no jump
      resumeStateStruct->totalLoopsToNextAction = 0;
   }
}

void MageScriptActions::action_play_entity_animation(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionPlayEntityAnimation*)args;

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      if (resumeStateStruct->totalLoopsToNextAction == 0)
      {
         resumeStateStruct->totalLoopsToNextAction = argStruct->playCount;
         resumeStateStruct->loopsToNextAction = argStruct->playCount;
         entity->currentAnimation = argStruct->animationId;
         entity->currentFrameIndex = 0;
         renderable->currentFrameTicks = 0;
         gameEngine->gameControl->updateEntityRenderableData(entityIndex);
      }
      else if (
         // we just reset to 0
         entity->currentFrameIndex == 0
         // the previously rendered frame was the last in the animation
         && resumeStateStruct->currentSegmentIndex == (renderable->frameCount - 1)
         )
      {
         resumeStateStruct->loopsToNextAction--;
         if (resumeStateStruct->loopsToNextAction == 0)
         {
            resumeStateStruct->totalLoopsToNextAction = 0;
            entity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
            entity->currentFrameIndex = 0;
            renderable->currentFrameTicks = 0;
            gameEngine->gameControl->updateEntityRenderableData(entityIndex);
         }
      }
      // this is just a quick and dirty place to hold on to
      // the last frame that was rendered for this entity
      resumeStateStruct->currentSegmentIndex = entity->currentFrameIndex;
   }
}

void MageScriptActions::action_teleport_entity_to_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionTeleportEntityToGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);

      auto offsetPoint = offsetPointRelativeToEntityCenter(entity, &geometry->getPoints()[0]);
      entity->SetLocation(offsetPoint);
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_walk_entity_to_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t geometryId;
      uint8_t entityId;
   } ActionWalkEntityToGeometry;
   auto* argStruct = (ActionWalkEntityToGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
      int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);

      if (resumeStateStruct->totalLoopsToNextAction == 0)
      {
         //this is the points we're interpolating between
         resumeStateStruct->pointA = entity->location;
         resumeStateStruct->pointB = offsetPointRelativeToEntityCenter(entity, &geometry->getPoints()[0]);
         entity->direction = gameEngine->gameControl->updateDirectionAndPreserveFlags(
            getRelativeDirection(resumeStateStruct->pointA, resumeStateStruct->pointB),
            entity->direction
         );
         entity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
         entity->currentFrameIndex = 0;
         renderable->currentFrameTicks = 0;
      }
      float progress = manageProgressOfAction(resumeStateStruct, argStruct->duration);
      Point betweenPoint = resumeStateStruct->pointA.lerp(resumeStateStruct->pointB, progress);
      entity->SetLocation(betweenPoint);
      if (progress >= 1.0f)
      {
         entity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
         entity->currentFrameIndex = 0;
         renderable->currentFrameTicks = 0;
         resumeStateStruct->totalLoopsToNextAction = 0;
      }
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_walk_entity_along_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t geometryId;
      uint8_t entityId;
   } ActionWalkEntityAlongGeometry;
   auto* argStruct = (ActionWalkEntityAlongGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, gameEngine->scriptControl->currentEntityId);
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);

      // handle single point geometries
      if (geometry->getPoints().size() == 1)
      {
         resumeStateStruct->totalLoopsToNextAction = 1;
         auto offsetPoint = offsetPointRelativeToEntityCenter(entity, &geometry->getPoints()[0]);
         entity->SetLocation(offsetPoint);
         gameEngine->gameControl->updateEntityRenderableData(entityIndex);
         return;
      }
      // and for everything else...
      if (resumeStateStruct->totalLoopsToNextAction == 0)
      {
         uint16_t totalDelayLoops = argStruct->duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
         //now set the resumeStateStruct variables:
         resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
         resumeStateStruct->loopsToNextAction = totalDelayLoops;
         resumeStateStruct->length = geometry->GetPathLength();
         initializeEntityGeometryPath(resumeStateStruct, renderable, entity, geometry);
         entity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
         entity->currentFrameIndex = 0;
         renderable->currentFrameTicks = 0;
      }
      resumeStateStruct->loopsToNextAction--;

      uint16_t sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeStateStruct->currentSegmentIndex);
      float totalProgress = getProgressOfAction(resumeStateStruct);
      float currentProgressLength = resumeStateStruct->length * totalProgress;
      float currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
      float lengthAtEndOfCurrentSegment = resumeStateStruct->lengthOfPreviousSegments + currentSegmentLength;
      float progressBetweenPoints = (currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
         / (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments);

      if (progressBetweenPoints > 1)
      {
         resumeStateStruct->lengthOfPreviousSegments += currentSegmentLength;
         resumeStateStruct->currentSegmentIndex++;
         uint16_t pointAIndex = geometry->getLoopableGeometryPointIndex(resumeStateStruct->currentSegmentIndex);
         uint16_t pointBIndex = geometry->getLoopableGeometryPointIndex(resumeStateStruct->currentSegmentIndex + 1);
         sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeStateStruct->currentSegmentIndex);
         currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
         lengthAtEndOfCurrentSegment = resumeStateStruct->lengthOfPreviousSegments + currentSegmentLength;
         progressBetweenPoints = (currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
            / (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments);

         setResumeStatePointsAndEntityDirection(
            resumeStateStruct,
            renderable,
            entity,
            geometry,
            pointAIndex,
            pointBIndex
         );
      }
      
      Point betweenPoint = resumeStateStruct->pointA.lerp(resumeStateStruct->pointB, progressBetweenPoints);
      entity->SetLocation(betweenPoint);
      if (resumeStateStruct->loopsToNextAction == 0)
      {
         resumeStateStruct->totalLoopsToNextAction = 0;
         entity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
         entity->currentFrameIndex = 0;
         renderable->currentFrameTicks = 0;
      }
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}
void MageScriptActions::action_loop_entity_along_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t geometryId;
      uint8_t entityId;
   } ActionLoopEntityAlongGeometry;
   auto* argStruct = (ActionLoopEntityAlongGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(argStruct->entityId, gameEngine->scriptControl->currentEntityId);
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();
      auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);

      // handle single point geometries
      if (geometry->getPoints().size() == 1)
      {
         resumeStateStruct->totalLoopsToNextAction = 1;
         entity->SetLocation(offsetPointRelativeToEntityCenter(entity, &geometry->getPoints()[0]));
         gameEngine->gameControl->updateEntityRenderableData(entityIndex);
         return;
      }

      // and for everything else...
      if (resumeStateStruct->totalLoopsToNextAction == 0)
      {
         uint16_t totalDelayLoops = argStruct->duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
         //now set the resumeStateStruct variables:
         resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
         resumeStateStruct->loopsToNextAction = totalDelayLoops;
         resumeStateStruct->length = (geometry->GetTypeId()== MageGeometryType::Polyline)
            ? geometry->GetPathLength() * 2
            : geometry->GetPathLength();
         initializeEntityGeometryPath(resumeStateStruct, renderable, entity, geometry);
         entity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
         entity->currentFrameIndex = 0;
         renderable->currentFrameTicks = 0;
      }

      if (resumeStateStruct->loopsToNextAction == 0)
      {
         resumeStateStruct->loopsToNextAction = resumeStateStruct->totalLoopsToNextAction;
         initializeEntityGeometryPath(resumeStateStruct, renderable, entity, geometry);
      }
      resumeStateStruct->loopsToNextAction--;
      uint16_t sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeStateStruct->currentSegmentIndex);
      float totalProgress = getProgressOfAction(resumeStateStruct);
      float currentProgressLength = resumeStateStruct->length * totalProgress;
      float currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
      float lengthAtEndOfCurrentSegment = resumeStateStruct->lengthOfPreviousSegments + currentSegmentLength;
      float progressBetweenPoints = (currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
         / (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments);

      if (progressBetweenPoints > 1.0f)
      {
         resumeStateStruct->lengthOfPreviousSegments += currentSegmentLength;
         resumeStateStruct->currentSegmentIndex++;
         uint16_t pointAIndex = geometry->getLoopableGeometryPointIndex(resumeStateStruct->currentSegmentIndex );
         uint16_t pointBIndex = geometry->getLoopableGeometryPointIndex(resumeStateStruct->currentSegmentIndex + 1);

         sanitizedCurrentSegmentIndex = geometry->GetLoopableGeometrySegmentIndex(resumeStateStruct->currentSegmentIndex);

         currentSegmentLength = geometry->GetSegmentLength(sanitizedCurrentSegmentIndex);
         lengthAtEndOfCurrentSegment = resumeStateStruct->lengthOfPreviousSegments + currentSegmentLength;
         progressBetweenPoints = (currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
            / (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments);

         setResumeStatePointsAndEntityDirection(
            resumeStateStruct,
            renderable,
            entity,
            geometry,
            pointAIndex,
            pointBIndex
         );
      }
      Point betweenPoint = resumeStateStruct->pointA.lerp(resumeStateStruct->pointB, progressBetweenPoints);
      entity->SetLocation(betweenPoint);
      gameEngine->gameControl->updateEntityRenderableData(entityIndex);
   }
}

void MageScriptActions::action_set_camera_to_follow_entity(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetCameraToFollowEntity*)args;
   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   gameEngine->gameControl->camera.followEntityId = entityIndex;
}

void MageScriptActions::action_teleport_camera_to_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionTeleportCameraToGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(gameEngine->scriptControl->currentEntityId);
   auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);

   gameEngine->gameControl->camera.followEntityId = NO_PLAYER;
   const auto midScreen = Point{ HALF_WIDTH, HALF_HEIGHT };
   gameEngine->gameControl->camera.position = geometry->getPoints()[0] - midScreen;
}

void MageScriptActions::action_pan_camera_to_entity(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint8_t entityId;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionPanCameraToEntity;
   auto* argStruct = (ActionPanCameraToEntity*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      auto renderable = entity->getRenderableData();

      if (resumeStateStruct->totalLoopsToNextAction == 0)
      {
         gameEngine->gameControl->camera.followEntityId = NO_PLAYER;
         //this is the points we're interpolating between
         resumeStateStruct->pointA = {
            gameEngine->gameControl->camera.position.x,
            gameEngine->gameControl->camera.position.y,
         };
      }
      float progress = manageProgressOfAction(
         resumeStateStruct,
         argStruct->duration
      );
      // yes, this is intentional;
      // if the entity is moving, pan will continue to the entity
      resumeStateStruct->pointB = {
         renderable->center.x - HALF_WIDTH,
         renderable->center.y - HALF_HEIGHT,
      };
      Point betweenPoint = resumeStateStruct->pointA.lerp(resumeStateStruct->pointB, progress);
      gameEngine->gameControl->camera.position.x = betweenPoint.x;
      gameEngine->gameControl->camera.position.y = betweenPoint.y;
      if (progress >= 1.0f)
      {
         // Moved the camera there, may as well follow the entity now.
         gameEngine->gameControl->camera.followEntityId = entityIndex;
      }
   }
}

void MageScriptActions::action_pan_camera_to_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t geometryId;
      uint8_t paddingG;
   } ActionPanCameraToGeometry;
   auto* argStruct = (ActionPanCameraToGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   
   MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(gameEngine->scriptControl->currentEntityId);
   auto geometry = gameEngine->gameControl->getGeometry(argStruct->geometryId);


   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      gameEngine->gameControl->camera.followEntityId = NO_PLAYER;
      //this is the points we're interpolating between
      resumeStateStruct->pointA = {
         gameEngine->gameControl->camera.position.x,
         gameEngine->gameControl->camera.position.y,
      };
      resumeStateStruct->pointB = {
         geometry->getPoints()[0].x - HALF_WIDTH,
         geometry->getPoints()[0].y - HALF_HEIGHT,
      };
   }
   float progress = manageProgressOfAction(resumeStateStruct, argStruct->duration);

   Point betweenPoint = resumeStateStruct->pointA.lerp(resumeStateStruct->pointB, progress);
   gameEngine->gameControl->camera.position.x = betweenPoint.x;
   gameEngine->gameControl->camera.position.y = betweenPoint.y;
}

void MageScriptActions::action_pan_camera_along_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t geometryId;
      uint8_t paddingG;
   } ActionPanCameraAlongGeometry;
   auto* argStruct = (ActionPanCameraAlongGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   }

void MageScriptActions::action_loop_camera_along_geometry(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t geometryId;
      uint8_t paddingG;
   } ActionLoopCameraAlongGeometry;
   auto* argStruct = (ActionLoopCameraAlongGeometry*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   }

void MageScriptActions::action_set_screen_shake(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t duration; //in ms
      uint16_t frequency;
      uint8_t amplitude;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionSetScreenShake;
   auto* argStruct = (ActionSetScreenShake*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   float progress = manageProgressOfAction(
      resumeStateStruct,
      argStruct->duration
   );

   if (progress < 1.0)
   {
      gameEngine->gameControl->camera.shaking = true;
      gameEngine->gameControl->camera.shakeAmplitude = argStruct->amplitude;
      gameEngine->gameControl->camera.shakePhase = (
         progress /
         (
            (float)argStruct->frequency
            / 1000.0f
            )
         );
   }
   else
   {
      gameEngine->gameControl->camera.shaking = false;
      gameEngine->gameControl->camera.shakeAmplitude = 0;
      gameEngine->gameControl->camera.shakePhase = 0;
   }
}
void MageScriptActions::action_screen_fade_out(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t color;
      uint8_t paddingG;
   } ActionScreenFadeOut;
   auto* argStruct = (ActionScreenFadeOut*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   argStruct->color = SCREEN_ENDIAN_U2_VALUE(argStruct->color);

   float progress = manageProgressOfAction(resumeStateStruct, argStruct->duration);

   gameEngine->frameBuffer->SetFade(argStruct->color, progress);
}

void MageScriptActions::action_screen_fade_in(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint32_t duration; //in ms
      uint16_t color;
      uint8_t paddingG;
   } ActionScreenFadeIn;
   auto* argStruct = (ActionScreenFadeIn*)args;
   //endianness conversion for arguments larger than 1 byte:
   argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
   argStruct->color = SCREEN_ENDIAN_U2_VALUE(argStruct->color);
   float progress = manageProgressOfAction(
      resumeStateStruct,
      argStruct->duration
   );

   gameEngine->frameBuffer->SetFade(argStruct->color, 1.0f - progress);
}

void MageScriptActions::action_mutate_variable(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionMutateVariable*)args;
   //endianness conversion for arguments larger than 1 byte:
      uint16_t* currentValue = &gameEngine->gameControl->currentSave.scriptVariables[argStruct->variableId];

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
   //		);
   //		values[testVar] += 1;
   //	}
   //	for (int i = 0; i < range; ++i) {
   //		debug_print(
   //			"%05d: %05d",
   //			i,
   //			values[i]
   //		);
   //	}
   //}
   mutate(
      argStruct->operation,
      currentValue,
      argStruct->value
   );
}

void MageScriptActions::action_mutate_variables(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionMutateVariables*)args;
   uint16_t* currentValue = &gameEngine->gameControl->currentSave.scriptVariables[argStruct->variableId];
   uint16_t sourceValue = gameEngine->gameControl->currentSave.scriptVariables[argStruct->sourceId];

   mutate(
      argStruct->operation,
      currentValue,
      sourceValue
   );
}

void MageScriptActions::action_copy_variable(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint8_t variableId;
      uint8_t entityId;
      MageEntityField field;
      uint8_t inbound;
      uint8_t paddingE;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCopyVariable;
   auto* argStruct = (ActionCopyVariable*)args;
   //endianness conversion for arguments larger than 1 byte:
   uint16_t* currentValue = &gameEngine->gameControl->currentSave.scriptVariables[argStruct->variableId];

   int16_t entityIndex = GetUsefulEntityIndexFromActionEntityId(
      argStruct->entityId,
      gameEngine->scriptControl->currentEntityId
   );
   if (entityIndex != NO_PLAYER)
   {
      MageEntity* entity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      uint16_t* variableValue = &gameEngine->gameControl->currentSave.scriptVariables[argStruct->variableId];
      uint8_t* fieldValue = ((uint8_t*)entity) + argStruct->field;


      switch (argStruct->field)
      {
      case x:
      case y:
      case onInteractScriptId:
      case onTickScriptId:
      case primaryId:
      case secondaryId:
         if (argStruct->inbound)
         {
            *variableValue = (uint16_t)*fieldValue;
         }
         else
         {
            uint16_t* destination = (uint16_t*)fieldValue;
            *destination = *variableValue;
         }
         break;
      case primaryIdType:
      case currentAnimation:
      case currentFrame:
      case direction:
      case hackableStateA:
      case hackableStateB:
      case hackableStateC:
      case hackableStateD:
         if (argStruct->inbound)
         {
            *variableValue = (uint8_t)*fieldValue;
         }
         else
         {
            *fieldValue = *variableValue % 256;
         }
         break;
      default: debug_print(
         "copyVariable received an invalid field: %d",
         argStruct->field
      );
      }
   }
}

void MageScriptActions::action_check_variable(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t value;
      uint8_t variableId;
      MageCheckComparison comparison;
      uint8_t expectedBool;
   } ActionCheckVariable;
   auto* argStruct = (ActionCheckVariable*)args;
   //endianness conversion for arguments larger than 1 byte:
      
   uint16_t variableValue = gameEngine->gameControl->currentSave.scriptVariables[argStruct->variableId];
   bool comparison = compare(
      argStruct->comparison,
      variableValue,
      argStruct->value
   );
   if (comparison == (bool)argStruct->expectedBool)
   {
      gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
   }
}

void MageScriptActions::action_check_variables(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionCheckVariables*)args;
   //endianness conversion for arguments larger than 1 byte:
   
   uint16_t variableValue = gameEngine->gameControl->currentSave.scriptVariables[argStruct->variableId];
   uint16_t sourceValue = gameEngine->gameControl->currentSave.scriptVariables[argStruct->sourceId];
   bool comparison = compare(
      argStruct->comparison,
      variableValue,
      sourceValue
   );
   if (comparison == (bool)argStruct->expectedBool)
   {
      gameEngine->scriptControl->jumpScriptId = argStruct->successScriptId;
   }
}

void MageScriptActions::action_slot_save(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSlotSave*)args;
   // In the case that someone hacks an on_tick script to save, we don't want it
   // just burning through 8 ROM writes per second, our chip would be fried in a
   // matter on minutes. So how do we counter? Throw up a "Save Completed" dialog
   // that FORCES user interaction to advance from. A player encountering like 10
   // of these dialogs right in a row should hopefully get the hint and reset
   // their board to get out of that dialog lock. Better to protect the player
   // with an annoying confirm dialog than allowing them to quietly burn through
   // the ROM chip's 10000 write cycles.
   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      gameEngine->gameControl->saveGameSlotSave();
      //debug_print("Opening dialog %d\n", argStruct->dialogId);
      gameEngine->gameControl->dialogControl->showSaveMessageDialog(
         std::string("Save complete.")
      );
      resumeStateStruct->totalLoopsToNextAction = 1;
   }
   else if (!gameEngine->gameControl->dialogControl->isOpen())
   {
      resumeStateStruct->totalLoopsToNextAction = 0;
   }
}

void MageScriptActions::action_slot_load(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSlotLoad*)args;
   //delaying until next tick allows for displaying of an error message on read before resuming
   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      gameEngine->gameControl->saveGameSlotLoad(argStruct->slotIndex);
      resumeStateStruct->totalLoopsToNextAction = 1;
   }
   else if (!gameEngine->gameControl->dialogControl->isOpen())
   {
      resumeStateStruct->totalLoopsToNextAction = 0;
   }
}

void MageScriptActions::action_slot_erase(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSlotErase*)args;
   // In the case that someone hacks an on_tick script to save, we don't want it
   // just burning through 8 ROM writes per second, our chip would be fried in a
   // matter on minutes. So how do we counter? Throw up a "Save Completed" dialog
   // that FORCES user interaction to advance from. A player encountering like 10
   // of these dialogs right in a row should hopefully get the hint and reset
   // their board to get out of that dialog lock. Better to protect the player
   // with an annoying confirm dialog than allowing them to quietly burn through
   // the ROM chip's 10000 write cycles.
   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      gameEngine->gameControl->saveGameSlotErase(argStruct->slotIndex);
      //debug_print("Opening dialog %d\n", argStruct->dialogId);
      gameEngine->gameControl->dialogControl->showSaveMessageDialog(
         std::string("Save erased.")
      );
      resumeStateStruct->totalLoopsToNextAction = 1;
   }
   else if (!gameEngine->gameControl->dialogControl->isOpen())
   {
      resumeStateStruct->totalLoopsToNextAction = 0;
   }
}

void MageScriptActions::action_set_connect_serial_dialog(uint8_t* args, MageScriptState* resumeStateStruct)
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
   ROM_ENDIAN_U2_BUFFER(&argStruct->serialDialogId, 1);
   gameEngine->commandControl->connectSerialDialogId = argStruct->serialDialogId;
}

void MageScriptActions::action_show_serial_dialog(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionShowSerialDialog*)args;
   ROM_ENDIAN_U2_BUFFER(&argStruct->serialDialogId, 1);
   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      gameEngine->commandControl->showSerialDialog(argStruct->serialDialogId);
      if (gameEngine->commandControl->isInputTrapped)
      {
         resumeStateStruct->totalLoopsToNextAction = 1;
      }
   }
   else if (!gameEngine->commandControl->isInputTrapped)
   {
      resumeStateStruct->totalLoopsToNextAction = 0;
   }
}

void MageScriptActions::action_inventory_get(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionInventoryGet*)args;
   // TODO: implement this
}

void MageScriptActions::action_inventory_drop(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionInventoryDrop*)args;
   // TODO: implement this
}

void MageScriptActions::action_check_inventory(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionCheckInventory*)args;
   ROM_ENDIAN_U2_BUFFER(&argStruct->successScriptId, 1);
   // TODO: implement this
}

void MageScriptActions::action_set_map_look_script(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetMapLookScript*)args;
   ROM_ENDIAN_U2_BUFFER(&argStruct->scriptId, 1);
   // TODO: implement this
}

void MageScriptActions::action_set_entity_look_script(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetEntityLookScript*)args;
   ROM_ENDIAN_U2_BUFFER(&argStruct->scriptId, 1);
   // TODO: implement this
}

void MageScriptActions::action_set_teleport_enabled(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetTeleportEnabled*)args;
   // TODO: implement this
}

void MageScriptActions::action_check_map(uint8_t* args, MageScriptState* resumeStateStruct)
{
   typedef struct
   {
      uint16_t successScriptId;
      uint16_t mapId;
      uint8_t expectedBool;
      uint8_t paddingF;
      uint8_t paddingG;
   } ActionCheckMap;
   auto* argStruct = (ActionCheckMap*)args;
   ROM_ENDIAN_U2_BUFFER(&argStruct->successScriptId, 1);
   ROM_ENDIAN_U2_BUFFER(&argStruct->mapId, 1);
   // TODO: implement this
}

void MageScriptActions::action_set_ble_flag(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionSetBleFlag*)args;
   // TODO: implement this
}

void MageScriptActions::action_check_ble_flag(uint8_t* args, MageScriptState* resumeStateStruct)
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
   auto* argStruct = (ActionCheckBleFlag*)args;
   ROM_ENDIAN_U2_BUFFER(&argStruct->successScriptId, 1);
   // TODO: implement this
}


uint16_t MageScriptActions::getUsefulGeometryIndexFromActionGeometryId(
   uint16_t geometryId,
   MageEntity* entity
)
{
   uint16_t geometryIndex = geometryId;
   if (geometryIndex == MAGE_ENTITY_PATH)
   {
      geometryIndex = ROM_ENDIAN_U2_VALUE(
         *(uint16_t*)((uint8_t*)&entity->hackableStateA)
      );
   }
   return geometryIndex;
}

float MageScriptActions::getProgressOfAction(
   const MageScriptState* resumeStateStruct
)
{
   return 1.0f - (
      (float)resumeStateStruct->loopsToNextAction
      / (float)resumeStateStruct->totalLoopsToNextAction
      );
}

float MageScriptActions::manageProgressOfAction(
   MageScriptState* resumeStateStruct,
   uint32_t duration
)
{
   resumeStateStruct->loopsToNextAction--;
   if (resumeStateStruct->totalLoopsToNextAction == 0)
   {
      uint16_t totalDelayLoops = duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
      resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
      resumeStateStruct->loopsToNextAction = totalDelayLoops;
   }
   float result = 1.0f - (
      (float)resumeStateStruct->loopsToNextAction
      / (float)resumeStateStruct->totalLoopsToNextAction
      );
   if (result >= 1.0f)
   {
      resumeStateStruct->totalLoopsToNextAction = 0;
      resumeStateStruct->loopsToNextAction = 0;
   }
   return result;
}

MageEntityAnimationDirection MageScriptActions::getRelativeDirection(
   const Point& pointA,
   const Point& pointB
)
{
   float angle = atan2f(
      pointB.y - pointA.y,
      pointB.x - pointA.x
   );
   float absoluteAngle = abs(angle);
   MageEntityAnimationDirection direction = SOUTH;
   if (absoluteAngle > 2.356194)
   {
      direction = WEST;
   }
   else if (absoluteAngle < 0.785398)
   {
      direction = EAST;
   }
   else if (angle < 0)
   {
      direction = NORTH;
   }
   else if (angle > 0)
   {
      direction = SOUTH;
   }
   return direction;
}

Point MageScriptActions::offsetPointRelativeToEntityCenter(const MageEntity* entity, const Point* geometryPoint)
{
   auto renderable = entity->getRenderableData();
   return *geometryPoint - renderable->center - entity->location;
}

void MageScriptActions::initializeEntityGeometryPath(
   MageScriptState* resumeStateStruct,
   RenderableData* renderable,
   MageEntity* entity,
   const MageGeometry* geometry
)
{
   resumeStateStruct->lengthOfPreviousSegments = 0;
   resumeStateStruct->currentSegmentIndex = 0;
   setResumeStatePointsAndEntityDirection(
      resumeStateStruct,
      renderable,
      entity,
      geometry,
      geometry->getLoopableGeometryPointIndex(0),
      geometry->getLoopableGeometryPointIndex(1)
   );
}

void MageScriptActions::setResumeStatePointsAndEntityDirection(
   MageScriptState* resumeStateStruct,
   RenderableData* renderable,
   MageEntity* entity,
   const MageGeometry* geometry,
   uint16_t pointAIndex,
   uint16_t pointBIndex
)
{
   resumeStateStruct->pointA = offsetPointRelativeToEntityCenter(
      entity,
      &geometry->getPoints()[pointAIndex]
   );
   resumeStateStruct->pointB = offsetPointRelativeToEntityCenter(
      entity,
      &geometry->getPoints()[pointBIndex]
   );
   entity->direction = gameEngine->gameControl->updateDirectionAndPreserveFlags(
      getRelativeDirection(
         resumeStateStruct->pointA,
         resumeStateStruct->pointB
      ),
      entity->direction
   );
}

void MageScriptActions::mutate(
   MageMutateOperation operation,
   uint16_t* destination,
   uint16_t value
)
{
   //protect against division by 0 errors
   uint16_t safeValue = value == 0 ? 1 : value;
   switch (operation)
   {
   case SET: *destination = value; break;
   case ADD: *destination += value; break;
   case SUB: *destination -= value; break;
   case DIV: *destination /= safeValue; break;
   case MUL: *destination *= value; break;
   case MOD: *destination %= safeValue; break;
   case RNG: *destination = rand() % safeValue; break;
   default: debug_print(
      "mutateVariable received an invalid operation: %d",
      operation
   );
   }
}

bool MageScriptActions::compare(
   MageCheckComparison comparison,
   uint16_t a,
   uint16_t b
)
{
   switch (comparison)
   {
   case LT: return a < b;
   case LTEQ: return a <= b;
   case EQ: return a == b;
   case GTEQ: return a >= b;
   case GT: return a > b;
   default:
      debug_print(
         "checkComparison received an invalid comparison: %d",
         comparison
      );
      return false;
   }
}
