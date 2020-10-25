/*
This class contains all the code related to the hex editor hacking interface.
*/
#ifndef _MAGE_SCRIPT_CONTROL_H
#define _MAGE_SCRIPT_CONTROL_H

#include "mage_defines.h"
#include "mage.h"
#include "mage_game_control.h"
#include "mage_hex.h"

//this is a class designed to handle all the scripting for the MAGE() game
//it is designed to work in tandem with a MageGameControl object and a
//MageHex object to effect that state of the game.

class MageScriptControl
{
	private:
		//variables for tracking suspended script states:
		MageScriptState mapLoadResumeState;
		MageScriptState mapTickResumeState;
		MageScriptState entityTickResumeStates[MAX_ENTITIES_PER_MAP];
		MageScriptState entityInteractResumeStates[MAX_ENTITIES_PER_MAP];
	public:
		MageScriptControl();

		uint32_t size() const;

		//this will get action arguments from ROM memory and call
		//a function based on the ActionTypeId 
		void runAction(uint8_t actionTypeId, uint32_t argumentMemoryAddress);
}; //MageScriptControl

#endif //_MAGE_SCRIPT_CONTROL_H
