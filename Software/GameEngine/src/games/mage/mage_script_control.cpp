#include "mage_script_control.h"
#include "mage_dialog_control.h"
#include "EngineROM.h"
#include "EngineInput.h"
#include "mage_script_actions.h"
#include "mage_command_control.h"

//load in the global variables that the scripts will be operating on:
extern MageGameControl *MageGame;
extern MageHexEditor *MageHex;
extern MageDialogControl *MageDialog;
extern MageCommandControl *MageCommand;
extern MageEntity *hackableDataAddress;
extern FrameBuffer *mage_canvas;

MageScriptControl::MageScriptControl()
{
	jumpScriptId = MAGE_NO_SCRIPT;

	blockingDelayTime = 0;

	mapLoadId = MAGE_NO_MAP;

	//these should never be used in their initialized states, they will always be set when calling processScript()
	currentEntityId = MAGE_MAP_ENTITY;
}

void MageScriptControl::initializeScriptsOnMapLoad()
{
	MageMap* map = &MageGame->Map();
	//initialize the script ResumeStateStructs:
	initScriptState(
		&resumeStates.mapLoad,
		map->onLoad,
		true
	);
	initScriptState(
		&resumeStates.mapTick,
		map->onTick,
		false
	);
	initScriptState(
		&resumeStates.serial,
		0,
		false
	);
	for (uint8_t i = 0; i < MageGame->filteredEntityCountOnThisMap; i++) {
		//Initialize the script ResumeStateStructs to default values for this map.
		MageEntity *entity = &MageGame->entities[i];
		initScriptState(
			getEntityTickResumeState(i),
			entity->onTickScriptId,
			false
		);
		initScriptState(
			getEntityInteractResumeState(i),
			entity->onInteractScriptId,
			false
		);
		initScriptState(
			getEntityLookResumeState(i),
			entity->onInteractScriptId,
			false
		);
	}
	MageCommand->reset();
	handleMapOnLoadScript(true);
}

void MageScriptControl::initScriptState(
	MageScriptState * resumeStateStruct,
	uint16_t scriptId,
	bool scriptIsRunning,
	bool isGlobalExecutionScope
)
{
	//set the values passed to the function first:
	resumeStateStruct->scriptIsRunning = scriptIsRunning;
	resumeStateStruct->scriptIsPaused = false;
	resumeStateStruct->isGlobalExecutionScope = isGlobalExecutionScope;
	resumeStateStruct->currentScriptId = scriptId;
	//then set default initializer values for the others:
	//initial action for a new script is always 0:
	resumeStateStruct->actionOffset = 0;
	//init to 0, actions will set is it is needed.
	resumeStateStruct->totalLoopsToNextAction = 0;
	//init to 0, actions will set is it is needed.
	resumeStateStruct->loopsToNextAction = 0;
}

void MageScriptControl::processScript(
	MageScriptState * resumeStateStruct,
	uint8_t mapLocalEntityId,
	MageScriptType scriptType
)
{
	// script has been paused by another script, to be resumed by the same mechanism.
	if(resumeStateStruct->scriptIsPaused) { return; }
	//set the current entity to the passed value.
	currentEntityId = mapLocalEntityId;
	//set the current script type to the passed value.
	//All script processing from here relies solely on the state of the resumeStateStruct:
	//Make sure you've got your script states correct in the resumeStateStruct before calling this function:
	jumpScriptId = resumeStateStruct->currentScriptId;
	while(jumpScriptId != MAGE_NO_SCRIPT) {
		processActionQueue(
			resumeStateStruct,
			scriptType
		);
		//check for loadMap:
		if(mapLoadId != MAGE_NO_MAP) { return; }
	}
}

void MageScriptControl::processActionQueue(
	MageScriptState * resumeStateStruct,
	MageScriptType currentScriptType
)
{
	//reset jump script once processing begins
	jumpScriptId = MAGE_NO_SCRIPT;
	uint32_t address = MageGame->getScriptAddressFromGlobalScriptId(0);

	//get the memory address for the script:
	if (!resumeStateStruct->isGlobalExecutionScope) {
		address = MageGame->getScriptAddressFromGlobalScriptId(
			MageGame->Map().getGlobalScriptId(
				resumeStateStruct->currentScriptId
			)
		);
	} else {
		address = MageGame->getScriptAddressFromGlobalScriptId(
			resumeStateStruct->currentScriptId
		);
	}

	//read the action count from ROM:
	//skip the name of the script, we don't need it in ram at runtime:
	//char scriptName[SCRIPT_NAME_LENGTH] = {0};
	//EngineROM_Read(
	//	address,
	//	SCRIPT_NAME_LENGTH,
	//	(uint8_t *)scriptName,
	//	"MageScriptControl::processActionQueue\nFailed to load property 'name'"
	//);
	//debug_print(
	//	"Running script: %s",
	//	scriptName
	//);
	//MageGame->logAllEntityScriptValues("processActionQueue-Before");
	address += SCRIPT_NAME_LENGTH;

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
	uint32_t actionStartAddress = address;

	//increment the address by the resumeStateStruct->actionOffset*sizeof(uint64_t) to get to the current action:
	address += resumeStateStruct->actionOffset * sizeof(uint64_t);

	//now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
	//note we're using the value in resumeStateStruct directly as our index so it will update automatically as we proceed:
	while(resumeStateStruct->actionOffset<actionCount)
	{
		//char logString[128];
		//sprintf(
		//	logString,
		//	"processActionQueue-action: %02d",
		//	resumeStateStruct->actionOffset
		//);
		//MageGame->logAllEntityScriptValues(logString);
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


		//check to see if the action set a jumpScriptId value
		if(
			jumpScriptId != MAGE_NO_SCRIPT
			&& !resumeStateStruct->isGlobalExecutionScope
		){
			//debug_print(
			//	"processActionQueue-jumpScriptId: %02d;\n"
			//	"	currentEntityId: %02d;\n",
			//	resumeStateStruct->actionOffset,
			//	currentEntityId
			//);
			//If we have a new jumpScriptId, we want to re-init the resumeState
			//to run the new jumpScriptId from the beginning:
			//immediately end action processing and return if a jumpScriptId value was set:
			setEntityScript(
				jumpScriptId,
				currentEntityId,
				currentScriptType
			);
			initScriptState(
				resumeStateStruct,
				jumpScriptId,
				true
			);
			return;
		}
		else if (
			jumpScriptId != MAGE_NO_SCRIPT
			&& resumeStateStruct->isGlobalExecutionScope
		){
			//debug_print(
			//	"processActionQueue-jumpScriptId: %02d;\n"
			//	"	currentEntityId: %02d;\n",
			//	resumeStateStruct->actionOffset,
			//	currentEntityId
			//);
			//If we have a new jumpScriptId, we want to re-init the resumeState
			//to run the new jumpScriptId from the beginning:
			//immediately end action processing and return if a jumpScriptId value was set:
			initScriptState(
				resumeStateStruct,
				jumpScriptId,
				true,
				true
			);
			return;
		}
		//all actions are exactly 8 bytes long, so we can address increment by one uint64_t
		resumeStateStruct->actionOffset++;
		address = actionStartAddress + (resumeStateStruct->actionOffset * sizeof(uint64_t));
	}
	//if you get here, and jumpScriptId == MAGE_NO_SCRIPT, all actions in the script are done
	if(jumpScriptId == MAGE_NO_SCRIPT)
	{
		//we can now set resumeState.scriptIsRunning to false and end processing the script:
		resumeStateStruct->scriptIsRunning = false;
	}
	//MageGame->logAllEntityScriptValues("processActionQueue-after");
}

void MageScriptControl::runAction(
	uint32_t actionMemoryAddress,
	MageScriptState * resumeStateStruct
) {
	//variable to store action type:
	uint8_t actionTypeId;
	//array for all 7 bytes of argument data:
	uint8_t actionArgs[MAGE_NUM_ACTION_ARGS];
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

	//read remaining 7 bytes of argument data into actionArgs
	EngineROM_Read(
		actionMemoryAddress,
		sizeof(actionArgs),
		(uint8_t *)&actionArgs,
		"MageScriptControl::runAction\nFailed to load property 'actionArgs'"
	);

	//get the function for actionTypeId, and feed it the actionArgs as args:
	actionHandlerFunction = actionFunctions[actionTypeId];
	(*actionHandlerFunction)(actionArgs, resumeStateStruct);
}

void MageScriptControl::setEntityScript(
	uint16_t mapLocalScriptId,
	uint8_t entityId,
	uint8_t scriptType
) {
	//check for map script first:
	if(entityId == MAGE_MAP_ENTITY) {
		if(scriptType == MageScriptType::ON_LOAD) {
			//useless
			//MageGame->Map().onLoad = mapLocalScriptId;
		} else if(scriptType == MageScriptType::ON_TICK) {
			MageGame->Map().onTick = mapLocalScriptId;
		} else if(scriptType == MageScriptType::ON_LOOK) {
			MageGame->Map().onLook = mapLocalScriptId;
		} else if(scriptType == MageScriptType::ON_COMMAND) {
			//useless
			//resumeStateStruct->currentScriptId = mapLocalScriptId;
		}
	}
	//target is an entity
	else {
		MageEntity* entity = MageGame->getEntityByMapLocalId(entityId);
		//if it's not a map script, set the appropriate entity's script value:
		if(scriptType == MageScriptType::ON_INTERACT) {
			entity->onInteractScriptId = mapLocalScriptId;
		} else if(scriptType == MageScriptType::ON_TICK) {
			entity->onTickScriptId = mapLocalScriptId;
		} else if(scriptType == MageScriptType::ON_LOOK) {
			entity->onLookScriptId = mapLocalScriptId;
		}
	}
}

uint32_t MageScriptControl::size() const
{
	uint32_t size =
		sizeof(jumpScriptId) +
		sizeof(blockingDelayTime) +
		sizeof(mapLoadId) +
		sizeof(currentEntityId) +
		sizeof(resumeStates) +
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityInteractResumeStates
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityTickResumeStates
		sizeof(ActionFunctionPointer)*MageScriptActionTypeId::NUM_ACTIONS; //function pointer array
	return size;
}

MageScriptState* MageScriptControl::getEntityInteractResumeState(uint8_t index)
{
	return &entityInteractResumeStates[index];
}

MageScriptState* MageScriptControl::getEntityTickResumeState(uint8_t index)
{
	return &entityTickResumeStates[index];
}

MageScriptState* MageScriptControl::getEntityLookResumeState(uint8_t index)
{
	return &entityLookResumeStates[index];
}

void MageScriptControl::handleMapOnLoadScript(bool isFirstRun)
{
	MageScriptState* resumeState = &resumeStates.mapLoad;
	//the load script is still running and the resumeStateStruct controls all further actions:
	if(resumeState->scriptIsRunning) {
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the currentScriptId is contained within the *ResumeState struct so we can call actions:
		//now that the *ResumeState struct is correctly configured, process the script:
		processScript(
			resumeState,
			MAGE_MAP_ENTITY,
			MageScriptType::ON_LOAD
		);
	}
}

void MageScriptControl::handleMapOnTickScript()
{
	MageScriptState* resumeState = &resumeStates.mapTick;
	uint16_t onTickScriptId = MageGame->Map().onTick;
	//get a bool to show if a script is already running:
	bool scriptIsRunning = resumeState->scriptIsRunning;
	//if a script isn't already running and you're in hex editor state, don't start any new scripts:
	if(MageHex->getHexEditorState() && !scriptIsRunning)
	{
		return;
	}
	//if a script isn't already running, OR
	//if the resumeState script Id doesn't match the *ResumeState,
	//re-initialize the *ResumeState struct from the currentScriptId
	else if(
		!scriptIsRunning ||
		resumeState->currentScriptId != onTickScriptId
	)
	{
		//populate the MageScriptState struct with appropriate init data
		initScriptState(
			resumeState,
			onTickScriptId,
			true
		);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the currentScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the map entity value.
	currentEntityId = MAGE_MAP_ENTITY;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(
		resumeState,
		MAGE_MAP_ENTITY,
		MageScriptType::ON_TICK
	);
}

void MageScriptControl::handleCommandScript(MageScriptState *resumeState)
{
	//this checks to see if the command script should be running:
	if (resumeState->scriptIsRunning) {
		//now that the *ResumeState struct is correctly configured, process the script:
		processScript(
			resumeState,
			MAGE_MAP_ENTITY,
			MageScriptType::ON_COMMAND
		);
	}
}

void MageScriptControl::handleEntityOnTickScript(uint8_t filteredEntityId)
{
	//get a bool to show if a script is already running:
	MageScriptState	*scriptState = &entityTickResumeStates[filteredEntityId];
	bool scriptIsRunning = scriptState->scriptIsRunning;
	//we also need to convert the entity's local ScriptId to the global context:
	uint16_t mapLocalScriptId = MageGame->entities[filteredEntityId].onTickScriptId;

	//if a script isn't already running and you're in hex editor state, don't start any new scripts:
	if(MageHex->getHexEditorState() && !scriptIsRunning)
	{
		return;
	}
	//if a script isn't already running, OR
	//if the entityOnTick script Id doesn't match the *ResumeState,
	//re-initialize the *ResumeState struct from the currentScriptId
	else if(
		!scriptIsRunning ||
		scriptState->currentScriptId != mapLocalScriptId
	)
	{
		//populate the MageScriptState struct with appropriate init data
		initScriptState(
			scriptState,
			mapLocalScriptId,
			true
		);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the currentScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = MageGame->getMapLocalEntityId(filteredEntityId);
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(
		scriptState,
		currentEntityId,
		MageScriptType::ON_TICK
	);
}

void MageScriptControl::handleEntityOnInteractScript(uint8_t filteredEntityId)
{
	MageScriptState	*scriptState = &entityInteractResumeStates[filteredEntityId];
	uint16_t mapLocalScriptId = MageGame->entities[filteredEntityId].onInteractScriptId;
	//if a script is not currently running, do nothing.
	if(!scriptState->scriptIsRunning)
	{
		return;
	}
	//if the entity currentScriptId doesn't match what is in the entityInteractResumeStates[filteredEntityId] struct, re-init it
	//with .scriptIsRunning set to false to stop all current actions.
	else if(scriptState->currentScriptId != mapLocalScriptId)
	{
		initScriptState(
			scriptState,
			mapLocalScriptId,
			false
		);
		return;
	}
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the currentScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = MageGame->getMapLocalEntityId(filteredEntityId);
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(
		scriptState,
		currentEntityId,
		MageScriptType::ON_INTERACT
	);
}

void MageScriptControl::handleEntityOnLookScript(uint8_t filteredEntityId)
{
	MageScriptState	*scriptState = &entityLookResumeStates[filteredEntityId];
	uint16_t mapLocalScriptId = MageGame->entities[filteredEntityId].onLookScriptId;
	//if a script is not currently running, do nothing.
	if(!scriptState->scriptIsRunning)
	{
		return;
	}
	//if the entity currentScriptId doesn't match what is in the entityInteractResumeStates[filteredEntityId] struct, re-init it
	//with .scriptIsRunning set to false to stop all current actions.
	else if(scriptState->currentScriptId != mapLocalScriptId)
	{
		initScriptState(
			scriptState,
			mapLocalScriptId,
			false
		);
		return;
	}
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the currentScriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = MageGame->getMapLocalEntityId(filteredEntityId);
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(
		scriptState,
		currentEntityId,
		MageScriptType::ON_LOOK
	);
}

void MageScriptControl::tickScripts()
{
	//Note: all script handlers check for hex editor mode internally and will only continue
	//scripts that have already started and are not yet complete when in hex editor mode.

	//the map's onLoad script is called with a false isFirstRun flag. This allows it to
	//complete any non-blocking actions that were called when the map was first loaded,
	//but it will not allow it to run the script again once it is completed.
	handleMapOnLoadScript(false);
	if(mapLoadId != MAGE_NO_MAP) { return; }
	//the map's onTick script will run every tick, restarting from the beginning as it completes
	handleMapOnTickScript();
	if(mapLoadId != MAGE_NO_MAP) { return; }
	handleCommandScript(&resumeStates.serial);
	if(mapLoadId != MAGE_NO_MAP) { return; }
	for(uint8_t i = 0; i < MageGame->filteredEntityCountOnThisMap; i++)
	{
		//this script will not initiate any new onInteract scripts. It will simply run an
		//onInteract script based on the state of the entityInteractResumeStates[i] struct
		//the struct is initialized in MageGame->applyUniversalInputs() when the interact
		//button is pressed.
		handleEntityOnInteractScript(i);
		if(mapLoadId != MAGE_NO_MAP) { return; }
		//handle Entity onTick scripts for the local entity at Id 'i':
		//these scripts will run every tick, starting from the beginning as they complete.
		handleEntityOnTickScript(i);
		if(mapLoadId != MAGE_NO_MAP) { return; }
		// yolo
		handleEntityOnLookScript(i);
		if(mapLoadId != MAGE_NO_MAP) { return; }
	}
	MageCommand->sendBufferedOutput();
}
