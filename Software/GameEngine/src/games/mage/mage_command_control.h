#ifndef GAMEENGINE_MAGE_COMMAND_CONTROL_H
#define GAMEENGINE_MAGE_COMMAND_CONTROL_H
#include "mage_defines.h"

#define COMMAND_NO_CONNECT_DIALOG_ID 0xFFFF

typedef enum : uint8_t {
	COMMAND_NONE = 0,
	COMMAND_HELP = 1,
	COMMAND_LOOK = 2,
	COMMAND_GO = 3,
	COMMAND_GET = 4,
	COMMAND_DROP = 5,
	COMMAND_INVENTORY = 6,
	COMMAND_USE = 7,
	NUM_SERIAL_COMMANDS
} MageSerialCommands;

typedef enum : uint8_t {
	RESPONSE_NONE = 0,
	RESPONSE_ENTER_NUMBER = 1,
	RESPONSE_ENTER_STRING = 2,
	NUM_RESPONSE_TYPES
} MageSerialDialogResponseTypes;

typedef struct {
	char name[32];
	uint16_t stringId;
	MageSerialDialogResponseTypes serialResponseType;
	uint8_t responseCount;
} MageSerialDialog;

typedef struct {
	uint16_t stringId;
	uint16_t globalScriptId;
} MageSerialDialogResponse;

class MageCommandControl {
	public:
		std::string commandResponseBuffer;
		std::string serialDialogBuffer;
		std::string postDialogBuffer;
		MageSerialDialog serialDialog = {};
		std::unique_ptr<MageSerialDialogResponse[]> serialDialogResponses = {};
		int32_t globalJumpScriptId = MAGE_NO_SCRIPT;
		uint16_t connectSerialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		uint16_t serialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		MageSerialCommands lastCommandUsed = COMMAND_NONE;
		bool isInputTrapped = false;
		MageCommandControl();
		void handleStart();
		void processCommand(char *commandString);
		void processCommandAsVerb(std::string input);
		void processCommandAsResponseInput(std::string input);
		void showSerialDialog(uint16_t serialDialogId);
		uint32_t size();
		void sendBufferedOutput();
};

#endif //GAMEENGINE_MAGE_COMMAND_CONTROL_H
