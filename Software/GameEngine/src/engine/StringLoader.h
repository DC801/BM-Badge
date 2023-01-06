#ifndef _STRING_LOADER
#define _STRING_LOADER

#include <stdint.h>
#include <memory>
#include <string>
#include <optional>
#include "games/mage/mage_defines.h"
#include "games/mage/mage_rom.h"

class MageScriptControl;
class MapControl;

class StringLoader
{
public:
   StringLoader(std::shared_ptr<MageScriptControl> scriptControl, std::shared_ptr<MapControl> mapControl, const uint16_t* scriptVariables) noexcept
      : scriptControl(scriptControl), mapControl(mapControl), scriptVariables(scriptVariables)
   {}

   std::string getString(uint16_t stringId, int16_t mapLocalEntityId = NO_PLAYER) const;
private:
   std::shared_ptr<MageScriptControl> scriptControl;
   std::shared_ptr<MapControl> mapControl;
   const uint16_t* scriptVariables;
};

#endif //_STRING_LOADER