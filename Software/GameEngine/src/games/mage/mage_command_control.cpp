#include "mage_command_control.h"
#include "mage_script_control.h"
#include "mage_rom.h"
#include "EngineROM.h"
#include "EngineSerial.h"
#include <vector>
#include <unordered_map>

void MageCommandControl::handleStart()
{
   if (connectSerialDialogId != COMMAND_NO_CONNECT_DIALOG_ID)
   {
      showSerialDialog(connectSerialDialogId);
   }
   else
   {
      commandResponseBuffer += "WELCOME TO MAGE NET\n"
         "   __  ______  _________  _  ____________\n"
         "  /  |/  / _ |/ ___/ __/ / |/ / __/_  __/\n"
         " / /|_/ / __ / (_ / _/  /    / _/  / /   \n"
         "/_/  /_/_/ |_\\___/___/ /_/|_/___/ /_/    \n";
   }
}

void MageCommandControl::processCommand(std::string& commandString)
{
   std::string lowercasedInput = commandString;
   badAsciiLowerCase(lowercasedInput);
   if (!inputTrapped)
   {
      processCommandAsVerb(lowercasedInput);
   }
   else
   {
      processCommandAsResponseInput(lowercasedInput);
   }
}

void MageCommandControl::processCommandAsVerb(std::string& input)
{
   // Used to split string around spaces.
   bool syntaxValid = true;
   uint8_t wordCount = 0;
   std::string word = "";
   std::string verb;
   std::string subject;
   std::string modifier;

   // Traverse through all words
   // while loop through segments to store in string word
   while (input.compare(word) != 0 && syntaxValid)
   {
      size_t index = input.find_first_of(" ");
      word = input.substr(0, index);
      input = input.substr(index + 1, input.length());
      if (word.length() == 0)
      {
         // skip space
         continue;
      }

      wordCount++;
      if (wordCount == 1)
      {
         verb.append(word);
      }
      else if (wordCount == 2)
      {
         subject.append(word);
      }
      else
      {
         // only cases could be wordCount > 2
         syntaxValid = false;
      }
   }

   if (syntaxValid)
   {
      std::string message = "Verb: " + verb;
      if (subject.length() == 0)
      {
         message += "\n";
      }
      else
      {
         message += " | Subject: " + subject + "\n";
      }
      commandResponseBuffer += message;
   }
   else if (!syntaxValid)
   {
      commandResponseBuffer += "Invalid command! Commands are exactly one or two words.\n"
         "Examples: help | look | look $ITEM | go $DIRECTION\n";
      return;
   }

   if (verb == "help")
   {
      // I sure thought `lastCommandUsed` & the `MageSerialCommands` enum
      // would be really useful earlier, but I can't remember why now.
      lastCommandUsed = MageSerialCommand::HELP;
      commandResponseBuffer += "Supported Verbs:\n"
         "\thelp\tlook\tgo\n";
   }
   else if (verb == "look")
   {
      lastCommandUsed = MageSerialCommand::LOOK;
      commandResponseBuffer += "You try to look.\n";
      /*scriptControl->initScriptState(
         &scriptControl->resumeStates.commandLook,
         mapControl->onLook,
         true
      );*/
      std::string directionNames = mapControl->getDirectionNames();
      if (directionNames.length() > 0)
      {
         postDialogBuffer += "Exits are:\n";
         postDialogBuffer += directionNames;
         postDialogBuffer += "\n";
      }
   }
   else if (verb == "go")
   {
      lastCommandUsed = MageSerialCommand::GO;
      if (!subject.length())
      {
         commandResponseBuffer += "You cannot `go` nowhere. Pick a direction.\n";
      }
      else
      {
         subject = subject.substr(0, MAP_GO_DIRECTION_NAME_LENGTH);
         std::string output = "You try to go `";
         output += subject;
         output += "`";
         uint16_t directionScriptId = mapControl->getDirectionScriptId(subject);
         if (!directionScriptId)
         {
            output += ", but that is not a valid direction\n";
         }
         else
         {
            output += "\n";
         }
         commandResponseBuffer += output;
         if (directionScriptId)
         {
            /*&scriptControl->resumeStates.commandGo,
            directionScriptId,
            true*/
         }
      }
   }
   // start SECRET_GOAT
   else if (verb == "goat")
   {
      commandResponseBuffer +=
         "You have found a secret goat!\n"
         "               ##### ####    \n"
         "             ##   #  ##      \n"
         "            #   (-)    #     \n"
         "            #+       ######  \n"
         " FEED ME -  #^             ##\n"
         "             ###           # \n"
         "               #  #      # # \n"
         "               ##  ##  ##  # \n"
         "               ######  ##### \n";
   }
   else if (input == "feed goat")
   {
      commandResponseBuffer +=
         "You have fed the secret goat!\n"
         "               ##### ####    \n"
         "             ##   #  ##      \n"
         "            #   (-)    #     \n"
         "            #+       ######  \n"
         "   THANK -  #v             ##\n"
         "             ###           # \n"
         "               #  #      # # \n"
         "               ##  ##  ##  # \n"
         "               ######  ##### \n";
   }
   // end SECRET_GOAT
   else
   {
      commandResponseBuffer = "Unrecognized Verb: " + verb + "\n";
   }
}

void MageCommandControl::processCommandAsResponseInput(std::string& input)
{
   commandResponseBuffer += "processCommandAsResponseInput: " + input + "\n";
   MageSerialDialogResponseTypes responseType = openSerialDialog->serialResponseType;
   if (responseType == MageSerialDialogResponseTypes::RESPONSE_ENTER_NUMBER)
   {
      int responseIndex;
      bool errorWhileParsingInt = false;
      try
      {
         responseIndex = std::stoi(input);
      }
      catch (std::exception& err)
      {
         errorWhileParsingInt = true;
      }
      if (!errorWhileParsingInt && responseIndex >= 0 && responseIndex < openSerialDialog->responseCount)
      {
         // TODO: script responses?
         //const auto& response = openSerialDialog->Responses[responseIndex];
         //const auto responseLabel = stringLoader->getString(response.stringId);
         //commandResponseBuffer += "Valid response: " + input + " - " + responseLabel + "\n";
         //jumpScriptId = response.scriptId;
         //inputTrapped = false;
      }
      else
      {
         commandResponseBuffer += "Invalid response: " + input + "\n";
         showSerialDialog(serialDialogId);
      }
   }
   else if (responseType == MageSerialDialogResponseTypes::RESPONSE_ENTER_STRING)
   {
      // TODO: serial responses?
     /* bool validResponseFound = false;
      for (uint8_t i = 0; i < openSerialDialog->responseCount; i++)
      {
         const auto& response = openSerialDialog->Responses[i];
         std::string responseLabel = stringLoader->getString(response.stringId);
         badAsciiLowerCase(responseLabel);
         if (responseLabel == input)
         {
            commandResponseBuffer += "Valid response: " + input + "\n";
            jumpScriptId = response.scriptId;
            inputTrapped = false;
            validResponseFound = true;
            break;
         }
      }
      if (!validResponseFound)
      {
         commandResponseBuffer += "Invalid response: " + input + "\n";
         inputTrapped = false;
      }*/
   }
}

void MageCommandControl::showSerialDialog(uint16_t _serialDialogId)
{
   serialDialogId = _serialDialogId;
   jumpScriptId = MAGE_NO_SCRIPT;
   openSerialDialog = ROM()->GetReadPointerByIndex<MageSerialDialog>(serialDialogId);
   
   std::string dialogString = stringLoader->getString(openSerialDialog->stringId);
    serialDialogBuffer += "showSerialDialog: " + std::to_string(serialDialogId) + "\n" +
    	"openSerialDialog->stringId: " + std::to_string(openSerialDialog->stringId) + "\n"
    	"openSerialDialog->responseCount: " + std::to_string(openSerialDialog->responseCount) + "\n"
    	"message: " + dialogString + "\n";

   inputTrapped = openSerialDialog->serialResponseType != MageSerialDialogResponseTypes::RESPONSE_NONE;
   auto address = ROM()->GetOffsetByIndex<MageSerialDialog>(serialDialogId);
   auto serialDialogResponses = ROM()->GetViewOf<MageDialogResponse>(address, (uint16_t)openSerialDialog->responseCount);
   
   for (auto i = 0; i < openSerialDialog->responseCount; i++)
   {
      // TODO: are there any serial responses?
      /*auto& response = openSerialDialog->Responses[i];
      if (openSerialDialog->serialResponseType == MageSerialDialogResponseTypes::RESPONSE_ENTER_NUMBER)
      {
         std::string responseLabel = stringLoader->getString(response.stringId);
         serialDialogBuffer += "\t" + std::to_string(i) + ": " + responseLabel + "\n";
      }*/
   }
}

void MageCommandControl::registerCommand(uint16_t commandStringId, uint16_t scriptId, bool isFail)
{
   std::string lowercasedString = stringLoader->getString(commandStringId);
   badAsciiLowerCase(lowercasedString);
   MageSerialDialogCommand command
   {
      .combinedString = lowercasedString,
      .commandStringId = commandStringId,
      .argumentStringId = 0,
      .scriptId = scriptId,
      .isFail = isFail,
      .isVisible = true 
   };
   int32_t existingCommandIndex = getCommandIndex(command.combinedString, command.isFail, true);
   if (existingCommandIndex != -1)
   {
      // replace the existing one
      registeredCommands[existingCommandIndex] = command;
   }
   else
   {
      // is new, put it on the end
      registeredCommands.push_back(command);
   }
}

void MageCommandControl::registerArgument(uint16_t commandStringId, uint16_t argumentStringId, uint16_t scriptId)
{
   std::string lowercasedString = stringLoader->getString(commandStringId) + " " + stringLoader->getString(argumentStringId);
   badAsciiLowerCase(lowercasedString);
   MageSerialDialogCommand command = {
      .combinedString = lowercasedString,
      .commandStringId = commandStringId,
      .argumentStringId = argumentStringId,
      .scriptId = scriptId,
      .isFail = false,
      .isVisible = true,
   };
   int32_t existingCommandIndex = getCommandIndex(command.combinedString, command.isFail, false);
   if (existingCommandIndex != -1)
   {
      // replace the existing one
      registeredCommands[existingCommandIndex] = command;
   }
   else
   {
      // is new, put it on the end
      registeredCommands.push_back(command);
   }
}

int32_t MageCommandControl::getCommandIndex(const std::string& combinedString, bool isFail, bool useFail)
{
   int32_t result = -1;
   for (auto& command : registeredCommands)
   {
      bool areStringsTheSame = combinedString == command.combinedString;
      bool areFailureStatesTheSame = useFail ? command.isFail == isFail : true;

      if (areStringsTheSame && areFailureStatesTheSame)
      {
         // found an existing incomingCommand with the same params, get its id
         result = &command - &registeredCommands[0];
         break;
      }
   }
   return result;
}

void MageCommandControl::unregisterCommand(uint16_t commandStringId, bool isFail)
{
   std::vector<MageSerialDialogCommand> newCommands = {};
   bool wasCommandFound = false;
   if (isFail)
   {
      // We're unregistering ONLY the fail state
      for (const auto& command : registeredCommands)
      {
         if (command.commandStringId != commandStringId || !command.isFail)
         {
            newCommands.push_back(command);
         }
         else
         {
            wasCommandFound = true;
         }
      }
   }
   else
   {
      // un-register command aliases
      auto command = stringLoader->getString(commandStringId);
      for (auto alias = commandAliases.begin(); alias != commandAliases.end(); )
      {
         if (alias->second == command)
         {
            commandAliases.erase(alias++);
         }
         else
         {
            ++alias;
         }
      }
      // We're unregistering all the arguments, the fail state, and the root command
      for (auto& registeredCommand : registeredCommands)
      {
         if (registeredCommand.commandStringId != commandStringId)
         {
            newCommands.push_back(registeredCommand);
         }
         else
         {
            wasCommandFound = true;
         }
      }
   }
   if (!wasCommandFound)
   {
      commandResponseBuffer += "Unable to unregister command because it was not already registered: "
         + stringLoader->getString(commandStringId);
   }
   registeredCommands = newCommands;
}

void MageCommandControl::unregisterArgument(uint16_t commandStringId, uint16_t argumentStringId)
{
   std::vector<MageSerialDialogCommand> newCommands = {};
   bool wasCommandFound = false;
   for (auto& registeredCommand : registeredCommands)
   {
      if (registeredCommand.commandStringId != commandStringId || registeredCommand.argumentStringId || argumentStringId)
      {
         newCommands.push_back(registeredCommand);
      }
      else
      {
         wasCommandFound = true;
      }
   }
   if (!wasCommandFound)// && gameControl->isEntityDebugOn)
   {
      commandResponseBuffer += "Unable to unregister Argument because it was not already registered: "
         + stringLoader->getString(commandStringId);
   }
   registeredCommands = newCommands;
}

void MageCommandControl::registerCommandAlias(uint16_t commandStringId, uint16_t aliasStringId)
{
   auto command = stringLoader->getString(commandStringId);
   auto alias = stringLoader->getString(aliasStringId);

   commandAliases[alias] = command;
}

void MageCommandControl::unregisterCommandAlias(uint16_t aliasStringId)
{
   auto alias = stringLoader->getString(aliasStringId);
   commandAliases.erase(alias);
}

void MageCommandControl::setCommandVisibility(uint16_t commandStringId, bool isVisible)
{
   auto commandString = stringLoader->getString(commandStringId);
   
   int32_t existingCommandIndex = getCommandIndex(commandString, false, true);
   if (existingCommandIndex != -1)
   {
      // set the visibility
      registeredCommands[existingCommandIndex].isVisible = isVisible;
   }
   else
   {
      // could not find it, show warning in debug mode
   }
}

MageSerialDialogCommand* MageCommandControl::searchForCommand(const std::string& verb, const std::string& subject)
{
   MageSerialDialogCommand* failStateCommand = nullptr;
   MageSerialDialogCommand* successStateCommand = nullptr;

   auto combinedString = verb;
   if (!subject.empty())
   {
      combinedString += " " + subject;
   }

   for (auto& command : registeredCommands)
   {
      if (command.combinedString == combinedString && !command.isFail)
      {
         successStateCommand = &command;
         break;
      }
      else if (command.combinedString == verb && command.isFail)
      {
         failStateCommand = &command;
      }
   }

   return successStateCommand == nullptr
      ? failStateCommand
      : successStateCommand;
}

void MageCommandControl::sendBufferedOutput()
{
   std::vector<std::string*> bufferedStrings{ &commandResponseBuffer, &serialDialogBuffer, &postDialogBuffer };
   bool anyOutput = false;
   for (auto currentString : bufferedStrings)
   {
      if (currentString->length())
      {
         serial->SendMessage(currentString->data());
         *currentString = "";
         anyOutput = true;
      }
   }
   if (anyOutput)
   {
      serial->SendMessage("> ");
   }
}
