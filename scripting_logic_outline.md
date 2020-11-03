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
	-script handlers are called using the handleScripts() function every time through the main loop.
		-the map onLoad script is called only once with it's isFirstRun flag set to true when the map is loaded.
			-all other calls to the map's onLoad handler will only continue the first run of the script until all actions are completed.
			-the isFirstRun flag will force the appropriate script to run from the 0th action.
			-otherwise, the handler will only be able to resume the previously started script based on the MageScriptStruct.
		-the entity onInteract scripts are only triggered by a button press, and as such are initialized from applyGameModeInput()
			-when the onInteract is triggered in, all the base function does is set the MageStateStruct, not run any actions.
				-If onInteract is triggered while a script is running, it should start the script over again from the beginning.
			-the entity onInteract handlers will continue the initialized MageStateStruct currently running script until all actions are completed.
				-If: the MageScriptState.scriptIsRunning is false, return without further action.
				-Else If: the scriptId doesn't match, stop all current script actions without starting a new onInteract script.
					-reinitialize the MageStateStruct with .scriptIsRunning set to false.
				-Else: run the script based on the state of the MageScriptStruct until it completes.
		-the 2 remaining onTick script handlers will need to update the appropriate MageScriptState struct based on the following logic:
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
			-All blocking actions called in a loop will add their blocking timer value to a MageScriptControl private variable.
				-At the end of the game loop (after all other updates and rendering), the game will delay for the total blocking delay time before the next loop.
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
