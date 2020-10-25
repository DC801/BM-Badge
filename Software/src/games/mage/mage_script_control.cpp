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

	//since a bunch of variables below use the same names, and only one switch case will
	//be using them at a time, declare them all up here and only set them below:
	bool expectedBoolValue;
	bool pauseState;
	bool playerHasControl;
	bool state;
	uint8_t paddingA;
	uint8_t paddingB;
	uint8_t paddingC;
	uint8_t paddingD;
	uint8_t paddingE;
	uint8_t paddingF;
	uint8_t paddingG;
	uint8_t entityId;
	uint8_t byteOffset;
	uint8_t expectedByteValue;
	uint8_t saveFlagOffset;
	uint8_t buttonId;
	uint8_t newByteValue;
	uint8_t primaryIdType;
	uint8_t byteAddress;
	uint8_t bitmask;
	uint8_t cellOffset;
	uint8_t amplitude;
	uint8_t frequency;
	uint8_t color;
	uint8_t fontId;
	uint8_t direction;
	uint16_t successScriptId;
	uint16_t geometryId;
	uint16_t dialogId;
	uint16_t stringId;
	uint16_t scriptId;
	uint16_t primaryId;
	uint16_t secondaryId;
	uint16_t mapId;
	uint32_t delayTime;
	uint32_t duration;


	//WARNING: giant switch case for all action types below:
	//I'm also manually coding the conversion from uint8_ts to uint16_ts 
	//and uint32_ts, so the endianness fix is hardcoded. Sorry.
	switch (actionTypeId)
	{
		case MageScriptActionTypeId::NULL_ACTION:
			paddingA = romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];
			//don't do anything for NULL_ACTION
			break;
		case MageScriptActionTypeId::CHECK_ENTITY_BYTE:
			entityId = romValues[0];
			byteOffset = romValues[1];
			expectedByteValue = romValues[2];
			successScriptId = romValues[3] + (romValues[4]<<8);
			paddingF = romValues[5];
			paddingG = romValues[6];
			//checkEntityByte(entityId, byteOffset, expectedValue, successScriptId);
			break;
		case MageScriptActionTypeId::CHECK_SAVE_FLAG:
			saveFlagOffset = romValues[0];
			expectedBoolValue = (bool)romValues[1];
			successScriptId = romValues[2] + (romValues[3]<<8);
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_IF_ENTITY_IS_IN_GEOMETRY:
			entityId = romValues[0];
			geometryId = romValues[1] + (romValues[2]<<8);
			expectedBoolValue = (bool)romValues[3];
			successScriptId = romValues[4] + (romValues[5]<<8);
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_FOR_BUTTON_PRESS:
			buttonId = romValues[0]; //KEYBOARD_KEY enum value
			successScriptId = romValues[1] + (romValues[2]<<8);
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_FOR_BUTTON_STATE:
			buttonId = romValues[0]; //KEYBOARD_KEY enum value
			expectedBoolValue = (bool)romValues[1];
			successScriptId = romValues[2] + (romValues[3]<<8);
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::CHECK_DIALOG_RESPONSE:
			dialogId = romValues[0] + (romValues[1]<<8);
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::COMPARE_ENTITY_NAME:
			entityId = romValues[0];
			stringId = romValues[1] + (romValues[2]<<8);
			successScriptId = romValues[3] + (romValues[4]<<8);
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::DELAY:
			delayTime = romValues[0] + (romValues[1]<<8) + (romValues[2]<<16) + (romValues[3]<<24);
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::NON_BLOCKING_DELAY:
			delayTime = romValues[0] + (romValues[1]<<8) + (romValues[2]<<16) + (romValues[3]<<24);
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_PAUSE_STATE:
			pauseState = (bool)romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_BYTE:
			entityId = romValues[0];
			byteOffset = romValues[1];
			newByteValue = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_SAVE_FLAG:
			saveFlagOffset = romValues[0];
			newByteValue = (bool)romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_PLAYER_CONTROL:
			playerHasControl = (bool)romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_INTERACT_SCRIPT:
			entityId = romValues[0];
			scriptId = romValues[1] + (romValues[2]<<8);
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_TICK_SCRIPT:
			entityId = romValues[0];
			scriptId = romValues[1] + (romValues[2]<<8);
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_MAP_TICK_SCRIPT:
			scriptId = romValues[0] + (romValues[1]<<8);
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_TYPE:
			entityId = romValues[0];
			primaryId = romValues[1] + (romValues[2]<<8);
			secondaryId = romValues[3] + (romValues[4]<<8);
			primaryIdType = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_CURSOR_LOCATION:
			byteAddress = romValues[0] + (romValues[1]<<8);
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_BIT:
			bitmask = romValues[0];
			state = (bool)romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::UNLOCK_HAX_CELL:
			cellOffset = romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::LOCK_HAX_CELL:
			cellOffset = romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::LOAD_MAP:
			mapId = romValues[0] + (romValues[1]<<8);
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SCREEN_SHAKE:
			amplitude = romValues[0];
			frequency = romValues[1];
			duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SCREEN_FADE_OUT:
			color = romValues[0] + (romValues[1]<<8);
			duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SCREEN_FADE_IN:
			color = romValues[0] + (romValues[1]<<8);
			duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SHOW_DIALOG:
			dialogId = romValues[0] + (romValues[1]<<8);
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_RENDERABLE_FONT:
			fontId = romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::MOVE_ENTITY_TO_GEOMETRY:
			entityId = romValues[0];
			geometryId = romValues[1] + (romValues[2]<<8);
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::MOVE_ENTITY_ALONG_GEOMETRY:
			entityId = romValues[0];
			geometryId = romValues[1] + (romValues[2]<<8);
			duration = romValues[3] + (romValues[4]<<8) + (romValues[5]<<16) + (romValues[6]<<24);

			break;
		case MageScriptActionTypeId::LOOP_ENTITY_ALONG_GEOMETRY:
			entityId = romValues[0];
			geometryId = romValues[1] + (romValues[2]<<8);
			duration = romValues[3] + (romValues[4]<<8) + (romValues[5]<<16) + (romValues[6]<<24);

			break;
		case MageScriptActionTypeId::MOVE_CAMERA_TO_GEOMETRY:
			geometryId = romValues[0] + (romValues[1]<<8);
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::MOVE_CAMERA_ALONG_GEOMETRY:
			geometryId = romValues[0] + (romValues[1]<<8);
			duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::LOOP_CAMERA_ALONG_GEOMETRY:
			geometryId = romValues[0] + (romValues[1]<<8);
			duration = romValues[2] + (romValues[3]<<8) + (romValues[4]<<16) + (romValues[5]<<24);
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_ENTITY_DIRECTION:
			entityId = romValues[0];
			direction = romValues[1]; //MageEntityAnimationDirection enum value
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_EDITOR_STATE:
			state = (bool)romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		case MageScriptActionTypeId::SET_HEX_EDITOR_DIALOG_MODE:
			state = (bool)romValues[0];
			paddingB = romValues[1];
			paddingC = romValues[2];
			paddingD = romValues[3];
			paddingE = romValues[4];
			paddingF = romValues[5];
			paddingG = romValues[6];

			break;
		//error if actionTypeId is not one of the above types.
		default:
			#ifdef DC801_DESKTOP
				fprintf(stderr, "Invalid ActionTypeId provided to runAction() function: %d\r\n", actionTypeId);
			#endif
			break;
	}
}
