#include "mage_script_control.h"
#include "mage_command_control.h"
#include "EngineInput.h"
#include "shim_err.h"

//load in the global variables that the scripts will be operating on:

void MageScriptControl::initializeScriptsOnMapLoad()
{
   //initialize the script resumeStates:
   for (uint8_t i = 0; i < COMMAND_STATES_COUNT; i++)
   {
      *commandStates[i] = MageScriptState{ 0, false };
   }
   resumeStates.mapLoad = MageScriptState{ mapControl->GetOnLoad(), true };
   resumeStates.mapTick = MageScriptState{ mapControl->GetOnTick(), false };
   for (uint8_t i = 0; i < mapControl->FilteredEntityCount(); i++)
   {
      //Initialize the script resumeStates to default values for this map.
      entityTickResumeStates[i] = MageScriptState{ mapControl->getEntity(i).value()->onTickScriptId, false };
      entityInteractResumeStates[i] = MageScriptState{ mapControl->getEntity(i).value()->onInteractScriptId, false };
   }
   jumpScriptId = MAGE_NO_SCRIPT;
}

void MageScriptControl::processScript(MageScriptState& resumeState, uint8_t mapLocalEntityId, MageScriptType scriptType)
{
   //set the current entity to the passed value.
   currentEntityId = mapLocalEntityId;

   //All script processing from here relies solely on the state of the resumeState:
   //Make sure you've got your script states correct in the resumeState before calling this function:
   for (jumpScriptId = resumeState.currentScriptId; jumpScriptId != MAGE_NO_SCRIPT; jumpScriptId = MAGE_NO_SCRIPT)
   {
      processActionQueue(resumeState, scriptType);
      //check for loadMap:
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
   }
}

void MageScriptControl::processActionQueue(MageScriptState& resumeState, MageScriptType currentScriptType)
{
   //get a read-only pointer to the memory offset for the script:
   auto script = ROM()->GetReadPointerByIndex<MageScript>(resumeState.currentScriptId);

   //now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
   //note we're using the value in resumeState directly as our index so it will update automatically as we proceed:
   for (; resumeState.actionOffset < script->GetActionCount(); resumeState.actionOffset++)
   {
      auto action = script->GetAction(resumeState.actionOffset);

      //validate actionTypeId:
      if (action->TypeId >= NUM_SCRIPT_ACTIONS)
      {
         return;
      }

      //get the function for actionTypeId, and feed it the actionArgs as args:
      auto actionFunction = actionFunctions[action->TypeId];
      jumpScriptId = (scriptActions.get()->*actionFunction)(action->Args, resumeState, currentEntityId);

      //check for loadMap:
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

      //non-blocking action check is based on whether resumeState.totalLoopsToNextAction is set:
      if (resumeState.totalLoopsToNextAction != 0)
      {
         //if this value is not 0, we need to stop the action now and return later when the countdown is complete:
         //note that resumeState.actionOffset is set to the NB action's offset since we are using it as an index
         //on the next loop, it should call the same action again. It is up to the action handler function to decide
         //how to complete its action and track how much time is left using the resumeState's values.
         return;
      }

      //check to see if the action set a jumpScriptId value
      if (jumpScriptId != MAGE_NO_SCRIPT)
      {
         //If we have a new jumpScriptId, we want to re-init the resumeState
         //to run the new jumpScriptId from the beginning:
         resumeState = MageScriptState{ jumpScriptId.value(), true, resumeState.isGlobalExecutionScope };

         if (!resumeState.isGlobalExecutionScope)
         {
            if (currentEntityId == MAGE_MAP_ENTITY)
            {
               if (currentScriptType == MageScriptType::ON_LOAD)
               {
                  mapControl->SetOnLoad(jumpScriptId.value());
               }
               else if (currentScriptType == MageScriptType::ON_TICK)
               {
                  mapControl->SetOnTick(jumpScriptId.value());
               }
            }
            //target is an entity
            else
            {
               //if it's not a map script, set the appropriate entity's script value:
               if (currentScriptType == MageScriptType::ON_INTERACT)
               {
                   mapControl->getEntity(currentEntityId).value()->onInteractScriptId = jumpScriptId.value();
               }
               else if (currentScriptType == MageScriptType::ON_TICK)
               {
                   mapControl->getEntity(currentEntityId).value()->onTickScriptId = jumpScriptId.value();
               }
            }
         }

         //immediately end action processing and return if a jumpScriptId value was set:
         return;
      }
   }

   //if you get here, and jumpScriptId == MAGE_NO_SCRIPT, all actions in the script are done
   if (jumpScriptId == MAGE_NO_SCRIPT)
   {
      //we can now set resumeState.scriptIsRunning to false and end processing the script:
      resumeState.scriptIsRunning = false;
   }
}

void MageScriptControl::handleMapOnLoadScript(bool isFirstRun)
{
   //the load script is still running and the resumeState controls all further actions:
   if (resumeStates.mapLoad.scriptIsRunning)
   {
      //if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
      //resumeState struct, so we will proceed with the remaining info in the struct as-is.
      //the currentScriptId is contained within the *ResumeState struct so we can call actions:
      //now that the *ResumeState struct is correctly configured, process the script:
      processScript(resumeStates.mapLoad, MAGE_MAP_ENTITY, MageScriptType::ON_LOAD);
   }
}

void MageScriptControl::handleMapOnTickScript()
{
   uint16_t onTickScriptId = mapControl->GetOnTick();
   //get a bool to show if a script is already running:
   bool scriptIsRunning = resumeStates.mapTick.scriptIsRunning;
   //if a script isn't already running and you're in hex editor state, don't start any new scripts:
   if (hexEditor->isHexEditorOn() && !scriptIsRunning)
   {
      return;
   }
   //if a script isn't already running, OR
   //if the resumeState script Id doesn't match the *ResumeState,
   //re-initialize the *ResumeState struct from the currentScriptId
   else if (!scriptIsRunning || resumeStates.mapTick.currentScriptId != onTickScriptId)
   {
      //populate the MageScriptState struct with appropriate init data
      resumeStates.mapTick = MageScriptState{ onTickScriptId, true };
   }
   //otherwise, a script is running and the resumeState controls all further actions:
   else
   {
      //if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
      //resumeState struct, so we will proceed with the remaining info in the struct as-is.
      //the currentScriptId is contained within the *ResumeState struct so we can call actions:
   }
   //set the current entity to the map entity value.
   currentEntityId = MAGE_MAP_ENTITY;
   //now that the struct is correctly configured, process the script:
   processScript(resumeStates.mapTick, MAGE_MAP_ENTITY, MageScriptType::ON_TICK);
}

void MageScriptControl::handleCommandScript(MageScriptState& resumeState)
{
   //this checks to see if the command script should be running:
   if (resumeState.scriptIsRunning)
   {
      //now that the *ResumeState struct is correctly configured, process the script:
      processScript(resumeState, MAGE_MAP_ENTITY, MageScriptType::ON_COMMAND);
   }
}

void MageScriptControl::handleEntityOnTickScript(uint8_t entityId)
{
   currentEntityId = entityId;

   // Get a pointer to the script state 
   auto& scriptState = entityTickResumeStates[currentEntityId];
   // convert the entity's local ScriptId to the global context:
   uint16_t mapLocalScriptId = mapControl->getEntity(currentEntityId).value()->onTickScriptId;

   // when there isn't a script running, figure out what to do
   if (!scriptState.scriptIsRunning)
   {
      // don't change anything when hex editor is on
      if (hexEditor->isHexEditorOn())
      {
         return;
      }
      // update the script state to match the current script upon change
      else if (scriptState.currentScriptId != mapLocalScriptId)
      {
         scriptState = MageScriptState{ mapLocalScriptId, true };
      }
   }

   processScript(scriptState, currentEntityId, MageScriptType::ON_TICK);
}

void MageScriptControl::handleEntityOnInteractScript(uint8_t filteredEntityId)
{
   currentEntityId = filteredEntityId;

   auto& scriptState = entityInteractResumeStates[currentEntityId];
   uint16_t mapLocalScriptId = mapControl->getEntity(currentEntityId).value()->onInteractScriptId;
   //if a script is not currently running, do nothing.
   if (!scriptState.scriptIsRunning)
   {
      return;
   }
   //if the entity currentScriptId doesn't match what is in the entityInteractResumeStates[currentEntityId] struct, re-init it
   //with .scriptIsRunning set to false to stop all current actions.
   else if (scriptState.currentScriptId != mapLocalScriptId)
   {
      scriptState = MageScriptState{ mapLocalScriptId, false };
      return;
   }
   else
   {
      //if the resumeState.scriptIsRunning is true, then we don't want to modify the state of the
      //resumeState struct, so we will proceed with the remaining info in the struct as-is.
      //the currentScriptId is contained within the *ResumeState struct so we can call actions:
   }
   //now that the *ResumeState struct is correctly configured, process the script:
   processScript(scriptState, currentEntityId, MageScriptType::ON_INTERACT);
}

void MageScriptControl::tickScripts()
{
   //Note: all script handlers check for hex editor mode internally and will only continue
   //scripts that have already started and are not yet complete when in hex editor mode.

   //the map's onLoad script is called with a false isFirstRun flag. This allows it to
   //complete any non-blocking actions that were called when the map was first loaded,
   //but it will not allow it to run the script again once it is completed.
   handleMapOnLoadScript(false);
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
   //the map's onTick script will run every tick, restarting from the beginning as it completes
   handleMapOnTickScript();
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
   handleCommandScript(resumeStates.commandLook);
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
   for (uint8_t i = 0; i < COMMAND_STATES_COUNT; i++)
   {
      handleCommandScript(*commandStates[i]);
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
   }
   for (uint8_t i = 0; i < mapControl->FilteredEntityCount(); i++)
   {
      //this script will not initiate any new onInteract scripts. It will simply run an
      //onInteract script based on the state of the entityInteractResumeStates[i] struct
      //the struct is initialized in applyUniversalInputs() when the interact
      //button is pressed.
      handleEntityOnInteractScript(i);
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
      //handle Entity onTick scripts for the local entity at Id 'i':
      //these scripts will run every tick, starting from the beginning as they complete.
      handleEntityOnTickScript(i);
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
   }
}
