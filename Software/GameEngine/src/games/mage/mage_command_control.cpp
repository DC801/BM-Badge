#include "mage_command_control.h"
#include "mage_game_control.h"
#include "mage_script_control.h"
#include "EngineInput.h"
#include <bits/stdc++.h>

extern MageGameControl *MageGame;
extern MageScriptControl *MageScript;

MageCommandControl::MageCommandControl() {
	printf("Hello there, the Command Goats are listening for commands.\n");
}

void MageCommandControl::handleStart() {
	EngineSendSerialMessage(
		(char*)
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
	std::istringstream wordSeparator(commandString);

	bool syntaxValid = true;
	uint8_t wordCount = 0;
	std::string word;
	std::string verb;
	std::string subject;

	// Traverse through all words
	// while loop till we get
	// strings to store in string word
	while (
		(wordSeparator >> word)
		&& syntaxValid
	) {
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
			(char*) message.c_str()
		);
	} else if (!syntaxValid) {
		EngineSendSerialMessage(
			(char*)
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
			(char*)
			"Supported Verbs:\n"
			"\thelp\tlook\n"
		);
	} else if(verb == "look") {
		lastCommandUsed = COMMAND_LOOK;
		EngineSendSerialMessage(
			(char*)
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
			(char*)
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
			(char*)
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
			(char*) message.c_str()
		);
	}
}

uint32_t MageCommandControl::size() {
	return (
		0
		+ sizeof(lastCommandUsed)
	);
};
