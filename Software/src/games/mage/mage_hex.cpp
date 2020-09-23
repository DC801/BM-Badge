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
			"THE SYSTEM IS DOWN",
			practical8pt7b,
			0xffff,
			16,
			16
		);
	}
}
