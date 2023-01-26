#include "StringLoader.h"
#include "games/mage/mage_map.h"

std::string StringLoader::getString(uint16_t stringId, std::string triggeringEntityName) const
{
   auto address = ROM()->GetAddress<MageStringValue>(stringId);
   const char* inputCharPtr;
   ROM()->SetReadPointerToOffset(inputCharPtr, address);
   auto inputString = std::string{ inputCharPtr };
   std::string outputString{};
   size_t cursor{ 0 };
   size_t variableStartPosition{ 0 };
   size_t variableEndPosition{ 0 };
   size_t replaceCount{ 0 };
   while ((variableStartPosition = inputString.find("%%", variableStartPosition)) != std::string::npos)
   {
      outputString += inputString.substr(cursor, variableStartPosition - cursor);
      variableStartPosition += 2;
      variableEndPosition = inputString.find("%%", variableStartPosition);
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString.substr(variableStartPosition, variableEndPosition - variableStartPosition);
      auto parsedEntityIndex = std::stoi(variableHolder);

      if (!triggeringEntityName.empty())
      {
         outputString += triggeringEntityName;
      }
      variableStartPosition = variableEndPosition + 2;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += inputString.substr(cursor, inputString.length() - 1);
      outputString = "";
   }

   cursor = 0;
   variableStartPosition = 0;
   variableEndPosition = 0;
   replaceCount = 0;
   while ((variableStartPosition = inputString.find("$$", variableStartPosition)) != std::string::npos)
   {
      outputString += inputString.substr(cursor, variableStartPosition - cursor);
      variableStartPosition += 2;
      variableEndPosition = inputString.find("$$", variableStartPosition);
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString.substr(variableStartPosition, variableEndPosition - variableStartPosition);
      auto parsedVariableIndex = std::stoi(variableHolder);

      uint16_t variableValue = scriptVariables[parsedVariableIndex];
      std::string valueString = std::to_string(variableValue);
      outputString += valueString.c_str();
      variableStartPosition = variableEndPosition + 1;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += inputString.substr(cursor, inputString.length() - 1);
   }
   return outputString;
}