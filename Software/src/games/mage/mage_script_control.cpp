#include "mage_script_control.h"
#include "mage_dialog_control.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "EngineInput.h"

//load in the global variables that the scripts will be operating on:
extern MageGameControl *MageGame;
extern MageHexEditor *MageHex;
extern MageDialogControl *MageDialog;
extern MageScriptControl *MageScript;
extern MageEntity *hackableDataAddress;
extern FrameBuffer *mage_canvas;

void MageScriptControl::initScriptState(
	MageScriptState * resumeStateStruct,
	uint16_t mapLocalScriptId,
	bool scriptIsRunning
)
{
	MageScriptState state;
	//set the values passed to the function first:
	resumeStateStruct->scriptIsRunning = scriptIsRunning;
	resumeStateStruct->mapLocalScriptId = mapLocalScriptId;
	//then set default initializer values for the others:
	//initial action for a new script is always 0:
	resumeStateStruct->actionOffset = 0;
	//init to 0, actions will set is it is needed.
	resumeStateStruct->totalLoopsToNextAction = 0;
	//init to 0, actions will set is it is needed.
	resumeStateStruct->loopsToNextAction = 0;
}

void MageScriptControl::processScript(MageScriptState * resumeStateStruct, uint8_t entityId, MageScriptType scriptType)
{
	//set the current entity to the passed value.
	currentEntityId = entityId;
	//set the current script type to the passed value.
	currentScriptType = scriptType;
	//All script processing from here relies solely on the state of the resumeStateStruct:
	//Make sure you've got your script states correct in the resumeStateStruct array before calling this function:
	mapLocalJumpScript = resumeStateStruct->mapLocalScriptId;
	while(mapLocalJumpScript != MAGE_NO_SCRIPT)
	{
		processActionQueue(resumeStateStruct);
		//check for loadMap:
		if(mapLoadId != MAGE_NO_MAP) { return; }

		//if no new mapLocalJumpScript was set, we can exit the loop immediately.
		if(mapLocalJumpScript == MAGE_NO_SCRIPT)
		{ break; }
		//otherwise, we want to re-init the resumeState to run the new mapLocalJumpScript from the beginning:
		else
		{
			initScriptState(resumeStateStruct, mapLocalJumpScript, true);
		}
	}
}

void MageScriptControl::processActionQueue(MageScriptState * resumeStateStruct)
{
	//reset jump script once processing begins
	mapLocalJumpScript = MAGE_NO_SCRIPT;

	//get the memory address for the script:
	uint32_t address = MageGame->getScriptAddress(
		MageGame->Map().getGlobalScriptId(
			resumeStateStruct->mapLocalScriptId
		)
	);

	//read the action count from ROM:
	//skip the name of the script, we don't need it in this codebase:
	address += 32;

	//read the script's action count:
	uint32_t actionCount = 0;
	EngineROM_Read(
		address,
		sizeof(actionCount),
		(uint8_t *)&actionCount,
		"MageScriptControl::processActionQueue\nFailed to load property 'actionCount'"
	);

	actionCount = ROM_ENDIAN_U4_VALUE(actionCount);
	address += sizeof(actionCount);

	//increment the address by the resumeStateStruct->actionOffset*sizeof(uint64_t) to get to the current action:
	address += resumeStateStruct->actionOffset * sizeof(uint64_t);

	//now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
	//note we're using the value in resumeStateStruct directly as our index so it will update automatically as we proceed:
	for(; resumeStateStruct->actionOffset<actionCount; resumeStateStruct->actionOffset++)
	{
		runAction(address, resumeStateStruct);
		//check for loadMap:
		if(mapLoadId != MAGE_NO_MAP) { return; }

		//non-blocking action check is based on whether resumeStateStruct->totalLoopsToNextAction is set:
		if(resumeStateStruct->totalLoopsToNextAction != 0)
		{
			//if this value is not 0, we need to stop the action now and return later when the countdown is complete:
			//note that resumeStateStruct->actionOffset is set to the NB action's offset since we are using it as an index
			//on the next loop, it should call the same action again. It is up to the action handler function to decide
			//how to complete its action and track how much time is left using the resumeStateStruct's values.
			return;
		}
		//check to see if the action set a mapLocalJumpScript value
		if(mapLocalJumpScript != MAGE_NO_SCRIPT){
			setEntityScript(mapLocalJumpScript, currentEntityId, currentScriptType);
			//immediately end action processing and return if a mapLocalJumpScript value was set:
			return;
		}
		//all actions are exactly 8 bytes long, so we can address increment by one uint64_t
		address += sizeof(uint64_t);
	}
	//if you get here, and mapLocalJumpScript == MAGE_NO_SCRIPT, all actions in the script are done
	if(mapLocalJumpScript == MAGE_NO_SCRIPT)
	{
		//we can now set resumeState.scriptIsRunning to false and end processing the script:
		resumeStateStruct->scriptIsRunning = false;
	}
}

void MageScriptControl::runAction(uint32_t actionMemoryAddress, MageScriptState * resumeStateStruct)
{
	//variable to store action type:
	uint8_t actionTypeId;
	//array for all 7 bytes of argument data:
	uint8_t romValues[MAGE_NUM_ACTION_ARGS];
	//variable to hold function pointer to action function:
	ActionFunctionPointer actionHandlerFunction;

	//get actionTypeId from ROM:
	EngineROM_Read(
		actionMemoryAddress,
		sizeof(actionTypeId),
		(uint8_t *)&actionTypeId,
		"MageScriptControl::runAction\nFailed to load property 'actionTypeId'"
	);
	actionMemoryAddress += sizeof(actionTypeId);

	//validate actionTypeId:
	if(actionTypeId >= MageScriptActionTypeId::NUM_ACTIONS)
	{
		#ifdef DC801_DESKTOP
			fprintf(stderr, "Error in runAction(): actionTypeId (%d) larger than NUM_ACTIONS. Check your scripts.\r\n", actionTypeId);
		#endif
		return;
	}

	//read remaining 7 bytes of argument data into romValues
	EngineROM_Read(
		actionMemoryAddress,
		sizeof(romValues),
		(uint8_t *)&romValues,
		"MageScriptControl::runAction\nFailed to load property 'romValues'"
	);

	//get the function for actionTypeId, and feed it the romValues as args:
	actionHandlerFunction = actionFunctions[actionTypeId];
	(this->*actionHandlerFunction)(romValues, resumeStateStruct);

}

void MageScriptControl::setEntityScript(uint16_t mapLocalScriptId, uint8_t entityId, uint8_t scriptType)
{
	//check for map script first:
	if(entityId == MAGE_MAP_ENTITY)
	{
		if(scriptType == MageScriptType::ON_LOAD)
		{
			MageGame->Map().setOnLoad(mapLocalScriptId);
		}
		else if(scriptType == MageScriptType::ON_TICK)
		{
			MageGame->Map().setOnTick(mapLocalScriptId);
		}
	}
	//if it's not a map script, set the appropriate entity's script value:
	if(scriptType == MageScriptType::ON_INTERACT)
	{
		MageGame->entities[entityId].onInteractScriptId = mapLocalScriptId;
	}
	else if(scriptType == MageScriptType::ON_TICK)
	{
		MageGame->entities[entityId].onTickScriptId = mapLocalScriptId;
	}
}

uint16_t MageScriptControl::getUsefulGeometryIndexFromActionGeometryId(
	uint16_t geometryId,
	MageEntity *entity
)
{
	uint16_t geometryIndex = geometryId;
	if(geometryIndex == MAGE_ENTITY_PATH) {
		geometryIndex = ROM_ENDIAN_U2_VALUE(
			*(uint16_t *)((uint8_t *)&entity->hackableStateA)
		);
	}
	return geometryIndex;
}

void MageScriptControl::nullAction(uint8_t * args, MageScriptState * resumeStateStruct)
{
	//nullAction does nothing.
}

void MageScriptControl::checkEntityName(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityName *argStruct = (ActionCheckEntityName*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		std::string romString = MageGame->getString(argStruct->stringId, currentEntityId);
		std::string entityName = MageGame->getEntityNameStringById(entityIndex);
		int compare = strcmp(entityName.c_str(), romString.c_str());
		bool identical = compare == 0;
		if(identical == argStruct->expectedBoolValue) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityX(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityX *argStruct = (ActionCheckEntityX*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->x == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityY(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityX *argStruct = (ActionCheckEntityX*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->y == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityInteractScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityInteractScript *argStruct = (ActionCheckEntityInteractScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedScript = ROM_ENDIAN_U2_VALUE(argStruct->expectedScript);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->onInteractScriptId == argStruct->expectedScript);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityTickScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityTickScript *argStruct = (ActionCheckEntityTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedScript = ROM_ENDIAN_U2_VALUE(argStruct->expectedScript);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->onTickScriptId == argStruct->expectedScript);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityType(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityType *argStruct = (ActionCheckEntityType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->entityTypeId = ROM_ENDIAN_U2_VALUE(argStruct->entityTypeId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t sanitizedEntityTypeId = MageGame->getValidEntityTypeId(entity->primaryId);
		bool identical = (
			sanitizedEntityTypeId == argStruct->entityTypeId &&
			entity->primaryIdType == ENTITY_TYPE
		);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityPrimaryId(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityPrimaryId *argStruct = (ActionCheckEntityPrimaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->primaryId == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntitySecondaryId(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntitySecondaryId *argStruct = (ActionCheckEntitySecondaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->secondaryId == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityPrimaryIdType(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityPrimaryIdType *argStruct = (ActionCheckEntityPrimaryIdType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->primaryIdType == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityCurrentAnimation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityCurrentAnimation *argStruct = (ActionCheckEntityCurrentAnimation*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->currentAnimation == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityCurrentFrame(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityCurrentFrame *argStruct = (ActionCheckEntityCurrentFrame*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->currentFrame == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityDirection(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityDirection *argStruct = (ActionCheckEntityDirection*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->direction == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityHackableStateA(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateA *argStruct = (ActionCheckEntityHackableStateA*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->hackableStateA == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityHackableStateB(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateB *argStruct = (ActionCheckEntityHackableStateB*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->hackableStateB == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityHackableStateC(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateC *argStruct = (ActionCheckEntityHackableStateC*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->hackableStateC == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkEntityHackableStateD(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateD *argStruct = (ActionCheckEntityHackableStateD*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		bool identical = (entity->hackableStateD == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

// Need to verify the u2 conversion of bytes is working -Tim
void MageScriptControl::checkEntityHackableStateAU2(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateAU2 *argStruct = (ActionCheckEntityHackableStateAU2*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t u2_value = ROM_ENDIAN_U2_VALUE(
			*(uint16_t *)((uint8_t *)&entity->hackableStateA)
		);
		bool identical = (u2_value == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

//Need to verify encoding of u2_value variable works correctly -Tim
void MageScriptControl::checkEntityHackableStateCU2(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateCU2 *argStruct = (ActionCheckEntityHackableStateCU2*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t u2_value = ROM_ENDIAN_U2_VALUE(
			*(uint16_t *)((uint8_t *)&entity->hackableStateC)
		);
		bool identical = (u2_value == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

//Need to verify encoding of u4_value variable works correctly -Tim
void MageScriptControl::checkEntityHackableStateAU4(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityHackableStateAU4 *argStruct = (ActionCheckEntityHackableStateAU4*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->expectedValue = ROM_ENDIAN_U4_VALUE(argStruct->expectedValue);
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint32_t u4_value = ROM_ENDIAN_U4_VALUE(
			*(uint32_t *)((uint8_t *)&entity->hackableStateA)
		);
		if(u4_value == argStruct->expectedValue) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

// Need to verify which two bytes make up the pathId. I think it's A and B, so that's what I put in here for now. -Tim
void MageScriptControl::checkEntityPath(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityPath *argStruct = (ActionCheckEntityPath*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->expectedValue = ROM_ENDIAN_U2_VALUE(argStruct->expectedValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t pathId = ROM_ENDIAN_U2_VALUE(
			*(uint16_t *)((uint8_t *)&entity->hackableStateC)
		);
		bool identical = (pathId == argStruct->expectedValue);
		if(identical == argStruct->expectedBool) {
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

//waiting for implementation of Save Flag System to implement -Tim
void MageScriptControl::checkSaveFlag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckSaveFlag *argStruct = (ActionCheckSaveFlag*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->saveFlagOffset = ROM_ENDIAN_U2_VALUE(argStruct->saveFlagOffset);
	uint16_t byteOffset = argStruct->saveFlagOffset / 8;
	uint8_t bitOffset = argStruct->saveFlagOffset % 8;
	uint8_t currentByteValue = saveFlags[byteOffset];
	bool bitValue = (currentByteValue >> bitOffset) & 0x01u;

	if(bitValue == argStruct->expectedBoolValue) {
		mapLocalJumpScript = argStruct->successScriptId;
	}
}

void MageScriptControl::checkIfEntityIsInGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckifEntityIsInGeometry *argStruct = (ActionCheckifEntityIsInGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
		bool colliding = geometry.isPointInGeometry(renderable->center);
		if(colliding == argStruct->expectedBoolValue) {
			//convert mapLocalScriptId from local to global scope and assign to mapLocalJumpScript:
			mapLocalJumpScript = argStruct->successScriptId;
		}
	}
}

void MageScriptControl::checkForButtonPress(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckForButtonPress *argStruct = (ActionCheckForButtonPress*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	//get state of button:
	bool *button_address = (bool*)(&EngineInput_Activated) + argStruct->buttonId;
	bool button_activated = *button_address;
	if(button_activated)
	{
		//convert mapLocalScriptId from local to global scope and assign to mapLocalJumpScript:
		mapLocalJumpScript = argStruct->successScriptId;
	}
}

void MageScriptControl::checkForButtonState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckForButtonState *argStruct = (ActionCheckForButtonState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);

	//get state of button:
	bool *button_address = (bool*)(&EngineInput_Buttons) + argStruct->buttonId;
	bool button_state = *button_address;
	if(button_state == (bool)(argStruct->expectedBoolValue))
	{
		//convert mapLocalScriptId from local to global scope and assign to mapLocalJumpScript:
		mapLocalJumpScript = argStruct->successScriptId;
	}
}

void MageScriptControl::checkWarpState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckWarpState *argStruct = (ActionCheckWarpState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = ROM_ENDIAN_U2_VALUE(argStruct->successScriptId);
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	bool doesWarpStateMatch = MageGame->warpState == argStruct->stringId;
	if(doesWarpStateMatch == (bool)(argStruct->expectedBoolValue))
	{
		//convert mapLocalScriptId from local to global scope and assign to mapLocalJumpScript:
		mapLocalJumpScript = argStruct->successScriptId;
	}
}

void MageScriptControl::runScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionRunScript *argStruct = (ActionRunScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	//convert mapLocalScriptId from local to global scope and assign to mapLocalJumpScript:
	mapLocalJumpScript = argStruct->scriptId;
}

void MageScriptControl::blockingDelay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionBlockingDelay *argStruct = (ActionBlockingDelay*)args;
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
		blockingDelayTime = (blockingDelayTime < argStruct->duration) ? argStruct->duration : blockingDelayTime;
		//now set the resumeStateStruct variables:
		resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
		resumeStateStruct->loopsToNextAction = totalDelayLoops;
	}
}

void MageScriptControl::nonBlockingDelay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionNonBlockingDelay *argStruct = (ActionNonBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

	manageProgressOfAction(
		resumeStateStruct,
		argStruct->duration
	);
}

//Need to implement -Tim
void MageScriptControl::pauseGame(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPauseGame *argStruct = (ActionPauseGame*)args;
}

void MageScriptControl::pauseEntityScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPauseEntityScript *argStruct = (ActionPauseEntityScript*)args;

	//Get the entity:
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		// TODO: Get the target scriptType resumeStateStruct
		// TODO: Add `resumeStateStruct.isPaused` and toggle it
	}
}

void MageScriptControl::setEntityName(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityName *argStruct = (ActionSetEntityName*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	//get the string from the stringId:
	std::string romString = MageGame->getString(argStruct->stringId, currentEntityId);
	//Get the entity:
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		//simple loop to set the name:
		//Note: this will stop at the first null character and leave any data after it in place.
		for(int i=0; i<MAGE_ENTITY_NAME_LENGTH; i++) {
			entity->name[i] = romString[i];
			if(romString[i] == 00) {
				break;
			}
		}
	}
}

void MageScriptControl::setEntityX(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityX *argStruct = (ActionSetEntityX*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->x = argStruct->newValue;
	}
}

void MageScriptControl::setEntityY(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityY *argStruct = (ActionSetEntityY*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->y = argStruct->newValue;
	}
}

void MageScriptControl::setEntityInteractScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityInteractScript *argStruct = (ActionSetEntityInteractScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	setEntityScript(
		argStruct->scriptId,
		getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId),
		ON_INTERACT
	);
}

void MageScriptControl::setEntityTickScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityTickScript *argStruct = (ActionSetEntityTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	setEntityScript(
		argStruct->scriptId,
		getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId),
		ON_TICK
	);
}

void MageScriptControl::setEntityType(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityType *argStruct = (ActionSetEntityType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->entityTypeId = ROM_ENDIAN_U2_VALUE(argStruct->entityTypeId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->primaryId = argStruct->entityTypeId;
		entity->primaryIdType = ENTITY_TYPE;
	}
}

void MageScriptControl::setEntityPrimaryId(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityPrimaryId *argStruct = (ActionSetEntityPrimaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->primaryId = argStruct->newValue;
	}
}

void MageScriptControl::setEntitySecondaryId(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntitySecondaryId *argStruct = (ActionSetEntitySecondaryId*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->secondaryId = argStruct->newValue;
	}
}

void MageScriptControl::setEntityPrimaryIdType(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityPrimaryIdType *argStruct = (ActionSetEntityPrimaryIdType*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->primaryIdType = argStruct->newValue;
	}
}

void MageScriptControl::setEntityCurrentAnimation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityCurrentAnimation *argStruct = (ActionSetEntityCurrentAnimation*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->currentAnimation = argStruct->newValue;
	}
}

void MageScriptControl::setEntityCurrentFrame(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityCurrentFrame *argStruct = (ActionSetEntityCurrentFrame*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->currentFrame = argStruct->newValue;
	}
}

void MageScriptControl::setEntityDirection(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityDirection *argStruct = (ActionSetEntityDirection*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->direction = MageGame->getValidEntityTypeDirection(argStruct->direction);
	}
}

void MageScriptControl::setEntityDirectionRelative(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityDirectionRelative *argStruct = (ActionSetEntityDirectionRelative*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->direction = (
			entity->direction + NUM_DIRECTIONS + argStruct->relativeDirection
		) % NUM_DIRECTIONS;
	}
}

void MageScriptControl::setEntityDirectionTargetEntity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityDirectionTargetEntity *argStruct = (ActionSetEntityDirectionTargetEntity*)args;

	int16_t targetEntityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->targetEntityId, currentEntityId);
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(
		entityIndex != NO_PLAYER
		&& targetEntityIndex != NO_PLAYER
	) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		MageEntityRenderableData *targetRenderable = MageGame->getValidEntityRenderableData(targetEntityIndex);
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		entity->direction = getRelativeDirection(
			renderable->center,
			targetRenderable->center
		);
	}
}

void MageScriptControl::setEntityDirectionTargetGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityDirectionTargetGeometry *argStruct = (ActionSetEntityDirectionTargetGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->targetGeometryId = ROM_ENDIAN_U2_VALUE(argStruct->targetGeometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->targetGeometryId, entity);
		MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
		entity->direction = getRelativeDirection(
			renderable->center,
			geometry.points[0]
		);
	}
}

void MageScriptControl::setEntityHackableStateA(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateA *argStruct = (ActionSetEntityHackableStateA*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->hackableStateA = argStruct->newValue;
	}
}

void MageScriptControl::setEntityHackableStateB(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateB *argStruct = (ActionSetEntityHackableStateB*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->hackableStateB = argStruct->newValue;
	}
}

void MageScriptControl::setEntityHackableStateC(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateC *argStruct = (ActionSetEntityHackableStateC*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->hackableStateC = argStruct->newValue;
	}
}

void MageScriptControl::setEntityHackableStateD(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateD *argStruct = (ActionSetEntityHackableStateD*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->hackableStateD = argStruct->newValue;
	}
}

//need to verify that u2 values are set correctly in the struct. -Tim
void MageScriptControl::setEntityHackableStateAU2(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateAU2 *argStruct = (ActionSetEntityHackableStateAU2*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		*(uint16_t *)((uint8_t *)&entity->hackableStateA) = argStruct->newValue;
	}
}

//need to verify that u2 values are set correctly in the struct. -Tim
void MageScriptControl::setEntityHackableStateCU2(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateCU2 *argStruct = (ActionSetEntityHackableStateCU2*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		*(uint16_t *)((uint8_t *)&entity->hackableStateC) = argStruct->newValue;
	}
}

//need to verify that u4 values are set correctly in the struct. -Tim
void MageScriptControl::setEntityHackableStateAU4(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityHackableStateAU4 *argStruct = (ActionSetEntityHackableStateAU4*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U4_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		*(uint32_t *)((uint8_t *)&entity->hackableStateA) = argStruct->newValue;
	}
}

//need to verify that u2 values are set correctly in the struct. -Tim
void MageScriptControl::setEntityPath(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityPath *argStruct = (ActionSetEntityPath*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->newValue = ROM_ENDIAN_U2_VALUE(argStruct->newValue);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		*(uint16_t *)((uint8_t *)&entity->hackableStateC) = argStruct->newValue;
	}
}

void MageScriptControl::setSaveFlag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetSaveFlag *argStruct = (ActionSetSaveFlag*)args;
	argStruct->saveFlagOffset = ROM_ENDIAN_U2_VALUE(argStruct->saveFlagOffset);
	uint16_t byteOffset = argStruct->saveFlagOffset / 8;
	uint8_t bitOffset = argStruct->saveFlagOffset % 8;
	uint8_t currentByteValue = saveFlags[byteOffset];

	if(argStruct->newBoolValue) {
		currentByteValue |= 0x01u << bitOffset;
	} else {
		// tilde operator inverts all the bits on a byte; Bitwise NOT
		currentByteValue &= ~(0x01u << bitOffset);
	}
	saveFlags[byteOffset] = currentByteValue;
}

void MageScriptControl::setPlayerControl(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetPlayerControl *argStruct = (ActionSetPlayerControl*)args;
	MageGame->playerHasControl = argStruct->playerHasControl;
}

void MageScriptControl::setMapTickScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetMapTickScript *argStruct = (ActionSetMapTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = ROM_ENDIAN_U2_VALUE(argStruct->scriptId);

	setEntityScript(
		argStruct->scriptId,
		MAGE_MAP_ENTITY,
		ON_TICK
	);
}

void MageScriptControl::setHexCursorLocation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexCursorLocation *argStruct = (ActionSetHexCursorLocation*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->byteAddress = ROM_ENDIAN_U2_VALUE(argStruct->byteAddress);

	MageHex->setHexCursorLocation(argStruct->byteAddress);
}

//Need to implement a set-current-byte-value type function on MageHex for this to work. -Tim
void MageScriptControl::setHexBits(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexBits *argStruct = (ActionSetHexBits*)args;

}

void MageScriptControl::setWarpState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetWarpState *argStruct = (ActionSetWarpState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->stringId = ROM_ENDIAN_U2_VALUE(argStruct->stringId);

	MageGame->warpState = argStruct->stringId;
}

//Need to implement locking and unlocking in MageHex for this to work -Tim
void MageScriptControl::unlockHaxCell(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionUnlockHaxCell *argStruct = (ActionUnlockHaxCell*)args;

}

//Need to implement locking and unlocking in MageHex for this to work -Tim
void MageScriptControl::lockHaxCell(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLockHaxCell *argStruct = (ActionLockHaxCell*)args;

}

void MageScriptControl::setHexEditorState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexEditorState *argStruct = (ActionSetHexEditorState*)args;

	if(MageHex->getHexEditorState() != argStruct->state)
	{
		MageHex->toggleHexEditor();
	}
}

void MageScriptControl::setHexEditorDialogMode(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexEditorDialogMode *argStruct = (ActionSetHexEditorDialogMode*)args;

	if(MageHex->getHexDialogState() != argStruct->state)
	{
		MageHex->toggleHexDialog();
	}
}

void MageScriptControl::loadMap(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoadMap *argStruct = (ActionLoadMap*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->mapId = ROM_ENDIAN_U2_VALUE(argStruct->mapId);

	mapLoadId = MageGame->getValidMapId(argStruct->mapId);
}

void MageScriptControl::showDialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionShowDialog *argStruct = (ActionShowDialog*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->dialogId = ROM_ENDIAN_U2_VALUE(argStruct->dialogId);

	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		//debug_print("Opening dialog %d\n", argStruct->dialogId);
		MageDialog->load(argStruct->dialogId, currentEntityId);
		resumeStateStruct->totalLoopsToNextAction = 1;
	} else if (!MageDialog->isOpen) {
		resumeStateStruct->totalLoopsToNextAction = 0;
	}
}

void MageScriptControl::playEntityAnimation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPlayEntityAnimation *argStruct = (ActionPlayEntityAnimation*)args;

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		entity->currentAnimation = argStruct->animationId;
		// TODO: Implement the non-blocking `argStruct->playCount` part
	}
}

void MageScriptControl::teleportEntityToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionTeleportEntityToGeometry *argStruct = (ActionTeleportEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
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

void MageScriptControl::walkEntityToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionWalkEntityToGeometry *argStruct = (ActionWalkEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
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
			entity->direction = getRelativeDirection(
				resumeStateStruct->pointA,
				resumeStateStruct->pointB
			);
			entity->currentAnimation = 1;
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
			entity->currentAnimation = 0;
			entity->currentFrame = 0;
			resumeStateStruct->totalLoopsToNextAction = 0;
		}
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void MageScriptControl::walkEntityAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionWalkEntityAlongGeometry *argStruct = (ActionWalkEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
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
			entity->currentAnimation = 1;
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
			entity->currentAnimation = 0;
			entity->currentFrame = 0;
		}
		MageGame->updateEntityRenderableData(entityIndex);
	}
}
void MageScriptControl::loopEntityAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoopEntityAlongGeometry *argStruct = (ActionLoopEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
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
			entity->currentAnimation = 1;
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

void MageScriptControl::setCameraToFollowEntity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetCameraToFollowEntity *argStruct = (ActionSetCameraToFollowEntity*)args;
	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	MageGame->cameraFollowEntityId = entityIndex;
}

void MageScriptControl::teleportCameraToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionTeleportCameraToGeometry *argStruct = (ActionTeleportCameraToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	MageEntity *entity = MageGame->getValidEntity(currentEntityId);
	uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
	MageGeometry geometry = MageGame->getGeometryFromMapLocalId(geometryIndex);
	MageGame->cameraFollowEntityId = NO_PLAYER;
	MageGame->cameraPosition.x = geometry.points[0].x - HALF_WIDTH;
	MageGame->cameraPosition.y = geometry.points[0].y - HALF_HEIGHT;
}

void MageScriptControl::panCameraToEntity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPanCameraToEntity *argStruct = (ActionPanCameraToEntity*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId, currentEntityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);

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

void MageScriptControl::panCameraToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPanCameraToGeometry *argStruct = (ActionPanCameraToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

	MageEntity *entity = MageGame->getValidEntity(currentEntityId);
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

void MageScriptControl::panCameraAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPanCameraAlongGeometry *argStruct = (ActionPanCameraAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

}

void MageScriptControl::loopCameraAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoopCameraAlongGeometry *argStruct = (ActionLoopCameraAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = ROM_ENDIAN_U4_VALUE(argStruct->duration);
	argStruct->geometryId = ROM_ENDIAN_U2_VALUE(argStruct->geometryId);

}

void MageScriptControl::setScreenShake(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetScreenShake *argStruct = (ActionSetScreenShake*)args;
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
void MageScriptControl::screenFadeOut(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionScreenFadeOut *argStruct = (ActionScreenFadeOut*)args;
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
void MageScriptControl::screenFadeIn(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionScreenFadeIn *argStruct = (ActionScreenFadeIn*)args;
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
void MageScriptControl::playSoundContinuous(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPlaySoundContinuous *argStruct = (ActionPlaySoundContinuous*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->soundId = ROM_ENDIAN_U2_VALUE(argStruct->soundId);
}
void MageScriptControl::playSoundInterrupt(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPlaySoundInterrupt *argStruct = (ActionPlaySoundInterrupt*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->soundId = ROM_ENDIAN_U2_VALUE(argStruct->soundId);
}

MageScriptControl::MageScriptControl()
{
	mapLocalJumpScript = MAGE_NO_SCRIPT;

	blockingDelayTime = 0;

	mapLoadId = MAGE_NO_MAP;

	//these should never be used in their initialized states, they will always be set when calling processScript()
	currentEntityId = MAGE_MAP_ENTITY;
	currentScriptType = ON_LOAD;

	initScriptState(&mapLoadResumeState, MAGE_NO_SCRIPT, false);
	initScriptState(&mapTickResumeState, MAGE_NO_SCRIPT, false);

	for(uint16_t e=0; e<MAX_ENTITIES_PER_MAP; e++)
	{
		initScriptState(&entityInteractResumeStates[e], MAGE_NO_SCRIPT, false);
		initScriptState(&entityTickResumeStates[e], MAGE_NO_SCRIPT, false);
	}

	//this is the array of action functions that will be called by scripts.
	//the array index corresponds to the enum value of the script that is
	//stored in the ROM file, so it calls the correct function automatically.
	actionFunctions[MageScriptActionTypeId::NULL_ACTION] = &MageScriptControl::nullAction;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_NAME] = &MageScriptControl::checkEntityName;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_X] = &MageScriptControl::checkEntityX;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_Y] = &MageScriptControl::checkEntityY;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_INTERACT_SCRIPT] = &MageScriptControl::checkEntityInteractScript;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_TICK_SCRIPT] = &MageScriptControl::checkEntityTickScript;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_TYPE] = &MageScriptControl::checkEntityType;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_PRIMARY_ID] = &MageScriptControl::checkEntityPrimaryId;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_SECONDARY_ID] = &MageScriptControl::checkEntitySecondaryId;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_PRIMARY_ID_TYPE] = &MageScriptControl::checkEntityPrimaryIdType;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_CURRENT_ANIMATION] = &MageScriptControl::checkEntityCurrentAnimation;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_CURRENT_FRAME] = &MageScriptControl::checkEntityCurrentFrame;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_DIRECTION] = &MageScriptControl::checkEntityDirection;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_A] = &MageScriptControl::checkEntityHackableStateA;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_B] = &MageScriptControl::checkEntityHackableStateB;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_C] = &MageScriptControl::checkEntityHackableStateC;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_D] = &MageScriptControl::checkEntityHackableStateD;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_A_U2] = &MageScriptControl::checkEntityHackableStateAU2;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_C_U2] = &MageScriptControl::checkEntityHackableStateCU2;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_HACKABLE_STATE_A_U4] = &MageScriptControl::checkEntityHackableStateAU4;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_PATH] = &MageScriptControl::checkEntityPath;
	actionFunctions[MageScriptActionTypeId::CHECK_SAVE_FLAG] = &MageScriptControl::checkSaveFlag;
	actionFunctions[MageScriptActionTypeId::CHECK_IF_ENTITY_IS_IN_GEOMETRY] = &MageScriptControl::checkIfEntityIsInGeometry;
	actionFunctions[MageScriptActionTypeId::CHECK_FOR_BUTTON_PRESS] = &MageScriptControl::checkForButtonPress;
	actionFunctions[MageScriptActionTypeId::CHECK_FOR_BUTTON_STATE] = &MageScriptControl::checkForButtonState;
	actionFunctions[MageScriptActionTypeId::CHECK_WARP_STATE] = &MageScriptControl::checkWarpState;
	actionFunctions[MageScriptActionTypeId::RUN_SCRIPT] = &MageScriptControl::runScript;
	actionFunctions[MageScriptActionTypeId::BLOCKING_DELAY] = &MageScriptControl::blockingDelay;
	actionFunctions[MageScriptActionTypeId::NON_BLOCKING_DELAY] = &MageScriptControl::nonBlockingDelay;
	actionFunctions[MageScriptActionTypeId::PAUSE_GAME] = &MageScriptControl::pauseGame;
	actionFunctions[MageScriptActionTypeId::PAUSE_ENTITY_SCRIPT] = &MageScriptControl::pauseEntityScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_NAME] = &MageScriptControl::setEntityName;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_X] = &MageScriptControl::setEntityX;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_Y] = &MageScriptControl::setEntityY;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_INTERACT_SCRIPT] = &MageScriptControl::setEntityInteractScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_TICK_SCRIPT] = &MageScriptControl::setEntityTickScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_TYPE] = &MageScriptControl::setEntityType;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_PRIMARY_ID] = &MageScriptControl::setEntityPrimaryId;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_SECONDARY_ID] = &MageScriptControl::setEntitySecondaryId;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_PRIMARY_ID_TYPE] = &MageScriptControl::setEntityPrimaryIdType;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_CURRENT_ANIMATION] = &MageScriptControl::setEntityCurrentAnimation;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_CURRENT_FRAME] = &MageScriptControl::setEntityCurrentFrame;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_DIRECTION] = &MageScriptControl::setEntityDirection;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_DIRECTION_RELATIVE] = &MageScriptControl::setEntityDirectionRelative;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_DIRECTION_TARGET_ENTITY] = &MageScriptControl::setEntityDirectionTargetEntity;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_DIRECTION_TARGET_GEOMETRY] = &MageScriptControl::setEntityDirectionTargetGeometry;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_A] = &MageScriptControl::setEntityHackableStateA;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_B] = &MageScriptControl::setEntityHackableStateB;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_C] = &MageScriptControl::setEntityHackableStateC;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_D] = &MageScriptControl::setEntityHackableStateD;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_A_U2] = &MageScriptControl::setEntityHackableStateAU2;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_C_U2] = &MageScriptControl::setEntityHackableStateCU2;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_HACKABLE_STATE_A_U4] = &MageScriptControl::setEntityHackableStateAU4;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_PATH] = &MageScriptControl::setEntityPath;
	actionFunctions[MageScriptActionTypeId::SET_SAVE_FLAG] = &MageScriptControl::setSaveFlag;
	actionFunctions[MageScriptActionTypeId::SET_PLAYER_CONTROL] = &MageScriptControl::setPlayerControl;
	actionFunctions[MageScriptActionTypeId::SET_MAP_TICK_SCRIPT] = &MageScriptControl::setMapTickScript;
	actionFunctions[MageScriptActionTypeId::SET_HEX_CURSOR_LOCATION] = &MageScriptControl::setHexCursorLocation;
	actionFunctions[MageScriptActionTypeId::SET_HEX_BITS] = &MageScriptControl::setHexBits;
	actionFunctions[MageScriptActionTypeId::SET_WARP_STATE] = &MageScriptControl::setWarpState;
	actionFunctions[MageScriptActionTypeId::UNLOCK_HAX_CELL] = &MageScriptControl::unlockHaxCell;
	actionFunctions[MageScriptActionTypeId::LOCK_HAX_CELL] = &MageScriptControl::lockHaxCell;
	actionFunctions[MageScriptActionTypeId::SET_HEX_EDITOR_STATE] = &MageScriptControl::setHexEditorState;
	actionFunctions[MageScriptActionTypeId::SET_HEX_EDITOR_DIALOG_MODE] = &MageScriptControl::setHexEditorDialogMode;
	actionFunctions[MageScriptActionTypeId::LOAD_MAP] = &MageScriptControl::loadMap;
	actionFunctions[MageScriptActionTypeId::SHOW_DIALOG] = &MageScriptControl::showDialog;
	actionFunctions[MageScriptActionTypeId::PLAY_ENTITY_ANIMATION] = &MageScriptControl::playEntityAnimation;
	actionFunctions[MageScriptActionTypeId::TELEPORT_ENTITY_TO_GEOMETRY] = &MageScriptControl::teleportEntityToGeometry;
	actionFunctions[MageScriptActionTypeId::WALK_ENTITY_TO_GEOMETRY] = &MageScriptControl::walkEntityToGeometry;
	actionFunctions[MageScriptActionTypeId::WALK_ENTITY_ALONG_GEOMETRY] = &MageScriptControl::walkEntityAlongGeometry;
	actionFunctions[MageScriptActionTypeId::LOOP_ENTITY_ALONG_GEOMETRY] = &MageScriptControl::loopEntityAlongGeometry;
	actionFunctions[MageScriptActionTypeId::SET_CAMERA_TO_FOLLOW_ENTITY] = &MageScriptControl::setCameraToFollowEntity;
	actionFunctions[MageScriptActionTypeId::TELEPORT_CAMERA_TO_GEOMETRY] = &MageScriptControl::teleportCameraToGeometry;
	actionFunctions[MageScriptActionTypeId::PAN_CAMERA_TO_ENTITY] = &MageScriptControl::panCameraToEntity;
	actionFunctions[MageScriptActionTypeId::PAN_CAMERA_TO_GEOMETRY] = &MageScriptControl::panCameraToGeometry;
	actionFunctions[MageScriptActionTypeId::PAN_CAMERA_ALONG_GEOMETRY] = &MageScriptControl::panCameraAlongGeometry;
	actionFunctions[MageScriptActionTypeId::LOOP_CAMERA_ALONG_GEOMETRY] = &MageScriptControl::loopCameraAlongGeometry;
	actionFunctions[MageScriptActionTypeId::SET_SCREEN_SHAKE] = &MageScriptControl::setScreenShake;
	actionFunctions[MageScriptActionTypeId::SCREEN_FADE_OUT] = &MageScriptControl::screenFadeOut;
	actionFunctions[MageScriptActionTypeId::SCREEN_FADE_IN] = &MageScriptControl::screenFadeIn;
	actionFunctions[MageScriptActionTypeId::PLAY_SOUND_CONTINUOUS] = &MageScriptControl::playSoundContinuous;
	actionFunctions[MageScriptActionTypeId::PLAY_SOUND_INTERRUPT] = &MageScriptControl::playSoundInterrupt;

}

uint32_t MageScriptControl::size() const
{
	uint32_t size =
		sizeof(mapLocalJumpScript) +
		sizeof(blockingDelayTime) +
		sizeof(mapLoadId) +
		sizeof(currentEntityId) +
		sizeof(currentScriptType) +
		sizeof(MageScriptState) + //mapLoadResumeState
		sizeof(MageScriptState) + //mapTickResumeState
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityInteractResumeStates
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityTickResumeStates
		sizeof(ActionFunctionPointer)*MageScriptActionTypeId::NUM_ACTIONS; //function pointer array
	return size;
}

MageScriptState* MageScriptControl::getMapLoadResumeState()
{
	return &mapLoadResumeState;
}

MageScriptState* MageScriptControl::getMapTickResumeState()
{
	return &mapTickResumeState;
}

MageScriptState* MageScriptControl::getEntityInteractResumeState(uint8_t index)
{
	return &entityInteractResumeStates[index];
}

MageScriptState* MageScriptControl::getEntityTickResumeState(uint8_t index)
{
	return &entityTickResumeStates[index];
}

float MageScriptControl::getProgressOfAction(
	const MageScriptState *resumeStateStruct
) const {
	return 1.0f - (
		(float)resumeStateStruct->loopsToNextAction
		/ (float)resumeStateStruct->totalLoopsToNextAction
	);
}

float MageScriptControl::manageProgressOfAction(
	MageScriptState *resumeStateStruct,
	uint32_t duration
) const {
	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		uint16_t totalDelayLoops = duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
		resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
		resumeStateStruct->loopsToNextAction = totalDelayLoops;
	}
	resumeStateStruct->loopsToNextAction--;
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

MageEntityAnimationDirection MageScriptControl::getRelativeDirection(
	const Point &pointA,
	const Point &pointB
) const {
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

Point MageScriptControl::offsetPointRelativeToEntityCenter(
	const MageEntityRenderableData *renderable,
	const MageEntity *entity,
	const Point *geometryPoint
) const {
	return {
		.x = geometryPoint->x - (renderable->center.x - entity->x),
		.y = geometryPoint->y - (renderable->center.y - entity->y),
	};
}

uint16_t MageScriptControl::getLoopableGeometryPointIndex(
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

uint16_t MageScriptControl::getLoopableGeometrySegmentIndex(
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

void MageScriptControl::initializeEntityGeometryPath(
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

void MageScriptControl::setResumeStatePointsAndEntityDirection(
	MageScriptState *resumeStateStruct,
	MageEntityRenderableData *renderable,
	MageEntity *entity,
	MageGeometry *geometry,
	uint16_t pointAIndex,
	uint16_t pointBIndex
) const {
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
	entity->direction = getRelativeDirection(
		resumeStateStruct->pointA,
		resumeStateStruct->pointB
	);
}

void MageScriptControl::setEntityPositionToPoint(
	MageEntity *entity,
	const Point &point
) const {
	entity->x = point.x;
	entity->y = point.y;
}

void MageScriptControl::handleMapOnLoadScript(bool isFirstRun)
{
	//since this should only run once when a map is loaded, and then proceed through the script once,
	//we only need to check the isFirstRun argument to see if we should initialize based on the
	//map's onLoad mapLocalScriptId or if we should resume from the state of the mapLoadResumeState struct.
	if(isFirstRun)
	{
		initScriptState(&mapLoadResumeState, MageGame->Map().getMapLocalMapOnLoadScriptId(), true);
	}
	//this checks to see if the map onLoad script is complete and returns if it is:
	if(!mapLoadResumeState.scriptIsRunning)
	{
		return;
	}
	//otherwise, the load script is still running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the mapLocalScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&mapLoadResumeState, MAGE_MAP_ENTITY, MageScriptType::ON_LOAD);
}

void MageScriptControl::handleMapOnTickScript()
{
	//get a bool to show if a script is already running:
	bool scriptIsRunning = mapTickResumeState.scriptIsRunning;
	//if a script isn't already running and you're in hex editor state, don't start any new scripts:
	if(MageHex->getHexEditorState() && !scriptIsRunning)
	{
		return;
	}
	//if a script isn't already running, OR
	//if the mapLoad script Id doesn't match the *ResumeState,
	//re-initialize the *ResumeState struct from the mapLocalScriptId
	else if(
		!scriptIsRunning ||
		mapTickResumeState.mapLocalScriptId != (MageGame->Map().getMapLocalMapOnTickScriptId())
	)
	{
		//populate the MageScriptState struct with appropriate init data
		initScriptState(&mapTickResumeState, MageGame->Map().getMapLocalMapOnTickScriptId(), true);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the mapLocalScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the map entity value.
	currentEntityId = MAGE_MAP_ENTITY;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&mapTickResumeState, MAGE_MAP_ENTITY, MageScriptType::ON_TICK);
}

void MageScriptControl::handleEntityOnTickScript(uint8_t index)
{
	//get a bool to show if a script is already running:
	bool scriptIsRunning = entityTickResumeStates[index].scriptIsRunning;
	//we also need to convert the entity's local ScriptId to the global context:
	uint16_t mapLocalScriptId = MageGame->entities[index].onTickScriptId;

	//if a script isn't already running and you're in hex editor state, don't start any new scripts:
	if(MageHex->getHexEditorState() && !scriptIsRunning)
	{
		return;
	}
	//if a script isn't already running, OR
	//if the entityOnTick script Id doesn't match the *ResumeState,
	//re-initialize the *ResumeState struct from the mapLocalScriptId
	else if(
		!scriptIsRunning ||
		entityTickResumeStates[index].mapLocalScriptId != mapLocalScriptId
	)
	{
		//populate the MageScriptState struct with appropriate init data
		initScriptState(&entityTickResumeStates[index], mapLocalScriptId, true);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the mapLocalScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = index;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&entityTickResumeStates[index], index, MageScriptType::ON_TICK);
}

void MageScriptControl::handleEntityOnInteractScript(uint8_t index)
{
	uint16_t mapLocalScriptId = MageGame->entities[index].onInteractScriptId;
	//if a script is not currently running, do nothing.
	if(!entityInteractResumeStates[index].scriptIsRunning)
	{
		return;
	}
	//if the entity mapLocalScriptId doesn't match what is in the entityInteractResumeStates[index] struct, re-init it
	//with .scriptIsRunning set to false to stop all current actions.
	else if(entityInteractResumeStates[index].mapLocalScriptId != mapLocalScriptId)
	{
		initScriptState(
			&entityInteractResumeStates[index],
			mapLocalScriptId,
			false
		);
		return;
	}
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the mapLocalScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = index;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&entityInteractResumeStates[index], index, MageScriptType::ON_INTERACT);
}

int16_t MageScriptControl::getUsefulEntityIndexFromActionEntityId(
	uint8_t entityId,
	int16_t callingEntityId
)
{
	int16_t entityIndex = entityId;
	if (entityIndex == MAGE_ENTITY_SELF) {
		entityIndex = callingEntityId;
	} else if (entityIndex == MAGE_ENTITY_PLAYER) {
		entityIndex = MageGame->playerEntityIndex;
	} else if (entityIndex == MAGE_MAP_ENTITY) {
		//the map doesn't have an entity, so we return if the script is on the map:
		entityIndex = NO_PLAYER;
	}
	return entityIndex;
}
