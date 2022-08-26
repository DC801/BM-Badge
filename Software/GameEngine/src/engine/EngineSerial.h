#ifndef ENGINE_SERIAL_H
#define ENGINE_SERIAL_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define COMMAND_BUFFER_SIZE 1024
#define COMMAND_RESPONSE_SIZE (COMMAND_BUFFER_SIZE + 128)

// always allow for a null termination byte
#define COMMAND_BUFFER_MAX_READ (COMMAND_BUFFER_SIZE - 1)

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

#ifdef __cplusplus
}
#endif

#endif