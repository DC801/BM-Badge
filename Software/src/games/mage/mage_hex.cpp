#include "mage_hex.h"

uint8_t *hexEditorState = &led_states[LED_HAX];
void toggle_hex_editor()
{
	ledSet(
		LED_HAX,
		*hexEditorState ? 0x00 : 0xff
	);
}

#define HEX_BYTES 256
#define BYTES_PER_ROW 16
#define BYTE_OFFSET_X 12
#define BYTE_OFFSET_Y 3
#define BYTE_WIDTH 19
#define BYTE_HEIGHT 14
#define BYTE_CURSOR_OFFSET_X -4
#define BYTE_CURSOR_OFFSET_Y 5
#define HEX_TICK_DELAY 5

uint16_t hex_cursor = 0;

void getHexStringForByte (uint8_t byte, char* outputString) {
	sprintf(outputString,"%02X", byte);
}

bool anyHexMovement = false;
uint8_t delay = 0;
void update_hex_editor()
{
	if (!delay)
	{
		anyHexMovement = (
			buttons.ljoy_left ||
			buttons.ljoy_right ||
			buttons.ljoy_up ||
			buttons.ljoy_down
		);
		if (buttons.ljoy_left)
		{
			hex_cursor = (hex_cursor + HEX_BYTES - 1) % HEX_BYTES;
		}
		if (buttons.ljoy_right)
		{
			hex_cursor = (hex_cursor + 1) % HEX_BYTES;
		}
		if (buttons.ljoy_up)
		{
			hex_cursor = (hex_cursor + HEX_BYTES - BYTES_PER_ROW) % HEX_BYTES;
		}
		if (buttons.ljoy_down)
		{
			hex_cursor = (hex_cursor + BYTES_PER_ROW) % HEX_BYTES;
		}
		if (anyHexMovement) {
			delay = HEX_TICK_DELAY;
			// updateHexLights();
		}
	}
	else
	{
		delay--;
	}
}

void render_hex_editor()
{
	mage_canvas->fillRect(
		(hex_cursor % BYTES_PER_ROW) * BYTE_WIDTH + BYTE_OFFSET_X + BYTE_CURSOR_OFFSET_X,
		(hex_cursor / BYTES_PER_ROW) * BYTE_HEIGHT + BYTE_OFFSET_Y + BYTE_CURSOR_OFFSET_Y,
		BYTE_WIDTH,
		BYTE_HEIGHT,
		0x38ff
	);
	for(uint16_t i = 0; i < HEX_BYTES; i++)
	{
		mage_canvas->printMessage(
			"00",
			Monaco9,
			0xffff,
			(i % BYTES_PER_ROW) * BYTE_WIDTH + BYTE_OFFSET_X,
			(i / BYTES_PER_ROW) * BYTE_HEIGHT + BYTE_OFFSET_Y
		);
	}
}
