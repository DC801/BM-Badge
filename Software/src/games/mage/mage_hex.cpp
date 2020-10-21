#include "mage_hex.h"

bool MageHexEditor::getHexEditorState()
{
	return hexEditorState;
}

void MageHexEditor::toggleHexEditor()
{
	hexEditorState = !hexEditorState;
	//set LED to the state 
	ledSet(LED_HAX, hexEditorState ? 0x00 : 0xff);
}

void MageHexEditor::toggleHexDialog()
{
	dialog_open = !dialog_open;
	// bytes_per_page = (bytes_per_page % 192) + HEXED_BYTES_PER_ROW;
}

void MageHexEditor::setHexOp (enum HEX_OPS op)
{
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

void MageHexEditor::applyInputToHexState()
{
	ledSet(LED_PAGE, EngineInput_Buttons.op_page ? 0xFF : 0x00);
	if (EngineInput_Activated.hax) { toggleHexEditor(); }
	if (EngineInput_Activated.op_xor) { setHexOp(HEX_OPS_XOR); }
	if (EngineInput_Activated.op_add) { setHexOp(HEX_OPS_ADD); }
	if (EngineInput_Activated.op_sub) { setHexOp(HEX_OPS_SUB); }
	if (EngineInput_Activated.bit_128) { runHex(0b10000000); }
	if (EngineInput_Activated.bit_64 ) { runHex(0b01000000); }
	if (EngineInput_Activated.bit_32 ) { runHex(0b00100000); }
	if (EngineInput_Activated.bit_16 ) { runHex(0b00010000); }
	if (EngineInput_Activated.bit_8  ) { runHex(0b00001000); }
	if (EngineInput_Activated.bit_4  ) { runHex(0b00000100); }
	if (EngineInput_Activated.bit_2  ) { runHex(0b00000010); }
	if (EngineInput_Activated.bit_1  ) { runHex(0b00000001); }
	if (EngineInput_Activated.ljoy_center) { toggleHexDialog(); }
}

void MageHexEditor::updateHexLights()
{
	const uint8_t currentByte = *(((uint8_t *) hackableDataAddress) + hex_cursor);
	ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
}

void MageHexEditor::updateHexEditor()
{
	static uint8_t hexTickDelay = 0;
	bytes_per_page = dialog_open ? 64 : 192;
	hex_rows = ceil((0.0 + bytes_per_page) / (0.0 + HEXED_BYTES_PER_ROW));
	mem_total = MageGame->Map().EntityCount() * sizeof(MageEntity);
	mem_pages = ceil((0.0 + mem_total) / (0.0 + bytes_per_page));
	if (!hexTickDelay)
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
				hex_cursor = (hex_cursor + mem_total - HEXED_BYTES_PER_ROW) % mem_total;
			}
			if (EngineInput_Buttons.ljoy_down || EngineInput_Buttons.rjoy_down)
			{
				hex_cursor = (hex_cursor + HEXED_BYTES_PER_ROW) % mem_total;
			}
		}
		if (anyHexMovement) {
			hexTickDelay = HEXED_TICK_DELAY;
		}
	}
	else
	{
		hexTickDelay--;
	}
}

void MageHexEditor::get_hex_string_for_byte (uint8_t byte, char* outputString)
{
	sprintf(outputString,"%02X", byte);
}

void MageHexEditor::renderHexHeader()
{
	char headerString[128];
	sprintf(
		headerString,
		"CurrentPage: %03u              CurrentByte: 0x%04x\n"
		    "TotalPages:  %03u   Entities: %05u    Mem: 0x%04x",
		mem_page,
		hex_cursor,
		mem_pages,
		MageGame->Map().EntityCount(),
		mem_total
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		HEXED_BYTE_OFFSET_X,
		0
	);
	uint16_t u2Value = *(uint16_t *) ((uint8_t *) hackableDataAddress + (hex_cursor - (hex_cursor % 2)));
	sprintf(
		headerString,
		"%s | uint8: %03d | uint16: %05d\n"
		"string output: %s",
		endian_label,
		*((uint8_t *) hackableDataAddress + hex_cursor),
		u2Value,
		(uint8_t *) hackableDataAddress + hex_cursor
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		HEXED_BYTE_OFFSET_X,
		HEXED_BYTE_FOOTER_OFFSET_Y + (HEXED_BYTE_HEIGHT * (hex_rows + 2))
	);
}

void MageHexEditor::renderHexEditor()
{
	char currentByteString[2];
	if ((hex_cursor / bytes_per_page) == mem_page)
	{
		mage_canvas->fillRect(
			(hex_cursor % bytes_per_page % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
			(hex_cursor % bytes_per_page / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
			HEXED_BYTE_WIDTH,
			HEXED_BYTE_HEIGHT,
			0x38ff
		);
	}
	renderHexHeader();
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
			*(((uint8_t *) hackableDataAddress) + (i + (mem_page * bytes_per_page))),
			currentByteString
		);

		//this bit will color the playerEntity differently than the other entities in the hex editor:
		uint32_t font_color = 0xffff;
		if(MageGame->playerEntityIndex != NO_PLAYER)
		{
			if(
				( (i + (mem_page * bytes_per_page)) >= (MageGame->playerEntityIndex * sizeof(MageEntity)) ) &&
				( (i + (mem_page * bytes_per_page)) <  ((MageGame->playerEntityIndex+1) * sizeof(MageEntity)) )
			)
			{
				font_color = 0xfc10;
			}
		}

		//print the byte:
		mage_canvas->printMessage(
			currentByteString,
			Monaco9,
			font_color,
			(i % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X,
			(i / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y
		);
	}
}

void MageHexEditor::runHex(uint8_t value)
{
	uint8_t *currentByte = (((uint8_t *) hackableDataAddress) + hex_cursor);
	uint8_t changedValue = *currentByte;
	switch (currentOp) {
		case HEX_OPS_XOR: changedValue ^= value; break;
		case HEX_OPS_ADD: changedValue += value; break;
		case HEX_OPS_SUB: changedValue -= value; break;
		default: break;
	}
	*currentByte = changedValue;
}
