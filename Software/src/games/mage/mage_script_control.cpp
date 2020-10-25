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

void MageScriptControl::runAction(uint8_t actionTypeId, uint32_t argumentMemoryAddress)
{
	//first read all 7 bytes from ROM
	uint8_t romValues[MAGE_NUM_ACTION_ARGS];
	//Will need to read from ROM for valid data once there's data in the ROM file. -Tim
	//for now just use the following fake data to test for all arguments:
	for(int i=0; i<MAGE_NUM_ACTION_ARGS; i++)
	{ romValues[i] = i*5; }

	//WARNING: giant switch case for all action types below:
	//I'm also manually coding the conversion from uint8_ts to uint16_ts 
	//and uint32_ts, so the endianness fix is hardcoded. Sorry.
	switch (actionTypeId)
	{
		case MageScriptActionTypeId::NULL_ACTION:
			//don't do anything for NULL_ACTION
			break;
		case MageScriptActionTypeId::CHECK_ENTITY_BYTE:
			uint8_t entityId = romValues[0];
			uint8_t byteOffset = romValues[1];
			uint8_t expectedValue = romValues[2];
			uint16_t successScriptId = romValues[3] + (romValues[4]<<8);
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];
			//checkEntityByte(entityId, byteOffset, expectedValue, successScriptId);
			break;
		case MageScriptActionTypeId::CHECK_SAVE_FLAG:
			uint8_t saveFlagOffset = romValues[0];
			bool expectedValue = (bool)romValues[1];
			uint16_t successScriptId = romValues[2] + (romValues[3]<<8);
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_IF_ENTITY_IS_IN_GEOMETRY:
			uint8_t entityId = romValues[0];
			uint16_t GeometryId = romValues[1] + (romValues[2]<<8);
			bool expectedValue = (bool)romValues[3];
			uint16_t successScriptId = romValues[4] + (romValues[5]<<8);
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_FOR_BUTTON_PRESS:
			uint8_t buttonId = romValues[0]; //KEYBOARD_KEY enum value
			uint16_t successScriptId = romValues[1] + (romValues[2]<<8);
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_FOR_BUTTON_STATE:
			uint8_t buttonId = romValues[0]; //KEYBOARD_KEY enum value
			bool expectedValue = (bool)romValues[1];
			uint16_t successScriptId = romValues[2] + (romValues[3]<<8);
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_DIALOG_RESPONSE:
			uint16_t dialogId = romValues[0] + (romValues[1]<<8);
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::COMPARE_ENTITY_NAME:
			uint8_t entityId = romValues[0];
			uint16_t stringId = romValues[1] + (romValues[2]<<8);
			uint16_t successScriptId = romValues[3] + (romValues[4]<<8);
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::DELAY:
			uint32_t delayTime = romValues[0] + (romValues[1]<<8) + (romValues[2]<<16) + (romValues[3]<<24);
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::NON_BLOCKING_DELAY:
			uint32_t delayTime = romValues[0] + (romValues[1]<<8) + (romValues[2]<<16) + (romValues[3]<<24);
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_PAUSE_STATE:
			bool pauseState = (bool)romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_BYTE:
			uint8_t entityId = romValues[0];
			uint8_t byteOffset = romValues[1];
			uint8_t newValue = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_SAVE_FLAG:
			uint8_t saveFlagOffset = romValues[0];
			bool newValue = (bool)romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_PLAYER_CONTROL:
			bool playerHasControl = (bool)romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_INTERACT_SCRIPT:
			uint8_t entityId = romValues[0];
			uint16_t scriptId = romValues[1] + (romValues[2]<<8);
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_TICK_SCRIPT:
			uint8_t entityId = romValues[0];
			uint16_t scriptId = romValues[1] + (romValues[2]<<8);
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_MAP_TICK_SCRIPT:
			uint16_t scriptId = romValues[0] + (romValues[1]<<8);
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_TYPE:
			uint8_t entityId = romValues[0];
			uint16_t primaryId = romValues[1] + (romValues[2]<<8);
			uint16_t secondaryId = romValues[3] + (romValues[4]<<8);
			uint8_t primaryIdType = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_CURSOR_LOCATION:
			uint16_t byteAddress = romValues[0] + (romValues[1]<<8);
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_BIT:
			uint8_t bitmask = romValues[0];
			bool state = (bool)romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::UNLOCK_HAX_CELL:
			uint8_t cellOffset = romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::LOCK_HAX_CELL:
			uint8_t cellOffset = romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::LOAD_MAP:
			uint16_t mapId = romValues[0] + (romValues[1]<<8);
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SCREEN_SHAKE:
			uint8_t amplitude = romValues[0];
			uint8_t frequency = romValues[1];
			uint32_t duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SCREEN_FADE_OUT:
			uint16_t color = romValues[0] + (romValues[1]<<8);
			uint32_t duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SCREEN_FADE_IN:
			uint16_t color = romValues[0] + (romValues[1]<<8);
			uint32_t duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SHOW_DIALOG:
			uint16_t dialogId = romValues[0] + (romValues[1]<<8);
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_RENDERABLE_FONT:
			uint8_t fontId = romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::MOVE_ENTITY_TO_GEOMETRY:
			uint8_t entityId = romValues[0];
			uint16_t geometryId = romValues[1] + (romValues[2]<<8);
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::MOVE_ENTITY_ALONG_GEOMETRY:
			uint8_t entityId = romValues[0];
			uint16_t geometryId = romValues[1] + (romValues[2]<<8);
			uint32_t duration = romValues[3] + (romValues[4]<<8) + (romValues[5]<<16) + (romValues[6]<<24);

			break;
		case MageScriptActionTypeId::LOOP_ENTITY_ALONG_GEOMETRY:
			uint8_t entityId = romValues[0];
			uint16_t geometryId = romValues[1] + (romValues[2]<<8);
			uint32_t duration = romValues[3] + (romValues[4]<<8) + (romValues[5]<<16) + (romValues[6]<<24);

			break;
		case MageScriptActionTypeId::MOVE_CAMERA_TO_GEOMETRY:
			uint16_t geometryId = romValues[0] + (romValues[1]<<8);
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::MOVE_CAMERA_ALONG_GEOMETRY:
			uint16_t geometryId = romValues[0] + (romValues[1]<<8);
			uint32_t duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::LOOP_CAMERA_ALONG_GEOMETRY:
			uint16_t geometryId = romValues[0] + (romValues[1]<<8);
			uint32_t duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_DIRECTION:
			uint8_t entityId = romValues[0];
			uint8_t direction = romValues[1]; //MageEntityAnimationDirection enum value
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_EDITOR_STATE:
			bool state = (bool)romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_EDITOR_DIALOG_MODE:
			bool state = (bool)romValues[0];
			uint8_t paddingB = romValues[1];
			uint8_t paddingC = romValues[2];
			uint8_t paddingD = romValues[3];
			uint8_t paddingE = romValues[4];
			uint8_t paddingF = romValues[5];
			uint8_t paddingG = romValues[6];

			break;
		//error if actionTypeId is not one of the above types.
		default:
			#ifdef DC801_DESKTOP
				fprintf(stderr, "Invalid ActionTypeId provided to runAction() function: %d\r\n", actionTypeId);
			#endif
			break;
	}
}
