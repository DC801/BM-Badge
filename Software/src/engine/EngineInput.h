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
	bool ljoy_left;
	bool ljoy_down;
	bool ljoy_up;
	bool ljoy_right;
	bool rjoy_center;
	bool rjoy_left;
	bool rjoy_down;
	bool rjoy_up;
	bool rjoy_right;
	bool hax;
} ButtonStates;

extern ButtonStates EngineInput_Buttons;
extern ButtonStates EngineInput_Activated;
extern bool *buttonBoolPointerArray[KEYBOARD_NUM_KEYS];

void EngineHandleInput();
bool EngineIsRunning();

#ifdef __cplusplus
}
#endif

#endif