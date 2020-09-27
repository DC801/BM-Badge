#include "mage_hex.h"

uint8_t *hexEditorState = &led_states[LED_HAX];
void toggle_hex_editor()
{
	ledSet(
		LED_HAX,
		*hexEditorState ? 0x00 : 0xff
	);
}

#define BYTES_PER_PAGE 192
#define BYTES_PER_ROW 16
#define BYTE_OFFSET_X 12
#define BYTE_OFFSET_Y 40
#define BYTE_WIDTH 19
#define BYTE_HEIGHT 14
#define BYTE_CURSOR_OFFSET_X -4
#define BYTE_CURSOR_OFFSET_Y 5
#define HEX_TICK_DELAY 7

uint16_t mem_total = 0;
uint16_t mem_page = 0;
uint16_t mem_pages = 0;
uint16_t hex_cursor = 0;

void update_hex_lights() {
	const uint8_t currentByte = *(((uint8_t *) currentMapEntities) + hex_cursor);
	ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
}

void getHexStringForByte (uint8_t byte, char* outputString) {
	sprintf(outputString,"%02X", byte);
}

bool anyHexMovement = false;
uint8_t delay = 0;
void update_hex_editor()
{
	mem_total = *dataMemoryAddresses.entityCount * sizeof(MageEntity);
	mem_pages = ceil((0.0 + mem_total) / (0.0 + BYTES_PER_PAGE));
	if (!delay)
	{
		anyHexMovement = (
			buttons.ljoy_left ||
			buttons.ljoy_right ||
			buttons.ljoy_up ||
			buttons.ljoy_down ||
			buttons.rjoy_left ||
			buttons.rjoy_right ||
			buttons.rjoy_up ||
			buttons.rjoy_down
		);
		if (buttons.op_page)
		{
			if (
				buttons.ljoy_up
				|| buttons.rjoy_up
				|| buttons.ljoy_left
				|| buttons.rjoy_left
			)
			{
				mem_page = (mem_page + mem_pages - 1) % mem_pages;
			}
			if (
				buttons.ljoy_down
				|| buttons.rjoy_down
				|| buttons.ljoy_right
				|| buttons.rjoy_right
			)
			{
				mem_page = (mem_page + 1) % mem_pages;
			}
		}
		else
		{
			if (buttons.ljoy_left || buttons.rjoy_left)
			{
				hex_cursor = (hex_cursor + mem_total - 1) % mem_total;
			}
			if (buttons.ljoy_right || buttons.rjoy_right)
			{
				hex_cursor = (hex_cursor + 1) % mem_total;
			}
			if (buttons.ljoy_up || buttons.rjoy_up)
			{
				hex_cursor = (hex_cursor + mem_total - BYTES_PER_ROW) % mem_total;
			}
			if (buttons.ljoy_down || buttons.rjoy_down)
			{
				hex_cursor = (hex_cursor + BYTES_PER_ROW) % mem_total;
			}
		}
		if (anyHexMovement) {
			delay = HEX_TICK_DELAY;
		}
	}
	else
	{
		delay--;
	}
}
void render_hex_header()
{
	char headerString[128];
	sprintf(
		headerString,
		"CurrentPage: %03u              CurrentByte: 0x%04x\n"
		    "TotalPages:  %03u   Entities: %05u    Mem: 0x%04x",
		mem_page,
		hex_cursor,
		mem_pages,
		*dataMemoryAddresses.entityCount,
		mem_total
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		BYTE_OFFSET_X,
		4
	);
}

void render_hex_editor()
{
	char currentByteString[2];
	render_hex_header();
	if ((hex_cursor / BYTES_PER_PAGE) == mem_page)
	{
		mage_canvas->fillRect(
			(hex_cursor % BYTES_PER_PAGE % BYTES_PER_ROW) * BYTE_WIDTH + BYTE_OFFSET_X + BYTE_CURSOR_OFFSET_X,
			(hex_cursor % BYTES_PER_PAGE / BYTES_PER_ROW) * BYTE_HEIGHT + BYTE_OFFSET_Y + BYTE_CURSOR_OFFSET_Y,
			BYTE_WIDTH,
			BYTE_HEIGHT,
			0x38ff
		);
	}
	for(
		uint16_t i = 0;
		(
			i < BYTES_PER_PAGE
			&& (i + (mem_page * BYTES_PER_PAGE)) < mem_total
		);
		i++
	)
	{
		getHexStringForByte(
			*(((uint8_t *) currentMapEntities) + (i + (mem_page * BYTES_PER_PAGE))),
			currentByteString
		);
		mage_canvas->printMessage(
			currentByteString,
			Monaco9,
			0xffff,
			(i % BYTES_PER_ROW) * BYTE_WIDTH + BYTE_OFFSET_X,
			(i / BYTES_PER_ROW) * BYTE_HEIGHT + BYTE_OFFSET_Y
		);
	}
}
