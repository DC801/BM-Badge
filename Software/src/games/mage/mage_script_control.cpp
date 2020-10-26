#include "mage_script_control.h"

//load in the global variables that the scripts will be operating on:
extern MageGameControl *MageGame;
extern MageHexEditor *MageHex;
extern MageScriptControl *MageScript;
extern MageEntity *hackableDataAddress;
extern FrameBuffer *mage_canvas;
extern Point cameraPosition;

MageScriptControl::MageScriptControl()
{
	mapLoadResumeState.scriptId = 0;
	mapLoadResumeState.actionId = 0;
	mapLoadResumeState.timeToNextAction = 0;

	mapTickResumeState.scriptId = 0;
	mapTickResumeState.actionId = 0;
	mapTickResumeState.timeToNextAction = 0;

	for(uint16_t i=0; i<MAX_ENTITIES_PER_MAP; i++)
	{
		entityInteractResumeStates[i].scriptId = 0;
		entityInteractResumeStates[i].actionId = 0;
		entityInteractResumeStates[i].timeToNextAction = 0;
		
		entityTickResumeStates[i].scriptId = 0;
		entityTickResumeStates[i].actionId = 0;
		entityTickResumeStates[i].timeToNextAction = 0;
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
	actionFunctions[MageScriptActionTypeId::DELAY]                          = &MageScriptControl::delay;
	actionFunctions[MageScriptActionTypeId::NON_BLOCKING_DELAY]             = &MageScriptControl::nonBlockingDelay;
	actionFunctions[MageScriptActionTypeId::SET_PAUSE_STATE]                = &MageScriptControl::setPauseState;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_BYTE]                = &MageScriptControl::setEntityByte;
	actionFunctions[MageScriptActionTypeId::SET_SAVE_FLAG]                  = &MageScriptControl::setSaveFlag;
	actionFunctions[MageScriptActionTypeId::SET_PLAYER_CONTROL]             = &MageScriptControl::setPlayerControl;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_INTERACT_SCRIPT]     = &MageScriptControl::setEntityInteractScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_TICK_SCRIPT]         = &MageScriptControl::setEntityTickScript;
	actionFunctions[MageScriptActionTypeId::SET_MAP_TICK_SCRIPT]            = &MageScriptControl::setMapTickScript;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_TYPE]                = &MageScriptControl::setEntityType;
	actionFunctions[MageScriptActionTypeId::SET_HEX_CURSOR_LOCATION]        = &MageScriptControl::setHexCursorLocation;
	actionFunctions[MageScriptActionTypeId::SET_HEX_BIT]                    = &MageScriptControl::setHexBit;
	actionFunctions[MageScriptActionTypeId::UNLOCK_HAX_CELL]                = &MageScriptControl::unlockHaxCell;
	actionFunctions[MageScriptActionTypeId::LOCK_HAX_CELL]                  = &MageScriptControl::lockHaxCell;
	actionFunctions[MageScriptActionTypeId::LOAD_MAP]                       = &MageScriptControl::loadMap;
	actionFunctions[MageScriptActionTypeId::SCREEN_SHAKE]                   = &MageScriptControl::screenShake;
	actionFunctions[MageScriptActionTypeId::SCREEN_FADE_OUT]                = &MageScriptControl::screenFadeOut;
	actionFunctions[MageScriptActionTypeId::SCREEN_FADE_IN]                 = &MageScriptControl::screenFadeIn;
	actionFunctions[MageScriptActionTypeId::SHOW_DIALOG]                    = &MageScriptControl::showDialog;
	actionFunctions[MageScriptActionTypeId::SET_RENDERABLE_FONT]            = &MageScriptControl::setRenderableFont;
	actionFunctions[MageScriptActionTypeId::MOVE_ENTITY_TO_GEOMETRY]        = &MageScriptControl::moveEntityToGeometry;
	actionFunctions[MageScriptActionTypeId::MOVE_ENTITY_ALONG_GEOMETRY]     = &MageScriptControl::moveEntityAlongGeometry;
	actionFunctions[MageScriptActionTypeId::LOOP_ENTITY_ALONG_GEOMETRY]     = &MageScriptControl::loopEntityAlongGeometry;
	actionFunctions[MageScriptActionTypeId::MOVE_CAMERA_TO_GEOMETRY]        = &MageScriptControl::moveCameratoGeometry;
	actionFunctions[MageScriptActionTypeId::MOVE_CAMERA_ALONG_GEOMETRY]     = &MageScriptControl::moveCameraAlongGeometry;
	actionFunctions[MageScriptActionTypeId::LOOP_CAMERA_ALONG_GEOMETRY]     = &MageScriptControl::loopCameraAlongGeometry;
	actionFunctions[MageScriptActionTypeId::SET_ENTITY_DIRECTION]           = &MageScriptControl::setEntityDirection;
	actionFunctions[MageScriptActionTypeId::SET_HEX_EDITOR_STATE]           = &MageScriptControl::setHexEditorState;
	actionFunctions[MageScriptActionTypeId::SET_HEX_EDITOR_DIALOG_MODE]     = &MageScriptControl::setHexEditorDialogMode;
}

uint32_t MageScriptControl::size() const
{
	uint32_t size =
		sizeof(MageScriptState) + //mapLoadResumeState
		sizeof(MageScriptState) + //mapTickResumeState
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP + //entityInteractResumeStates
		sizeof(MageScriptState)*MAX_ENTITIES_PER_MAP; //entityTickResumeStates
	return size;
}

void MageScriptControl::runAction(uint32_t actionMemoryAddress)
{
	//first read all 7 bytes from ROM
	uint8_t romValues[MAGE_NUM_ACTION_ARGS];
	//Will need to read from ROM for valid data once there's data in the ROM file. -Tim
	//for now just use the following fake data to test for all arguments:
	for(int i=0; i<MAGE_NUM_ACTION_ARGS; i++)
	{ romValues[i] = i*5; }
	//this will be the last byte read after the 7 args:
	uint8_t actionTypeId = MageScriptActionTypeId::CHECK_ENTITY_BYTE;

	//get the function for actionTypeId, and feed it the romValues as args:
	auto func = actionFunctions[actionTypeId];
	(this->*func)(romValues);
}

void MageScriptControl::nullAction(uint8_t * args)
{
	//nullAction does nothing.
	return;
}
void MageScriptControl::checkEntityByte(uint8_t * args)
{
	ActionCheckEntityByte *argStruct = (ActionCheckEntityByte*)args;
	return;
}
void MageScriptControl::checkSaveFlag(uint8_t * args)
{
	ActionCheckSaveFlag *argStruct = (ActionCheckSaveFlag*)args;
	return;
}
void MageScriptControl::checkIfEntityIsInGeometry(uint8_t * args)
{
	ActionCheckifEntityIsInGeometry *argStruct = (ActionCheckifEntityIsInGeometry*)args;
	return;
}
void MageScriptControl::checkForButtonPress(uint8_t * args)
{
	ActionCheckForButtonPress *argStruct = (ActionCheckForButtonPress*)args;
	return;
}
void MageScriptControl::checkForButtonState(uint8_t * args)
{
	ActionCheckForButtonState *argStruct = (ActionCheckForButtonState*)args;
	return;
}
void MageScriptControl::runScript(uint8_t * args)
{
	ActionRunScript *argStruct = (ActionRunScript*)args;
	return;
}
void MageScriptControl::compareEntityName(uint8_t * args)
{
	ActionCompareEntityName *argStruct = (ActionCompareEntityName*)args;
	return;
}
void MageScriptControl::delay(uint8_t * args)
{
	ActionDelay *argStruct = (ActionDelay*)args;
	return;
}
void MageScriptControl::nonBlockingDelay(uint8_t * args)
{
	ActionNonBlockingDelay *argStruct = (ActionNonBlockingDelay*)args;
	return;
}
void MageScriptControl::setPauseState(uint8_t * args)
{
	ActionSetPauseState *argStruct = (ActionSetPauseState*)args;
	return;
}
void MageScriptControl::setEntityByte(uint8_t * args)
{
	ActionSetEntityByte *argStruct = (ActionSetEntityByte*)args;
	return;
}
void MageScriptControl::setSaveFlag(uint8_t * args)
{
	ActionSetSaveFlag *argStruct = (ActionSetSaveFlag*)args;
	return;
}
void MageScriptControl::setPlayerControl(uint8_t * args)
{
	ActionSetPlayerControl *argStruct = (ActionSetPlayerControl*)args;
	return;
}
void MageScriptControl::setEntityInteractScript(uint8_t * args)
{
	ActionSetEntityInteractScript *argStruct = (ActionSetEntityInteractScript*)args;
	return;
}
void MageScriptControl::setEntityTickScript(uint8_t * args)
{
	ActionSetEntityTickScript *argStruct = (ActionSetEntityTickScript*)args;
	return;
}
void MageScriptControl::setMapTickScript(uint8_t * args)
{
	ActionSetMapTickScript *argStruct = (ActionSetMapTickScript*)args;
	return;
}
void MageScriptControl::setEntityType(uint8_t * args)
{
	ActionSetEntityType *argStruct = (ActionSetEntityType*)args;
	return;
}
void MageScriptControl::setHexCursorLocation(uint8_t * args)
{
	ActionSetHexCursorLocation *argStruct = (ActionSetHexCursorLocation*)args;
	return;
}
void MageScriptControl::setHexBit(uint8_t * args)
{
	ActionSetHexBit *argStruct = (ActionSetHexBit*)args;
	return;
}
void MageScriptControl::unlockHaxCell(uint8_t * args)
{
	ActionUnlockHaxCell *argStruct = (ActionUnlockHaxCell*)args;
	return;
}
void MageScriptControl::lockHaxCell(uint8_t * args)
{
	ActionLockHaxCell *argStruct = (ActionLockHaxCell*)args;
	return;
}
void MageScriptControl::loadMap(uint8_t * args)
{
	ActionLoadMap *argStruct = (ActionLoadMap*)args;
	return;
}
void MageScriptControl::screenShake(uint8_t * args)
{
	ActionScreenShake *argStruct = (ActionScreenShake*)args;
	return;
}
void MageScriptControl::screenFadeOut(uint8_t * args)
{
	ActionScreenFadeOut *argStruct = (ActionScreenFadeOut*)args;
	return;
}
void MageScriptControl::screenFadeIn(uint8_t * args)
{
	ActionScreenFadeIn *argStruct = (ActionScreenFadeIn*)args;
	return;
}
void MageScriptControl::showDialog(uint8_t * args)
{
	ActionShowDialog *argStruct = (ActionShowDialog*)args;
	return;
}
void MageScriptControl::setRenderableFont(uint8_t * args)
{
	ActionSetRenderableFont *argStruct = (ActionSetRenderableFont*)args;
	return;
}
void MageScriptControl::moveEntityToGeometry(uint8_t * args)
{
	ActionMoveEntityToGeometry *argStruct = (ActionMoveEntityToGeometry*)args;
	return;
}
void MageScriptControl::moveEntityAlongGeometry(uint8_t * args)
{
	ActionMoveEntityAlongGeometry *argStruct = (ActionMoveEntityAlongGeometry*)args;
	return;
}
void MageScriptControl::loopEntityAlongGeometry(uint8_t * args)
{
	ActionLoopEntityAlongGeometry *argStruct = (ActionLoopEntityAlongGeometry*)args;
	return;
}
void MageScriptControl::moveCameratoGeometry(uint8_t * args)
{
	ActionMoveCameraToGeometry *argStruct = (ActionMoveCameraToGeometry*)args;
	return;
}
void MageScriptControl::moveCameraAlongGeometry(uint8_t * args)
{
	ActionMoveCameraAlongGeometry *argStruct = (ActionMoveCameraAlongGeometry*)args;
	return;
}
void MageScriptControl::loopCameraAlongGeometry(uint8_t * args)
{
	ActionLoopCameraAlongGeometry *argStruct = (ActionLoopCameraAlongGeometry*)args;
	return;
}
void MageScriptControl::setEntityDirection(uint8_t * args)
{
	ActionSetEntityDirection *argStruct = (ActionSetEntityDirection*)args;
	return;
}
void MageScriptControl::setHexEditorState(uint8_t * args)
{
	ActionSetHexEditorState *argStruct = (ActionSetHexEditorState*)args;
	return;
}
void MageScriptControl::setHexEditorDialogMode(uint8_t * args)
{
	ActionSetHexEditorDialogMode *argStruct = (ActionSetHexEditorDialogMode*)args;
	return;
}
