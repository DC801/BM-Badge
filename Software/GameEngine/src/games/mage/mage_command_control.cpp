#include "mage_command_control.h"
#include "mage_dialog_control.h"
#include "mage_script_control.h"
#include "mage_map.h"

#include "EngineSerial.h"
#include "StringLoader.h"
#include <vector>

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

void MageCommandControl::processCommand(std::string& commandString)
{
   badAsciiLowerCase(commandString);
   if (!isInputTrapped)
   {
      processCommandAsVerb(commandString);
   }
   else
   {
      processCommandAsResponseInput(commandString);
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
      
      //mapControl->look.scriptIsRunning = true;

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
            //scriptControl->resumeStates.commandGo = MageScriptState{directionScriptId, true };
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

void MageCommandControl::processCommandAsResponseInput(std::string& input)
{
    if (openSerialDialog)
    {
        commandResponseBuffer += "processCommandAsResponseInput: " + input + "\n";
        MageSerialDialogResponseTypes responseType = openSerialDialog->serialResponseType;
        if (responseType == RESPONSE_ENTER_NUMBER)
        {
            bool errorWhileParsingInt = false;
            try
            {
                auto responseIndex = std::stoi(input);
                if (responseIndex >= 0 && responseIndex < openSerialDialog->Responses.size())
                {
                    auto& response = openSerialDialog->Responses[responseIndex];
                    auto responseLabel = stringLoader->getString(response.stringIndex);
                    commandResponseBuffer += "Valid response: " + input + " - " + responseLabel + "\n";
                    scriptControl->jumpScriptId = response.scriptIndex;
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
            for (uint8_t i = 0; i < openSerialDialog->Responses.size(); i++)
            {
                auto responseLabel = stringLoader->getString(openSerialDialog->Responses[i].stringIndex);
                badAsciiLowerCase(responseLabel);
                if (responseLabel == input)
                {
                    commandResponseBuffer += "Valid response: " + input + "\n";
                    scriptControl->jumpScriptId = openSerialDialog->Responses[i].scriptIndex;
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
}

void MageCommandControl::showSerialDialog(uint16_t serialDialogId)
{
   scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
   // uint32_t serialDialogAddress = tileManager->imageHeader.offset(serialDialogId);
   //ROM()->Read(serialDialog, serialDialogAddress);
   openSerialDialog = ROM()->InitializeRAMCopy<MageSerialDialog>(serialDialogId);
   auto dialogString = stringLoader->getString(openSerialDialog->stringId);
   // serialDialogBuffer += (
   // 	"showSerialDialog: " + std::to_string(serialDialogId) + "\n" +
   // 	"serialDialogAddress: " + std::to_string(serialDialogAddress) + "\n"
   // 	"openSerialDialog->stringId: " + std::to_string(openSerialDialog->stringId) + "\n"
   // 	"openSerialDialog->serialResponseType: " + std::to_string(openSerialDialog->serialResponseType) + "\n"
   // 	"openSerialDialog->Responses.size(): " + std::to_string(openSerialDialog->Responses.size()) + "\n"
   // 	"message:\n"
   // );
   serialDialogBuffer += dialogString + "\n";
   isInputTrapped = openSerialDialog->serialResponseType != RESPONSE_NONE;
   for (uint8_t i = 0; i < openSerialDialog->Responses.size(); i++)
   {
      if (openSerialDialog->serialResponseType == RESPONSE_ENTER_NUMBER)
      {
         auto responseLabel = stringLoader->getString(openSerialDialog->Responses[i].stringIndex);
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
         serial->SendMessage(currentString.c_str());
         anyOutput = true;
      }
   }
   if (anyOutput)
   {
      serial->SendMessage("> ");
   }
}
