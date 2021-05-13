#include "mage_hex.h"

extern FrameBuffer *mage_canvas;
extern MageGameControl *MageGame;
extern MageDialogControl *MageDialog;
extern MageEntity *hackableDataAddress;

uint32_t MageHexEditor::size() const
{
	uint32_t size = (
		sizeof(currentOp) +
		sizeof(hexEditorState) +
		sizeof(anyHexMovement) +
		sizeof(hexTickDelay) +
		sizeof(dialogState) +
		sizeof(bytesPerPage) +
		sizeof(hexRows) +
		sizeof(memTotal) +
		sizeof(currentMemPage) +
		sizeof(totalMemPages) +
		sizeof(hexCursorLocation) +
		sizeof(previousPageButtonState) +
		sizeof(lastPageButtonPressTime) +
		(sizeof(memAddresses)*HEXED_NUM_MEM_BUTTONS) +
		sizeof(isCopying) +
		sizeof(disableMovementUntilRJoyUpRelease)
	);
	return size;
}

bool MageHexEditor::getHexEditorState()
{
	return hexEditorState;
}

bool MageHexEditor::getHexDialogState()
{
	return dialogState;
}
uint16_t MageHexEditor::getMemoryAddress(uint8_t index)
{
	return index < HEXED_NUM_MEM_BUTTONS
		? memAddresses[index]
		: memAddresses[0];
}

void MageHexEditor::toggleHexEditor()
{
	hexEditorState = !hexEditorState;
	//set LED to the state 
	ledSet(LED_HAX, hexEditorState ? 0xff : 0x00);
}

void MageHexEditor::toggleHexDialog()
{
	dialogState = !dialogState;
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

void MageHexEditor::setPageToCursorLocation() {
	currentMemPage = getCurrentMemPage();
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
	ledSet(LED_MEM0, (hexCursorLocation == memAddresses[0]) ? 0xFF : 0x00);
	ledSet(LED_MEM1, (hexCursorLocation == memAddresses[1]) ? 0xFF : 0x00);
	ledSet(LED_MEM2, (hexCursorLocation == memAddresses[2]) ? 0xFF : 0x00);
	ledSet(LED_MEM3, (hexCursorLocation == memAddresses[3]) ? 0xFF : 0x00);
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

void MageHexEditor::updateHexStateVariables()
{
	bytesPerPage = dialogState ? 64 : 192;
	hexRows = ceil((0.0 + bytesPerPage) / (0.0 + HEXED_BYTES_PER_ROW));
	memTotal = MageGame->filteredEntityCountOnThisMap * sizeof(MageEntity);
	totalMemPages = ceil((0.0 + memTotal) / (0.0 + bytesPerPage));
}

void MageHexEditor::applyHexModeInputs()
{
	if(EngineInput_Deactivated.rjoy_up) {
		disableMovementUntilRJoyUpRelease = false;
	}
	//check to see if player input is allowed:
	if(
		MageDialog->isOpen
		|| !MageGame->playerHasControl
		|| !MageGame->playerHasHexEditorControl
		|| disableMovementUntilRJoyUpRelease
	) {
		return;
	}
	uint8_t *currentByte = (((uint8_t *) hackableDataAddress) + hexCursorLocation);
	//exiting the hex editor by pressing the hax button will happen immediately
	//before any other input is processed:
	if (EngineInput_Activated.hax) { toggleHexEditor(); }

	//debounce timer check.
	if (!hexTickDelay) {
		anyHexMovement = (
			EngineInput_Buttons.ljoy_left
			|| EngineInput_Buttons.ljoy_right
			|| EngineInput_Buttons.ljoy_up
			|| EngineInput_Buttons.ljoy_down
			|| EngineInput_Buttons.rjoy_up // triangle for increment
			|| EngineInput_Buttons.rjoy_down // x for decrement
		);
		if (EngineInput_Buttons.op_page) {
			//reset last press time only when the page button switches from unpressed to pressed
			if(!previousPageButtonState) {
				lastPageButtonPressTime = millis();
			}
			//change the state to show the button has been pressed.
			previousPageButtonState = true;

			//check to see if there is any directional button action while the page button is pressed
			if (
				EngineInput_Buttons.ljoy_up
				|| EngineInput_Buttons.ljoy_left
			) {
				currentMemPage = (currentMemPage + totalMemPages - 1) % totalMemPages;
			}
			if (
				EngineInput_Buttons.ljoy_down
				|| EngineInput_Buttons.ljoy_right
			) {
				currentMemPage = (currentMemPage + 1) % totalMemPages;
			}
			//check for memory button presses:
			if(EngineInput_Activated.mem0) {
				memAddresses[0] = hexCursorLocation;
			}
			if(EngineInput_Activated.mem1) {
				memAddresses[1] = hexCursorLocation;
			}
			if(EngineInput_Activated.mem2) {
				memAddresses[2] = hexCursorLocation;
			}
			if(EngineInput_Activated.mem3) {
				memAddresses[3] = hexCursorLocation;
			}
		}
		else
		{
			applyMemRecallInputs();
			//check to see if the page button was pressed and released quickly
			if(
				(previousPageButtonState) && 
				((millis() - lastPageButtonPressTime) < HEXED_QUICK_PRESS_TIMEOUT)
			) {
				//if the page button was pressed and then released fast enough, advance one page.
				currentMemPage = (currentMemPage + 1) % totalMemPages;
			}
			//reset this to false:
			previousPageButtonState = false;

			//check directional inputs and move cursor.
			if(
				!EngineInput_Buttons.rjoy_right // not if in multi-byte selection mode
			) {
				if (EngineInput_Buttons.ljoy_left) {
					//move the cursor left:
					hexCursorLocation = (hexCursorLocation + memTotal - 1) % memTotal;
					//change the current page to wherever the cursor is:
					setPageToCursorLocation();
				}
				if (EngineInput_Buttons.ljoy_right) {
					//move the cursor right:
					hexCursorLocation = (hexCursorLocation + 1) % memTotal;
					//change the current page to wherever the cursor is:
					setPageToCursorLocation();
				}
				if (EngineInput_Buttons.ljoy_up) {
					//move the cursor up:
					hexCursorLocation = (hexCursorLocation + memTotal - HEXED_BYTES_PER_ROW) % memTotal;
					//change the current page to wherever the cursor is:
					setPageToCursorLocation();
				}
				if (EngineInput_Buttons.ljoy_down) {
					//move the cursor down:
					hexCursorLocation = (hexCursorLocation + HEXED_BYTES_PER_ROW) % memTotal;
					//change the current page to wherever the cursor is:
					setPageToCursorLocation();
				}
				if (EngineInput_Buttons.rjoy_up) {
					//decrement the value
					*currentByte += 1;
				}
				if (EngineInput_Buttons.rjoy_down) {
					//decrement the value
					*currentByte -= 1;
				}
			}
			if (MageGame->playerHasHexEditorControlClipboard) {
				if (EngineInput_Activated.rjoy_right) {
					//start copying
					MageGame->currentSave.clipboardLength = 1;
					isCopying = true;
				}
				if (!EngineInput_Buttons.rjoy_right) {
					isCopying = false;
				}
				if (EngineInput_Buttons.rjoy_right) {
					if (EngineInput_Buttons.ljoy_left) {
						MageGame->currentSave.clipboardLength = MAX(
							(uint8_t) 1,
							MageGame->currentSave.clipboardLength - 1
						);
					}
					if (EngineInput_Buttons.ljoy_right) {
						MageGame->currentSave.clipboardLength = MIN(
							(uint8_t) sizeof(MageEntity),
							MageGame->currentSave.clipboardLength + 1
						);
					}
					memcpy(
						MageGame->currentSave.clipboard,
						currentByte,
						MageGame->currentSave.clipboardLength
					);
				}
				if (EngineInput_Buttons.rjoy_left) {
					//paste
					memcpy(
						currentByte,
						MageGame->currentSave.clipboard,
						MageGame->currentSave.clipboardLength
					);
					MageGame->UpdateEntities(0);
					memcpy(
						currentByte,
						MageGame->currentSave.clipboard,
						MageGame->currentSave.clipboardLength
					);
				}
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

void MageHexEditor::applyMemRecallInputs() {
	//check for memory button presses and set the hex cursor to the memory location
	if(EngineInput_Activated.mem0) {
		setHexCursorLocation(getMemoryAddress(0));
	}
	if(EngineInput_Activated.mem1) {
		setHexCursorLocation(getMemoryAddress(1));
	}
	if(EngineInput_Activated.mem2) {
		setHexCursorLocation(getMemoryAddress(2));
	}
	if(EngineInput_Activated.mem3) {
		setHexCursorLocation(getMemoryAddress(3));
	}
}

void MageHexEditor::getHexStringForByte (uint8_t byte, char* outputString)
{
	sprintf(outputString,"%02X", byte);
}

uint16_t MageHexEditor::getRenderableStringLength(uint8_t *bytes, uint16_t maxLength) {
	uint16_t offset = 0;
	uint16_t renderableLength = 0;
	uint8_t currentByte = bytes[0];
	while (
		currentByte != 0 &&
		offset < maxLength
	) {
		offset++;
		currentByte = bytes[renderableLength];
		if(
			currentByte >= 32 &&
			currentByte < 128
		) {
			renderableLength++;
		}
	}
	return renderableLength;
}

void MageHexEditor::renderHexHeader()
{
	char headerString[128];
	char clipboardPreview[24];
	char stringPreview[MAGE_ENTITY_NAME_LENGTH + 1] = {0};
	uint8_t *currentByteAddress = (uint8_t *) hackableDataAddress + hexCursorLocation;
	uint8_t u1Value = *currentByteAddress;
	uint16_t u2Value = *(uint16_t *) ((currentByteAddress - (hexCursorLocation % 2)));
	sprintf(
		headerString,
		"CurrentPage: %03u              CurrentByte: 0x%04X\n"
			"TotalPages:  %03u   Entities: %05u    Mem: 0x%04X",
		currentMemPage,
		hexCursorLocation,
		totalMemPages,
		MageGame->filteredEntityCountOnThisMap,
		memTotal
	);
	mage_canvas->printMessage(
		headerString,
		Monaco9,
		0xffff,
		HEXED_BYTE_OFFSET_X,
		0
	);
	memcpy(
		stringPreview,
		(uint8_t *) hackableDataAddress + hexCursorLocation,
		MAGE_ENTITY_NAME_LENGTH
	);
	uint16_t stringPreviewLength = getRenderableStringLength(
		(uint8_t *) stringPreview,
		MAGE_ENTITY_NAME_LENGTH
	);
	// add spaces for padding at the end of the string preview so clipboard stays put
	for (int i = stringPreviewLength; i < MAGE_ENTITY_NAME_LENGTH; i++) {
		sprintf(
			stringPreview + i,
			" \0"
		);
	}
	sprintf(
		headerString,
		"%s | uint8: %03d  | uint16: %05d\n"
		"string output: %s",
		endian_label,
		u1Value,
		u2Value,
		stringPreview
	);
	if (MageGame->playerHasHexEditorControlClipboard) {
		uint8_t clipboardPreviewClamp = MIN(
			(uint8_t)HEXED_CLIPBOARD_PREVIEW_LENGTH,
			MageGame->currentSave.clipboardLength
		);
		for (uint8_t i = 0; i < clipboardPreviewClamp; i++) {
			sprintf(
				clipboardPreview + (i * 2),
				"%02X",
				*(MageGame->currentSave.clipboard + i)
			);
		}
		if(MageGame->currentSave.clipboardLength > HEXED_CLIPBOARD_PREVIEW_LENGTH) {
			sprintf(
				clipboardPreview + (HEXED_CLIPBOARD_PREVIEW_LENGTH * 2),
				"..."
			);
		}
		sprintf(
			headerString + strlen(headerString),
			" | CP: 0x%s",
			clipboardPreview
		);
	}
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
			0x38FF
		);
		if (isCopying) {
			for (uint8_t i = 1; i < MageGame->currentSave.clipboardLength; i++) {
				uint16_t copyCursorOffset = (hexCursorLocation + i) % bytesPerPage;
				mage_canvas->fillRect(
					(copyCursorOffset % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
					(copyCursorOffset / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
					HEXED_BYTE_WIDTH,
					HEXED_BYTE_HEIGHT,
					0x00EE
				);
			}
		}
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
		getHexStringForByte(
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

void MageHexEditor::openToEntityByIndex(uint8_t entityIndex) {
	setHexCursorLocation(entityIndex * sizeof(MageEntity));
	setPageToCursorLocation();
	toggleHexEditor();
}
