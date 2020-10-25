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