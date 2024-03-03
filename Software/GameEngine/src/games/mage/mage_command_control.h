#ifndef GAMEENGINE_MAGE_COMMAND_CONTROL_H
#define GAMEENGINE_MAGE_COMMAND_CONTROL_H
#include "mage_defines.h"
#include <vector>
#include <unordered_map>

#define COMMAND_NO_CONNECT_DIALOG_ID 0xFFFF

typedef enum : uint8_t {
	COMMAND_NONE = 0,
	COMMAND_HELP = 1,
	COMMAND_LOOK = 2,
	COMMAND_GO = 3,
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
	uint16_t scriptId;
} MageSerialDialogResponse;

typedef struct {
	std::string combinedString;
	uint16_t commandStringId;
	uint16_t argumentStringId;
	uint16_t scriptId;
	bool isFail;
	bool isVisible;
} MageSerialDialogCommand;

class MageCommandControl {
	public:
		std::string commandResponseBuffer;
		std::string serialDialogBuffer;
		std::string postDialogBuffer;
		MageSerialDialog serialDialog = {};
		std::unique_ptr<MageSerialDialogResponse[]> serialDialogResponses = {};
		std::vector<MageSerialDialogCommand> registeredCommands = {};
		std::unordered_map<std::string, std::string> commandAliases = {};
		int32_t jumpScriptId = MAGE_NO_SCRIPT;
		uint16_t connectSerialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		uint16_t serialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		MageSerialCommands lastCommandUsed = COMMAND_NONE;
		bool isInputTrapped = false;
		bool isInputEnabled = true;
		MageCommandControl();
		void handleStart();
		void processCommand(const char *commandString);
		void processInputAsCommand(std::string input);
		std::string aliasLookup(std::string& input);
		void processInputAsTrappedResponse(const std::string& input);
		void cancelTrap();
		void showSerialDialog(
			uint16_t serialDialogId,
			bool disableNewline = false,
			uint8_t selfId = NO_PLAYER
		);
		void registerCommand(
			uint16_t commandStringId,
			uint16_t scriptId,
			bool isFail
		);
		void registerArgument(
			uint16_t commandStringId,
			uint16_t argumentStringId,
			uint16_t scriptId
		);
		void unregisterCommand(
			uint16_t commandStringId,
			bool isFail
		);
		void unregisterArgument(
			uint16_t commandStringId,
			uint16_t argumentStringId
		);
		void registerCommandAlias(
			uint16_t commandStringId,
			uint16_t aliasStringId
		);
		void debugAliases();
		void unregisterCommandAlias(
			uint16_t commandStringId,
			uint16_t aliasStringId
		);
		void setCommandVisibility(
			uint16_t commandStringId,
			bool isVisible
		);
		MageSerialDialogCommand* searchForCommand(
			const std::string& verb,
			const std::string& subject
		);
		uint32_t size();
		void reset();
		void sendBufferedOutput();

		int32_t getCommandIndex(const std::string &combinedString, bool isFail, bool useFail);
};

#endif //GAMEENGINE_MAGE_COMMAND_CONTROL_H
