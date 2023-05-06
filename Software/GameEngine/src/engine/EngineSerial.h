#ifndef ENGINE_SERIAL_H
#define ENGINE_SERIAL_H

#include <stdint.h>
#include "shim_serial.h"

extern char command_buffer[COMMAND_BUFFER_SIZE];
extern uint16_t command_buffer_length;
extern bool was_serial_started;
extern bool was_command_entered;

void EngineSendSerialMessage (const char *message);
void EngineSerialRegisterEventHandlers (
	void (*on_start)(),
	void (*on_command)(char *commandString)
);
void EngineHandleSerialInput();



#endif