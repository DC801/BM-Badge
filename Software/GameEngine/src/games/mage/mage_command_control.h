#ifndef GAMEENGINE_MAGE_COMMAND_CONTROL_H
#define GAMEENGINE_MAGE_COMMAND_CONTROL_H
#include <stdint.h>

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

class MageCommandControl {
	public:
		MageSerialCommands lastCommandUsed = COMMAND_NONE;
		MageCommandControl();
		static void handleStart();
		void processCommand(char *commandString);
		uint32_t size();
};

#endif //GAMEENGINE_MAGE_COMMAND_CONTROL_H
