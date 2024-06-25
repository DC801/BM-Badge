#include <string>
#include <regex>
#include "EngineSerial.h"
//#include "FrameBuffer.h"
//#include "fonts/Monaco9.h"

#ifdef DC801_DESKTOP
#include <cstdio>
#endif

#ifndef WIN32
#include <unistd.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

char command_buffer[COMMAND_BUFFER_SIZE];
uint16_t command_buffer_length = 0;
bool was_serial_started = false;
bool was_command_entered = false;
void (*on_start_function_pointer)() = nullptr;
void (*on_command_function_pointer)(char *commandString) = nullptr;


#ifdef DC801_DESKTOP
#define FILE_DESCRIPTOR_STDIN 0
void EngineInputDesktopGetCommandStringFromStandardIn ()
{
	memset(
		command_buffer,
		0,
		COMMAND_BUFFER_SIZE
	);
#ifndef WIN32
	fcntl(FILE_DESCRIPTOR_STDIN, F_SETFL, fcntl(0, F_GETFL) | O_NONBLOCK);
	ssize_t bytes_read = read(
		FILE_DESCRIPTOR_STDIN,
		command_buffer,
		COMMAND_BUFFER_MAX_READ
	);
	if (bytes_read > 0) {
		// length - 1 to purge the newline character
		command_buffer_length = strlen(command_buffer) - 1;
		command_buffer[command_buffer_length] = 0x00;
		was_command_entered = command_buffer_length > 0;
		/*
		printf(
			"stdin"
			"bytes_read: %d"
			"| value: %d"
			"| char: %c"
			"| command_buffer_length: %d"
			"| string: %s\n",
			bytes_read,
			command_buffer[0],
			command_buffer[0],
			command_buffer_length,
			command_buffer
		);
		*/
	}
#endif
}

#endif

void EngineSendSerialMessage (const char *message)
{
#ifdef DC801_DESKTOP
	printf("%s", message);
	fflush(stdout);
#endif
#ifdef DC801_EMBEDDED
	std::string message_with_crlf = std::regex_replace(
		message,
		std::regex("\n"),
		"\r\n"
	);
	send_serial_message(message_with_crlf.c_str());
#endif
}

void EngineSerialRegisterEventHandlers (
	void (*on_start)(),
	void (*on_command)(char *commandString)
) {
	on_start_function_pointer = on_start;
	on_command_function_pointer = on_command;
}

void EngineHandleSerialInput ()
{
#ifdef DC801_DESKTOP
	EngineInputDesktopGetCommandStringFromStandardIn();
#endif

#ifdef DC801_EMBEDDED
	handle_usb_serial_input();
#endif
	if(was_serial_started) {
		if(on_start_function_pointer != nullptr) {
			on_start_function_pointer();
		}
		was_serial_started = false;
	}
	if(was_command_entered) {
		if(on_command_function_pointer != nullptr) {
			on_command_function_pointer(command_buffer);
		}
		EngineSendSerialMessage("");
		memset(
			command_buffer,
			0,
			command_buffer_length
		);
		command_buffer_length = 0;
		was_command_entered = false;
	}
}

#ifdef __cplusplus
}
#endif
