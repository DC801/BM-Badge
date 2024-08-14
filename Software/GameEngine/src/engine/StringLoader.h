#ifndef _STRING_LOADER
#define _STRING_LOADER

#include <functional>
#include <stdint.h>
#include <memory>
#include <string>
#include <string_view>

#include "games/mage/mage_defines.h"
#include "games/mage/mage_rom.h"
#include "games/mage/mage_map.h"

class MapControl;

class StringLoader
{
public:
   StringLoader(std::shared_ptr<const MapControl> mapControl, const uint16_t* scriptVariables) noexcept
      : mapControl(mapControl), scriptVariables(scriptVariables)
   {}

   std::string GetString(uint16_t stringId, std::string triggeringEntityName = "") const;
private:
   std::string replaceVars(std::function<const std::string(int, const std::string)>, const std::string& inputString, const std::string& variableIndicator, uint16_t stringId, std::string triggeringEntityName = "") const;
   const uint16_t* scriptVariables;
   std::shared_ptr<const MapControl> mapControl;

};

#endif //_STRING_LOADER