#ifndef _STRING_LOADER
#define _STRING_LOADER

#include <stdint.h>
#include <memory>
#include <string>

class StringLoader
{
public:
   StringLoader(const uint16_t* scriptVariables) noexcept
      : scriptVariables(scriptVariables)
   {}

   std::string getString(uint16_t stringId, std::string triggeringEntityName = "") const;
private:
   const uint16_t* scriptVariables;
};

#endif //_STRING_LOADER