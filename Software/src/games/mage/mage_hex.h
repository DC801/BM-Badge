#ifndef _MAGE_HEX_H
#define _MAGE_HEX_H

#include "mage.h"
#include "../../modules/led.h"
#include "../../../fonts/Monaco9.h"
#include "../../../fonts/DeterminationMono.h"
#include "../../../fonts/Scientifica.h"
#include "FrameBuffer.h"

extern FrameBuffer *mage_canvas;

extern uint8_t *hexEditorState;
extern void toggle_hex_editor();
extern void update_hex_editor();
extern void render_hex_editor();

#endif //_MAGE_HEX_H
