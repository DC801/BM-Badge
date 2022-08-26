#include "mage_command_control.h"
#include "mage_game_control.h"
#include "mage_script_control.h"
#include "EngineROM.h"
#include "EngineSerial.h"
#include <vector>

extern std::unique_ptr<MageGameControl> MageGame;
extern std::unique_ptr<MageScriptControl> MageScript;

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

void MageCommandControl::processCommand(char *commandString) {
	std::string lowercasedInput = commandString;
	badAsciiLowerCase(&lowercasedInput);
	if (!isInputTrapped) {
		processCommandAsVerb(lowercasedInput);
	} else {
		processCommandAsResponseInput(lowercasedInput);
	}
}

void MageCommandControl::processCommandAsVerb(std::string input) {
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
	) {
		size_t index = input.find_first_of(" ");
		word = input.substr(0,index);
		input = input.substr(index+1, input.length());
		if (word.length() == 0) {
			// skip space
			continue;
		}

		wordCount++;
		if (wordCount == 1) {
			verb.append(word);
		} else if (wordCount == 2) {
			subject.append(word);
		} else {
			// only cases could be wordCount > 2
			syntaxValid = false;
		}
	}

	if (syntaxValid) {
		std::string message = "Verb: " + verb;
		if (subject.length() == 0) {
			message += "\n";
		} else {
			message += " | Subject: " + subject + "\n";
		}
		commandResponseBuffer += message;
	} else if (!syntaxValid) {
		commandResponseBuffer += (
			"Invalid command! Commands are exactly one or two words.\n"
			"Examples: help | look | look $ITEM | go $DIRECTION\n"
		);
		return;
	}

	if(verb == "help") {
		// I sure thought `lastCommandUsed` & the `MageSerialCommands` enum
		// would be really useful earlier, but I can't remember why now.
		lastCommandUsed = COMMAND_HELP;
		commandResponseBuffer += (
			"Supported Verbs:\n"
			"\thelp\tlook\tgo\n"
		);
	}
	else if(verb == "look") {
		lastCommandUsed = COMMAND_LOOK;
		commandResponseBuffer += (
			"You try to look.\n"
		);
		MageScript->initScriptState(
			&MageScript->resumeStates.commandLook,
			MageGame->Map().onLook,
			true
		);
		std::string directionNames = MageGame->Map().getDirectionNames();
		if(directionNames.length() > 0) {
			postDialogBuffer += "Exits are:\n";
			postDialogBuffer += directionNames;
			postDialogBuffer += "\n";
		}
	}
	else if(verb == "go") {
		lastCommandUsed = COMMAND_GO;
		if(!subject.length()) {
			commandResponseBuffer += (
				"You cannot `go` nowhere. Pick a direction.\n"
			);
		} else {
			subject = subject.substr (0, MAP_GO_DIRECTION_NAME_LENGTH);
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
					&MageScript->resumeStates.commandGo,
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
	else if(input == "feed goat") {
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
		commandResponseBuffer = "Unrecognized Verb: " + verb + "\n";
	}
}

void MageCommandControl::processCommandAsResponseInput(std::string input) {
	commandResponseBuffer += "processCommandAsResponseInput: " + input + "\n";
	MageSerialDialogResponseTypes responseType = serialDialog.serialResponseType;
	if (responseType == RESPONSE_ENTER_NUMBER) {
		int responseIndex;
		bool errorWhileParsingInt = false;
		try {
			responseIndex = std::stoi(input);
		} catch(std::exception &err) {
			errorWhileParsingInt = true;
		}
		if (
			!errorWhileParsingInt
			&& responseIndex >= 0
			&& responseIndex < (serialDialog.responseCount)
		) {
			MageSerialDialogResponse *response = &serialDialogResponses[responseIndex];
			std::string responseLabel = MageGame->getString(response->stringId, NO_PLAYER);
			commandResponseBuffer += (
				"Valid response: " +
				input + " - " +
				responseLabel + "\n"
			);
			jumpScriptId = response->scriptId;
			isInputTrapped = false;
		} else {
			commandResponseBuffer += "Invalid response: " + input + "\n";
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
				commandResponseBuffer += "Valid response: " + input + "\n";
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

void MageCommandControl::showSerialDialog(uint16_t _serialDialogId) {
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
		NO_PLAYER
	);
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
		+ sizeof(serialDialog)
		+ sizeof(serialDialogResponses)
		+ sizeof(jumpScriptId)
		+ sizeof(connectSerialDialogId)
		+ sizeof(serialDialogId)
		+ sizeof(lastCommandUsed)
		+ sizeof(isInputTrapped)
	);
}

void MageCommandControl::reset() {
	jumpScriptId = MAGE_NO_SCRIPT;
	isInputTrapped = false;
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
			"> "
		);
	}
}
