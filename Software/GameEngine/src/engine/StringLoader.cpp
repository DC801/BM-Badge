#include "StringLoader.h"

#include "games/mage/mage_defines.h"
#include "games/mage/mage_rom.h"

//std::string PrintFormattedOutput(const std::string_view& format, 

std::string StringLoader::getString(uint16_t stringId, std::string triggeringEntityName) const
{
   //auto address = ROM()->GetOffsetByIndex<MageStringValue>(stringId);
   auto inputCharPtr = ROM()->GetReadPointerByIndex<MageStringValue, char>(stringId);
   auto inputString = std::string{ inputCharPtr };
   std::string outputString = inputString;
   size_t cursor{ 0 };
   size_t variableStartPosition{ 0 };
   size_t variableEndPosition{ 0 };
   size_t replaceCount{ 0 };
   const auto variableIndicator = std::string{ "%%%" };
   while ((variableStartPosition = inputString.find(variableIndicator, variableStartPosition)) != std::string::npos)
   {
      outputString += inputString.substr(cursor, variableStartPosition - cursor);
      variableStartPosition += variableIndicator.size();
      variableEndPosition = inputString.find(variableIndicator, variableStartPosition);
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
      //outputString = "";
   }

   //cursor = 0;
   //variableStartPosition = 0;
   //variableEndPosition = 0;
   //replaceCount = 0;
   //while ((variableStartPosition = inputString.find(variableIndicator, variableStartPosition)) != std::string::npos)
   //{
   //   outputString += inputString.substr(cursor, variableStartPosition - cursor);
   //   variableStartPosition += 2;
   //   variableEndPosition = inputString.find(variableIndicator, variableStartPosition);
   //   if (variableEndPosition == std::string::npos)
   //   {
   //      break;
   //   }

   //   auto variableHolder = inputString.substr(variableStartPosition, variableEndPosition - variableStartPosition);
   //   auto parsedVariableIndex = std::stoi(variableHolder);

   //   uint16_t variableValue = scriptVariables[parsedVariableIndex];
   //   std::string valueString = std::to_string(variableValue);
   //   outputString += valueString.c_str();
   //   variableStartPosition = variableEndPosition + 1;
   //   cursor = variableStartPosition;
   //   replaceCount++;
   //}
   //if (replaceCount)
   //{
   //   outputString += inputString.substr(cursor, inputString.length() - 1);
   //}
   return outputString;
}