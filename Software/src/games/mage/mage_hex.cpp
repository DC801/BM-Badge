#include "mage_hex.h"

uint8_t *hexEditorState = &led_states[LED_HAX];
void toggle_hex_editor()
{
	ledSet(
		LED_HAX,
		*hexEditorState ? 0x00 : 0xff
	);
}
bool dialog_open = false;
uint8_t bytes_per_page = 64;
uint8_t hex_rows = 0;
uint16_t mem_total = 0;
uint16_t mem_page = 0;
uint16_t mem_pages = 0;
uint16_t hex_cursor = 0;

void toggle_dialog () {
	dialog_open = !dialog_open;
	// bytes_per_page = (bytes_per_page % 192) + BYTES_PER_ROW;
}

void update_hex_lights() {
	/* Need to update once entities are working again: -Tim
	const uint8_t currentByte = *(((uint8_t *) currentMapEntities) + hex_cursor);
	ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
	*/
}


HEX_OPS currentOp = HEX_OPS_XOR;

void runHex (uint8_t value) {
	/* Need to update once entities are working again: -Tim
	uint8_t *currentByte = (((uint8_t *) currentMapEntities) + hex_cursor);
	uint8_t changedValue = *currentByte;
	switch (currentOp) {
		case HEX_OPS_XOR: changedValue ^= value; break;
		case HEX_OPS_ADD: changedValue += value; break;
		case HEX_OPS_SUB: changedValue -= value; break;
		default: break;
	}
	*currentByte = changedValue;
	*/
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
	ledSet(LED_PAGE, EngineInput_Buttons.op_page ? 0xFF : 0x00);
	if (EngineInput_Activated.hax) { toggle_hex_editor(); }
	if (EngineInput_Activated.op_xor) { set_hex_op(HEX_OPS_XOR); }
	if (EngineInput_Activated.op_add) { set_hex_op(HEX_OPS_ADD); }
	if (EngineInput_Activated.op_sub) { set_hex_op(HEX_OPS_SUB); }
	if (EngineInput_Activated.bit_128) { runHex(0b10000000); }
	if (EngineInput_Activated.bit_64 ) { runHex(0b01000000); }
	if (EngineInput_Activated.bit_32 ) { runHex(0b00100000); }
	if (EngineInput_Activated.bit_16 ) { runHex(0b00010000); }
	if (EngineInput_Activated.bit_8  ) { runHex(0b00001000); }
	if (EngineInput_Activated.bit_4  ) { runHex(0b00000100); }
	if (EngineInput_Activated.bit_2  ) { runHex(0b00000010); }
	if (EngineInput_Activated.bit_1  ) { runHex(0b00000001); }
	if (EngineInput_Activated.ljoy_center) { toggle_dialog(); }
}

bool anyHexMovement = false;
uint8_t delay = 0;
void update_hex_editor()
{
	/* Need to update once entities are working again: -Tim
	bytes_per_page = dialog_open ? 64 : 192;
	hex_rows = ceil((0.0 + bytes_per_page) / (0.0 + BYTES_PER_ROW));
	mem_total = *dataMemoryAddresses.entityCount * sizeof(MageEntity);
	mem_pages = ceil((0.0 + mem_total) / (0.0 + bytes_per_page));
	if (!delay)
	{
		anyHexMovement = (
			EngineInput_Buttons.ljoy_left ||
			EngineInput_Buttons.ljoy_right ||
			EngineInput_Buttons.ljoy_up ||
			EngineInput_Buttons.ljoy_down ||
			EngineInput_Buttons.rjoy_left ||
			EngineInput_Buttons.rjoy_right ||
			EngineInput_Buttons.rjoy_up ||
			EngineInput_Buttons.rjoy_down
		);
		if (EngineInput_Buttons.op_page)
		{
			if (
				EngineInput_Buttons.ljoy_up
				|| EngineInput_Buttons.rjoy_up
				|| EngineInput_Buttons.ljoy_left
				|| EngineInput_Buttons.rjoy_left
			)
			{
				mem_page = (mem_page + mem_pages - 1) % mem_pages;
			}
			if (
				EngineInput_Buttons.ljoy_down
				|| EngineInput_Buttons.rjoy_down
				|| EngineInput_Buttons.ljoy_right
				|| EngineInput_Buttons.rjoy_right
			)
			{
				mem_page = (mem_page + 1) % mem_pages;
			}
		}
		else
		{
			if (EngineInput_Buttons.ljoy_left || EngineInput_Buttons.rjoy_left)
			{
				hex_cursor = (hex_cursor + mem_total - 1) % mem_total;
			}
			if (EngineInput_Buttons.ljoy_right || EngineInput_Buttons.rjoy_right)
			{
				hex_cursor = (hex_cursor + 1) % mem_total;
			}
			if (EngineInput_Buttons.ljoy_up || EngineInput_Buttons.rjoy_up)
			{
				hex_cursor = (hex_cursor + mem_total - BYTES_PER_ROW) % mem_total;
			}
			if (EngineInput_Buttons.ljoy_down || EngineInput_Buttons.rjoy_down)
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
	*/
}
void render_hex_header()
{
	/* Need to update once entities are working again: -Tim
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
		0
	);
	uint16_t u2Value = *(uint16_t *) ((uint8_t *) currentMapEntities + (hex_cursor - (hex_cursor % 2)));
	sprintf(
		headerString,
		"%s | uint8: %03d | uint16: %05d\n"
		"string output: %s",
		endian_label,
		*((uint8_t *) currentMapEntities + hex_cursor),
		u2Value,
		(uint8_t *) currentMapEntities + hex_cursor
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		BYTE_OFFSET_X,
		BYTE_FOOTER_OFFSET_Y + (BYTE_HEIGHT * (hex_rows + 2))
	);
	*/
}

void get_hex_string_for_byte (uint8_t byte, char* outputString)
{
	sprintf(outputString,"%02X", byte);
}

void render_hex_editor()
{
	/* Need to update once entities are working again: -Tim
	char currentByteString[2];
	if ((hex_cursor / bytes_per_page) == mem_page)
	{
		mage_canvas->fillRect(
			(hex_cursor % bytes_per_page % BYTES_PER_ROW) * BYTE_WIDTH + BYTE_OFFSET_X + BYTE_CURSOR_OFFSET_X,
			(hex_cursor % bytes_per_page / BYTES_PER_ROW) * BYTE_HEIGHT + BYTE_OFFSET_Y + BYTE_CURSOR_OFFSET_Y,
			BYTE_WIDTH,
			BYTE_HEIGHT,
			0x38ff
		);
	}
	render_hex_header();
	for(
		uint16_t i = 0;
		(
			i < bytes_per_page
			&& (i + (mem_page * bytes_per_page)) < mem_total
		);
		i++
	)
	{
		get_hex_string_for_byte(
			*(((uint8_t *) currentMapEntities) + (i + (mem_page * bytes_per_page))),
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
	*/
}
