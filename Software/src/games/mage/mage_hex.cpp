#include "mage_hex.h"

bool MageHexEditor::getHexEditorState()
{
	return hexEditorState;
}

uint16_t MageHexEditor::getMemoryAddress(uint8_t index)
{
	if(index < HEXED_NUM_MEM_BUTTONS)
	{
		return memAddresses[index];
	}
	else
	{
		return memAddresses[0];
	}
	
}

void MageHexEditor::toggleHexEditor()
{
	hexEditorState = !hexEditorState;
	//set LED to the state 
	ledSet(LED_HAX, hexEditorState ? 0xff : 0x00);
}

void MageHexEditor::toggleHexDialog()
{
	dialogOpen = !dialogOpen;
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

void MageHexEditor::setHexCursorLocation(uint16_t address)
{
	hexCursorLocation = address;
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
}

void MageHexEditor::updateHexLights()
{
	const uint8_t currentByte = *(((uint8_t *) hackableDataAddress) + hexCursorLocation);
	ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
}

uint16_t MageHexEditor::getCurrentMemPage()
{
	//assume we're on the first page until we find out otherwise.
	uint16_t memPage = 0;

	//start at the current location.
	int32_t adjustedMem = hexCursorLocation;

	while(adjustedMem >= 0){
		//subtract a page worth of memory from the memory location
		adjustedMem -= bytesPerPage;
		//if the address doesn't get to 0, it must be on a higher page.
		if(adjustedMem >= 0)
		{
			memPage++;
		}
	}
	//once it's <0, that should be the correct mem page:
	return memPage;

}

void MageHexEditor::updateHexEditor()
{
	static uint8_t hexTickDelay = 0;
	bytesPerPage = dialogOpen ? 64 : 192;
	hexRows = ceil((0.0 + bytesPerPage) / (0.0 + HEXED_BYTES_PER_ROW));
	memTotal = MageGame->Map().EntityCount() * sizeof(MageEntity);
	totalMemPages = ceil((0.0 + memTotal) / (0.0 + bytesPerPage));

	//debounce timer check.
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
			//reset last press time only when the page button switches from unpressed to pressed
			if(!previousPageButtonState)
			{
				lastPageButtonPressTime = millis();
			}
			//change the state to show the button has been pressed.
			previousPageButtonState = true;

			//check to see if there is any directional button action while the page button is pressed
			if (
				EngineInput_Buttons.ljoy_up
				|| EngineInput_Buttons.rjoy_up
				|| EngineInput_Buttons.ljoy_left
				|| EngineInput_Buttons.rjoy_left
			)
			{
				currentMemPage = (currentMemPage + totalMemPages - 1) % totalMemPages;
			}
			if (
				EngineInput_Buttons.ljoy_down
				|| EngineInput_Buttons.rjoy_down
				|| EngineInput_Buttons.ljoy_right
				|| EngineInput_Buttons.rjoy_right
			)
			{
				currentMemPage = (currentMemPage + 1) % totalMemPages;
			}
		}
		else
		{
			//check for memory button presses:
			if(EngineInput_Activated.mem0 && getHexEditorState())
			{
				memAddresses[0] = hexCursorLocation;
			}
			if(EngineInput_Activated.mem1 && getHexEditorState())
			{
				memAddresses[1] = hexCursorLocation;
			}
			if(EngineInput_Activated.mem2 && getHexEditorState())
			{
				memAddresses[2] = hexCursorLocation;
			}
			if(EngineInput_Activated.mem3 && getHexEditorState())
			{
				memAddresses[3] = hexCursorLocation;
			}

			//check to see if the page button was pressed and released quickly
			if(
				(previousPageButtonState) && 
				((millis() - lastPageButtonPressTime) < HEXED_QUICK_PRESS_TIMEOUT)
			)
			{
				//if the page button was pressed and then released fast enough, advance one page.
				currentMemPage = (currentMemPage + 1) % totalMemPages;
			}
			//reset this to false:
			previousPageButtonState = false;

			//check directional inputs and move cursor.
			if (EngineInput_Buttons.ljoy_left || EngineInput_Buttons.rjoy_left)
			{
				//move the cursor left:
				hexCursorLocation = (hexCursorLocation + memTotal - 1) % memTotal;
				//change the current page to wherever the cursor is:
				currentMemPage = getCurrentMemPage();
			}
			if (EngineInput_Buttons.ljoy_right || EngineInput_Buttons.rjoy_right)
			{
				//move the cursor right:
				hexCursorLocation = (hexCursorLocation + 1) % memTotal;
				//change the current page to wherever the cursor is:
				currentMemPage = getCurrentMemPage();
			}
			if (EngineInput_Buttons.ljoy_up || EngineInput_Buttons.rjoy_up)
			{
				//move the cursor up:
				hexCursorLocation = (hexCursorLocation + memTotal - HEXED_BYTES_PER_ROW) % memTotal;
				//change the current page to wherever the cursor is:
				currentMemPage = getCurrentMemPage();
			}
			if (EngineInput_Buttons.ljoy_down || EngineInput_Buttons.rjoy_down)
			{
				//move the cursor down:
				hexCursorLocation = (hexCursorLocation + HEXED_BYTES_PER_ROW) % memTotal;
				//change the current page to wherever the cursor is:
				currentMemPage = getCurrentMemPage();
			}
		}
		if (anyHexMovement) {
			hexTickDelay = HEXED_TICK_DELAY;
		}
	}
	//decrement debounce timer
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
		currentMemPage,
		hexCursorLocation,
		totalMemPages,
		MageGame->Map().EntityCount(),
		memTotal
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		HEXED_BYTE_OFFSET_X,
		0
	);
	uint16_t u2Value = *(uint16_t *) ((uint8_t *) hackableDataAddress + (hexCursorLocation - (hexCursorLocation % 2)));
	sprintf(
		headerString,
		"%s | uint8: %03d | uint16: %05d\n"
		"string output: %s",
		endian_label,
		*((uint8_t *) hackableDataAddress + hexCursorLocation),
		u2Value,
		(uint8_t *) hackableDataAddress + hexCursorLocation
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		HEXED_BYTE_OFFSET_X,
		HEXED_BYTE_FOOTER_OFFSET_Y + (HEXED_BYTE_HEIGHT * (hexRows + 2))
	);
}

void MageHexEditor::renderHexEditor()
{
	char currentByteString[2];
	if ((hexCursorLocation / bytesPerPage) == currentMemPage)
	{
		mage_canvas->fillRect(
			(hexCursorLocation % bytesPerPage % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
			(hexCursorLocation % bytesPerPage / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
			HEXED_BYTE_WIDTH,
			HEXED_BYTE_HEIGHT,
			0x38ff
		);
	}
	renderHexHeader();
	for(
		uint16_t i = 0;
		(
			i < bytesPerPage
			&& (i + (currentMemPage * bytesPerPage)) < memTotal
		);
		i++
	)
	{
		get_hex_string_for_byte(
			*(((uint8_t *) hackableDataAddress) + (i + (currentMemPage * bytesPerPage))),
			currentByteString
		);

		//this bit will color the playerEntity differently than the other entities in the hex editor:
		uint32_t font_color = 0xffff;
		if(MageGame->playerEntityIndex != NO_PLAYER)
		{
			if(
				( (uint32_t)(i + (currentMemPage * bytesPerPage)) >= (MageGame->playerEntityIndex * sizeof(MageEntity)) ) &&
				( (uint32_t)(i + (currentMemPage * bytesPerPage)) <  ((MageGame->playerEntityIndex+1) * sizeof(MageEntity)) )
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
	uint8_t *currentByte = (((uint8_t *) hackableDataAddress) + hexCursorLocation);
	uint8_t changedValue = *currentByte;
	switch (currentOp) {
		case HEX_OPS_XOR: changedValue ^= value; break;
		case HEX_OPS_ADD: changedValue += value; break;
		case HEX_OPS_SUB: changedValue -= value; break;
		default: break;
	}
	*currentByte = changedValue;
}
