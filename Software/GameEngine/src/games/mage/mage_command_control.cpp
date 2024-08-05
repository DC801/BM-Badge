#include "mage_command_control.h"
#include "mage_game_control.h"
#include "mage_script_control.h"
#include "EngineSerial.h"
#include <vector>
#include <unordered_map>

extern MageGameControl *MageGame;
extern MageScriptControl *MageScript;

void badAsciiLowerCase(std::string *data) {
	size_t length = data->size();
	for(size_t i=0; i < length; i++) {
		(*data)[i] = std::tolower((*data)[i]);
	}
}

MageCommandControl::MageCommandControl() {
	// EngineSendSerialMessage(
	// 	"Hello there, the Command Goats are listening for commands.\n"
	// );
}

void MageCommandControl::handleStart() {
	if(connectSerialDialogId != COMMAND_NO_CONNECT_DIALOG_ID) {
		showSerialDialog(connectSerialDialogId);
	} else {
		commandResponseBuffer += (
			"WELCOME TO MAGE NET\n"
			"   __  ______  _________  _  ____________\n"
			"  /  |/  / _ |/ ___/ __/ / |/ / __/_  __/\n"
			" / /|_/ / __ / (_ / _/  /    / _/  / /   \n"
			"/_/  /_/_/ |_\\___/___/ /_/|_/___/ /_/    \n"
		);
	}
}

void MageCommandControl::processCommand(const char *commandString) {
	std::string lowercasedInput = commandString;
	badAsciiLowerCase(&lowercasedInput);
	if (!isInputTrapped) {
		processInputAsCommand(lowercasedInput);
	} else {
		processInputAsTrappedResponse(lowercasedInput);
	}
}

void MageCommandControl::processInputAsCommand(std::string input) {
	// Used to split string around spaces.
	uint8_t wordCount = 0;
	std::string word;
	std::string verb;
	std::string subject;
	std::string modifier;

	// Traverse through all words
	// while loop through segments to store in string word
	while (!input.empty()) {
		size_t index = input.find_first_of(' ');
		if (index != std::string::npos) {
			// we found a space
			word = input.substr(0, index);
			input = input.substr(index + 1, input.length());
		} else {
			// no more spaces
			word = "" + input;
			input = "";
		}
		if (word.length() == 0) {
			// skip space
			continue;
		}

		wordCount++;
		if (wordCount == 1) {
			verb = "" + word;
		} else if (
				wordCount == 2
				&& (word == "at" || word == "to")
				) {
			modifier = word;
		} else {
			if (!subject.empty()) {
				subject += " ";
			}
			subject += word;
		}
	}

	verb = aliasLookup(verb);

	/*
	if (MageGame->isEntityDebugOn) {
		std::string message = "Verb: " + verb;
		if (!modifier.empty()) { message += " | Modifier: " + modifier; }
		if (!subject.empty()) { message += " | Subject: " + subject; }
		message += "\n";
		commandResponseBuffer += message;
	}
	*/

	MageSerialDialogCommand* foundCommand = searchForCommand(
		verb,
		subject
	);
	if (foundCommand != nullptr) {
		/*
		if(MageGame->isEntityDebugOn) {
			commandResponseBuffer += "COMMAND FOUND!!!!: " + verb + "\n";
		}
		*/
		MageScript->initScriptState(
			&MageScript->resumeStates.serial,
			foundCommand->scriptId,
			true
		);
	} else if(verb == "help") {
		// I sure thought `lastCommandUsed` & the `MageSerialCommands` enum
		// would be really useful earlier, but I can't remember why now.
		lastCommandUsed = COMMAND_HELP;
		commandResponseBuffer += (
			"Supported Commands:\n"
			"  help  look  go"
		);
		if (!registeredCommands.empty()) {
			for (const auto& command : registeredCommands) {
				if (
					command.argumentStringId == 0
					&& !command.isFail
					&& command.isVisible
				) {
					commandResponseBuffer += "  " + command.combinedString;
				}
			}
		}
		commandResponseBuffer += "\n";
	}
	else if(verb == "look") {
		lastCommandUsed = COMMAND_LOOK;
		if (subject.empty()) {
			commandResponseBuffer += (
				"You try to look.\n"
			);
			MageScript->initScriptState(
				&MageScript->resumeStates.serial,
				MageGame->Map().onLook,
				true
			);
			std::string directionNames = MageGame->Map().getDirectionNames();
			if (directionNames.length() > 0) {
				postDialogBuffer += "Exits are:\n";
				postDialogBuffer += directionNames;
				postDialogBuffer += "\n";
			}
		} else {
			// commandResponseBuffer += (
			// 	"You try to look AT " +
			// 	subject + "\n"
			// );
			// commandResponseBuffer += (
			// 	"Entities in the room:\n"
			// );
			std::vector<std::string> names = MageGame->getEntityNamesInRoom();
			std::string name;
			bool entityFound = false;
			uint16_t lookScriptId = 0;
			for (size_t i = 0; i < names.size(); ++i) {
				name = names[i];
				badAsciiLowerCase(&name);
				// commandResponseBuffer += (
				// 	"\t" + std::to_string(i) + ":\"" + name + "\"\n"
				// );
				if (!strcmp(name.c_str(), subject.c_str())) {
					entityFound = true;
					// commandResponseBuffer += (
					// 	"\tFound it! Entity index is: "+std::to_string(i)+"\n"
					// );
					lookScriptId = MageGame->entities[i].onLookScriptId;
					// commandResponseBuffer += (
					// 	"\tlookScriptId is: "+std::to_string(lookScriptId)+"\n"
					// );
					MageScript->initScriptState(
						MageScript->getEntityLookResumeState(i),
						lookScriptId,
						true
					);
					break;
				}
			}
			if(!entityFound) {
				commandResponseBuffer += "\"" + subject + "\" is not a valid entity name.\n";
			} else if (!lookScriptId) {
				commandResponseBuffer += "You looked at \"" + subject + "\", but learned nothing in particular.\n";
			} else {
				commandResponseBuffer += "You looked at \"" + subject + "\".\n";
			}
		}
	}
	else if(verb == "go") {
		lastCommandUsed = COMMAND_GO;
		if(!subject.length()) {
			commandResponseBuffer += (
				"You cannot `go` nowhere. Pick a direction.\n"
			);
		} else {
			if (subject == "n") { subject = "north"; }
			if (subject == "s") { subject = "south"; }
			if (subject == "e") { subject = "east"; }
			if (subject == "w") { subject = "west"; }
			if (subject == "ne") { subject = "northeast"; }
			if (subject == "sw") { subject = "southwest"; }
			if (subject == "se") { subject = "southeast"; }
			if (subject == "nw") { subject = "northwest"; }
			std::string output = "You try to go `";
			output += subject;
			output += "`";
			uint16_t directionScriptId = MageGame->Map().getDirectionScriptId(subject);
			if(!directionScriptId) {
				output += ", but that is not a valid direction\n";
			} else {
				output += "\n";
			}
			commandResponseBuffer += output;
			if(directionScriptId) {
				MageScript->initScriptState(
					&MageScript->resumeStates.serial,
					directionScriptId,
					true
				);
			}
		}
	}
	// start SECRET_GOAT
	else if(verb == "goat") {
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
	else if(verb == "feed" && subject == "goat") {
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
	else {
		commandResponseBuffer += "Unrecognized Command: " + verb + "\n";
	}
}

std::string MageCommandControl::aliasLookup(std::string& input) {
	auto result = input;
	auto found = commandAliases.find(input);
	if (found == commandAliases.end()) {
		/*
		if(MageGame->isEntityDebugOn) {
			commandResponseBuffer += "Alias NOT found: " + input + "\n";
		}
		*/
	}
	else {
		/*
		if(MageGame->isEntityDebugOn) {
			commandResponseBuffer += "Alias found: " + found->first + " is " + found->second + "\n";
		}
		*/
		result = found->second;
	}
	return result;
};

void MageCommandControl::processInputAsTrappedResponse(const std::string& input) {
	/*
	if(MageGame->isEntityDebugOn) {
		commandResponseBuffer += "processInputAsTrappedResponse: " + input + "\n";
	}
	*/
	MageSerialDialogResponseTypes responseType = serialDialog.serialResponseType;
	if (responseType == RESPONSE_ENTER_NUMBER) {
		bool errorWhileParsingInt = false;
		char *parseStatus;
		long responseIndex = strtol(input.c_str(), &parseStatus, 0);
		if(*parseStatus != 0){
			// commandResponseBuffer += "Parse string as number FAIL!!!";
			errorWhileParsingInt = true;
		}
		if (
			!errorWhileParsingInt
			&& responseIndex >= 0
			&& responseIndex < (serialDialog.responseCount)
		) {
			MageSerialDialogResponse *response = &serialDialogResponses[responseIndex];
			std::string responseLabel = MageGame->getString(response->stringId, NO_PLAYER);
			/*
			if(MageGame->isEntityDebugOn) {
				commandResponseBuffer += (
					"Valid response: " +
					input + " - " +
					responseLabel + "\n"
				);
			}
			*/
			jumpScriptId = response->scriptId;
			isInputTrapped = false;
		} else {
			/*
			if(MageGame->isEntityDebugOn) {
				commandResponseBuffer += "Invalid response: " + input + "\n";
			}
			*/
			showSerialDialog(serialDialogId);
		}
	}
	else if (responseType == RESPONSE_ENTER_STRING)
	{
		bool validResponseFound = false;
		for(uint8_t i = 0; i < serialDialog.responseCount; i++) {
			MageSerialDialogResponse *response = &serialDialogResponses[i];
			std::string responseLabel = MageGame->getString(response->stringId, NO_PLAYER);
			badAsciiLowerCase(&responseLabel);
			if (responseLabel == input) {
				/*
				if(MageGame->isEntityDebugOn) {
					commandResponseBuffer += "Valid response: " + input + "\n";
				}
				*/
				jumpScriptId = response->scriptId;
				isInputTrapped = false;
				validResponseFound = true;
				break;
			}
		}
		if(!validResponseFound) {
			commandResponseBuffer += "Invalid response: " + input + "\n";
			isInputTrapped = false;
		}
	}
}

void MageCommandControl::cancelTrap() {
	isInputTrapped = false;
};

void MageCommandControl::showSerialDialog(
	uint16_t _serialDialogId,
	bool disableNewline,
	uint8_t selfId
) {
	serialDialogId = _serialDialogId;
	jumpScriptId = MAGE_NO_SCRIPT;
	uint32_t serialDialogAddress = MageGame->getSerialDialogAddress(serialDialogId);
	EngineROM_Read(
		serialDialogAddress,
		sizeof(serialDialog),
		(uint8_t *) &serialDialog,
		"Unable to read MageSerialDialog"
	);
	ROM_ENDIAN_U2_BUFFER(&serialDialog.stringId, 1);
	std::string dialogString = MageGame->getString(
		serialDialog.stringId,
		selfId
	);
	// serialDialogBuffer += (
	// 	"showSerialDialog: " + std::to_string(serialDialogId) + "\n" +
	// 	"serialDialogAddress: " + std::to_string(serialDialogAddress) + "\n"
	// 	"serialDialog.stringId: " + std::to_string(serialDialog.stringId) + "\n"
	// 	"serialDialog.serialResponseType: " + std::to_string(serialDialog.serialResponseType) + "\n"
	// 	"serialDialog.responseCount: " + std::to_string(serialDialog.responseCount) + "\n"
	// 	"message:\n"
	// );
	serialDialogBuffer += dialogString;
	if (!disableNewline) {
		serialDialogBuffer += "\n";
	}
	isInputTrapped = serialDialog.serialResponseType != RESPONSE_NONE;
	serialDialogResponses = std::make_unique<MageSerialDialogResponse[]>(serialDialog.responseCount);
	EngineROM_Read(
		serialDialogAddress + sizeof(serialDialog),
		sizeof(MageSerialDialogResponse) * serialDialog.responseCount,
		(uint8_t *) serialDialogResponses.get(),
		"Unable to read MageSerialDialogResponse"
	);
	for(uint8_t i = 0; i < serialDialog.responseCount; i++) {
		MageSerialDialogResponse *response = &serialDialogResponses[i];
		ROM_ENDIAN_U2_BUFFER(&response->stringId, 1);
		ROM_ENDIAN_U2_BUFFER(&response->scriptId, 1);
		if(serialDialog.serialResponseType == RESPONSE_ENTER_NUMBER) {
			std::string responseLabel = MageGame->getString(response->stringId, NO_PLAYER);
			serialDialogBuffer += (
				"\t" + std::to_string(i) + ": " +
				responseLabel + "\n"
			);
		}
	}
}

uint32_t MageCommandControl::size() {
	return (
		0
		+ sizeof(commandResponseBuffer)
		+ sizeof(serialDialogBuffer)
		+ sizeof(postDialogBuffer)
		+ sizeof(registeredCommands)
		+ sizeof(commandAliases)
		+ sizeof(serialDialog)
		+ sizeof(serialDialogResponses)
		+ sizeof(jumpScriptId)
		+ sizeof(connectSerialDialogId)
		+ sizeof(serialDialogId)
		+ sizeof(lastCommandUsed)
		+ sizeof(isInputTrapped)
	);
}

void MageCommandControl::registerCommand(
	uint16_t commandStringId,
	uint16_t scriptId,
	bool isFail
) {
	std::string lowercasedString = MageGame->getString(commandStringId, NO_PLAYER);
	badAsciiLowerCase(&lowercasedString);
	MageSerialDialogCommand command;
	command.combinedString = lowercasedString;
	command.argumentStringId = 0;
	command.commandStringId = commandStringId;
	command.scriptId = scriptId;
	command.isFail = isFail;
	command.isVisible = true;
	int32_t existingCommandIndex = getCommandIndex(command.combinedString, command.isFail, true);
	if (existingCommandIndex != -1) {
		// replace the existing one
		if(MageGame->isEntityDebugOn) {
			commandResponseBuffer += "Duplicate command registration, you may wanna verify that: " + lowercasedString + "\n";
		}
		registeredCommands[existingCommandIndex] = command;
	} else {
		// is new, put it on the end
		registeredCommands.push_back(command);
	}
}
void MageCommandControl::registerArgument(
	uint16_t commandStringId,
	uint16_t argumentStringId,
	uint16_t scriptId
) {
	std::string lowercasedString = (
		MageGame->getString(commandStringId, NO_PLAYER)
		+ " "
		+ MageGame->getString(argumentStringId, NO_PLAYER)
	);
	badAsciiLowerCase(&lowercasedString);
	MageSerialDialogCommand command = {
		.combinedString = lowercasedString,
		.commandStringId = commandStringId,
		.argumentStringId = argumentStringId,
		.scriptId = scriptId,
		.isFail = false,
		.isVisible = true,
	};
	int32_t existingCommandIndex = getCommandIndex(command.combinedString, command.isFail, false);
	if (existingCommandIndex != -1) {
		// replace the existing one
		if(MageGame->isEntityDebugOn) {
			commandResponseBuffer += "Duplicate argument registration, you may wanna verify that: " + lowercasedString + "\n";
		}
		registeredCommands[existingCommandIndex] = command;
	} else {
		// is new, put it on the end
		registeredCommands.push_back(command);
	}
}
int32_t MageCommandControl::getCommandIndex(const std::string &combinedString, bool isFail, bool useFail) {
	int32_t result = -1;
	for (auto & command : registeredCommands) {
		bool areStringsTheSame = combinedString == command.combinedString;
		bool areFailureStatesTheSame = useFail ? command.isFail == isFail : true;
		/*
		std::string debugMessage = "";
		debugMessage += "'" + combinedString + "'";
		debugMessage += " == ";
		debugMessage += "'" + command.combinedString + "'";
		debugMessage += ": areStringsTheSame?";
		debugMessage += areStringsTheSame ? "Yes" : "No";
		debugMessage += " fails?: ";
		debugMessage += isFail ? "1" : "0";
		debugMessage += " == ";
		debugMessage += command.isFail ? "1" : "0";
		debugMessage += " | areFailureStatesTheSame?:";
		debugMessage += areFailureStatesTheSame ? "Yes" : "No";
		debugMessage += "\n";
		printf(debugMessage.c_str());
		*/
		if (areStringsTheSame && areFailureStatesTheSame) {
			// found an existing incomingCommand with the same params, get its id
			result = &command - &registeredCommands[0];
			break;
		}
	}
	return result;
}

void MageCommandControl::unregisterCommand(
	uint16_t commandStringId,
	bool isFail
) {
	std::vector<MageSerialDialogCommand> newCommands = {};
	bool wasCommandFound = false;
	if (isFail) {
		// We're unregistering ONLY the fail state
		for (const auto& command : registeredCommands) {
				if (
				!(
					command.commandStringId == commandStringId
					&& command.isFail
				)
			) {
				newCommands.push_back(command);
			} else {
				wasCommandFound = true;
			}
		}
	} else {
		// un-register command aliases
		auto command = MageGame->getString(commandStringId, NO_PLAYER);
		for (auto alias = commandAliases.begin(); alias != commandAliases.end(); ) {
			if (alias->second == command) {
				commandAliases.erase(alias++);
			} else {
				++alias;
			}
		}
		// debugAliases();
		// We're unregistering all the arguments, the fail state, and the root command
		for (auto & registeredCommand : registeredCommands) {
			if (registeredCommand.commandStringId != commandStringId) {
				newCommands.push_back(registeredCommand);
			} else {
				wasCommandFound = true;
			}
		}
	}
	if (!wasCommandFound) {
		commandResponseBuffer += (
			"Unable to unregister command because it was not already registered: "
			+ MageGame->getString(commandStringId, NO_PLAYER)
		);
	}
	registeredCommands = newCommands;
}
void MageCommandControl::unregisterArgument(
	uint16_t commandStringId,
	uint16_t argumentStringId
) {
	std::vector<MageSerialDialogCommand> newCommands = {};
	bool wasCommandFound = false;
	for (auto & registeredCommand : registeredCommands) {
		if (
			!(
				registeredCommand.commandStringId == commandStringId
				&& registeredCommand.argumentStringId == argumentStringId
			)
		) {
			newCommands.push_back(registeredCommand);
		} else {
			wasCommandFound = true;
		}
	}
	if (!wasCommandFound && MageGame->isEntityDebugOn) {
		commandResponseBuffer += (
			"Unable to unregister Argument because it was not already registered: "
			+ MageGame->getString(commandStringId, NO_PLAYER)
		);
	}
	registeredCommands = newCommands;
}

void MageCommandControl::registerCommandAlias(
	uint16_t commandStringId,
	uint16_t aliasStringId
) {
	auto command = MageGame->getString(commandStringId, NO_PLAYER);
	auto alias = MageGame->getString(aliasStringId, NO_PLAYER);
	/*
	if(MageGame->isEntityDebugOn) {
		commandResponseBuffer += (
				"registerCommandAlias: "
				" commandString: " + command
				+ "; aliasStringId: " + alias
				+ "\n"
		);
	}
	*/
	commandAliases[alias] = command;
	// debugAliases();
}

void MageCommandControl::debugAliases() {
	if(MageGame->isEntityDebugOn) {
		commandResponseBuffer += "Aliases:\n";
		for (const auto &item: commandAliases) {
			commandResponseBuffer += "	Key:[" + item.first + "] Value:[" + item.second + "]\n";
		}
	}
}

void MageCommandControl::unregisterCommandAlias(
	uint16_t aliasStringId
) {
	auto alias = MageGame->getString(aliasStringId, NO_PLAYER);
	/*
	if(MageGame->isEntityDebugOn) {
		commandResponseBuffer += (
				"unregisterCommandAlias:"
				" aliasStringId: " + alias
				+ "\n"
		);
	}
	*/
	commandAliases.erase(alias);
	// debugAliases();
}

void MageCommandControl::setCommandVisibility(
	uint16_t commandStringId,
	bool isVisible
) {
	auto commandString = MageGame->getString(commandStringId, NO_PLAYER);
	/*
	if(MageGame->isEntityDebugOn) {
		commandResponseBuffer += (
			"setCommandVisibility:"
			" commandString: " + commandString
			+ "; isVisible: " + (isVisible ? "yes" : "no")
			+ "\n"
		);
	}
	*/
	int32_t existingCommandIndex = getCommandIndex(commandString, false, true);
	if (existingCommandIndex != -1) {
		// set the visibility
		registeredCommands[existingCommandIndex].isVisible = isVisible;
	} else {
		// could not find it, show warning in debug mode
		if(MageGame->isEntityDebugOn) {
			commandResponseBuffer += "Warning: Could not set visibility on command: " + commandString + "\n";
		}
	}
}

MageSerialDialogCommand* MageCommandControl::searchForCommand(
	const std::string& verb,
	const std::string& subject
) {
	MageSerialDialogCommand* failStateCommand = nullptr;
	MageSerialDialogCommand* successStateCommand = nullptr;

	auto combinedString = verb;
	if (!subject.empty()) {
		combinedString += " " + subject;
	}
	for (auto & command : registeredCommands) {
		if (
			command.combinedString == combinedString
			&& !command.isFail
		) {
			successStateCommand = &command;
			break;
		} else if (
			command.combinedString == verb
			&& command.isFail
		) {
			failStateCommand = &command;
		}
	}

	return successStateCommand == nullptr
		? failStateCommand
		: successStateCommand;
}

void MageCommandControl::reset() {
	jumpScriptId = MAGE_NO_SCRIPT;
	isInputTrapped = false;

	// empties out the commandAliases and frees the memory?
	commandAliases.clear();
	commandAliases.rehash(0);

	// empties out the registeredCommands and frees the memory?
	registeredCommands.clear();
	registeredCommands.shrink_to_fit();

	// if reset has been run, you're probably on a new map
	// so don't show the postDialogBuffer contents,
	// but we do need to show the commandResponse and dialog
	// strings provided just before loading to the new map
	postDialogBuffer = "";
	sendBufferedOutput();
}

void MageCommandControl::sendBufferedOutput() {
	std::vector<std::string*> bufferedStrings {
		&commandResponseBuffer,
		&serialDialogBuffer,
		&postDialogBuffer
	};
	bool anyOutput = false;
	for(auto currentString : bufferedStrings) {
		if(currentString->length()) {
			EngineSendSerialMessage(
				currentString->c_str()
			);
			*currentString = "";
			anyOutput = true;
		}
	}
	if(anyOutput) {
		EngineSendSerialMessage(
			"\n> "
		);
	}
}
