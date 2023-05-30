#ifndef ENGINE_SERIAL_H
#define ENGINE_SERIAL_H

#include <stdint.h>
#include "shim_serial.h"

void EngineSendSerialMessage (const char *message);
void EngineSerialRegisterEventHandlers (
	void (*on_start)(),
	void (*on_command)(char *commandString)
);
void EngineHandleSerialInput();



#endif