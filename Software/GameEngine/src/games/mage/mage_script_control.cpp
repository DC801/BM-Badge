#include "mage_script_control.h"
#include "mage_command_control.h"
#include "EngineInput.h"
#include "shim_err.h"

void MageScriptControl::processScript(MageScriptState& scriptState, uint8_t currentEntityId) const
{
    //now iterate through the actions, starting with the actionIndexth action, calling the appropriate functions:
    //note we're using the value in scriptState directly as our index so it will update automatically as we proceed:
    for (auto& script = scriptState.script; script && scriptState.scriptIsRunning && scriptState.actionOffset < script->actionCount; scriptState.actionOffset++)
    {
        auto action = script->GetAction(scriptState.actionOffset);

        //validate actionTypeId:
        if (action->TypeId >= NUM_SCRIPT_ACTIONS)
        {
            //throw std::runtime_error("Script Action Id out of bounds");
            return;
        }

        //get the function for actionTypeId, and feed it the actionArgs as args:
        auto actionFunction = scriptActions->actionFunctions[action->TypeId];
        auto nextScriptId = (scriptActions.get()->*actionFunction)(action->Args, scriptState, currentEntityId);

        //  changing maps terminates further script processing:
        if (scriptState.totalLoopsToNextAction > 0 || mapControl->mapLoadId != MAGE_NO_MAP) { return; }

        // check to see if the action set a new script to jump to
        if (nextScriptId.has_value())
        {
            //If we have a new runningScript, we want to re-init the scriptState
            //to run the new runningScript from the beginning:
            auto resumeScript = scriptState.isGlobalExecutionScope
                ? ROM()->GetReadPointerByIndex<MageScript>(nextScriptId.value())
                : mapControl->GetScript(nextScriptId.value());

            scriptState = MageScriptState{ resumeScript, true, scriptState.isGlobalExecutionScope };
            return;
        }
    }
    scriptState.scriptIsRunning = false;
}

void MageScriptControl::tickScripts()
{
    mapControl->OnTick(this);
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

    for (auto& script : mapControl->GetAll<MapControl::OnTickScript>())
    {
        //handle Entity onTick scripts for the local entity at Id 'i':
        //these scripts will run every tick, starting from the beginning as they complete.

       for (auto i = 0; i < MAX_ENTITIES_PER_MAP; i++)
       {
          processScript(script, i);
          if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }
       }
    }
}
