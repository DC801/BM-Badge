#ifndef _MAGE_SCRIPT_CONTROL_H
#define _MAGE_SCRIPT_CONTROL_H

#include <stdint.h>
#include <optional>
#include <memory>
#include "mage_hex.h"
#include "mage_map.h"
#include "mage_script_actions.h"
#include "mage_script_state.h"

#define SCRIPT_NAME_LENGTH 32

class MageScriptControl
{
public:
   MageScriptControl(std::shared_ptr<MapControl> mapControl) noexcept
      : mapControl(mapControl)
   {}

   void SetActions(std::unique_ptr<MageScriptActions>&& actions)
   {
      scriptActions = std::move(actions);
   }

   //the jumpScriptId variable is used by some actions to indicate that a script should
   //end and immediately begin running a new script.
   //it should be set to MAGE_NO_SCRIPT unless a new script should be run immediately.
   std::optional<uint16_t> jumpScriptId{ MAGE_NO_SCRIPT };

   void tickScripts();
   void processScript(MageScriptState& resumeState, uint8_t currentEntityId) const;

private:
   std::shared_ptr<MapControl> mapControl;
   std::unique_ptr<MageScriptActions> scriptActions;


}; //MageScriptControl

#endif //_MAGE_SCRIPT_CONTROL_H
