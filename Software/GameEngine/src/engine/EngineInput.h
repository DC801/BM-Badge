#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H
#include "common.h"
#include "modules/keyboard.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
	bool mem0;
	bool mem1;
	bool mem2;
	bool mem3;
	bool bit_128;
	bool bit_64;
	bool bit_32;
	bool bit_16;
	bool bit_8;
	bool bit_4;
	bool bit_2;
	bool bit_1;
	bool op_xor;
	bool op_add;
	bool op_sub;
	bool op_page;
	bool ljoy_center;
	bool ljoy_up;
	bool ljoy_down;
	bool ljoy_left;
	bool ljoy_right;
	bool rjoy_center;
	bool rjoy_up;
	bool rjoy_down;
	bool rjoy_left;
	bool rjoy_right;
	bool hax;
} ButtonStates;

extern ButtonStates EngineInput_Buttons;
extern ButtonStates EngineInput_Activated;
extern ButtonStates EngineInput_Deactivated;
extern bool *buttonBoolPointerArray[KEYBOARD_NUM_KEYS];

#define COMMAND_BUFFER_SIZE 1024
#define COMMAND_RESPONSE_SIZE (COMMAND_BUFFER_SIZE + 128)

// always allow for a null termination byte
#define COMMAND_BUFFER_MAX_READ (COMMAND_BUFFER_SIZE - 1)

extern char command_buffer[COMMAND_BUFFER_SIZE];
extern uint16_t command_buffer_length;
extern bool was_serial_started;
extern bool was_command_entered;

void EngineHandleKeyboardInput();
void EngineSendSerialMessage (char *message);
void EngineSerialRegisterEventHandlers (
	void (*on_start)(),
	void (*on_command)(char *commandString)
);
void EngineHandleSerialInput();
bool EngineIsRunning();
bool EngineShouldReloadGameDat();
void EngineTriggerRomReload();

#ifdef __cplusplus
}
#endif

#endif