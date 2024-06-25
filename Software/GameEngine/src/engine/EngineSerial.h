#ifndef ENGINE_SERIAL_H
#define ENGINE_SERIAL_H

#include <array>
#include <string>
#include <type_traits>
#include "shim_serial.h"
using OnStart = std::add_pointer<void()>::type;
using OnCommand = std::add_pointer<void(const std::string&)>::type;
class EngineSerial
{
public:
	void SendMessage(const std::string& message);
	void HandleInput();
private:
	bool was_command_entered = false;
	OnStart onStart;
	OnCommand onCommand;

	//std::array<char, COMMAND_BUFFER_SIZE> command_buffer{ 0 };
};
#endif