#include "mage_script_control.h"
#include "mage_command_control.h"
#include "mage_rom.h"
#include "EngineInput.h"
#include "shim_err.h"

void MageScriptControl::processScript(MageScriptState& scriptState, uint8_t currentEntityId)
{
   // script has been paused by another script, to be resumed by the same mechanism.
   if (scriptState.scriptIsPaused)
   {
      return;
   }

   jumpScriptId = scriptState.Id;
   // jumping to a new script terminates further script processing:
   while (jumpScriptId != MAGE_NO_SCRIPT)
   {
      // ensure we don't have a jump script set prior to handling script actions
      jumpScriptId = MAGE_NO_SCRIPT;

      processScriptActions(scriptState, currentEntityId);

      // all actions in the script are done and there's no script to jump to, stop running
      if (jumpScriptId == MAGE_NO_SCRIPT)
      {
         scriptState.scriptIsRunning = false;
      }

      if (mapControl->mapLoadId != MAGE_NO_MAP)
      {
         break;
      }
   }
}

void MageScriptControl::processScriptActions(MageScriptState& scriptState, uint8_t currentEntityId)
{
   // iterate through script actions, calling the appropriate functions
   while (scriptState.scriptIsRunning && scriptState.currentAction < scriptState.script->actionCount)
   {
      auto action = scriptState.script->GetAction(scriptState.currentAction);

      //validate actionTypeId:
      if (!action || action->TypeId >= NUM_SCRIPT_ACTIONS)
      {
         return;
      }

      //get the function for actionTypeId, and feed it the actionArgs as args:
      auto actionFunction = scriptActions->actionFunctions[action->TypeId];
      auto nextScriptId = (scriptActions.get()->*actionFunction)(action->Args, scriptState, currentEntityId);
      
      // abort further processing because:
      // 1) there's a new map being loaded
      // 2) a non-blocking action has not completed
      if (mapControl->mapLoadId != MAGE_NO_MAP || scriptState.loopsToNextAction < scriptState.totalLoopsToNextAction)
      {
         return;
      }

      // see if the action changed the script to run and replace the script state
      if (nextScriptId.has_value())
      {
         jumpScriptId = nextScriptId;
         const auto nextScript = ROM()->GetReadPointerByIndex<MageScript>(nextScriptId.value());
         scriptState = MageScriptState{ nextScriptId.value(), nextScript};
         return;
      }

      // keep going with the next action in the current script
      scriptState.currentAction++;
   }
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
