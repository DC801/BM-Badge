#include "StringLoader.h"


std::string StringLoader::GetString(uint16_t stringId, std::string triggeringEntityName) const
{
   const auto entityVariableIndicator = std::string{ "%%" };
   const auto scriptVariableIndicator = std::string{ "$$" };

   const auto inputCharPtr = ROM()->GetReadPointerByIndex<MageStringValue, char>(stringId);
   const auto inputString = std::string{ inputCharPtr };

   auto getEntityName = [this](int id, const std::string triggeringEntityName) 
   {
      if (id == MAGE_ENTITY_SELF)
      {
         return triggeringEntityName;
      }
      else if (id == MAGE_ENTITY_PLAYER)
      {
         return std::string(mapControl->Get<MageEntityData>(mapControl->getPlayerEntityIndex()).name);
      }
      else
      {
         return std::string(mapControl->Get<MageEntityData>(id).name);
      }
   };

   auto getScriptVariable = [this](int id, std::string triggeringEntityName) 
   {
      return std::to_string(scriptVariables[id]);
   };

   const auto intermediateString = replaceVars(getEntityName, inputString, entityVariableIndicator, stringId, triggeringEntityName);
   const auto outputString = replaceVars(getScriptVariable, intermediateString, scriptVariableIndicator, stringId, triggeringEntityName);
   return outputString;
}

std::string StringLoader::replaceVars(std::function<const std::string(int, const std::string)> replaceFn, const std::string& inputString, const std::string& variableIndicator, uint16_t stringId, std::string triggeringEntityName) const
{
   std::string outputString{};
   size_t cursor{ 0 };
   size_t variableStartPosition{ inputString.find(variableIndicator, 0) };
   size_t replaceCount{ 0 };
   while (variableStartPosition != std::string::npos)
   {
      outputString += inputString.substr(cursor, variableStartPosition - cursor);
      variableStartPosition += variableIndicator.size();
      const auto variableEndPosition{ inputString.find(variableIndicator, variableStartPosition) };
      if (variableEndPosition == std::string::npos)
      {
         break;
      }

      auto variableHolder = inputString.substr(variableStartPosition, variableEndPosition - variableStartPosition);
      auto parsedIndex = std::stoi(variableHolder);
      std::string entityName = replaceFn(parsedIndex, triggeringEntityName);

      outputString += entityName;
      variableStartPosition = variableEndPosition + 2;
      cursor = variableStartPosition;
      replaceCount++;
   }

   if (cursor < inputString.length())
   {
      outputString += inputString.substr(cursor, inputString.length() - cursor);
   }

   return outputString;
}