#include "StringLoader.h"
#include "games/mage/mage_script_control.h"
#include "games/mage/mage_map.h"

std::string StringLoader::getString(uint16_t stringId, int16_t mapLocalEntityId) const
{
   auto inputString = ROM->Get<MageStringValue>(stringId);
   std::string outputString{};
   size_t cursor{ 0 };
   size_t variableStartPosition{ 0 };
   size_t variableEndPosition{ 0 };
   size_t replaceCount{ 0 };
   while ((variableStartPosition = inputString->find("%%", variableStartPosition)) != std::string::npos)
   {
      outputString += inputString->substr(cursor, variableStartPosition - cursor);
      variableStartPosition += 2;
      variableEndPosition = inputString->find("%%", variableStartPosition);
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString->substr(variableStartPosition, variableEndPosition - variableStartPosition);
      auto parsedEntityIndex = std::stoi(variableHolder);

      auto entityIndex = scriptControl->GetUsefulEntityIndexFromActionEntityId(parsedEntityIndex, mapLocalEntityId);
      if (entityIndex != NO_PLAYER)
      {
         auto entity = mapControl->getEntityByMapLocalId(entityIndex);
         outputString += entity->name;
      }
      else
      {
         char missingError[MAGE_ENTITY_NAME_LENGTH + 1];
         sprintf(missingError, "MISSING: %d", parsedEntityIndex);
         outputString += missingError;
      }
      variableStartPosition = variableEndPosition + 2;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += inputString->substr(cursor, inputString->length() - 1);
      outputString = "";
   }

   cursor = 0;
   variableStartPosition = 0;
   variableEndPosition = 0;
   replaceCount = 0;
   while ((variableStartPosition = inputString->find("$$", variableStartPosition)) != std::string::npos)
   {
      outputString += inputString->substr(cursor, variableStartPosition - cursor);
      variableStartPosition += 2;
      variableEndPosition = inputString->find("$$", variableStartPosition);
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString->substr(variableStartPosition, variableEndPosition - variableStartPosition);
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
      outputString += inputString->substr(cursor, inputString->length() - 1);
   }
   return outputString;
}