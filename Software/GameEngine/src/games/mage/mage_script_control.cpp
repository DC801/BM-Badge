#include "mage_script_control.h"
#include "mage_command_control.h"
#include "EngineInput.h"
#include "shim_err.h"

void MageScriptControl::processScript(MageScriptState& resumeState, uint8_t mapLocalEntityId, MageScriptType scriptType)
{
    //set the current entity to the passed value.
    currentEntityId = mapLocalEntityId;

    //now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
    //note we're using the value in resumeState directly as our index so it will update automatically as we proceed:
    while(resumeState.script && resumeState.scriptIsRunning && resumeState.actionOffset < resumeState.script->GetActionCount())
        {
            auto action = resumeState.script->GetAction(resumeState.actionOffset);

            //validate actionTypeId:
            if (action->TypeId >= NUM_SCRIPT_ACTIONS)
            {
                return;
            }

            //get the function for actionTypeId, and feed it the actionArgs as args:
            auto actionFunction = actionFunctions[action->TypeId];
            auto nextScriptId = (scriptActions.get()->*actionFunction)(action->Args, resumeState, currentEntityId);

            //  changing maps terminates further script processing:
            if (resumeState.totalLoopsToNextAction > 0 || mapControl->mapLoadId != MAGE_NO_MAP) { return; }

            // check to see if the action set a new script to jump to
            if (nextScriptId.has_value())
            {
                //If we have a new runningScript, we want to re-init the resumeState
                //to run the new runningScript from the beginning:
                //resumeState = MageScriptState{ runningScript.value(), true, resumeState.isGlobalExecutionScope };
                auto resumeScript = resumeState.isGlobalExecutionScope 
                    ? ROM()->GetReadPointerByIndex<MageScript>(nextScriptId.value())
                    : mapControl->GetScript(nextScriptId.value());

                resumeState = MageScriptState{ resumeScript, true, resumeState.isGlobalExecutionScope };

                //if (!resumeState.isGlobalExecutionScope)
                //{
                //    if (currentEntityId == MAGE_MAP_ENTITY)
                //    {
                //        if (scriptType == MageScriptType::ON_LOAD)
                //        {
                //            mapControl->SetOnLoad(runningScript.value());
                //        }
                //        else if (scriptType == MageScriptType::ON_TICK)
                //        {
                //            mapControl->SetOnTick(runningScript.value());
                //        }
                //    }
                //    //target is an entity
                //    else
                //    {
                //        //if it's not a map script, set the appropriate entity's script value:
                //        if (scriptType == MageScriptType::ON_INTERACT)
                //        {
                //            mapControl->tryGetEntity(currentEntityId).value()->onInteractScriptId = runningScript.value();
                //        }
                //        else if (scriptType == MageScriptType::ON_TICK)
                //        {
                //            mapControl->tryGetEntity(currentEntityId).value()->onTickScriptId = runningScript.value();
                //        }
                //    }
                //}

            }
            else
            {
                //we can now set resumeState.scriptIsRunning to false and end processing the script:
                resumeState.scriptIsRunning = false;
            }
        }
    

}

void MageScriptControl::tickScripts()
{
    //Note: all script handlers check for hex editor mode internally and will only continue
    //scripts that have already started and are not yet complete when in hex editor mode.

    mapControl->OnLoad(this);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

    //the map's onTick script will run every tick, restarting from the beginning as it completes
    mapControl->OnTick(this);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    processScript(resumeStates.commandLook, MAGE_MAP_ENTITY, MageScriptType::ON_COMMAND);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    for (uint8_t i = 0; i < COMMAND_STATES_COUNT; i++)
    {
        processScript(*commandStates[i], MAGE_MAP_ENTITY, MageScriptType::ON_COMMAND);
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    }
    // don't run entity scripts when hex editor is on
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
