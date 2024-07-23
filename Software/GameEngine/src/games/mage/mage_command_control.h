#ifndef MAGE_COMMAND_CONTROL_H
#define MAGE_COMMAND_CONTROL_H

#include <stdint.h>
#include <string>
#include <memory>
#include <optional>
#include "EngineSerial.h"
#include "StringLoader.h"
#include "mage_dialog_control.h"

class MapControl;
class FrameBuffer;
class MageScriptControl;

static inline const auto COMMAND_NO_CONNECT_DIALOG_ID = 0xFFFF;

enum class MageSerialCommand : uint8_t
{
	NONE = 0,
	HELP = 1,
	LOOK = 2,
	GO = 3,
	GET = 4,
	DROP = 5,
	INVENTORY = 6,
	USE = 7
};
inline static const auto NUM_SERIAL_COMMANDS = 8;


inline static const auto MAP_GO_DIRECTION_NAME_LENGTH = 12;

struct MageSerialDialogCommand
{
	std::string combinedString;
	uint16_t commandStringId;
	uint16_t argumentStringId;
	uint16_t scriptId;
	bool isFail;
	bool isVisible;
};

class MageCommandControl
{
public:
	MageCommandControl(std::shared_ptr<MapControl> mapControl, std::shared_ptr<FrameBuffer> frameBuffer, std::shared_ptr<MageScriptControl> scriptControl, std::shared_ptr<StringLoader> stringLoader) noexcept
		: mapControl(mapControl), frameBuffer(frameBuffer), scriptControl(scriptControl), stringLoader(stringLoader)
	{}

	std::string commandResponseBuffer;
	std::string serialDialogBuffer;
	std::string postDialogBuffer;
	uint16_t connectSerialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
	uint16_t serialDialogId = COMMAND_NO_CONNECT_DIALOG_ID;
	MageSerialCommand lastCommandUsed = MageSerialCommand::NONE;
	MageScriptState serialScriptState;
	int32_t getCommandIndex(const std::string& combinedString, bool isFail, bool useFail);
	void handleStart();
	void processCommand(std::string& commandString);
	void processCommandAsVerb(std::string& input);
	void processCommandAsResponseInput(std::string& input);
	void registerArgument(uint16_t commandStringId, uint16_t argumentStringId, uint16_t scriptId);
	void registerCommand(uint16_t commandStringId, uint16_t scriptId, bool isFail);
	void registerCommandAlias(uint16_t commandStringId, uint16_t aliasStringId);
	void showSerialDialog(uint16_t serialDialogId);
	MageSerialDialogCommand* searchForCommand(const std::string& verb, const std::string& subject);	
	void sendBufferedOutput(); 
	void setCommandVisibility(uint16_t commandStringId, bool isVisible);
	void unregisterArgument(uint16_t commandStringId, uint16_t argumentStringId);
	void unregisterCommand(uint16_t commandStringId, bool isFail);
	void unregisterCommandAlias(uint16_t aliasStringId);

	constexpr bool isInputTrapped() const
	{
		return inputTrapped;
	}

	constexpr void cancelTrap()
	{
		inputTrapped = false;
	}
private:
	bool inputTrapped{ false };

	std::shared_ptr<EngineSerial> serial;
	std::shared_ptr<MapControl> mapControl;
	std::shared_ptr<FrameBuffer> frameBuffer;
	std::shared_ptr<MageScriptControl> scriptControl;
	std::shared_ptr<StringLoader> stringLoader;

	std::vector<MageSerialDialogCommand> registeredCommands = {};
	std::unordered_map<std::string, std::string> commandAliases = {};

	std::unique_ptr<const MageSerialDialog> openSerialDialog{ nullptr };

	inline void badAsciiLowerCase(std::string& data)
	{
		// input first, input last, output first, transformation function
		std::transform(data.begin(), data.end(), data.begin(),
			[](unsigned char c) { return std::tolower(c); }
		);
	}
};
#endif //MAGE_COMMAND_CONTROL_H
