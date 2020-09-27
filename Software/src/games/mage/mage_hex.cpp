#include "mage_hex.h"

uint8_t *hexEditorState = &led_states[LED_HAX];
void toggle_hex_editor()
{
	ledSet(
		LED_HAX,
		*hexEditorState ? 0x00 : 0xff
	);
}

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


HEX_OPS currentOp = HEX_OPS_XOR;

void runHex (uint8_t value) {
	uint8_t *currentByte = (((uint8_t *) currentMapEntities) + hex_cursor);
	uint8_t changedValue = *currentByte;
	switch (currentOp) {
		case HEX_OPS_XOR: changedValue ^= value; break;
		case HEX_OPS_ADD: changedValue += value; break;
		case HEX_OPS_SUB: changedValue -= value; break;
		default: break;
	}
	*currentByte = changedValue;
}

void set_hex_op (enum HEX_OPS op) {
	currentOp = op;
	uint8_t led_op_xor = 0x00;
	uint8_t led_op_add = 0x00;
	uint8_t led_op_sub = 0x00;
	switch (op) {
		case HEX_OPS_XOR: led_op_xor = 0xFF; break;
		case HEX_OPS_ADD: led_op_add = 0xFF; break;
		case HEX_OPS_SUB: led_op_sub = 0xFF; break;
		default: break;
	}
	ledSet(LED_XOR, led_op_xor);
	ledSet(LED_ADD, led_op_add);
	ledSet(LED_SUB, led_op_sub);
}

#define BITS 8
#define BITS_BUTTONS_OFFSET 4
void apply_input_to_hex_state() {
	ledSet(LED_PAGE, buttons.op_page ? 0xFF : 0x00);
	if (activated.hax) { toggle_hex_editor(); }
	if (activated.op_xor) { set_hex_op(HEX_OPS_XOR); }
	if (activated.op_add) { set_hex_op(HEX_OPS_ADD); }
	if (activated.op_sub) { set_hex_op(HEX_OPS_SUB); }
	if (activated.bit_128) { runHex(0b10000000); }
	if (activated.bit_64 ) { runHex(0b01000000); }
	if (activated.bit_32 ) { runHex(0b00100000); }
	if (activated.bit_16 ) { runHex(0b00010000); }
	if (activated.bit_8  ) { runHex(0b00001000); }
	if (activated.bit_4  ) { runHex(0b00000100); }
	if (activated.bit_2  ) { runHex(0b00000010); }
	if (activated.bit_1  ) { runHex(0b00000001); }
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

void get_hex_string_for_byte (uint8_t byte, char* outputString)
{
	sprintf(outputString,"%02X", byte);
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
		get_hex_string_for_byte(
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
