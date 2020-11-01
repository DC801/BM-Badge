Script Handling processes:

A script is started via the main game loop calling a script handler function.
Scripts can be one of 4 types, each needing it's own control structure.
	-Map OnLoad
	-Map OnTick
	-Entity OnInteract
	-Entity OnTick
when calling a script, it will need to be passed a MageScriptState struct that corresponds to the context it was called in.
This allows for tracking of specific scripts using the same action functions.
as set up currently, there can be up to 2 map scripts and 64 entity scripts (2 scripts per entity, 32 max entities per map) running simultaneously, in various states of completion every loop.

Script handling works as follows:
	-script handlers are called from 4 different locations in the main loop, one for each script type listed above.
	-the 4 different script handlers will need to update the appropriate MageScriptState struct based on the following logic:
	-Check MageScriptState.scriptIsRunning to see if a script is in progress or not
		-If: a script is not running and you're in hex editor mode, return without running a new script.
		-else if: a script is not running, init MageScriptState for the appropriate script Id
		-else if: the scriptId for the map or entity does not match the resumeState, re-init the MageScriptStruct with default values for the appropriate scriptId
		-else: the current script is running, leave MageScriptStruct alone
		-Once MageScriptStruct is current, run processScript() based on the current state of the MageScriptState struct.

	-Once a processScript() function is called, all actions will be based solely on the MageScriptState struct passed to it.
	-Note we will be passing the appropriate MageScriptState struct address to all subsequent functions directly, so anything can edit it as we go.
	-This allows us to use a single action function regardless of which script type called the action and figure out the context from the MageScriptState directly.
		-the script will process actions in order as quickly as possible starting at MageScriptState.actionIndex
		-Actions can be:
			-instant (I), 
			-Instant + Update (I+U), 
			-Instant + call (I+C), 
			-Blocking (B),
			-Non-Blocking (NB), or
			-Non-Blocking Continuous (NBC). 
			-See mage_script_control.h comments above action functions for more info:
		I: process the action and move on as quickly as possible
			-MageScriptState.actionIndex's value will be used for the for loop index directly, so it automatically increments.
		I+U: process the action as quickly as possible and set the scriptRequiresRender variable to true
			-MageScriptState.actionIndex's value will be used for the for loop index directly, so it automatically increments.
		I+C: process the action as quickly as possible and set the MageScriptState.scriptId to the new value when appropriate
			-if a jumpScript is set, immediately init MageScriptState for the new scriptId and begin running the new scriptId from action 0
		B: check the scriptRequiresRender flag and call a manual update before performing the blocking action
			-MageScriptState.actionIndex's value will be used for the for loop index directly, so it automatically increments.
		NB:
			-check if MageScriptState.totalLoopsToNextAction is zero
				-if it is zero, then this is the first loop for this action.
					-set totalLoopsToNextAction and loopsToNextAction to the action duration
				-if it is non-zero, then the looping is in progress
					-decrement loopsToNextAction, and leave totalLoopsToNextAction alone.
			-then check if MageScriptState.loopsToNextAction is zero
				-if it is zero, increment MageScriptState.actionIndex so the program may continue.
		NBC:
			-check if MageScriptState.totalLoopsToNextAction is zero
				-if it is zero, then this is the first loop for this action.
					-set totalLoopsToNextAction and loopsToNextAction to the action duration
				-if it is non-zero, then the looping is in progress
					-decrement loopsToNextAction, and leave totalLoopsToNextAction alone.
			-then check if MageScriptState.loopsToNextAction is zero
				-if it is zero, reset loopsToNextAction to match totalLoopsToNextAction so it will continue forever until the scriptId is changed.
		-if all actions are processed, set the MageScriptState.scriptIsRunning variable to false.
			-this indicates that the next loop can re-init based on the map or entity script Id.
