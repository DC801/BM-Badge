#include "mage_script_control.h"
#include "mage_command_control.h"
#include "EngineInput.h"
#include "shim_err.h"

void MageScriptControl::processScript(MageScriptState& resumeState, uint8_t mapLocalEntityId, MageScriptType scriptType)
{
    // when there isn't a script running, figure out what to do
    if (!resumeState.scriptIsRunning)
    {
        return;
    }

    //set the current entity to the passed value.
    currentEntityId = mapLocalEntityId;

    //All script processing from here relies solely on the state of the resumeState:
    //Make sure you've got your script states correct in the resumeState before calling this function:
    for (jumpScriptId = resumeState.currentScriptId; jumpScriptId && jumpScriptId != MAGE_NO_SCRIPT;)
    {
        //now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
        //note we're using the value in resumeState directly as our index so it will update automatically as we proceed:
        for (auto script = ROM()->GetReadPointerByIndex<MageScript>(jumpScriptId.value());
            resumeState.actionOffset < script->GetActionCount();
            resumeState.actionOffset++)
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
                        if (scriptType == MageScriptType::ON_LOAD)
                        {
                            mapControl->SetOnLoad(jumpScriptId.value());
                        }
                        else if (scriptType == MageScriptType::ON_TICK)
                        {
                            mapControl->SetOnTick(jumpScriptId.value());
                        }
                    }
                    //target is an entity
                    else
                    {
                        //if it's not a map script, set the appropriate entity's script value:
                        if (scriptType == MageScriptType::ON_INTERACT)
                        {
                            mapControl->tryGetEntity(currentEntityId).value()->onInteractScriptId = jumpScriptId.value();
                        }
                        else if (scriptType == MageScriptType::ON_TICK)
                        {
                            mapControl->tryGetEntity(currentEntityId).value()->onTickScriptId = jumpScriptId.value();
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

        //check for loadMap:
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    }
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

void MageScriptControl::tickScripts()
{
    //Note: all script handlers check for hex editor mode internally and will only continue
    //scripts that have already started and are not yet complete when in hex editor mode.

    //the map's onLoad script is called with a false isFirstRun flag. This allows it to
    //complete any non-blocking actions that were called when the map was first loaded,
    //but it will not allow it to run the script again once it is completed.
    mapControl->OnLoad(this);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    //the map's onTick script will run every tick, restarting from the beginning as it completes
    mapControl->OnTick(this);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    handleCommandScript(resumeStates.commandLook);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    for (uint8_t i = 0; i < COMMAND_STATES_COUNT; i++)
    {
        handleCommandScript(*commandStates[i]);
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    }
    // don't change anything when hex editor is on
    if (hexEditor->isHexEditorOn())
    {
        return;
    }
    for (auto& entity : mapControl->GetEntities())
    {
        //handle Entity onTick scripts for the local entity at Id 'i':
        //these scripts will run every tick, starting from the beginning as they complete.
        entity.OnTick(this);
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    }
}
