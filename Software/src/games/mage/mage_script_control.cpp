#include "mage_script_control.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "EngineInput.h"

//load in the global variables that the scripts will be operating on:
extern MageGameControl *MageGame;
extern MageHexEditor *MageHex;
extern MageScriptControl *MageScript;
extern MageEntity *hackableDataAddress;
extern FrameBuffer *mage_canvas;
extern Point cameraPosition;

void MageScriptControl::initScriptState(MageScriptState * resumeStateStruct, uint16_t scriptId, bool scriptIsRunning)
{
	MageScriptState state;
	//set the values passed to the function first:
	resumeStateStruct->scriptIsRunning = scriptIsRunning;
	resumeStateStruct->scriptId = scriptId;
	//then set default initializer values for the others:
	//initial action for a new script is always 0:
	resumeStateStruct->actionOffset = 0;
	//init to 0, actions will set is it is needed.
	resumeStateStruct->totalLoopsToNextAction = 0;
	//init to 0, actions will set is it is needed.
	resumeStateStruct->loopsToNextAction = 0;
}

void MageScriptControl::processScript(MageScriptState * resumeStateStruct)
{
	//All script processing from here relies solely on the state of the resumeStateStruct:
	//Make sure you've got your script states correct in the resumeStateStruct array before calling this function:
	while(jumpScript != MAGE_NULL_SCRIPT)
	{
		processActionQueue(resumeStateStruct);
		//if no new jumpScript was set, we can exit the loop immediately.
		if(jumpScript == MAGE_NULL_SCRIPT)
		{ break; }
		//otherwise, we want to re-init the resumeState to run the new jumpScript from the beginning:
		else
		{
			initScriptState(resumeStateStruct, jumpScript, true);
		}
	}
}

void MageScriptControl::processActionQueue(MageScriptState * resumeStateStruct)
{
	//reset jump script once processing begins
	jumpScript = MAGE_NULL_SCRIPT;

	//get the memory address for the script:
	uint32_t address = MageGame->getScriptAddress(resumeStateStruct->scriptId);

	//read the action count from ROM:
	//skip the name of the script, we don't need it in this codebase:
	address += 32;

	//read the script's action count:
	uint32_t actionCount = 0;
	if (EngineROM_Read(address, sizeof(actionCount), (uint8_t *)&actionCount) != sizeof(actionCount))
	{
		goto MageScript_Error;
	}

	actionCount = convert_endian_u4_value(actionCount);
	address += sizeof(actionCount);

	//increment the address by the resumeStateStruct->actionOffset*sizeof(uint64_t) to get to the current action:
	address += resumeStateStruct->actionOffset * sizeof(uint64_t);

	//now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
	//note we're using the value in resumeStateStruct directly as our index so it will update automatically as we proceed:
	for(; resumeStateStruct->actionOffset<actionCount; resumeStateStruct->actionOffset++)
	{
		runAction(address, resumeStateStruct);
		//non-blocking action check is based on whether resumeStateStruct->totalLoopsToNextAction is set:
		if(resumeStateStruct->totalLoopsToNextAction != 0)
		{
			//if this value is not 0, we need to stop the action now and return later when the countdown is complete:
			//note that resumeStateStruct->actionOffset is set to the NB action's offset since we are using it as an index
			//on the next loop, it should call the same action again. It is up to the action handler function to decide
			//how to complete its action and track how much time is left using the resumeStateStruct's values.
			return;
		}
		//all actions are exactly 8 bytes long, so we can address increment by one uint64_t
		address += sizeof(uint64_t);
		//check to see if the action set a jumpScript value
		if(jumpScript != MAGE_NULL_SCRIPT){
			//immediately end action processing and return if a jumpScript value was set:
			return;
		}
	}
	//if you get here, and jumpScript == MAGE_NULL_SCRIPT, all actions in the script are done
	if(jumpScript == MAGE_NULL_SCRIPT)
	{
		//we can now set resumeState.scriptIsRunning to false and end processing the script:
		resumeStateStruct->scriptIsRunning = false;
	}
	return;

MageScript_Error:
	ENGINE_PANIC("Failed to read script data.");
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
	if (EngineROM_Read(actionMemoryAddress, sizeof(actionTypeId), (uint8_t *)&actionTypeId) != sizeof(actionTypeId))
	{
		goto MageAction_Error;
	}
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
	if (EngineROM_Read(actionMemoryAddress, sizeof(romValues), (uint8_t *)&romValues) != sizeof(romValues))
	{
		goto MageAction_Error;
	}
	
	//get the function for actionTypeId, and feed it the romValues as args:
	actionHandlerFunction = actionFunctions[actionTypeId];
	(this->*actionHandlerFunction)(romValues, resumeStateStruct);

	return;

MageAction_Error:
	ENGINE_PANIC("Failed to read action data.");
}

void MageScriptControl::nullAction(uint8_t * args, MageScriptState * resumeStateStruct)
{
	//nullAction does nothing.
	return;
}

//Needs testing -Tim
void MageScriptControl::checkEntityByte(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckEntityByte *argStruct = (ActionCheckEntityByte*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	//validate arguments:
	//make sure the entityId refers to an entity index for this specific map:
	argStruct->entityId = MageGame->getValidEntityId(argStruct->entityId);
	//make sure the offset is within the bounds of a single entity:
	argStruct->byteOffset = argStruct->byteOffset % sizeof(MageEntity);
	//convert the successScriptId to the global scope:
	argStruct->successScriptId = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
	//now check the validated data and set jumpScript if appropriate:
	uint8_t * byteAddress = ((uint8_t*)hackableDataAddress + argStruct->byteOffset);
	if(argStruct->expectedValue == *byteAddress)
	{
		jumpScript = MageGame->getValidGlobalScriptId(argStruct->successScriptId);
	}
	return;
}

//waiting for implementation of Save Flag System to implement -Tim
void MageScriptControl::checkSaveFlag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckSaveFlag *argStruct = (ActionCheckSaveFlag*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	return;
}

//waiting for implementation of geometry to implement -Tim
void MageScriptControl::checkIfEntityIsInGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckifEntityIsInGeometry *argStruct = (ActionCheckifEntityIsInGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	argStruct->GeometryId = convert_endian_u2_value(argStruct->GeometryId);
	return;
}

void MageScriptControl::checkForButtonPress(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckForButtonPress *argStruct = (ActionCheckForButtonPress*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	//convert scriptId from local to global scope:
	argStruct->successScriptId = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
	//get state of button:
	bool *button_address = (bool*)(&EngineInput_Activated) + argStruct->buttonId;
	bool button_activated = *button_address;
	if(button_activated)
	{
		jumpScript = MageGame->getValidGlobalScriptId(argStruct->successScriptId);
	}
	return;
}

void MageScriptControl::checkForButtonState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckForButtonState *argStruct = (ActionCheckForButtonState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	//convert scriptId from local to global scope:
	argStruct->successScriptId = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
	//get state of button:
	bool *button_address = (bool*)(&EngineInput_Buttons) + argStruct->buttonId;
	bool button_state = *button_address;
	if(button_state == (bool)(argStruct->expectedBoolValue))
	{
		jumpScript = MageGame->getValidGlobalScriptId(argStruct->successScriptId);
	}
	return;
}

void MageScriptControl::runScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionRunScript *argStruct = (ActionRunScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = convert_endian_u2_value(argStruct->scriptId);
	//convert scriptId from local to global scope:
	argStruct->scriptId = MageGame->Map().getGlobalScriptId(argStruct->scriptId);
	//set the jumpScript to the new script
	jumpScript = MageGame->getValidGlobalScriptId(argStruct->scriptId);
	return;
}

//waiting for implementation of global strings to implement -Tim
void MageScriptControl::compareEntityName(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCompareEntityName *argStruct = (ActionCompareEntityName*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	argStruct->stringId = convert_endian_u2_value(argStruct->stringId);
	return;
}

void MageScriptControl::blockingDelay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionNonBlockingDelay *argStruct = (ActionNonBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->delayTime = convert_endian_u4_value(argStruct->delayTime);
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
		//also set the blocking delay time to the larger of the current blockingDelayTime, or argStruct->delayTime:
		blockingDelayTime = (blockingDelayTime < argStruct->delayTime) ? argStruct->delayTime : blockingDelayTime;
		//now set the resumeStateStruct variables:
		resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
		resumeStateStruct->loopsToNextAction = totalDelayLoops;
	}
	return;
}

void MageScriptControl::nonBlockingDelay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionNonBlockingDelay *argStruct = (ActionNonBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->delayTime = convert_endian_u4_value(argStruct->delayTime);
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
		//convert delay into a number of game loops:
		uint16_t totalDelayLoops = argStruct->delayTime / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
		//now set the resumeStateStruct variables:
		resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
		resumeStateStruct->loopsToNextAction = totalDelayLoops;
	}
	return;
}
void MageScriptControl::setPauseState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetPauseState *argStruct = (ActionSetPauseState*)args;
	return;
}
void MageScriptControl::setEntityByte(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityByte *argStruct = (ActionSetEntityByte*)args;
	return;
}
void MageScriptControl::setSaveFlag(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetSaveFlag *argStruct = (ActionSetSaveFlag*)args;
	return;
}
void MageScriptControl::setPlayerControl(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetPlayerControl *argStruct = (ActionSetPlayerControl*)args;
	return;
}
void MageScriptControl::setEntityInteractScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityInteractScript *argStruct = (ActionSetEntityInteractScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = convert_endian_u2_value(argStruct->scriptId);
	return;
}
void MageScriptControl::setEntityTickScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityTickScript *argStruct = (ActionSetEntityTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = convert_endian_u2_value(argStruct->scriptId);
	return;
}
void MageScriptControl::setMapTickScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetMapTickScript *argStruct = (ActionSetMapTickScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = convert_endian_u2_value(argStruct->scriptId);
	return;
}
void MageScriptControl::setEntityType(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityType *argStruct = (ActionSetEntityType*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->primaryId = convert_endian_u2_value(argStruct->primaryId);
	argStruct->secondaryId = convert_endian_u2_value(argStruct->secondaryId);
	return;
}

void MageScriptControl::setEntityDirection(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetEntityDirection *argStruct = (ActionSetEntityDirection*)args;
	//validate arguments:
	argStruct->entityId = MageGame->getValidEntityId(argStruct->entityId);
	argStruct->direction = MageGame->getValidEntityTypeDirection(argStruct->direction);
	//set direction:
	MageGame->entities[argStruct->entityId].direction = argStruct->direction;
	//set update flag:
	scriptRequiresRender = true;
	return;
}
void MageScriptControl::setHexCursorLocation(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexCursorLocation *argStruct = (ActionSetHexCursorLocation*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->byteAddress = convert_endian_u2_value(argStruct->byteAddress);
	return;
}
void MageScriptControl::setHexBit(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexBit *argStruct = (ActionSetHexBit*)args;
	return;
}
void MageScriptControl::unlockHaxCell(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionUnlockHaxCell *argStruct = (ActionUnlockHaxCell*)args;
	return;
}
void MageScriptControl::lockHaxCell(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLockHaxCell *argStruct = (ActionLockHaxCell*)args;
	return;
}
void MageScriptControl::setHexEditorState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexEditorState *argStruct = (ActionSetHexEditorState*)args;
	if(MageHex->getHexEditorState() != argStruct->state)
	{
		MageHex->toggleHexEditor();
	}
	return;
}
void MageScriptControl::setHexEditorDialogMode(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetHexEditorDialogMode *argStruct = (ActionSetHexEditorDialogMode*)args;
	if(MageHex->getHexDialogState() != argStruct->state)
	{
		MageHex->toggleHexDialog();
	}
	return;
}
void MageScriptControl::loadMap(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoadMap *argStruct = (ActionLoadMap*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->mapId = convert_endian_u2_value(argStruct->mapId);
	return;
}
void MageScriptControl::showDialog(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionShowDialog *argStruct = (ActionShowDialog*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->dialogId = convert_endian_u2_value(argStruct->dialogId);
	return;
}
void MageScriptControl::setRenderableFont(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetRenderableFont *argStruct = (ActionSetRenderableFont*)args;
	return;
}
void MageScriptControl::teleportEntityToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionTeleportEntityToGeometry *argStruct = (ActionTeleportEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::walkEntityToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionWalkEntityToGeometry *argStruct = (ActionWalkEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::walkEntityAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionWalkEntityAlongGeometry *argStruct = (ActionWalkEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::loopEntityAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoopEntityAlongGeometry *argStruct = (ActionLoopEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::setCameraToFollowEntity(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetCameraToFollowEntity *argStruct = (ActionSetCameraToFollowEntity*)args;
	return;
}
void MageScriptControl::teleportCameraToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionTeleportCameraToGeometry *argStruct = (ActionTeleportCameraToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::panCameraToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPanCameraToGeometry *argStruct = (ActionPanCameraToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::panCameraAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPanCameraAlongGeometry *argStruct = (ActionPanCameraAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::loopCameraAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoopCameraAlongGeometry *argStruct = (ActionLoopCameraAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);
	return;
}
void MageScriptControl::setScreenShake(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionSetScreenShake *argStruct = (ActionSetScreenShake*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	return;
}
void MageScriptControl::screenFadeOut(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionScreenFadeOut *argStruct = (ActionScreenFadeOut*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->color = convert_endian_u2_value(argStruct->color);
	return;
}
void MageScriptControl::screenFadeIn(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionScreenFadeIn *argStruct = (ActionScreenFadeIn*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->color = convert_endian_u2_value(argStruct->color);
	return;
}
void MageScriptControl::playSoundContinuous(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPlaySoundContinuous *argStruct = (ActionPlaySoundContinuous*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->soundId = convert_endian_u2_value(argStruct->soundId);
	return;
}
void MageScriptControl::playSoundInterrupt(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionPlaySoundInterrupt *argStruct = (ActionPlaySoundInterrupt*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->soundId = convert_endian_u2_value(argStruct->soundId);
	return;
}

MageScriptControl::MageScriptControl()
{
	jumpScript = MAGE_NULL_SCRIPT;

	scriptRequiresRender = false;

	blockingDelayTime = 0;

	initScriptState(&mapLoadResumeState, MAGE_NULL_SCRIPT, false);
	initScriptState(&mapTickResumeState, MAGE_NULL_SCRIPT, false);

	for(uint16_t e=0; e<MAX_ENTITIES_PER_MAP; e++)
	{
		initScriptState(&entityInteractResumeStates[e], MAGE_NULL_SCRIPT, false);
		initScriptState(&entityTickResumeStates[e], MAGE_NULL_SCRIPT, false);
	}

	//this is the array of action functions that will be called by scripts.
	//the array index corresponds to the enum value of the script that is
	//stored in the ROM file, so it calls the correct function automatically.
	actionFunctions[MageScriptActionTypeId::NULL_ACTION]                    = &MageScriptControl::nullAction;
	actionFunctions[MageScriptActionTypeId::CHECK_ENTITY_BYTE]              = &MageScriptControl::checkEntityByte;
	actionFunctions[MageScriptActionTypeId::CHECK_SAVE_FLAG]                = &MageScriptControl::checkSaveFlag;
	actionFunctions[MageScriptActionTypeId::CHECK_IF_ENTITY_IS_IN_GEOMETRY] = &MageScriptControl::checkIfEntityIsInGeometry;
	actionFunctions[MageScriptActionTypeId::CHECK_FOR_BUTTON_PRESS]         = &MageScriptControl::checkForButtonPress;
	actionFunctions[MageScriptActionTypeId::CHECK_FOR_BUTTON_STATE]         = &MageScriptControl::checkForButtonState;
	actionFunctions[MageScriptActionTypeId::RUN_SCRIPT]                     = &MageScriptControl::runScript;
	actionFunctions[MageScriptActionTypeId::COMPARE_ENTITY_NAME]            = &MageScriptControl::compareEntityName;
	actionFunctions[MageScriptActionTypeId::BLOCKING_DELAY]                 = &MageScriptControl::blockingDelay;
	actionFunctions[MageScriptActionTypeId::NON_BLOCKING_DELAY]             = &MageScriptControl::nonBlockingDelay;
	actionFunctions[MageScriptActionTypeId::SET_PAUSE_STATE]                = &MageScriptControl::setPauseState;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_BYTE]                = &MageScriptControl::setEntityByte;
	actionFunctions[MageScriptActionTypeId::SET_SAVE_FLAG]                  = &MageScriptControl::setSaveFlag;
	actionFunctions[MageScriptActionTypeId::SET_PLAYER_CONTROL]             = &MageScriptControl::setPlayerControl;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_INTERACT_SCRIPT]     = &MageScriptControl::setEntityInteractScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_TICK_SCRIPT]         = &MageScriptControl::setEntityTickScript;
	actionFunctions[MageScriptActionTypeId::SET_MAP_TICK_SCRIPT]            = &MageScriptControl::setMapTickScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_TYPE]                = &MageScriptControl::setEntityType;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_DIRECTION]           = &MageScriptControl::setEntityDirection;
	actionFunctions[MageScriptActionTypeId::SET_HEX_CURSOR_LOCATION]        = &MageScriptControl::setHexCursorLocation;
	actionFunctions[MageScriptActionTypeId::SET_HEX_BIT]                    = &MageScriptControl::setHexBit;
	actionFunctions[MageScriptActionTypeId::UNLOCK_HAX_CELL]                = &MageScriptControl::unlockHaxCell;
	actionFunctions[MageScriptActionTypeId::LOCK_HAX_CELL]                  = &MageScriptControl::lockHaxCell;
	actionFunctions[MageScriptActionTypeId::SET_HEX_EDITOR_STATE]           = &MageScriptControl::setHexEditorState;
	actionFunctions[MageScriptActionTypeId::SET_HEX_EDITOR_DIALOG_MODE]     = &MageScriptControl::setHexEditorDialogMode;
	actionFunctions[MageScriptActionTypeId::LOAD_MAP]                       = &MageScriptControl::loadMap;
	actionFunctions[MageScriptActionTypeId::SHOW_DIALOG]                    = &MageScriptControl::showDialog;
	actionFunctions[MageScriptActionTypeId::SET_RENDERABLE_FONT]            = &MageScriptControl::setRenderableFont;
	actionFunctions[MageScriptActionTypeId::TELEPORT_ENTITY_TO_GEOMETRY]    = &MageScriptControl::teleportEntityToGeometry;
	actionFunctions[MageScriptActionTypeId::WALK_ENTITY_TO_GEOMETRY]        = &MageScriptControl::walkEntityToGeometry;
	actionFunctions[MageScriptActionTypeId::WALK_ENTITY_ALONG_GEOMETRY]     = &MageScriptControl::walkEntityAlongGeometry;
	actionFunctions[MageScriptActionTypeId::LOOP_ENTITY_ALONG_GEOMETRY]     = &MageScriptControl::loopEntityAlongGeometry;
	actionFunctions[MageScriptActionTypeId::SET_CAMERA_TO_FOLLOW_ENTITY]    = &MageScriptControl::setCameraToFollowEntity;
	actionFunctions[MageScriptActionTypeId::TELEPORT_CAMERA_TO_GEOMETRY]    = &MageScriptControl::teleportCameraToGeometry;
	actionFunctions[MageScriptActionTypeId::PAN_CAMERA_TO_GEOMETRY]         = &MageScriptControl::panCameraToGeometry;
	actionFunctions[MageScriptActionTypeId::PAN_CAMERA_ALONG_GEOMETRY]      = &MageScriptControl::panCameraAlongGeometry;
	actionFunctions[MageScriptActionTypeId::LOOP_CAMERA_ALONG_GEOMETRY]     = &MageScriptControl::loopCameraAlongGeometry;
	actionFunctions[MageScriptActionTypeId::SET_SCREEN_SHAKE]               = &MageScriptControl::setScreenShake;
	actionFunctions[MageScriptActionTypeId::SCREEN_FADE_OUT]                = &MageScriptControl::screenFadeOut;
	actionFunctions[MageScriptActionTypeId::SCREEN_FADE_IN]                 = &MageScriptControl::screenFadeIn;
	actionFunctions[MageScriptActionTypeId::PLAY_SOUND_CONTINUOUS]          = &MageScriptControl::playSoundContinuous;
	actionFunctions[MageScriptActionTypeId::PLAY_SOUND_INTERRUPT]           = &MageScriptControl::playSoundInterrupt;
}

uint32_t MageScriptControl::size() const
{
	uint32_t size =
		sizeof(jumpScript) +
		sizeof(scriptRequiresRender) +
		sizeof(blockingDelayTime) +
		sizeof(MageScriptState) + //mapLoadResumeState
		sizeof(MageScriptState) + //mapTickResumeState
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityInteractResumeStates
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityTickResumeStates
		sizeof(ActionFunctionPointer)*MageScriptActionTypeId::NUM_ACTIONS; //function pointer array
	return size;
}

MageScriptState MageScriptControl::getMapLoadResumeState()
{
	return mapLoadResumeState;
}

MageScriptState MageScriptControl::getMapTickResumeState()
{
	return mapTickResumeState;
}

MageScriptState MageScriptControl::getEntityInteractResumeState(uint8_t index)
{
	return entityInteractResumeStates[index];
}

MageScriptState MageScriptControl::getEntityTickResumeState(uint8_t index)
{
	return entityTickResumeStates[index];
}

void MageScriptControl::handleMapOnLoadScript(bool isFirstRun)
{
	//since this should only run once when a map is loaded, and then proceed through the script once,
	//we only need to check the isFirstRun argument to see if we should initialize based on the 
	//map's onLoad scriptId or if we should resume from the state of the mapLoadResumeState struct.
	if(isFirstRun)
	{
		initScriptState(&mapLoadResumeState, MageGame->Map().OnLoad(), true);
	}
	//this checks to see if the map onLoad script is complete and returns if it is:
	else if(!mapLoadResumeState.scriptIsRunning)
	{
		return;
	}
	//otherwise, the load script is still running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//we only need to set jumpScript to match the *ResumeState struct so we can call actions:
		jumpScript = mapLoadResumeState.scriptId;
	}
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&mapLoadResumeState);
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
	//re-initialize the *ResumeState struct from the scriptId
	else if(
		!scriptIsRunning ||
		mapTickResumeState.scriptId != (MageGame->Map().OnTick()) 
	)
	{
		//set the jumpScript to match the desired script:
		jumpScript = MageGame->Map().OnTick();
		//populate the MageScriptState struct with appropriate init data
		initScriptState(&mapTickResumeState, jumpScript, true);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//we only need to set jumpScript to match the *ResumeState struct so we can call actions:
		jumpScript = mapTickResumeState.scriptId;
	}
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&mapTickResumeState);
}

void MageScriptControl::handleEntityOnInteractScript(uint8_t index)
{
	uint16_t globalEntityOnInteractScriptId = MageGame->Map().getGlobalScriptId(MageGame->entities[index].onInteractScriptId);
	//if a script is not currently running, do nothing.
	if(!entityInteractResumeStates[index].scriptIsRunning)
	{
		return;
	}
	//if the entity scriptId doesn't match what is in the entityInteractResumeStates[index] struct, re-init it
	//with .scriptIsRunning set to false to stop all current actions.
	else if(entityInteractResumeStates[index].scriptId != globalEntityOnInteractScriptId)
	{
		initScriptState(&entityInteractResumeStates[index], globalEntityOnInteractScriptId, false);
		return;
	}
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//we only need to set jumpScript to match the *ResumeState struct so we can call actions:
		jumpScript = entityInteractResumeStates[index].scriptId;
	}
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&entityInteractResumeStates[index]);
}

void MageScriptControl::handleEntityOnTickScript(uint8_t index)
{
	//get a bool to show if a script is already running:
	bool scriptIsRunning = entityTickResumeStates[index].scriptIsRunning;
	//we also need to convert the entity's local ScriptId to the global context:
	uint16_t globalEntityScriptId = MageGame->Map().getGlobalScriptId(MageGame->entities[index].onTickScriptId);

	//if a script isn't already running and you're in hex editor state, don't start any new scripts:
	if(MageHex->getHexEditorState() && !scriptIsRunning)
	{
		return;
	}
	//if a script isn't already running, OR
	//if the mapLoad script Id doesn't match the *ResumeState, 
	//re-initialize the *ResumeState struct from the scriptId
	else if(
		!scriptIsRunning ||
		entityTickResumeStates[index].scriptId != MageGame->getValidGlobalScriptId(globalEntityScriptId)
	)
	{
		//set the jumpScript to match the desired script:
		jumpScript = globalEntityScriptId;
		//populate the MageScriptState struct with appropriate init data
		initScriptState(&entityTickResumeStates[index], jumpScript, true);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//we only need to set jumpScript to match the *ResumeState struct so we can call actions:
		jumpScript = entityTickResumeStates[index].scriptId;
	}
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&entityTickResumeStates[index]);
}
