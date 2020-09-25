#include "mage_hex.h"

uint8_t *hexEditorState = &led_states[LED_HAX];
void toggle_hex_editor()
{
	ledSet(
		LED_HAX,
		*hexEditorState ? 0x00 : 0xff
	);
}

void render_hex_editor()
{
	if (*hexEditorState)
	{
		mage_canvas->printMessage(
			" !\"#$%&'()*+,-./0123456789:;<=>?\n@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\n`abcdefghijklmnopqrstuvwxyz{|}~",
			Monaco9,
			0xffff,
			0,
			16
		);
	}
}
