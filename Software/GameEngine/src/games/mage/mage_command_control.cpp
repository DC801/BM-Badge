#include "mage_command_control.h"
#include "mage_map.h"
#include "mage_script_control.h"

#include "EngineSerial.h"
#include "StringLoader.h"
#include <vector>
#include "convert_endian.h"

void MageCommandControl::handleStart()
{
   if (connectSerialDialogId != COMMAND_NO_CONNECT_DIALOG_ID)
   {
      showSerialDialog(connectSerialDialogId);
   }
   else
   {
      commandResponseBuffer +=
         "WELCOME TO MAGE NET\n"
         "   __  ______  _________  _  ____________\n"
         "  /  |/  / _ |/ ___/ __/ / |/ / __/_  __/\n"
         " / /|_/ / __ / (_ / _/  /    / _/  / /   \n"
         "/_/  /_/_/ |_\\___/___/ /_/|_/___/ /_/    \n";
   }
}

void MageCommandControl::processCommand(char* commandString)
{
   std::string lowercasedInput = commandString;
   badAsciiLowerCase(&lowercasedInput);
   if (!isInputTrapped)
   {
      processCommandAsVerb(lowercasedInput);
   }
   else
   {
      processCommandAsResponseInput(lowercasedInput);
   }
}

void MageCommandControl::processCommandAsVerb(std::string input)
{
   // Used to split string around spaces.
   bool syntaxValid = true;
   uint8_t wordCount = 0;
   std::string word = "";
   std::string verb;
   std::string subject;

   // Traverse through all words
   // while loop through segments to store in string word
   while (
      input.compare(word) != 0
      && syntaxValid
      )
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
      commandResponseBuffer += (
         "Invalid command! Commands are exactly one or two words.\n"
         "Examples: help | look | look $ITEM | go $DIRECTION\n"
         );
      return;
   }

   if (verb == "help")
   {
      // I sure thought `lastCommandUsed` & the `MageSerialCommands` enum
      // would be really useful earlier, but I can't remember why now.
      lastCommandUsed = COMMAND_HELP;
      commandResponseBuffer += (
         "Supported Verbs:\n"
         "\thelp\tlook\tgo\n"
         );
   }
   else if (verb == "look")
   {
      lastCommandUsed = COMMAND_LOOK;
      commandResponseBuffer += "You try to look.\n";
      
      scriptControl->resumeStates.commandLook = MageScriptState{mapControl->GetOnLook(), true };

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
      lastCommandUsed = COMMAND_GO;
      if (!subject.length())
      {
         commandResponseBuffer += (
            "You cannot `go` nowhere. Pick a direction.\n"
            );
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
            scriptControl->resumeStates.commandGo = MageScriptState{directionScriptId, true };
         }
      }
   }
   // start SECRET_GOAT
   else if (verb == "goat")
   {
      commandResponseBuffer += (
         "You have found a secret goat!\n"
         "               ##### ####    \n"
         "             ##   #  ##      \n"
         "            #   (-)    #     \n"
         "            #+       ######  \n"
         " FEED ME -  #^             ##\n"
         "             ###           # \n"
         "               #  #      # # \n"
         "               ##  ##  ##  # \n"
         "               ######  ##### \n"
         );
   }
   else if (input == "feed goat")
   {
      commandResponseBuffer += (
         "You have fed the secret goat!\n"
         "               ##### ####    \n"
         "             ##   #  ##      \n"
         "            #   (-)    #     \n"
         "            #+       ######  \n"
         "   THANK -  #v             ##\n"
         "             ###           # \n"
         "               #  #      # # \n"
         "               ##  ##  ##  # \n"
         "               ######  ##### \n"
         );
   }
   // end SECRET_GOAT
   else
   {
      commandResponseBuffer = "Unrecognized Verb: " + verb + "\n";
   }
}

void MageCommandControl::processCommandAsResponseInput(std::string input)
{
   commandResponseBuffer += "processCommandAsResponseInput: " + input + "\n";
   MageSerialDialogResponseTypes responseType = serialDialog.serialResponseType;
   if (responseType == RESPONSE_ENTER_NUMBER)
   { 
      bool errorWhileParsingInt = false;
      try
      {
         auto responseIndex = std::stoi(input);
         if (responseIndex >= 0 && responseIndex < serialDialog.responseCount)
         {
            auto response = serialDialogResponses[responseIndex];
            std::string responseLabel = stringLoader->getString(response.stringId);
            commandResponseBuffer += "Valid response: " + input + " - " +  responseLabel + "\n";
            scriptControl->jumpScriptId = response.scriptId;
            isInputTrapped = false;
         }
         else
         {
            commandResponseBuffer += "Invalid response: " + input + "\n";
            showSerialDialog(serialDialogId);
         }
      }
      catch (std::logic_error& err)
      {
         commandResponseBuffer += "Response unparsable: " + input + "\n";
         showSerialDialog(serialDialogId);
      }
   }
   else if (responseType == RESPONSE_ENTER_STRING)
   {
      bool validResponseFound = false;
      for (uint8_t i = 0; i < serialDialog.responseCount; i++)
      {
         std::string responseLabel = stringLoader->getString(serialDialogResponses[i].stringId);
         badAsciiLowerCase(&responseLabel);
         if (responseLabel == input)
         {
            commandResponseBuffer += "Valid response: " + input + "\n";
            scriptControl->jumpScriptId = serialDialogResponses[i].scriptId;
            isInputTrapped = false;
            validResponseFound = true;
            break;
         }
      }
      if (!validResponseFound)
      {
         commandResponseBuffer += "Invalid response: " + input + "\n";
         isInputTrapped = false;
      }
   }
}

void MageCommandControl::showSerialDialog(uint16_t _serialDialogId)
{
   serialDialogId = _serialDialogId;
   scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
   uint32_t serialDialogAddress =  0;// tileManager->imageHeader.offset(serialDialogId);
   //ROM->Read(serialDialog, serialDialogAddress);
   serialDialog = * ROM->Get<MageSerialDialog>(serialDialogId);
   std::string dialogString = stringLoader->getString(serialDialog.stringId);
   // serialDialogBuffer += (
   // 	"showSerialDialog: " + std::to_string(serialDialogId) + "\n" +
   // 	"serialDialogAddress: " + std::to_string(serialDialogAddress) + "\n"
   // 	"serialDialog.stringId: " + std::to_string(serialDialog.stringId) + "\n"
   // 	"serialDialog.serialResponseType: " + std::to_string(serialDialog.serialResponseType) + "\n"
   // 	"serialDialog.responseCount: " + std::to_string(serialDialog.responseCount) + "\n"
   // 	"message:\n"
   // );
   serialDialogBuffer += dialogString + "\n";
   isInputTrapped = serialDialog.serialResponseType != RESPONSE_NONE;
   ROM->InitializeCollectionOf(serialDialogResponses, serialDialogAddress, serialDialog.responseCount);
   for (uint8_t i = 0; i < serialDialog.responseCount; i++)
   {
      if (serialDialog.serialResponseType == RESPONSE_ENTER_NUMBER)
      {
         std::string responseLabel = stringLoader->getString(serialDialogResponses[i].stringId);
         serialDialogBuffer += "\t" + std::to_string(i) + ": " + responseLabel + "\n";
      }
   }
}

void MageCommandControl::reset()
{
   isInputTrapped = false;
   // if reset has been run, you're probably on a new map
   // so don't show the postDialogBuffer contents,
   // but we do need to show the commandResponse and dialog
   // strings provided just before loading to the new map
   postDialogBuffer = "";
   sendBufferedOutput();
}

void MageCommandControl::sendBufferedOutput()
{
   bool anyOutput = false;
   for (auto& currentString : { commandResponseBuffer, serialDialogBuffer, postDialogBuffer })
   {
      if (!currentString.empty())
      {
         EngineSendSerialMessage(currentString.c_str());
         anyOutput = true;
      }
   }
   if (anyOutput)
   {
      EngineSendSerialMessage("> ");
   }
}
