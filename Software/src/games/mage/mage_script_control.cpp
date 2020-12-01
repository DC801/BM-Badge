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

void MageScriptControl::processScript(MageScriptState * resumeStateStruct, uint8_t entityId, uint8_t scriptType)
{
	//set the current entity to the passed value.
	currentEntityId = entityId;
	//set the current script type to the passed value.
	currentScriptType = scriptType;
	//All script processing from here relies solely on the state of the resumeStateStruct:
	//Make sure you've got your script states correct in the resumeStateStruct array before calling this function:
	jumpScript = resumeStateStruct->scriptId;
	while(jumpScript != MAGE_NO_SCRIPT)
	{
		processActionQueue(resumeStateStruct);
		//if no new jumpScript was set, we can exit the loop immediately.
		if(jumpScript == MAGE_NO_SCRIPT)
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
	jumpScript = MAGE_NO_SCRIPT;

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
		//check to see if the action set a jumpScript value
		if(jumpScript != MAGE_NO_SCRIPT){
			setEntityScript(jumpScript, currentEntityId, currentScriptType);
			//immediately end action processing and return if a jumpScript value was set:
			return;
		}
		//all actions are exactly 8 bytes long, so we can address increment by one uint64_t
		address += sizeof(uint64_t);
	}
	//if you get here, and jumpScript == MAGE_NO_SCRIPT, all actions in the script are done
	if(jumpScript == MAGE_NO_SCRIPT)
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

int16_t MageScriptControl::getUsefulEntityIndexFromActionEntityId(uint8_t entityId)
{
	int16_t entityIndex = entityId;
	if(entityIndex == MAGE_ENTITY_SELF) {
		entityIndex = currentEntityId;
	} else if (
		entityIndex == MAGE_ENTITY_PLAYER
		) {
		entityIndex = MageGame->playerEntityIndex;
	}
	return entityIndex;
}

uint16_t MageScriptControl::getUsefulGeometryIndexFromActionGeometryId(
	uint16_t geometryId,
	MageEntity *entity
)
{
	uint16_t geometryIndex = geometryId;
	if(geometryIndex == MAGE_ENTITY_PATH) {
		geometryIndex = convert_endian_u2_value(
			*(uint16_t *)((uint8_t *)&entity->hackableStateA)
		);
	}
	return geometryIndex;
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
	//now check the validated data and set jumpScript if appropriate:
	uint8_t * byteAddress = ((uint8_t*)hackableDataAddress + argStruct->byteOffset);
	if(argStruct->expectedValue == *byteAddress)
	{
		//convert scriptId from local to global scope and assign to jumpScript:
		jumpScript = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
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

void MageScriptControl::checkIfEntityIsInGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckifEntityIsInGeometry *argStruct = (ActionCheckifEntityIsInGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageGeometry *geometry = MageGame->getValidGeometry(argStruct->geometryId);
		bool colliding = geometry->isPointInGeometry(renderable->center);
		if(colliding == argStruct->expectedBoolValue) {
			//convert scriptId from local to global scope and assign to jumpScript:
			jumpScript = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
		}
	}
}

void MageScriptControl::checkForButtonPress(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckForButtonPress *argStruct = (ActionCheckForButtonPress*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	//get state of button:
	bool *button_address = (bool*)(&EngineInput_Activated) + argStruct->buttonId;
	bool button_activated = *button_address;
	if(button_activated)
	{
		//convert scriptId from local to global scope and assign to jumpScript:
		jumpScript = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
	}
	return;
}

void MageScriptControl::checkForButtonState(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCheckForButtonState *argStruct = (ActionCheckForButtonState*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	//get state of button:
	bool *button_address = (bool*)(&EngineInput_Buttons) + argStruct->buttonId;
	bool button_state = *button_address;
	if(button_state == (bool)(argStruct->expectedBoolValue))
	{
		//convert scriptId from local to global scope and assign to jumpScript:
		jumpScript = MageGame->Map().getGlobalScriptId(argStruct->successScriptId);
	}
	return;
}

void MageScriptControl::runScript(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionRunScript *argStruct = (ActionRunScript*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->scriptId = convert_endian_u2_value(argStruct->scriptId);
	//convert scriptId from local to global scope and assign to jumpScript:
	jumpScript = MageGame->Map().getGlobalScriptId(argStruct->scriptId);
	return;
}

//waiting for implementation of global strings to implement -Tim
void MageScriptControl::compareEntityName(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionCompareEntityName *argStruct = (ActionCompareEntityName*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->successScriptId = convert_endian_u2_value(argStruct->successScriptId);
	argStruct->stringId = convert_endian_u2_value(argStruct->stringId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId);
	if(entityIndex != NO_PLAYER) {
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		std::string romString = MageGame->getString(argStruct->stringId);
		std::string entityName(13, '\0');
		entityName.assign(entity->name, 12);
		int compare = strcmp(entityName.c_str(), romString.c_str());
		bool identical = compare == 0;
		if(identical == argStruct->expectedBoolValue) {
			jumpScript = argStruct->successScriptId;
		}
	}
	return;
}

void MageScriptControl::blockingDelay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionBlockingDelay *argStruct = (ActionBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
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
	return;
}

void MageScriptControl::nonBlockingDelay(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionNonBlockingDelay *argStruct = (ActionNonBlockingDelay*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
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
		uint16_t totalDelayLoops = argStruct->duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
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
	if(argStruct->entityId == MAGE_ENTITY_SELF)
	{
		//the map doesn't have an entity, so we return if the script is on the map:
		if(currentEntityId == MAGE_MAP_ENTITY) 
		{
			return;
		}
		//set the entityId to be the entity that the script was called from:
		argStruct->entityId = currentEntityId;
	}
	else if (argStruct->entityId == MAGE_ENTITY_PLAYER)
	{
		//set the entityId to the player, if there is one:
		if(MageGame->playerEntityIndex == NO_PLAYER)
		{ 
			return; 
		}
		else
		{
			argStruct->entityId = MageGame->playerEntityIndex;
		}
	}
	else
	{
		argStruct->entityId = MageGame->getValidEntityId(argStruct->entityId);
	}
	argStruct->direction = MageGame->getValidEntityTypeDirection(argStruct->direction);
	//set direction:
	MageGame->entities[argStruct->entityId].direction = argStruct->direction;
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

	if(resumeStateStruct->totalLoopsToNextAction == 0) {
		printf("Opening dialog %d\n", argStruct->dialogId);
		MageGame->playerHasControl = false;
		MageDialog->load(argStruct->dialogId);
		resumeStateStruct->totalLoopsToNextAction = 1;
	}
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

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		MageGeometry *geometry = MageGame->getValidGeometry(argStruct->geometryId);
		setEntityPositionToPoint(
			entity,
			offsetPointRelativeToEntityCenter(
				renderable,
				entity,
				&geometry->points[0]
			)
		);
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

void MageScriptControl::walkEntityToGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionWalkEntityToGeometry *argStruct = (ActionWalkEntityToGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry *geometry = MageGame->getValidGeometry(geometryIndex);

		if(resumeStateStruct->totalLoopsToNextAction == 0) {
			uint16_t totalDelayLoops = argStruct->duration / MAGE_MIN_MILLIS_BETWEEN_FRAMES;
			//now set the resumeStateStruct variables:
			resumeStateStruct->totalLoopsToNextAction = totalDelayLoops;
			resumeStateStruct->loopsToNextAction = totalDelayLoops;

			//this is the points we're interpolating between
			resumeStateStruct->pointA = {
				.x = entity->x,
				.y = entity->y,
			};
			resumeStateStruct->pointB = offsetPointRelativeToEntityCenter(
				renderable,
				entity,
				&geometry->points[0]
			);
			entity->direction = getRelativeDirection(
				resumeStateStruct->pointA,
				resumeStateStruct->pointB
			);
			entity->currentAnimation = 1;
		}
		resumeStateStruct->loopsToNextAction--;
		Point betweenPoint = FrameBuffer::lerpPoints(
			resumeStateStruct->pointA,
			resumeStateStruct->pointB,
			getProgressOfAction(resumeStateStruct)
		);
		setEntityPositionToPoint(entity, betweenPoint);
		if(resumeStateStruct->loopsToNextAction == 0) {
			entity->currentAnimation = 0;
			entity->currentFrame = 0;
			resumeStateStruct->totalLoopsToNextAction = 0;
		}
		MageGame->updateEntityRenderableData(entityIndex);
	}
}

float MageScriptControl::getProgressOfAction(
	const MageScriptState *resumeStateStruct
) const {
	return 1.0f - (
		(float)resumeStateStruct->loopsToNextAction
		/ (float)resumeStateStruct->totalLoopsToNextAction
	);
}

MageEntityAnimationDirection MageScriptControl::getRelativeDirection(
	const Point &pointA,
	const Point &pointB
) const {
	float angle = atan2f32(
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

void MageScriptControl::walkEntityAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionWalkEntityAlongGeometry *argStruct = (ActionWalkEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry *geometry = MageGame->getValidGeometry(geometryIndex);

		// handle single point geometries
		if(geometry->pointCount == 1) {
			resumeStateStruct->totalLoopsToNextAction = 1;
			setEntityPositionToPoint(
				entity,
				offsetPointRelativeToEntityCenter(
					renderable,
					entity,
					&geometry->points[0]
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
			resumeStateStruct->length = geometry->pathLength;
			initializeEntityGeometryPath(resumeStateStruct, renderable, entity, geometry);
			entity->currentAnimation = 1;
		}
		resumeStateStruct->loopsToNextAction--;
		uint16_t sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
			geometry,
			resumeStateStruct->currentSegmentIndex
		);
		float totalProgress = getProgressOfAction(resumeStateStruct);
		float currentProgressLength = resumeStateStruct->length * totalProgress;
		float currentSegmentLength = geometry->segmentLengths[sanitizedCurrentSegmentIndex];
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
				geometry,
				resumeStateStruct->currentSegmentIndex
			);
			uint16_t pointBIndex = getLoopableGeometryPointIndex(
				geometry,
				resumeStateStruct->currentSegmentIndex + 1
			);
			sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
				geometry,
				resumeStateStruct->currentSegmentIndex
			);
			currentSegmentLength = geometry->segmentLengths[sanitizedCurrentSegmentIndex];
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
				geometry,
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
	return;
}
void MageScriptControl::loopEntityAlongGeometry(uint8_t * args, MageScriptState * resumeStateStruct)
{
	ActionLoopEntityAlongGeometry *argStruct = (ActionLoopEntityAlongGeometry*)args;
	//endianness conversion for arguments larger than 1 byte:
	argStruct->duration = convert_endian_u4_value(argStruct->duration);
	argStruct->geometryId = convert_endian_u2_value(argStruct->geometryId);

	int16_t entityIndex = getUsefulEntityIndexFromActionEntityId(argStruct->entityId);
	if(entityIndex != NO_PLAYER) {
		MageEntityRenderableData *renderable = MageGame->getValidEntityRenderableData(entityIndex);
		MageEntity *entity = MageGame->getValidEntity(entityIndex);
		uint16_t geometryIndex = getUsefulGeometryIndexFromActionGeometryId(argStruct->geometryId, entity);
		MageGeometry *geometry = MageGame->getValidGeometry(geometryIndex);

		// handle single point geometries
		if(geometry->pointCount == 1) {
			resumeStateStruct->totalLoopsToNextAction = 1;
			setEntityPositionToPoint(
				entity,
				offsetPointRelativeToEntityCenter(
					renderable,
					entity,
					&geometry->points[0]
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
			resumeStateStruct->length = (geometry->typeId == POLYLINE)
				? geometry->pathLength * 2
				: geometry->pathLength;
			initializeEntityGeometryPath(resumeStateStruct, renderable, entity, geometry);
			entity->currentAnimation = 1;
		}
		if(resumeStateStruct->loopsToNextAction == 0) {
			resumeStateStruct->loopsToNextAction = resumeStateStruct->totalLoopsToNextAction;
			initializeEntityGeometryPath(resumeStateStruct, renderable, entity, geometry);
		}
		resumeStateStruct->loopsToNextAction--;
		uint16_t sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
			geometry,
			resumeStateStruct->currentSegmentIndex
		);
		float totalProgress = getProgressOfAction(resumeStateStruct);
		float currentProgressLength = resumeStateStruct->length * totalProgress;
		float currentSegmentLength = geometry->segmentLengths[sanitizedCurrentSegmentIndex];
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
				geometry,
				resumeStateStruct->currentSegmentIndex
			);
			uint16_t pointBIndex = getLoopableGeometryPointIndex(
				geometry,
				resumeStateStruct->currentSegmentIndex + 1
			);
			sanitizedCurrentSegmentIndex = getLoopableGeometrySegmentIndex(
				geometry,
				resumeStateStruct->currentSegmentIndex
			);
			currentSegmentLength = geometry->segmentLengths[sanitizedCurrentSegmentIndex];
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
				geometry,
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
	jumpScript = MAGE_NO_SCRIPT;

	blockingDelayTime = 0;

	//these should never be used in their initialized states, they will always be set when calling processScript()
	currentEntityId = MAGE_MAP_ENTITY;
	currentScriptType = ON_LOAD;

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
		sizeof(blockingDelayTime) +
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
	if(!mapLoadResumeState.scriptIsRunning)
	{
		return;
	}
	//otherwise, the load script is still running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the scriptId is contained within the *ResumeState struct so we can call actions:
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
	//re-initialize the *ResumeState struct from the scriptId
	else if(
		!scriptIsRunning ||
		mapTickResumeState.scriptId != (MageGame->Map().OnTick()) 
	)
	{
		//populate the MageScriptState struct with appropriate init data
		initScriptState(&mapTickResumeState, MageGame->Map().OnTick(), true);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the scriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the map entity value.
	currentEntityId = MAGE_MAP_ENTITY;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&mapTickResumeState, MAGE_MAP_ENTITY, MageScriptType::ON_TICK);
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
		//the scriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = index;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&entityInteractResumeStates[index], index, MageScriptType::ON_INTERACT);
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
	//if the entityOnTick script Id doesn't match the *ResumeState, 
	//re-initialize the *ResumeState struct from the scriptId
	else if(
		!scriptIsRunning ||
		entityTickResumeStates[index].scriptId != MageGame->getValidGlobalScriptId(globalEntityScriptId)
	)
	{
		//populate the MageScriptState struct with appropriate init data
		initScriptState(&entityTickResumeStates[index], globalEntityScriptId, true);
	}
	//otherwise, a script is running and the resumeStateStruct controls all further actions:
	else
	{
		//if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the 
		//resumeState struct, so we will proceed with the remaining info in the struct as-is.
		//the scriptId is contained within the *ResumeState struct so we can call actions:
	}
	//set the current entity to the current entity index value.
	currentEntityId = index;
	//now that the *ResumeState struct is correctly configured, process the script:
	processScript(&entityTickResumeStates[index], index, MageScriptType::ON_TICK);
}
