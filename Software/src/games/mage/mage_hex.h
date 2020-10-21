/*
This class contains all the code related to the hex editor hacking interface.
*/
#ifndef _MAGE_HEX_H
#define _MAGE_HEX_H

#include "mage_defines.h"
#include "mage.h"
#include "mage_game_control.h"
#include "modules/led.h"
#include "fonts/Monaco9.h"
#include "fonts/DeterminationMono.h"
#include "fonts/Scientifica.h"
#include "FrameBuffer.h"

#define HEXED_BYTES_PER_ROW 16
#define HEXED_BYTE_OFFSET_X 12
#define HEXED_BYTE_OFFSET_Y 30
#define HEXED_BYTE_FOOTER_OFFSET_Y 6
#define HEXED_BYTE_WIDTH 19
#define HEXED_BYTE_HEIGHT 14
#define HEXED_BYTE_CURSOR_OFFSET_X -4
#define HEXED_BYTE_CURSOR_OFFSET_Y 5
#define HEXED_TICK_DELAY 7
#define HEXED_DEFAULT_BYTES_PER_PAGE 64

enum HEX_OPS {
	HEX_OPS_XOR,
	HEX_OPS_ADD,
	HEX_OPS_SUB
};

extern FrameBuffer *mage_canvas;
extern std::unique_ptr<MageGameControl> MageGame;
extern MageEntity *hackableDataAddress;

extern uint16_t hex_cursor;
extern uint8_t *hexEditorState;
extern void set_hex_op(enum HEX_OPS op);
extern void apply_input_to_hex_state();
extern void toggle_hex_editor();
extern void update_hex_lights();
extern void update_hex_editor();
extern void render_hex_editor();

#endif //_MAGE_HEX_H
