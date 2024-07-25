#include "mage_script_control.h"
#include "mage_command_control.h"
#include "mage_rom.h"
#include "EngineInput.h"
#include "shim_err.h"

void MageScriptControl::processScript(MageScriptState& scriptState, uint8_t currentEntityId) const
{
   // iterate through script actions, calling the appropriate functions
   for (const auto& script = scriptState.script; script && scriptState.scriptIsRunning && scriptState.currentAction < script->actionCount; scriptState.currentAction++)
   {
      auto action = script->GetAction(scriptState.currentAction);

      //validate actionTypeId:
      if (scriptState.currentAction > script->actionCount || action->TypeId >= NUM_SCRIPT_ACTIONS)
      {
         break;
      }

      //get the function for actionTypeId, and feed it the actionArgs as args:
      auto actionFunction = scriptActions->actionFunctions[action->TypeId];
      auto nextScriptId = (scriptActions.get()->*actionFunction)(action->Args, scriptState, currentEntityId);

      //  changing maps terminates further script processing:
      if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

      // check to see if the action set a new script to jump to
      if (nextScriptId.has_value())
      {
         //If we have a new runningScript, we want to re-init the scriptState
         //to run the new runningScript from the beginning:
         const auto nextScript = ROM()->GetReadPointerByIndex<MageScript>(nextScriptId.value());
         scriptState = MageScriptState{ nextScriptId.value(), nextScript};
         break;
      }
   }
   scriptState.scriptIsRunning = false;
}

void MageScriptControl::tickScripts()
{
   mapControl->OnTick(this);
   if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

   for (auto& script : mapControl->GetAll<OnTickScript>())
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
