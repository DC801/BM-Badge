#ifndef _MAGE_SCRIPT_CONTROL_H
#define _MAGE_SCRIPT_CONTROL_H

#include "mage_defines.h"
#include "mage.h"
#include "mage_game_control.h"
#include "mage_hex.h"

#define SCRIPT_NAME_LENGTH 32

//these are the types of scripts that can be on a map or entity:
typedef enum : uint8_t {
	ON_LOAD = 0,
	ON_TICK,
	ON_INTERACT,
	ON_LOOK,
	ON_COMMAND,
	NUM_SCRIPT_TYPES
} MageScriptType;

struct resumeStatesStruct {
	MageScriptState mapLoad;
	MageScriptState mapTick;
	MageScriptState commandLook;
	MageScriptState commandGo;
	MageScriptState commandUse;
	MageScriptState commandGet;
	MageScriptState commandDrop;
};

//this is a class designed to handle all the scripting for the MAGE() game
//it is designed to work in tandem with a MageGameControl object and a
//MageHex object to effect that state of the game.

class MageScriptControl
{
	private:
		//variables for tracking suspended script states:
		MageScriptState entityInteractResumeStates[MAX_ENTITIES_PER_MAP];
		MageScriptState entityTickResumeStates[MAX_ENTITIES_PER_MAP];

		//this will process a script based on the state of the resumeStateStruct passed to it.
		//it should only be called from the 
		void processScript(MageScriptState * resumeStateStruct, uint8_t mapLocalEntityId, MageScriptType scriptType);

		//this will run through the actions in a script from the state stores in resumeState
		//if a mapLocalJumpScript is called by an action, it will return without processing any further actions.
		void processActionQueue(
			MageScriptState * resumeStateStruct,
			MageScriptType scriptType
		);

		//this will get action arguments from ROM memory and call
		//a function based on the ActionTypeId 
		void runAction(uint32_t argumentMemoryAddress, MageScriptState * resumeStateStruct);

	public:
		//this allows an I+C action to set the calling map or entity script to match the new script.
		void setEntityScript(
			uint16_t mapLocalScriptId,
			uint8_t entityId,
			uint8_t scriptType
		);

		//the mapLocalJumpScript variable is used by some actions to indicate that a script should
		//end and immediately begin running a new script.
		//it should be set to MAGE_NO_SCRIPT unless a new script should be run immediately.
		int32_t mapLocalJumpScript;

		//this is a variable that tracks which entity called an action.
		//If the action was called by the map, the value will be MAGE_MAP_ENTITY.
		//most actions will not do anything if an action that uses MAGE_ENTITY_SELF is called from the map's scripts.
		uint8_t currentEntityId;

		//this is a global that holds the amount of millis that a blocking delay will
		//prevent the main loop from continuing for. It is set by the blockingDelay() action.
		uint32_t blockingDelayTime;

		//this is used by the loadMap action to indicate when a new map needs to be loaded.
		//when set to a value other than MAGE_NO_MAP, it will cause all scripts to stop and 
		//the new map will be loaded at the beginning of the next tick
		int32_t mapLoadId;

		MageScriptControl();

		//returns size in RAM of all reserved class variables.
		uint32_t size() const;

		//this resets the values of a MageScriptState struct to default values.
		//you need to provide a mapLocalScriptId, and the state of the scriptIsRunning variable
		//the actionId, and duration variables are always reset to 0 on an init.
		void initScriptState(
			MageScriptState * resumeStateStruct,
			uint16_t mapLocalScriptId,
			bool scriptIsRunning
		);

		//these functions return the specified MageScriptState struct:
		resumeStatesStruct resumeStates;
		MageScriptState* getEntityInteractResumeState(uint8_t index);
		MageScriptState* getEntityTickResumeState(uint8_t index);

		//these functions will call the appropriate script processing for their script type:
		void handleMapOnLoadScript(bool isFirstRun);
		void handleMapOnTickScript();
		void handleCommandScript(MageScriptState *resumeState);
		void handleEntityOnTickScript(uint8_t filteredEntityId);
		void handleEntityOnInteractScript(uint8_t filteredEntityId);

		void tickScripts();
}; //MageScriptControl

#endif //_MAGE_SCRIPT_CONTROL_H
