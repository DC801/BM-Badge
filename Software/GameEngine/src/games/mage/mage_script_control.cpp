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
    for (auto& script = resumeState.script; script && resumeState.scriptIsRunning && resumeState.actionOffset < script->GetActionCount(); resumeState.actionOffset++)
    {
        auto action = script->GetAction(resumeState.actionOffset);

        //validate actionTypeId:
        if (action->TypeId >= NUM_SCRIPT_ACTIONS)
        {
            //throw std::runtime_error("Script Action Id out of bounds");
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
            auto resumeScript = resumeState.isGlobalExecutionScope
                ? ROM()->GetReadPointerByIndex<MageScript>(nextScriptId.value())
                : mapControl->GetScript(nextScriptId.value());

            resumeState = MageScriptState{ resumeScript, true, resumeState.isGlobalExecutionScope };
            return;
        }
    }
    resumeState.scriptIsRunning = false;
}

void MageScriptControl::tickScripts()
{
    mapControl->OnTick(this);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

    for (auto& entity : mapControl->GetEntities())
    {
        //handle Entity onTick scripts for the local entity at Id 'i':
        //these scripts will run every tick, starting from the beginning as they complete.
        entity.OnTick(this);
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
    }
}
