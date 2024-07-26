#ifndef ENGINE_SERIAL_H
#define ENGINE_SERIAL_H

#include <array>
#include <string>
#include <type_traits>
#include "shim_serial.h"
using OnStart = std::add_pointer<void()>::type;
using OnCommand = std::add_pointer<void(const std::string&)>::type;

static inline const auto COMMAND_BUFFER_SIZE = 1024;
static inline const auto  COMMAND_RESPONSE_SIZE = (COMMAND_BUFFER_SIZE + 128);

// always allow for a null termination byte
static inline const auto COMMAND_BUFFER_MAX_READ = (COMMAND_BUFFER_SIZE - 1);

class EngineSerial
{
public:
	EngineSerial(OnStart onStart, OnCommand onCommand)
		: onStart(onStart),
		onCommand(onCommand)
	{}
	void SendMessage(const char* message);
	void HandleInput();
private:
	bool started{ false };
	bool commandEntered{false};
	OnStart onStart;
	OnCommand onCommand;

	std::array<char, COMMAND_BUFFER_SIZE> commandBuffer{ 0 };
};

#endif

