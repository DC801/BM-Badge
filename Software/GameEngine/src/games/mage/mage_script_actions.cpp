#include "mage_script_actions.h"
#include "EngineInput.h"
#include "mage_script_control.h"
#include "mage_dialog_control.h"
#include "mage_command_control.h"
#include "led.h"

//load in the global variables that the scripts will be operating on:
extern MageGameControl *MageGame;
extern MageHexEditor *MageHex;
extern MageDialogControl *MageDialog;
extern MageScriptControl *MageScript;
extern MageCommandControl *MageCommand;
extern MageScriptControl *MageScript;
extern MageEntity *hackableDataAddress;
extern FrameBuffer *mage_canvas;

void action_null_action(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
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

void action_check_entity_name(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t stringId;
		uint8_t entityId;
		uint8_t expectedBoolValue;
		uint8_t paddingG;
	} ActionCheckEntityName;
	auto *argStruct = (ActionCheckEntityName*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		std::string romString = MageGame->getString(argStruct->stringId, MageScript->currentEntityId);
		std::string entityName = MageGame->getEntityNameStringById(entityIndex);
		// DO NOT try to do an == comparison on these two C++ strings because
		// the extra null values at the end of the entity name cause fail
		int compare = strcmp(entityName.c_str(), romString.c_str());
		bool identical = compare == 0;
		if(identical == argStruct->expectedBoolValue) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_x(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedValue;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityX;
	auto *argStruct = (ActionCheckEntityX*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->x == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_y(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedValue;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityY;
	auto *argStruct = (ActionCheckEntityY*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->y == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_interact_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedScript;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityInteractScript;
	auto *argStruct = (ActionCheckEntityInteractScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedScript = ROM_ENDIAN_U2_VALUE(argStruct->expectedScript);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->onInteractScriptId == argStruct->expectedScript);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_tick_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedScript;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityTickScript;
	auto *argStruct = (ActionCheckEntityTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedScript = ROM_ENDIAN_U2_VALUE(argStruct->expectedScript);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->onTickScriptId == argStruct->expectedScript);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_look_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedScript;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityLookScript;
	auto *argStruct = (ActionCheckEntityLookScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedScript = ROM_ENDIAN_U2_VALUE(argStruct->expectedScript);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->onLookScriptId == argStruct->expectedScript);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_type(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t entityTypeId;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityType;
	auto *argStruct = (ActionCheckEntityType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->entityTypeId = ROM_ENDIAN_U2_VALUE(argStruct->entityTypeId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t sanitizedEntityTypeId = MageGame->getValidEntityTypeId(entity->primaryId);
		bool identical = (
			sanitizedEntityTypeId == argStruct->entityTypeId &&
			entity->primaryIdType == ENTITY_TYPE
		);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_primary_id(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedValue;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityPrimaryId;
	auto *argStruct = (ActionCheckEntityPrimaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t sizeLimit;
		uint8_t sanitizedPrimaryType = entity->primaryIdType % NUM_PRIMARY_ID_TYPES;
		if(sanitizedPrimaryType == ENTITY_TYPE) {sizeLimit = MageGame->entityTypeCount();}
		if(sanitizedPrimaryType == ANIMATION) {sizeLimit = MageGame->animationCount();}
		if(sanitizedPrimaryType == TILESET) {sizeLimit = MageGame->tilesetCount();}
		bool identical = ((entity->primaryId % sizeLimit) == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_secondary_id(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedValue;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntitySecondaryId;
	auto *argStruct = (ActionCheckEntitySecondaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t sizeLimit;
		uint8_t sanitizedPrimaryType = entity->primaryIdType % NUM_PRIMARY_ID_TYPES;
		if(sanitizedPrimaryType == ENTITY_TYPE) {sizeLimit = 1;}
		if(sanitizedPrimaryType == ANIMATION) {sizeLimit = 1;}
		if(sanitizedPrimaryType == TILESET) {
			MageTileset *tileset = MageGame->getValidTileset(entity->primaryId);
			sizeLimit = tileset->Tiles();
		}
		bool identical = ((entity->secondaryId % sizeLimit) == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_primary_id_type(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t entityId;
		uint8_t expectedValue;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityPrimaryIdType;
	auto *argStruct = (ActionCheckEntityPrimaryIdType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint8_t sanitizedPrimaryType = entity->primaryIdType % NUM_PRIMARY_ID_TYPES;
		bool identical = (sanitizedPrimaryType == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_current_animation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t entityId;
		uint8_t expectedValue;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityCurrentAnimation;
	auto *argStruct = (ActionCheckEntityCurrentAnimation*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->currentAnimation == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_current_frame(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t entityId;
		uint8_t expectedValue;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityCurrentFrame;
	auto *argStruct = (ActionCheckEntityCurrentFrame*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->currentFrame == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_direction(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t entityId;
		uint8_t expectedValue;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckEntityDirection;
	auto *argStruct = (ActionCheckEntityDirection*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool identical = (entity->direction == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_glitched(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t entityId;
		uint8_t expectedBool;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckEntityGlitched;
	auto *argStruct = (ActionCheckEntityGlitched*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		bool isGlitched = (entity->direction & RENDER_FLAGS_IS_GLITCHED) != 0;
		if(isGlitched == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_entity_path(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t expectedValue;
		uint8_t entityId;
		uint8_t expectedBool;
	} ActionCheckEntityPath;
	auto *argStruct = (ActionCheckEntityPath*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t pathId = entity->pathId;
		bool identical = (pathId == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_save_flag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t saveFlagOffset;
		uint8_t expectedBoolValue;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckSaveFlag;
	auto *argStruct = (ActionCheckSaveFlag*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->saveFlagOffset = ROM_ENDIAN_U2_VALUE(argStruct->saveFlagOffset);
	uint16_t byteOffset = argStruct->saveFlagOffset / 8;
	uint8_t bitOffset = argStruct->saveFlagOffset % 8;
	uint8_t currentByteValue = MageGame->currentSave.saveFlags[byteOffset];
	bool bitValue = (currentByteValue >> bitOffset) & 0x01u;

	if(bitValue == argStruct->expectedBoolValue) {
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_check_if_entity_is_in_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t geometryId;
		uint8_t entityId;
		uint8_t expectedBoolValue;
		uint8_t paddingG;
	} ActionCheckifEntityIsInGeometry;
	auto *argStruct = (ActionCheckifEntityIsInGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
		bool colliding = geometry.isPointInGeometry(renderable->center);
		if(colliding == argStruct->expectedBoolValue) {
			MageScript->jumpScriptId = argStruct->successScriptId;
		}
	}
}

void action_check_for_button_press(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t buttonId; //KEYBOARD_KEY enum value
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckForButtonPress;
	auto *argStruct = (ActionCheckForButtonPress*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	bool button_activated = getButtonStateFromButtonArray(
		argStruct->buttonId,
		&EngineInput_Activated
	);
	if(button_activated)
	{
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_check_for_button_state(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t buttonId; //KEYBOARD_KEY enum value
		uint8_t expectedBoolValue;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckForButtonState;
	auto *argStruct = (ActionCheckForButtonState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	bool button_state = getButtonStateFromButtonArray(
		argStruct->buttonId,
		&EngineInput_Buttons
	);
	if(button_state == (bool)(argStruct->expectedBoolValue))
	{
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_check_warp_state(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t stringId;
		uint8_t expectedBoolValue;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckWarpState;
	auto *argStruct = (ActionCheckWarpState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	bool doesWarpStateMatch = MageGame->currentSave.warpState == argStruct->stringId;
	if(doesWarpStateMatch == (bool)(argStruct->expectedBoolValue))
	{
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_run_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t scriptId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionRunScript;
	auto *argStruct = (ActionRunScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	MageScript->jumpScriptId = argStruct->scriptId;
}

void action_blocking_delay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionBlockingDelay;
	auto *argStruct = (ActionBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

	//If there's already a total number of loops to next action set, a delay is currently in progress:
	if(resumeStateStruct->totalLoopsToNextAction != 0)
	{
		//decrement the number of loops to the end of the delay:
		resumeStateStruct->loopsToNextAction--;
		//if we've reached the end:
		if(resumeStateStruct->loopsToNextAction <= 0)
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
		MageScript->blockingDelayTime = (MageScript->blockingDelayTime < argStruct->duration)
			? argStruct->duration
			: MageScript->blockingDelayTime;
		//now set the resumeStateStruct variables:
		resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
		resumeStateStruct->loopsToNextAction = totalDelayLoops;
	}
}

void action_non_blocking_delay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionNonBlockingDelay;
	auto *argStruct = (ActionNonBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

	manageProgressOfAction(
		resumeStateStruct,
		argStruct->duration
	);
}

void action_set_entity_name(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t stringId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityName;
	auto *argStruct = (ActionSetEntityName*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	//get the string from the stringId:
	std::string romString = MageGame->getString(argStruct->stringId, MageScript->currentEntityId);
	//Get the entity:
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		//simple loop to set the name:
		for(int i=0; i<MAGE_ENTITY_NAME_LENGTH; i++) {
			entity->name[i] = romString[i];
			if(romString[i] == 00) {
				// if we have hit one null, fill in the remainder with null too
				for(int j=i + 1; j<MAGE_ENTITY_NAME_LENGTH; j++) {
					entity->name[j] = 00;
				}
				break;
			}
		}
	}
}

void action_set_entity_x(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t newValue;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityX;
	auto *argStruct = (ActionSetEntityX*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->x = argStruct->newValue;
	}
}

void action_set_entity_y(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t newValue;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityY;
	auto *argStruct = (ActionSetEntityY*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->y = argStruct->newValue;
	}
}

void action_set_entity_interact_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t scriptId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityInteractScript;
	auto *argStruct = (ActionSetEntityInteractScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	MageScript->setEntityScript(
		argStruct->scriptId,
		getUsefulEntityIndexFromActionEntityId(
			argStruct->entityId,
			MageScript->currentEntityId
		),
		ON_INTERACT
	);
}

void action_set_entity_tick_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t scriptId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityTickScript;
	auto *argStruct = (ActionSetEntityTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	MageScript->setEntityScript(
		argStruct->scriptId,
		entityIndex,
		ON_TICK
	);
}

void action_set_entity_type(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t entityTypeId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityType;
	auto *argStruct = (ActionSetEntityType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->entityTypeId = ROM_ENDIAN_U2_VALUE(argStruct->entityTypeId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->primaryId = argStruct->entityTypeId;
		entity->primaryIdType = ENTITY_TYPE;
	}
}

void action_set_entity_primary_id(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t newValue;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityPrimaryId;
	auto *argStruct = (ActionSetEntityPrimaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->primaryId = argStruct->newValue;
	}
}

void action_set_entity_secondary_id(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t newValue;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntitySecondaryId;
	auto *argStruct = (ActionSetEntitySecondaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->secondaryId = argStruct->newValue;
	}
}

void action_set_entity_primary_id_type(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		MageEntityPrimaryIdType newValue;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityPrimaryIdType;
	auto *argStruct = (ActionSetEntityPrimaryIdType*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->primaryIdType = (MageEntityPrimaryIdType)(argStruct->newValue % NUM_PRIMARY_ID_TYPES);
	}
}

void action_set_entity_current_animation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t newValue;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityCurrentAnimation;
	auto *argStruct = (ActionSetEntityCurrentAnimation*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		entity->currentAnimation = argStruct->newValue;
		entity->currentFrame = 0;
		renderable->currentFrameTicks = 0;
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_current_frame(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t newValue;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityCurrentFrame;
	auto *argStruct = (ActionSetEntityCurrentFrame*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		entity->currentFrame = argStruct->newValue;
		renderable->currentFrameTicks = 0;
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_direction(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		MageEntityAnimationDirection direction;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityDirection;
	auto *argStruct = (ActionSetEntityDirection*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->direction = MageGame->updateDirectionAndPreserveFlags(
			argStruct->direction,
			entity->direction
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_direction_relative(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		int8_t relativeDirection;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityDirectionRelative;
	auto *argStruct = (ActionSetEntityDirectionRelative*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->direction = MageGame->updateDirectionAndPreserveFlags(
			(MageEntityAnimationDirection) ((
				entity->direction
				+ argStruct->relativeDirection
				+ NUM_DIRECTIONS
			) % NUM_DIRECTIONS),
			entity->direction
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_direction_target_entity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t targetEntityId;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityDirectionTargetEntity;
	auto *argStruct = (ActionSetEntityDirectionTargetEntity*)args;

	int16_t targetEntityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->targetEntityId,
		MageScript->currentEntityId
	);
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(
		entityIndex != NO_PLAYER
		&& targetEntityIndex != NO_PLAYER
	) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		MageEntityRenderableData *targetRenderable = MageGame->getEntityRenderableDataByMapLocalId(targetEntityIndex);
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		entity->direction = MageGame->updateDirectionAndPreserveFlags(
			getRelativeDirection(
				renderable->center,
				targetRenderable->center
			),
			entity->direction
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_direction_target_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t targetGeometryId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityDirectionTargetGeometry;
	auto *argStruct = (ActionSetEntityDirectionTargetGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->targetGeometryId = ROM_ENDIAN_U2_VALUE(argStruct->targetGeometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->targetGeometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
		entity->direction = MageGame->updateDirectionAndPreserveFlags(
			getRelativeDirection(
				renderable->center,
				geometry.points[0]
			),
			entity->direction
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_glitched(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t entityId;
		uint8_t isGlitched;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityGlitched;
	auto *argStruct = (ActionSetEntityGlitched*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->direction = (MageEntityAnimationDirection) (
			(entity->direction & RENDER_FLAGS_IS_GLITCHED_MASK)
			| (argStruct->isGlitched * RENDER_FLAGS_IS_GLITCHED)
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_entity_path(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t newValue;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityPath;
	auto *argStruct = (ActionSetEntityPath*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->pathId = argStruct->newValue;
	}
}

void action_set_save_flag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t saveFlagOffset;
		uint8_t newBoolValue;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetSaveFlag;
	auto *argStruct = (ActionSetSaveFlag*)args;
	argStruct->saveFlagOffset = ROM_ENDIAN_U2_VALUE(argStruct->saveFlagOffset);
	uint16_t byteOffset = argStruct->saveFlagOffset / 8;
	uint8_t bitOffset = argStruct->saveFlagOffset % 8;
	uint8_t currentByteValue = MageGame->currentSave.saveFlags[byteOffset];

	if(argStruct->newBoolValue) {
		currentByteValue |= 0x01u << bitOffset;
	} else {
		// tilde operator inverts all the bits on a byte; Bitwise NOT
		currentByteValue &= ~(0x01u << bitOffset);
	}
	MageGame->currentSave.saveFlags[byteOffset] = currentByteValue;
}

void action_set_player_control(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t playerHasControl;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetPlayerControl;
	auto *argStruct = (ActionSetPlayerControl*)args;
	MageGame->playerHasControl = argStruct->playerHasControl;
}

void action_set_map_tick_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t scriptId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetMapTickScript;
	auto *argStruct = (ActionSetMapTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	MageScript->setEntityScript(
		argStruct->scriptId,
		MAGE_MAP_ENTITY,
		ON_TICK
	);
}

void action_set_hex_cursor_location(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t byteAddress;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetHexCursorLocation;
	auto *argStruct = (ActionSetHexCursorLocation*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->byteAddress = ROM_ENDIAN_U2_VALUE(argStruct->byteAddress);

	MageHex->setHexCursorLocation(argStruct->byteAddress);
}

void action_set_warp_state(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t stringId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetWarpState;
	auto *argStruct = (ActionSetWarpState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	MageGame->currentSave.warpState = argStruct->stringId;
}

void action_set_hex_editor_state(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t state;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetHexEditorState;
	auto *argStruct = (ActionSetHexEditorState*)args;

	if(MageHex->getHexEditorState() != argStruct->state)
	{
		MageHex->toggleHexEditor();
	}
}

void action_set_hex_editor_dialog_mode(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t state;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetHexEditorDialogMode;
	auto *argStruct = (ActionSetHexEditorDialogMode*)args;

	if(MageHex->getHexDialogState() != argStruct->state)
	{
		MageHex->toggleHexDialog();
	}
}

void action_set_hex_editor_control(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t playerHasHexEditorControl;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetHexEditorControl;
	auto *argStruct = (ActionSetHexEditorControl*)args;
	MageGame->playerHasHexEditorControl = argStruct->playerHasHexEditorControl;
}

void action_set_hex_editor_control_clipboard(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t playerHasHexEditorControlClipboard;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetHexEditorControlClipboard;
	auto *argStruct = (ActionSetHexEditorControlClipboard*)args;
	MageGame->playerHasHexEditorControlClipboard = argStruct->playerHasHexEditorControlClipboard;
}

void action_load_map(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t mapId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionLoadMap;
	auto *argStruct = (ActionLoadMap*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->mapId = ROM_ENDIAN_U2_VALUE(argStruct->mapId);

	MageScript->mapLoadId = MageGame->getValidMapId(argStruct->mapId);
}

void action_show_dialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t dialogId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionShowDialog;
	auto *argStruct = (ActionShowDialog*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->dialogId = ROM_ENDIAN_U2_VALUE(argStruct->dialogId);

	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		//debug_print("Opening dialog %d\n", argStruct->dialogId);
		MageDialog->load(argStruct->dialogId, MageScript->currentEntityId);
		resumeStateStruct->totalLoopsToNextAction = 1;
	} else if (!MageDialog->isOpen) {
		// will be 0 any time there is no response; no jump
		if(MageDialog->mapLocalJumpScriptId != MAGE_NO_SCRIPT) {
			MageScript->jumpScriptId = MageDialog->mapLocalJumpScriptId;
		}
		resumeStateStruct->totalLoopsToNextAction = 0;
	}
}

void action_play_entity_animation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t entityId;
		uint8_t animationId;
		uint8_t playCount;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionPlayEntityAnimation;
	auto *argStruct = (ActionPlayEntityAnimation*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		if (resumeStateStruct->totalLoopsToNextAction == 0) {
			resumeStateStruct->totalLoopsToNextAction = argStruct->playCount;
			resumeStateStruct->loopsToNextAction = argStruct->playCount;
			entity->currentAnimation = argStruct->animationId;
			entity->currentFrame = 0;
			renderable->currentFrameTicks = 0;
			MageGame->updateEntityRenderableData(entityIndex);
		} else if (
			// we just reset to 0
			entity->currentFrame == 0
			// the previously rendered frame was the last in the animation
			&& resumeStateStruct->currentSegmentIndex == (renderable->frameCount - 1)
		) {
			resumeStateStruct->loopsToNextAction--;
			if (resumeStateStruct->loopsToNextAction == 0) {
				resumeStateStruct->totalLoopsToNextAction = 0;
				entity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
				entity->currentFrame = 0;
				renderable->currentFrameTicks = 0;
				MageGame->updateEntityRenderableData(entityIndex);
			}
		}
		// this is just a quick and dirty place to hold on to
		// the last frame that was rendered for this entity
		resumeStateStruct->currentSegmentIndex = entity->currentFrame;
	}
}

void action_teleport_entity_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t geometryId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionTeleportEntityToGeometry;
	auto *argStruct = (ActionTeleportEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
		setEntityPositionToPoint(
			entity,
			offsetPointRelativeToEntityCenter(
				renderable,
				entity,
				&geometry.points[0]
			)
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_walk_entity_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t geometryId;
		uint8_t entityId;
	} ActionWalkEntityToGeometry;
	auto *argStruct = (ActionWalkEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);

		if(resumeStateStruct->totalLoopsToNextAction == 0) {
			//this is the points we're interpolating between
			resumeStateStruct->pointA = {
				.x = entity->x,
				.y = entity->y,
			};
			resumeStateStruct->pointB = offsetPointRelativeToEntityCenter(
				renderable,
				entity,
				&geometry.points[0]
			);
			entity->direction = MageGame->updateDirectionAndPreserveFlags(
				getRelativeDirection(
					resumeStateStruct->pointA,
					resumeStateStruct->pointB
				),
				entity->direction
			);
			entity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
			entity->currentFrame = 0;
			renderable->currentFrameTicks = 0;
		}
		float progress = manageProgressOfAction(
			resumeStateStruct,
			argStruct->duration
		);
		Point betweenPoint = FrameBuffer::lerpPoints(
			resumeStateStruct->pointA,
			resumeStateStruct->pointB,
			progress
		);
		setEntityPositionToPoint(entity, betweenPoint);
		if(progress >= 1.0f) {
			entity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
			entity->currentFrame = 0;
			renderable->currentFrameTicks = 0;
			resumeStateStruct->totalLoopsToNextAction = 0;
		}
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_walk_entity_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t geometryId;
		uint8_t entityId;
	} ActionWalkEntityAlongGeometry;
	auto *argStruct = (ActionWalkEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);

		// handle single point geometries
		if(geometry.pointCount == 1) {
			resumeStateStruct->totalLoopsToNextAction = 1;
			setEntityPositionToPoint(
				entity,
				offsetPointRelativeToEntityCenter(
					renderable,
					entity,
					&geometry.points[0]
				)
			);
			MageGame->updateEntityRenderableData(entityIndex);
			return;
		}
		// and for everything else...
		if(resumeStateStruct->totalLoopsToNextAction == 0) {
			uint16_t totalDelayLoops = argStruct->duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
			//now set the resumeStateStruct variables:
			resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
			resumeStateStruct->loopsToNextAction = totalDelayLoops;
			resumeStateStruct->length = geometry.pathLength;
			initializeEntityGeometryPath(resumeStateStruct, renderable, entity, &geometry);
			entity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
			entity->currentFrame = 0;
			renderable->currentFrameTicks = 0;
		}
		resumeStateStruct->loopsToNextAction--;
		uint16_t sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
			&geometry,
			resumeStateStruct->currentSegmentIndex
		);
		float totalProgress = getProgressOfAction(resumeStateStruct);
		float currentProgressLength = resumeStateStruct->length * totalProgress;
		float currentSegmentLength = geometry.segmentLengths[sanitizedCurrentSegmentIndex];
		float lengthAtEndOfCurrentSegment = (
			resumeStateStruct->lengthOfPreviousSegments
			+ currentSegmentLength
		);
		float progressBetweenPoints = (
			(currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
			/ (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments)
		);
		if(progressBetweenPoints > 1) {
			resumeStateStruct->lengthOfPreviousSegments += currentSegmentLength;
			resumeStateStruct->currentSegmentIndex++;
			uint16_t pointAIndex = getLoopableGeometryPointIndex(
				&geometry,
				resumeStateStruct->currentSegmentIndex
			);
			uint16_t pointBIndex = getLoopableGeometryPointIndex(
				&geometry,
				resumeStateStruct->currentSegmentIndex + 1
			);
			sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
				&geometry,
				resumeStateStruct->currentSegmentIndex
			);
			currentSegmentLength = geometry.segmentLengths[sanitizedCurrentSegmentIndex];
			lengthAtEndOfCurrentSegment = (
				resumeStateStruct->lengthOfPreviousSegments
				+ currentSegmentLength
			);
			progressBetweenPoints = (
				(currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
				/ (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments)
			);
			setResumeStatePointsAndEntityDirection(
				resumeStateStruct,
				renderable,
				entity,
				&geometry,
				pointAIndex,
				pointBIndex
			);
		}
		Point betweenPoint = FrameBuffer::lerpPoints(
			resumeStateStruct->pointA,
			resumeStateStruct->pointB,
			progressBetweenPoints
		);
		setEntityPositionToPoint(entity, betweenPoint);
		if(resumeStateStruct->loopsToNextAction == 0) {
			resumeStateStruct->totalLoopsToNextAction = 0;
			entity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
			entity->currentFrame = 0;
			renderable->currentFrameTicks = 0;
		}
		MageGame->updateEntityRenderableData(entityIndex);
	}
}
void action_loop_entity_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t geometryId;
		uint8_t entityId;
	} ActionLoopEntityAlongGeometry;
	auto *argStruct = (ActionLoopEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);

		// handle single point geometries
		if(geometry.pointCount == 1) {
			resumeStateStruct->totalLoopsToNextAction = 1;
			setEntityPositionToPoint(
				entity,
				offsetPointRelativeToEntityCenter(
					renderable,
					entity,
					&geometry.points[0]
				)
			);
			MageGame->updateEntityRenderableData(entityIndex);
			return;
		}
		// and for everything else...
		if(resumeStateStruct->totalLoopsToNextAction == 0) {
			uint16_t totalDelayLoops = argStruct->duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
			//now set the resumeStateStruct variables:
			resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
			resumeStateStruct->loopsToNextAction = totalDelayLoops;
			resumeStateStruct->length = (geometry.typeId == POLYLINE)
				? geometry.pathLength * 2
				: geometry.pathLength;
			initializeEntityGeometryPath(resumeStateStruct, renderable, entity, &geometry);
			entity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
			entity->currentFrame = 0;
			renderable->currentFrameTicks = 0;
		}
		if(resumeStateStruct->loopsToNextAction == 0) {
			resumeStateStruct->loopsToNextAction = resumeStateStruct->totalLoopsToNextAction;
			initializeEntityGeometryPath(resumeStateStruct, renderable, entity, &geometry);
		}
		resumeStateStruct->loopsToNextAction--;
		uint16_t sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
			&geometry,
			resumeStateStruct->currentSegmentIndex
		);
		float totalProgress = getProgressOfAction(resumeStateStruct);
		float currentProgressLength = resumeStateStruct->length * totalProgress;
		float currentSegmentLength = geometry.segmentLengths[sanitizedCurrentSegmentIndex];
		float lengthAtEndOfCurrentSegment = (
			resumeStateStruct->lengthOfPreviousSegments
			+ currentSegmentLength
		);
		float progressBetweenPoints = (
			(currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
			/ (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments)
		);
		if(progressBetweenPoints > 1) {
			resumeStateStruct->lengthOfPreviousSegments += currentSegmentLength;
			resumeStateStruct->currentSegmentIndex++;
			uint16_t pointAIndex = getLoopableGeometryPointIndex(
				&geometry,
				resumeStateStruct->currentSegmentIndex
			);
			uint16_t pointBIndex = getLoopableGeometryPointIndex(
				&geometry,
				resumeStateStruct->currentSegmentIndex + 1
			);
			sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
				&geometry,
				resumeStateStruct->currentSegmentIndex
			);
			currentSegmentLength = geometry.segmentLengths[sanitizedCurrentSegmentIndex];
			lengthAtEndOfCurrentSegment = (
				resumeStateStruct->lengthOfPreviousSegments
				+ currentSegmentLength
			);
			progressBetweenPoints = (
				(currentProgressLength - resumeStateStruct->lengthOfPreviousSegments)
				/ (lengthAtEndOfCurrentSegment - resumeStateStruct->lengthOfPreviousSegments)
			);
			setResumeStatePointsAndEntityDirection(
				resumeStateStruct,
				renderable,
				entity,
				&geometry,
				pointAIndex,
				pointBIndex
			);
		}
		Point betweenPoint = FrameBuffer::lerpPoints(
			resumeStateStruct->pointA,
			resumeStateStruct->pointB,
			progressBetweenPoints
		);
		setEntityPositionToPoint(entity, betweenPoint);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_set_camera_to_follow_entity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t entityId;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetCameraToFollowEntity;
	auto *argStruct = (ActionSetCameraToFollowEntity*)args;
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	MageGame->cameraFollowEntityId = entityIndex;
}

void action_teleport_camera_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t geometryId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionTeleportCameraToGeometry;
	auto *argStruct = (ActionTeleportCameraToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	MageEntity *entity = MageGame->getEntityByMapLocalId(MageScript->currentEntityId);
	uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
	MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
	MageGame->cameraFollowEntityId = NO_PLAYER;
	MageGame->cameraPosition.x = geometry.points[0].x - HALF_WIDTH;
	MageGame->cameraPosition.y = geometry.points[0].y - HALF_HEIGHT;
}

void action_pan_camera_to_entity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint8_t entityId;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionPanCameraToEntity;
	auto *argStruct = (ActionPanCameraToEntity*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getEntityRenderableDataByMapLocalId(entityIndex);
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);

		if(resumeStateStruct->totalLoopsToNextAction == 0) {
			MageGame->cameraFollowEntityId = NO_PLAYER;
			//this is the points we're interpolating between
			resumeStateStruct->pointA = {
				.x = MageGame->cameraPosition.x,
				.y = MageGame->cameraPosition.y,
			};
		}
		float progress = manageProgressOfAction(
			resumeStateStruct,
			argStruct->duration
		);
		// yes, this is intentional;
		// if the entity is moving, pan will continue to the entity
		resumeStateStruct->pointB = {
			.x = renderable->center.x - HALF_WIDTH,
			.y = renderable->center.y - HALF_HEIGHT,
		};
		Point betweenPoint = FrameBuffer::lerpPoints(
			resumeStateStruct->pointA,
			resumeStateStruct->pointB,
			progress
		);
		MageGame->cameraPosition.x = betweenPoint.x;
		MageGame->cameraPosition.y = betweenPoint.y;
		if(progress >= 1.0f) {
			// Moved the camera there, may as well follow the entity now.
			MageGame->cameraFollowEntityId = entityIndex;
		}
	}
}

void action_pan_camera_to_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t geometryId;
		uint8_t paddingG;
	} ActionPanCameraToGeometry;
	auto *argStruct = (ActionPanCameraToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	MageEntity *entity = MageGame->getEntityByMapLocalId(MageScript->currentEntityId);
	uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
	MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);

	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		MageGame->cameraFollowEntityId = NO_PLAYER;
		//this is the points we're interpolating between
		resumeStateStruct->pointA = {
			.x = MageGame->cameraPosition.x,
			.y = MageGame->cameraPosition.y,
		};
		resumeStateStruct->pointB = {
			.x = geometry.points[0].x - HALF_WIDTH,
			.y = geometry.points[0].y - HALF_HEIGHT,
		};
	}
	float progress = manageProgressOfAction(
		resumeStateStruct,
		argStruct->duration
	);
	Point betweenPoint = FrameBuffer::lerpPoints(
		resumeStateStruct->pointA,
		resumeStateStruct->pointB,
		progress
	);
	MageGame->cameraPosition.x = betweenPoint.x;
	MageGame->cameraPosition.y = betweenPoint.y;
}

void action_pan_camera_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t geometryId;
		uint8_t paddingG;
	} ActionPanCameraAlongGeometry;
	auto *argStruct = (ActionPanCameraAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);
}

void action_loop_camera_along_geometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t geometryId;
		uint8_t paddingG;
	} ActionLoopCameraAlongGeometry;
	auto *argStruct = (ActionLoopCameraAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);
}

void action_set_screen_shake(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t duration; //in ms
		uint16_t frequency;
		uint8_t amplitude;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetScreenShake;
	auto *argStruct = (ActionSetScreenShake*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U2_VALUE(argStruct->duration);
	argStruct->frequency = ROM_ENDIAN_U2_VALUE(argStruct->frequency);

	float progress = manageProgressOfAction(
		resumeStateStruct,
		argStruct->duration
	);

	if(progress < 1.0) {
		MageGame->cameraShaking = true;
		MageGame->cameraShakeAmplitude = argStruct->amplitude;
		MageGame->cameraShakePhase = (
			progress /
			(
				(float)argStruct->frequency
				/ 1000.0f
			)
		);
	} else {
		MageGame->cameraShaking = false;
		MageGame->cameraShakeAmplitude = 0;
		MageGame->cameraShakePhase = 0;
	}
}
void action_screen_fade_out(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t color;
		uint8_t paddingG;
	} ActionScreenFadeOut;
	auto *argStruct = (ActionScreenFadeOut*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->color = SCREEN_ENDIAN_U2_VALUE(argStruct->color);

	float progress = manageProgressOfAction(
		resumeStateStruct,
		argStruct->duration
	);

	mage_canvas->fadeColor = argStruct->color;
	mage_canvas->fadeFraction = progress;
	if(progress < 1.0f) {
		mage_canvas->isFading = true;
	}
}
void action_screen_fade_in(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t duration; //in ms
		uint16_t color;
		uint8_t paddingG;
	} ActionScreenFadeIn;
	auto *argStruct = (ActionScreenFadeIn*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->color = SCREEN_ENDIAN_U2_VALUE(argStruct->color);
	float progress = manageProgressOfAction(
		resumeStateStruct,
		argStruct->duration
	);

	mage_canvas->fadeColor = argStruct->color;
	mage_canvas->fadeFraction = 1.0f - progress;
	if(progress < 1.0f) {
		mage_canvas->isFading = true;
	}
}

void action_mutate_variable(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t value;
		uint8_t variableId;
		MageMutateOperation operation;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionMutateVariable;
	auto *argStruct = (ActionMutateVariable*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->value = ROM_ENDIAN_U2_VALUE(argStruct->value);
	uint16_t *currentValue = &MageGame->currentSave.scriptVariables[argStruct->variableId];

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

void action_mutate_variables(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t variableId;
		uint8_t sourceId;
		MageMutateOperation operation;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionMutateVariables;
	auto *argStruct = (ActionMutateVariables*)args;
	uint16_t *currentValue = &MageGame->currentSave.scriptVariables[argStruct->variableId];
	uint16_t sourceValue = MageGame->currentSave.scriptVariables[argStruct->sourceId];

	mutate(
		argStruct->operation,
		currentValue,
		sourceValue
	);
}

void action_copy_variable(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t variableId;
		uint8_t entityId;
		MageEntityField field;
		uint8_t inbound;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCopyVariable;
	auto *argStruct = (ActionCopyVariable*)args;
	//endianness conversion for arguments larger than 1 byte:
	uint16_t *currentValue = &MageGame->currentSave.scriptVariables[argStruct->variableId];

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		uint16_t *variableValue = &MageGame->currentSave.scriptVariables[argStruct->variableId];
		uint8_t *fieldValue = ((uint8_t *)entity) + argStruct->field;


		switch(argStruct->field) {
			case x :
			case y :
			case onInteractScriptId :
			case onTickScriptId :
			case primaryId :
			case secondaryId :
			case pathId :
			case onLookScriptId :
				if(argStruct->inbound) {
					*variableValue = (uint16_t)*fieldValue;
				} else {
					uint16_t *destination = (uint16_t*)fieldValue;
					*destination = *variableValue;
				}
				break;
			case primaryIdType :
			case currentAnimation :
			case currentFrame :
			case direction :
				if(argStruct->inbound) {
					*variableValue = (uint8_t)*fieldValue;
				} else {
					*fieldValue = *variableValue % 256;
				}
				break;
			default : debug_print(
				"copyVariable received an invalid field: %d",
				argStruct->field
			);
		}
	}
}

void action_check_variable(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t value;
		uint8_t variableId;
		MageCheckComparison comparison;
		uint8_t expectedBool;
	} ActionCheckVariable;
	auto *argStruct = (ActionCheckVariable*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->value = ROM_ENDIAN_U2_VALUE(argStruct->value);
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	uint16_t variableValue = MageGame->currentSave.scriptVariables[argStruct->variableId];
	bool comparison = compare(
		argStruct->comparison,
		variableValue,
		argStruct->value
	);
	if(comparison == argStruct->expectedBool) {
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_check_variables(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t variableId;
		uint8_t sourceId;
		MageCheckComparison comparison;
		uint8_t expectedBool;
		uint8_t paddingG;
	} ActionCheckVariables;
	auto *argStruct = (ActionCheckVariables*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	uint16_t variableValue = MageGame->currentSave.scriptVariables[argStruct->variableId];
	uint16_t sourceValue = MageGame->currentSave.scriptVariables[argStruct->sourceId];
	bool comparison = compare(
		argStruct->comparison,
		variableValue,
		sourceValue
	);
	if(comparison == argStruct->expectedBool) {
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_slot_save(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t paddingA;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSlotSave;
	auto *argStruct = (ActionSlotSave*)args;
	// In the case that someone hacks an on_tick script to save, we don't want it
	// just burning through 8 ROM writes per second, our chip would be fried in a
	// matter on minutes. So how do we counter? Throw up a "Save Completed" dialog
	// that FORCES user interaction to advance from. A player encountering like 10
	// of these dialogs right in a row should hopefully get the hint and reset
	// their board to get out of that dialog lock. Better to protect the player
	// with an annoying confirm dialog than allowing them to quietly burn through
	// the ROM chip's 10000 write cycles.
	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		MageGame->saveGameSlotSave();
		//debug_print("Opening dialog %d\n", argStruct->dialogId);
		MageDialog->showSaveMessageDialog(
			std::string("Save complete.")
		);
		resumeStateStruct->totalLoopsToNextAction = 1;
	} else if (!MageDialog->isOpen) {
		resumeStateStruct->totalLoopsToNextAction = 0;
	}
}

void action_slot_load(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t slotIndex;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSlotLoad;
	auto *argStruct = (ActionSlotLoad*)args;
	//delaying until next tick allows for displaying of an error message on read before resuming
	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		MageGame->saveGameSlotLoad(argStruct->slotIndex);
		resumeStateStruct->totalLoopsToNextAction = 1;
	} else if (!MageDialog->isOpen) {
		resumeStateStruct->totalLoopsToNextAction = 0;
	}
}

void action_slot_erase(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t slotIndex;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSlotErase;
	auto *argStruct = (ActionSlotErase*)args;
	// In the case that someone hacks an on_tick script to save, we don't want it
	// just burning through 8 ROM writes per second, our chip would be fried in a
	// matter on minutes. So how do we counter? Throw up a "Save Completed" dialog
	// that FORCES user interaction to advance from. A player encountering like 10
	// of these dialogs right in a row should hopefully get the hint and reset
	// their board to get out of that dialog lock. Better to protect the player
	// with an annoying confirm dialog than allowing them to quietly burn through
	// the ROM chip's 10000 write cycles.
	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		MageGame->saveGameSlotErase(argStruct->slotIndex);
		//debug_print("Opening dialog %d\n", argStruct->dialogId);
		MageDialog->showSaveMessageDialog(
			std::string("Save erased.")
		);
		resumeStateStruct->totalLoopsToNextAction = 1;
	} else if (!MageDialog->isOpen) {
		resumeStateStruct->totalLoopsToNextAction = 0;
	}
}

void action_set_connect_serial_dialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t serialDialogId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetConnectSerialDialog;
	ActionSetConnectSerialDialog *argStruct = (ActionSetConnectSerialDialog*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->serialDialogId, 1);
	MageCommand->connectSerialDialogId = argStruct->serialDialogId;
}

void action_show_serial_dialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t serialDialogId;
		uint8_t disableNewline;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionShowSerialDialog;
	auto *argStruct = (ActionShowSerialDialog*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->serialDialogId, 1);
	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		MageCommand->showSerialDialog(
			argStruct->serialDialogId,
			argStruct->disableNewline,
			MageScript->currentEntityId
		);
		if(MageCommand->isInputTrapped) {
			resumeStateStruct->totalLoopsToNextAction = 1;
		}
	} else if (!MageCommand->isInputTrapped) {
		if(MageCommand->jumpScriptId != MAGE_NO_SCRIPT) {
			//debug_print(
			//	"jumpScriptId: %d\n",
			//	MageCommand->jumpScriptId
			//);
			MageScript->jumpScriptId = MageCommand->jumpScriptId;
		}
		resumeStateStruct->totalLoopsToNextAction = 0;
	}
}

void action_inventory_get(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t itemId;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionInventoryGet;
	auto *argStruct = (ActionInventoryGet*)args;
	// TODO: implement this
}

void action_inventory_drop(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t itemId;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionInventoryDrop;
	auto *argStruct = (ActionInventoryDrop*)args;
	// TODO: implement this
}

void action_check_inventory(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t itemId;
		uint8_t expectedBool;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckInventory;
	auto *argStruct = (ActionCheckInventory*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->successScriptId, 1);
	// TODO: implement this
}

void action_set_map_look_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t scriptId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetMapLookScript;
	auto *argStruct = (ActionSetMapLookScript*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->scriptId, 1);
	// TODO: implement this
}

void action_set_entity_look_script(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t scriptId;
		uint8_t entityId;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityLookScript;
	auto *argStruct = (ActionSetEntityLookScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	MageScript->setEntityScript(
		argStruct->scriptId,
		entityIndex,
		ON_LOOK
	);
}

void action_set_teleport_enabled(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t value;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetTeleportEnabled;
	auto *argStruct = (ActionSetTeleportEnabled*)args;
	// TODO: implement this
}

void action_check_map(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint16_t mapId;
		uint8_t expectedBool;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckMap;
	auto *argStruct = (ActionCheckMap*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->successScriptId, 1);
	ROM_ENDIAN_U2_BUFFER(&argStruct->mapId, 1);
	// TODO: implement this
}

void action_set_ble_flag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t bleFlagOffset;
		uint8_t newBoolValue;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetBleFlag;
	auto *argStruct = (ActionSetBleFlag*)args;
	// TODO: implement this
}

void action_check_ble_flag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t bleFlagOffset;
		uint8_t expectedBoolValue;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckBleFlag;
	auto *argStruct = (ActionCheckBleFlag*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->successScriptId, 1);
	// TODO: implement this
}

void action_set_serial_dialog_control(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t playerHasControl;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetPlayerControl;
	auto *argStruct = (ActionSetPlayerControl*)args;
	MageCommand->isInputEnabled = argStruct->playerHasControl;
}

void action_register_serial_dialog_command(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t commandStringId;
		uint16_t scriptId;
		uint8_t isFail;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionRegisterSerialDialogVerb;
	auto *argStruct = (ActionRegisterSerialDialogVerb*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->commandStringId, 1);
	ROM_ENDIAN_U2_BUFFER(&argStruct->scriptId, 1);
	MageCommand->registerCommand(
		argStruct->commandStringId,
		argStruct->scriptId,
		argStruct->isFail
	);
}

void action_register_serial_dialog_command_argument(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t commandStringId;
		uint16_t argumentStringId;
		uint16_t scriptId;
		uint8_t paddingG;
	} ActionRegisterSerialDialogVerb;
	auto *argStruct = (ActionRegisterSerialDialogVerb*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->commandStringId, 1);
	ROM_ENDIAN_U2_BUFFER(&argStruct->argumentStringId, 1);
	ROM_ENDIAN_U2_BUFFER(&argStruct->scriptId, 1);
	MageCommand->registerArgument(
		argStruct->commandStringId,
		argStruct->argumentStringId,
		argStruct->scriptId
	);
}

void action_unregister_serial_dialog_command(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t commandStringId;
		uint8_t isFail;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionUnregisterSerialDialogVerb;
	auto *argStruct = (ActionUnregisterSerialDialogVerb*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->commandStringId, 1);
	MageCommand->unregisterCommand(
		argStruct->commandStringId,
		argStruct->isFail
	);
}

void action_unregister_serial_dialog_command_argument(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t commandStringId;
		uint16_t argumentStringId;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionRegisterSerialDialogVerb;
	auto *argStruct = (ActionRegisterSerialDialogVerb*)args;
	ROM_ENDIAN_U2_BUFFER(&argStruct->commandStringId, 1);
	ROM_ENDIAN_U2_BUFFER(&argStruct->argumentStringId, 1);
	MageCommand->unregisterArgument(
		argStruct->commandStringId,
		argStruct->argumentStringId
	);
}

void action_set_entity_movement_relative(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		int8_t relativeDirection;
		uint8_t entityId;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionSetEntityMotionRelative;
	auto *argStruct = (ActionSetEntityMotionRelative*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(
		argStruct->entityId,
		MageScript->currentEntityId
	);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getEntityByMapLocalId(entityIndex);
		entity->direction = MageEntityAnimationDirection (
			(
				entity->direction
				& (255 ^ RENDER_FLAGS_RELATIVE_DIRECTION)
			)
			| argStruct->relativeDirection << 4
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void action_check_dialog_open(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t expectedBool;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckDialogOpen;
	auto *argStruct = (ActionCheckDialogOpen*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	bool value = MageDialog->isOpen;
	if(value == argStruct->expectedBool) {
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_check_serial_dialog_open(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t expectedBool;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckSerialDialogOpen;
	auto *argStruct = (ActionCheckSerialDialogOpen*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	bool value = MageCommand->isInputTrapped;
	if(value == argStruct->expectedBool) {
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}


void action_check_debug_mode(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint16_t successScriptId;
		uint8_t expectedBool;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckSerialDialogOpen;
	auto *argStruct = (ActionCheckSerialDialogOpen*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	bool value = MageGame->isEntityDebugOn;
	if(value == argStruct->expectedBool) {
		MageScript->jumpScriptId = argStruct->successScriptId;
	}
}

void action_close_dialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t paddingA;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCloseDialog;
	auto *argStruct = (ActionCloseDialog*)args;

	MageDialog->closeDialog();
}

void action_close_serial_dialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t paddingA;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckSerialDialogOpen;
	auto *argStruct = (ActionCheckSerialDialogOpen*)args;

	MageCommand->cancelTrap();
}

void action_set_lights_control(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint8_t isEnabled;
		uint8_t paddingB;
		uint8_t paddingC;
		uint8_t paddingD;
		uint8_t paddingE;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckSerialDialogOpen;
	auto *argStruct = (ActionCheckSerialDialogOpen*)args;
	MageGame->isLEDControlEnabled = argStruct->isEnabled;
}

void action_set_lights_state(uint8_t * args, MageScriptState * resumeStateStruct)
{
	typedef struct {
		uint32_t lights;
		uint8_t isEnabled;
		uint8_t paddingF;
		uint8_t paddingG;
	} ActionCheckSerialDialogOpen;
	auto *argStruct = (ActionCheckSerialDialogOpen*)args;
	argStruct->lights = ROM_ENDIAN_U4_VALUE(argStruct->lights);

	// std::string message = "Value of lights is:" + std::to_string(argStruct->lights);
	// MageCommand->processCommand(message.c_str());
	for (uint8_t i = 0; i < LED_COUNT; i += 1) {
		bool current_light = (bool)((argStruct->lights >> i) & 1);
		if (current_light) {
			if (argStruct->isEnabled) {
				ledOn((LEDID) i);
			} else {
				ledOff((LEDID) i);
			}
		}
	}
}


ActionFunctionPointer actionFunctions[MageScriptActionTypeId::NUM_ACTIONS] = {
	&action_null_action,
	&action_check_entity_name,
	&action_check_entity_x,
	&action_check_entity_y,
	&action_check_entity_interact_script,
	&action_check_entity_tick_script,
	&action_check_entity_look_script,
	&action_check_entity_type,
	&action_check_entity_primary_id,
	&action_check_entity_secondary_id,
	&action_check_entity_primary_id_type,
	&action_check_entity_current_animation,
	&action_check_entity_current_frame,
	&action_check_entity_direction,
	&action_check_entity_glitched,
	&action_check_entity_path,
	&action_check_save_flag,
	&action_check_if_entity_is_in_geometry,
	&action_check_for_button_press,
	&action_check_for_button_state,
	&action_check_warp_state,
	&action_run_script,
	&action_blocking_delay,
	&action_non_blocking_delay,
	&action_set_entity_name,
	&action_set_entity_x,
	&action_set_entity_y,
	&action_set_entity_interact_script,
	&action_set_entity_tick_script,
	&action_set_entity_type,
	&action_set_entity_primary_id,
	&action_set_entity_secondary_id,
	&action_set_entity_primary_id_type,
	&action_set_entity_current_animation,
	&action_set_entity_current_frame,
	&action_set_entity_direction,
	&action_set_entity_direction_relative,
	&action_set_entity_direction_target_entity,
	&action_set_entity_direction_target_geometry,
	&action_set_entity_glitched,
	&action_set_entity_path,
	&action_set_save_flag,
	&action_set_player_control,
	&action_set_map_tick_script,
	&action_set_hex_cursor_location,
	&action_set_warp_state,
	&action_set_hex_editor_state,
	&action_set_hex_editor_dialog_mode,
	&action_set_hex_editor_control,
	&action_set_hex_editor_control_clipboard,
	&action_load_map,
	&action_show_dialog,
	&action_play_entity_animation,
	&action_teleport_entity_to_geometry,
	&action_walk_entity_to_geometry,
	&action_walk_entity_along_geometry,
	&action_loop_entity_along_geometry,
	&action_set_camera_to_follow_entity,
	&action_teleport_camera_to_geometry,
	&action_pan_camera_to_entity,
	&action_pan_camera_to_geometry,
	&action_pan_camera_along_geometry,
	&action_loop_camera_along_geometry,
	&action_set_screen_shake,
	&action_screen_fade_out,
	&action_screen_fade_in,
	&action_mutate_variable,
	&action_mutate_variables,
	&action_copy_variable,
	&action_check_variable,
	&action_check_variables,
	&action_slot_save,
	&action_slot_load,
	&action_slot_erase,
	&action_set_connect_serial_dialog,
	&action_show_serial_dialog,
	&action_inventory_get,
	&action_inventory_drop,
	&action_check_inventory,
	&action_set_map_look_script,
	&action_set_entity_look_script,
	&action_set_teleport_enabled,
	&action_check_map,
	&action_set_ble_flag,
	&action_check_ble_flag,
	&action_set_serial_dialog_control,
	&action_register_serial_dialog_command,
	&action_register_serial_dialog_command_argument,
	&action_unregister_serial_dialog_command,
	&action_unregister_serial_dialog_command_argument,
	&action_set_entity_movement_relative,
	&action_check_dialog_open,
	&action_check_serial_dialog_open,
	&action_check_debug_mode,
	&action_close_dialog,
	&action_close_serial_dialog,
	&action_set_lights_control,
	&action_set_lights_state,
};

uint16_t getUsefulGeometryIndexFromActionGeometryId(
	uint16_t geometryId,
	MageEntity *entity
)
{
	uint16_t geometryIndex = geometryId;
	if(geometryIndex == MAGE_ENTITY_PATH) {
		geometryIndex = entity->pathId;
	}
	return geometryIndex;
}

float getProgressOfAction(
	const MageScriptState *resumeStateStruct
) {
	return 1.0f - (
		(float)resumeStateStruct->loopsToNextAction
		/ (float)resumeStateStruct->totalLoopsToNextAction
	);
}

float manageProgressOfAction(
	MageScriptState *resumeStateStruct,
	uint32_t duration
) {
	resumeStateStruct->loopsToNextAction--;
	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		uint16_t totalDelayLoops = duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
		resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
		resumeStateStruct->loopsToNextAction = totalDelayLoops;
	}
	float result = 1.0f - (
		(float)resumeStateStruct->loopsToNextAction
		/ (float)resumeStateStruct->totalLoopsToNextAction
	);
	if (result >= 1.0f) {
		resumeStateStruct->totalLoopsToNextAction = 0;
		resumeStateStruct->loopsToNextAction = 0;
	}
	return result;
}

MageEntityAnimationDirection getRelativeDirection(
	const Point &pointA,
	const Point &pointB
) {
	float angle = atan2f(
		pointB.y - pointA.y,
		pointB.x - pointA.x
	);
	float absoluteAngle = abs(angle);
	MageEntityAnimationDirection direction = SOUTH;
	if(absoluteAngle > 2.356194) {
		direction = WEST;
	} else if(absoluteAngle < 0.785398) {
		direction = EAST;
	} else if (angle < 0) {
		direction = NORTH;
	} else if (angle > 0) {
		direction = SOUTH;
	}
	return direction;
}

Point offsetPointRelativeToEntityCenter(
	const MageEntityRenderableData *renderable,
	const MageEntity *entity,
	const Point *geometryPoint
) {
	return {
		.x = geometryPoint->x - (renderable->center.x - entity->x),
		.y = geometryPoint->y - (renderable->center.y - entity->y),
	};
}

uint16_t getLoopableGeometryPointIndex(
	MageGeometry *geometry,
	uint8_t pointIndex
) {
	uint16_t result = 0;
	if(geometry->pointCount == 1) {
		// handle the derp who made a poly* with 1 point
	} else if (geometry->typeId == POLYGON) {
		result = pointIndex % geometry->pointCount;
	} else if (geometry->typeId == POLYLINE) {
		// haunted, do not touch
		pointIndex %= (geometry->segmentCount * 2);
		result = (pointIndex < geometry->pointCount)
				? pointIndex
				: geometry->segmentCount + (geometry->segmentCount - pointIndex);
	}
	return result;
}

uint16_t getLoopableGeometrySegmentIndex(
	MageGeometry *geometry,
	uint8_t segmentIndex
) {
	uint16_t result = 0;
	if(geometry->pointCount == 1) {
		// handle the derp who made a poly* with 1 point
	} else if (geometry->typeId == POLYGON) {
		result = segmentIndex % geometry->segmentCount;
	} else if (geometry->typeId == POLYLINE) {
		// haunted, do not touch
		segmentIndex %= (geometry->segmentCount * 2);
		uint16_t zeroIndexedSegmentCount = geometry->segmentCount - 1;
		result = (segmentIndex < geometry->segmentCount)
				? segmentIndex
				: zeroIndexedSegmentCount + (zeroIndexedSegmentCount - segmentIndex) + 1;
	}
	return result;
}

void initializeEntityGeometryPath(
	MageScriptState *resumeStateStruct,
	MageEntityRenderableData *renderable,
	MageEntity *entity,
	MageGeometry *geometry
) {
	resumeStateStruct->lengthOfPreviousSegments = 0;
	resumeStateStruct->currentSegmentIndex = 0;
	setResumeStatePointsAndEntityDirection(
		resumeStateStruct,
		renderable,
		entity,
		geometry,
		getLoopableGeometryPointIndex(geometry, 0),
		getLoopableGeometryPointIndex(geometry, 1)
	);
}

void setResumeStatePointsAndEntityDirection(
	MageScriptState *resumeStateStruct,
	MageEntityRenderableData *renderable,
	MageEntity *entity,
	MageGeometry *geometry,
	uint16_t pointAIndex,
	uint16_t pointBIndex
) {
	resumeStateStruct->pointA = offsetPointRelativeToEntityCenter(
		renderable,
		entity,
		&geometry->points[pointAIndex]
	);
	resumeStateStruct->pointB = offsetPointRelativeToEntityCenter(
		renderable,
		entity,
		&geometry->points[pointBIndex]
	);
	entity->direction = MageGame->updateDirectionAndPreserveFlags(
		getRelativeDirection(
			resumeStateStruct->pointA,
			resumeStateStruct->pointB
		),
		entity->direction
	);
}

void setEntityPositionToPoint(
	MageEntity *entity,
	const Point &point
) {
	entity->x = point.x;
	entity->y = point.y;
}

int16_t getUsefulEntityIndexFromActionEntityId(
	uint8_t entityId,
	int16_t callingEntityId
)
{
	int16_t entityIndex = entityId;
	if (entityIndex == MAGE_ENTITY_SELF) {
		entityIndex = callingEntityId;
	} else if (entityIndex == MAGE_ENTITY_PLAYER) {
		entityIndex = MageGame->playerEntityIndex;
	}
	if (entityIndex == MAGE_MAP_ENTITY) {
		//target is the map itself, leave the value alone
	} else if (entityIndex >= MageGame->filteredEntityCountOnThisMap) {
		//if it targets one of the debug entities filtered off the end of the list,
		//treat it like it's not there:
		entityIndex = NO_PLAYER;
	}
	return entityIndex;
}

void mutate(
	MageMutateOperation operation,
	uint16_t *destination,
	uint16_t value
) {
	//protect against division by 0 errors
	uint16_t safeValue = value == 0 ? 1 : value;
	switch(operation) {
		case SET : *destination = value; break;
		case ADD : *destination += value; break;
		case SUB : *destination -= value; break;
		case DIV : *destination /= safeValue; break;
		case MUL : *destination *= value; break;
		case MOD : *destination %= safeValue; break;
		case RNG : *destination = rand() % safeValue; break;
		default : debug_print(
			"mutateVariable received an invalid operation: %d",
			operation
		);
	}
}

bool compare(
	MageCheckComparison comparison,
	uint16_t a,
	uint16_t b
) {
	switch(comparison) {
		case LT   : return a <  b;
		case LTEQ : return a <= b;
		case EQ   : return a == b;
		case GTEQ : return a >= b;
		case GT   : return a >  b;
		default :
			debug_print(
				"checkComparison received an invalid comparison: %d",
				comparison
			);
			return false;
	}
}

bool getButtonStateFromButtonArray(
	uint8_t buttonId, // enum KEYBOARD_KEY, but can't use that type as uint8_t it because it's c, not cpp
	ButtonStates *buttonStates
) {
	//get state of button:
	bool button_activated = false;
	// For some reason, the value of `KEYBOARD_NUM_KEYS` DOESN'T EXIST IN A USEFUL WAY
	// unless you set it into an explicitly typed variable. WTF.
	const uint8_t anyKeyId = KEYBOARD_NUM_KEYS;
	if (buttonId == anyKeyId) { // checking for the elusive `any` key
		for(uint8_t i = 0; i < anyKeyId; i++) {
			button_activated = *(((bool *)buttonStates) + i);
			if(button_activated == true) {
				break;
			}
		}
	} else { // all other keys
		button_activated = *(((bool *)buttonStates) + buttonId);
	}
	return button_activated;
}
