#ifndef GAMEENGINE_MAGE_COMMAND_CONTROL_H
#define GAMEENGINE_MAGE_COMMAND_CONTROL_H

#include <stdint.h>
#include <string>
#include <memory>
#include <optional>
#include "EngineSerial.h"
#include "StringLoader.h"
#include "mage_dialog_control.h"

class MapControl;
class TileManager;
class MageScriptControl;

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
};

class MageCommandControl {
	public:
		MageCommandControl(std::shared_ptr<MapControl> mapControl, std::shared_ptr<TileManager> tileManager, std::shared_ptr<MageScriptControl> scriptControl, std::shared_ptr<StringLoader> stringLoader) noexcept
			: mapControl(mapControl), tileManager(tileManager), scriptControl(scriptControl), stringLoader(stringLoader)
		{}

		std::string commandResponseBuffer;
		std::string serialDialogBuffer;
		std::string postDialogBuffer;
		uint16_t connectSerialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		uint16_t serialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
		MageSerialCommands lastCommandUsed = COMMAND_NONE;
		bool isInputTrapped = false;
		void handleStart();
		void processCommand(std::string& commandString);
		void processCommandAsVerb(std::string& input);
		void processCommandAsResponseInput(std::string& input);
		void showSerialDialog(uint16_t serialDialogId);
		void reset();
		void sendBufferedOutput();
private:
	std::shared_ptr<EngineSerial> serial;
	std::shared_ptr<MapControl> mapControl;
	std::shared_ptr<TileManager> tileManager;
	std::shared_ptr<MageScriptControl> scriptControl;
	std::shared_ptr<StringLoader> stringLoader;

	std::unique_ptr<MageSerialDialog> openSerialDialog{nullptr};

	inline void badAsciiLowerCase(std::string& data)
	{
		for (auto i = 0; i < data.size(); i++)
		{
			data[i] = std::tolower(data[i]);
		}
	}
};

#endif //GAMEENGINE_MAGE_COMMAND_CONTROL_H
