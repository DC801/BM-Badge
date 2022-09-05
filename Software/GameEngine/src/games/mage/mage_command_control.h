#ifndef GAMEENGINE_MAGE_COMMAND_CONTROL_H
#define GAMEENGINE_MAGE_COMMAND_CONTROL_H
#include "mage_defines.h"
#include "EngineROM.h"
#include "mage_game_control.h"
#include "mage_script_control.h"

#define COMMAND_NO_CONNECT_DIALOG_ID 0xFFFF

enum MageSerialCommands : uint8_t {
	COMMAND_NONE = 0,
	COMMAND_HELP = 1,
	COMMAND_LOOK = 2,
	COMMAND_GO = 3,
	COMMAND_GET = 4,
	COMMAND_DROP = 5,
	COMMAND_INVENTORY = 6,
	COMMAND_USE = 7,
	NUM_SERIAL_COMMANDS
} ;

enum MageSerialDialogResponseTypes : uint8_t {
	RESPONSE_NONE = 0,
	RESPONSE_ENTER_NUMBER = 1,
	RESPONSE_ENTER_STRING = 2,
	NUM_RESPONSE_TYPES
} ;

struct MageSerialDialog
{
	char name[32];
	uint16_t stringId;
	MageSerialDialogResponseTypes serialResponseType;
	uint8_t responseCount;
};

 struct MageSerialDialogResponse
 {
	uint16_t stringId;
	uint16_t scriptId;
};

class MageCommandControl {
	public:
		MageCommandControl(MageGameEngine*  gameEngine) noexcept
			: gameEngine(gameEngine)
		{
			// EngineSendSerialMessage(
			// 	"Hello there, the Command Goats are listening for commands.\n"
			// );

		}

		std::string commandResponseBuffer;
		std::string serialDialogBuffer;
		std::string postDialogBuffer;
		MageSerialDialog serialDialog = {};
		std::unique_ptr<MageSerialDialogResponse[]> serialDialogResponses = {};
		int32_t jumpScriptId = MAGE_NO_SCRIPT;
		uint16_t connectSerialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		uint16_t serialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		MageSerialCommands lastCommandUsed = COMMAND_NONE;
		bool isInputTrapped = false;
		void handleStart();
		void processCommand(char *commandString);
		void processCommandAsVerb(std::string input);
		void processCommandAsResponseInput(std::string input);
		void showSerialDialog(uint16_t serialDialogId);
		uint32_t size();
		void reset();
		void sendBufferedOutput();
private:
	MageGameEngine*  gameEngine;

	void badAsciiLowerCase(std::string* data)
	{
		size_t length = data->size();
		for (size_t i = 0; i < length; i++)
		{
			(*data)[i] = std::tolower((*data)[i]);
		}
	}
};

#endif //GAMEENGINE_MAGE_COMMAND_CONTROL_H
