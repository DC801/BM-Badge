#include "mage_command_control.h"
#include "mage_game_control.h"
#include "mage_script_control.h"
#include "EngineSerial.h"

extern MageGameControl *MageGame;
extern MageScriptControl *MageScript;

MageCommandControl::MageCommandControl() {
	printf("Hello there, the Command Goats are listening for commands.\n");
}

void MageCommandControl::handleStart() {
	EngineSendSerialMessage(
		"WELCOME TO MAGE NET\n"
		"   __  ______  _________  _  ____________\n"
		"  /  |/  / _ |/ ___/ __/ / |/ / __/_  __/\n"
		" / /|_/ / __ / (_ / _/  /    / _/  / /   \n"
		"/_/  /_/_/ |_\\___/___/ /_/|_/___/ /_/    \n"
		"\n> "
	);
}

void MageCommandControl::processCommand(char *commandString) {
	// Used to split string around spaces.
	std::string input(commandString);
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
		EngineSendSerialMessage(
			message.c_str()
		);
	} else if (!syntaxValid) {
		EngineSendSerialMessage(
			"Invalid command! Commands are exactly one or two words.\n"
			"Examples: help | look | look $ITEM | go $DIRECTION\n"
		);
		return;
	}

	if(verb == "help") {
		// I sure thought `lastCommandUsed` & the `MageSerialCommands` enum
		// would be really useful earlier, but I can't remember why now.
		lastCommandUsed = COMMAND_HELP;
		EngineSendSerialMessage(
			"Supported Verbs:\n"
			"\thelp\tlook\n"
		);
	} else if(verb == "look") {
		lastCommandUsed = COMMAND_LOOK;
		EngineSendSerialMessage(
			"You try to look.\n"
		);
		MageScript->initScriptState(
			MageScript->getMapLookResumeState(),
			MageGame->Map().getMapLocalMapOnLookScriptId(),
			true
		);
	}
	// start SECRET_GOAT
	else if(verb == "goat") {
		EngineSendSerialMessage(
			"You have found a secret goat!\n"
			"               ##### ####     \n"
			"             ##   #  ##       \n"
			"            #   (-)    #      \n"
			"            #+       ######   \n"
			" FEED ME -  #^             ## \n"
			"             ###           #  \n"
			"               #  #      # #  \n"
			"               ##  ##  ##  #  \n"
			"               ######  #####  \n"
		);
	}
	else if(strcmp(commandString, "feed goat") == 0) {
		EngineSendSerialMessage(
			"You have fed the secret goat!\n"
			"               ##### ####     \n"
			"             ##   #  ##       \n"
			"            #   (-)    #      \n"
			"            #+       ######   \n"
			"   THANK -  #v             ## \n"
			"             ###           #  \n"
			"               #  #      # #  \n"
			"               ##  ##  ##  #  \n"
			"               ######  #####  \n"
		);
	}
	// end SECRET_GOAT
	else {
		std::string message = "Unrecognized Verb: " + verb + "\n";
		EngineSendSerialMessage(
			message.c_str()
		);
	}
}

uint32_t MageCommandControl::size() {
	return (
		0
		+ sizeof(lastCommandUsed)
	);
};
