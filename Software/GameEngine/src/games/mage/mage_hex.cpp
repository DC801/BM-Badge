#include "mage_hex.h"
#include "mage_rom.h"
#include "EngineInput.h"
#include "utility.h"
#include "mage_dialog_control.h"
#include <fonts/Monaco9.h>
#include <algorithm>
#include <tuple>

#ifndef DC801_EMBEDDED
#include "shim_err.h"
#else
#include <nrf_error.h>
#endif


void MageHexEditor::setHexEditorOn(bool on)
{
   hexEditorOn = on;
   //set LED to the state
   ledSet(LED_HAX, on ? 0xff : 0x00);
}

void MageHexEditor::toggleHexDialog()
{
   dialogState = !dialogState;
   // bytes_per_page = (bytes_per_page % 192) + HEXED_BYTES_PER_ROW;
}

void MageHexEditor::setHexOp(enum HEX_OPS op)
{
<<<<<<< HEAD
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
	uint8_t *memOffsets = MageGame->currentSave.memOffsets;
	uint8_t entityRelativeMemOffset = hexCursorLocation % sizeof(MageEntity);
	ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
	ledSet(LED_MEM0, (entityRelativeMemOffset == memOffsets[0]) ? 0xFF : 0x00);
	ledSet(LED_MEM1, (entityRelativeMemOffset == memOffsets[1]) ? 0xFF : 0x00);
	ledSet(LED_MEM2, (entityRelativeMemOffset == memOffsets[2]) ? 0xFF : 0x00);
	ledSet(LED_MEM3, (entityRelativeMemOffset == memOffsets[3]) ? 0xFF : 0x00);
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

=======
   currentOp = op;
   uint8_t led_op_xor = 0x00;
   uint8_t led_op_add = 0x00;
   uint8_t led_op_sub = 0x00;
   switch (op)
   {
   case HEX_OPS_XOR: led_op_xor = 0xFF; break;
   case HEX_OPS_ADD: led_op_add = 0xFF; break;
   case HEX_OPS_SUB: led_op_sub = 0xFF; break;
   default: break;
   }
   ledSet(LED_XOR, led_op_xor);
   ledSet(LED_ADD, led_op_add);
   ledSet(LED_SUB, led_op_sub);
>>>>>>> scriptFixes
}

void MageHexEditor::updateHexStateVariables()
{
   bytesPerPage = dialogState ? 64 : 192;
   hexRows = ceil(float(bytesPerPage) / float(HEXED_BYTES_PER_ROW));
   memTotal = std::tuple_size<MapControl::EntityDataArray>{};
   totalMemPages = ceil(float(memTotal) / float(bytesPerPage));
}

void MageHexEditor::Update()
{
<<<<<<< HEAD
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
	uint8_t *memOffsets = MageGame->currentSave.memOffsets;
	//exiting the hex editor by pressing the hax button will happen immediately
	//before any other input is processed:
	if (EngineInput_Activated.hax) { toggleHexEditor(); }
=======
   if (!hexEditorOn || !playerHasHexEditorControl || disableMovement)
   {
      return;
   }
>>>>>>> scriptFixes

   if (inputHandler->IsPressed(KeyPress::Xor)) { setHexOp(HEX_OPS_XOR); }
   if (inputHandler->IsPressed(KeyPress::Add)) { setHexOp(HEX_OPS_ADD); }
   if (inputHandler->IsPressed(KeyPress::Sub)) { setHexOp(HEX_OPS_SUB); }
   if (inputHandler->IsPressed(KeyPress::Bit128)) { runHex(0b10000000); }
   if (inputHandler->IsPressed(KeyPress::Bit64)) { runHex(0b01000000); }
   if (inputHandler->IsPressed(KeyPress::Bit32)) { runHex(0b00100000); }
   if (inputHandler->IsPressed(KeyPress::Bit16)) { runHex(0b00010000); }
   if (inputHandler->IsPressed(KeyPress::Bit8)) { runHex(0b00001000); }
   if (inputHandler->IsPressed(KeyPress::Bit4)) { runHex(0b00000100); }
   if (inputHandler->IsPressed(KeyPress::Bit2)) { runHex(0b00000010); }
   if (inputHandler->IsPressed(KeyPress::Bit1)) { runHex(0b00000001); }

<<<<<<< HEAD
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
			int8_t memIndex = -1;
			if (EngineInput_Activated.mem0) { memIndex = 0; }
			if (EngineInput_Activated.mem1) { memIndex = 1; }
			if (EngineInput_Activated.mem2) { memIndex = 2; }
			if (EngineInput_Activated.mem3) { memIndex = 3; }
			if (memIndex != -1) {
				memOffsets[memIndex] = hexCursorLocation % sizeof(MageEntity);
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
=======
   uint8_t* currentByte = mapControl->GetEntityDataPointer() + hexCursorOffset;
>>>>>>> scriptFixes

   if (!inputHandler->Hack())
   {
      disableMovement = false;
   }
   if (disableMovement)
   {
      return;
   }

   //exiting the hex editor by pressing the hax button will happen immediately
   //before any other input is processed:
   if (inputHandler->Hack())// activatedButton.IsPressed(KeyPress::Hax)) 
   {
      setHexEditorOn(false);
   }

   anyHexMovement = inputHandler->Left() || inputHandler->Right() || inputHandler->Up() || inputHandler->Down()
      || inputHandler->Increment() || inputHandler->Decrement();

   static auto lastPageButtonPressTime = GameClock::now();
   if (inputHandler->IsPressed(KeyPress::Page))
   {
      //reset last press time only when the page button switches from unpressed to pressed
      if (!previousPageButtonState)
      {
         lastPageButtonPressTime = GameClock::now();
      }
      //change the state to show the button has been pressed.
      previousPageButtonState = true;

      //check to see if there is any directional button action while the page button is pressed
      if (inputHandler->Up() || inputHandler->Left())
      {
         currentMemPage = (currentMemPage + totalMemPages - 1) % totalMemPages;
      }
      else if (inputHandler->Down() || inputHandler->Right())
      {
         currentMemPage = (currentMemPage + 1) % totalMemPages;
      }
      //check for memory button presses:
      int8_t memIndex = -1;
      if (inputHandler->IsPressed(KeyPress::Mem0)) { memIndex = 0; }
      else if (inputHandler->IsPressed(KeyPress::Mem1)) { memIndex = 1; }
      else if (inputHandler->IsPressed(KeyPress::Mem2)) { memIndex = 2; }
      else if (inputHandler->IsPressed(KeyPress::Mem3)) { memIndex = 3; }
      if (memIndex != -1)
      {
         memOffsets[memIndex] = hexCursorOffset % sizeof(MageEntityData);
      }
   }
   else
   {
      applyMemRecallInputs();
      //check to see if the page button was pressed and released quickly
      if (previousPageButtonState
         && (GameClock::now() - lastPageButtonPressTime).count() < HEXED_QUICK_PRESS_TIMEOUT)
      {
         //if the page button was pressed and then released fast enough, advance one page.
         currentMemPage = (currentMemPage + 1) % totalMemPages;
      }
      //reset this to false:
      previousPageButtonState = false;

      //check directional inputs and move cursor.
      if (!inputHandler->IsPressed(KeyPress::Rjoy_right))
      {
         // not if in multi-byte selection mode
         if (inputHandler->Left())
         {
            hexCursorOffset = (hexCursorOffset + memTotal - 1) % memTotal;
            setPageToCursorLocation();
         }
         if (inputHandler->Right())
         {
            hexCursorOffset = (hexCursorOffset + 1) % memTotal;
            setPageToCursorLocation();
         }
         if (inputHandler->Up())
         {
            hexCursorOffset = (hexCursorOffset + memTotal - HEXED_BYTES_PER_ROW) % memTotal;
            setPageToCursorLocation();
         }
         if (inputHandler->Down())
         {
            hexCursorOffset = (hexCursorOffset + HEXED_BYTES_PER_ROW) % memTotal;
            setPageToCursorLocation();
         }
         if (inputHandler->Increment())
         {
            *currentByte += 1;
         }
         if (inputHandler->Decrement())
         {
            *currentByte -= 1;
         }
      }
      if (playerHasClipboardControl)
      {
         if (inputHandler->IsPressed(KeyPress::Rjoy_right))
         {
            //start copying
            clipboardLength = 1;
            isCopying = true;
         }
         if (!inputHandler->IsPressed(KeyPress::Rjoy_right))
         {
            isCopying = false;
         }
         if (inputHandler->IsPressed(KeyPress::Rjoy_right))
         {
            if (inputHandler->Left())
            {
               clipboardLength = std::max(1, clipboardLength - 1);
            }
            if (inputHandler->Right())
            {
               clipboardLength = std::min<uint8_t>(sizeof(MageEntityData), clipboardLength + 1);
            }
            memcpy(clipboard, currentByte, clipboardLength);
         }
         if (inputHandler->IsPressed(KeyPress::Rjoy_left))
         {
            //paste
            memcpy(currentByte, clipboard, clipboardLength);
         }
      }
   }
   if (anyHexMovement)
   {
      hexTickDelay = 1;
   }
   updateHexStateVariables();
}

void MageHexEditor::applyMemRecallInputs()
{
   const auto currentEntityIndex = hexCursorOffset / sizeof(MageEntityData);
   const auto currentEntityStart = currentEntityIndex * sizeof(MageEntityData);
   //check for memory button presses and set the hex cursor to the memory location
   auto memIndex = -1;
   if (inputHandler->IsPressed(KeyPress::Mem0)) { memIndex = 0; }
   else if (inputHandler->IsPressed(KeyPress::Mem1)) { memIndex = 1; }
   else if (inputHandler->IsPressed(KeyPress::Mem2)) { memIndex = 2; }
   else if (inputHandler->IsPressed(KeyPress::Mem3)) { memIndex = 3; }
   if (memIndex != -1)
   {
      const auto memoryAddress = memOffsets[memIndex % MAGE_NUM_MEM_BUTTONS];
      SetCursorOffset(currentEntityStart + memoryAddress);
   }
}

void MageHexEditor::renderHexHeader()
{
<<<<<<< HEAD
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
=======
   char headerString[128]{ " " };
   char clipboardPreview[24]{ " " };
   auto entityDataPointer = mapControl->GetEntityDataPointer();
   const uint8_t* currentByteAddress = entityDataPointer + hexCursorOffset;
   uint8_t u1Value = *currentByteAddress;
   uint16_t u2Value = *(uint16_t*)((currentByteAddress - (hexCursorOffset % 2)));
   sprintf(headerString, "CurrentPage: %03u  CurrentByte: 0x%04X\n""TotalPages:  %03u  Entities: %05zu  Mem: 0x%04X",
      currentMemPage, hexCursorOffset, totalMemPages, mapControl->currentMap.value().entityCount, memTotal);

   frameBuffer->DrawText(headerString, 0xffff, HEXED_BYTE_OFFSET_X, 0);
   auto stringPreview = std::string{ entityDataPointer + hexCursorOffset,
                                     entityDataPointer + hexCursorOffset + MAGE_ENTITY_NAME_LENGTH };

   sprintf(
      headerString,
      "Little Endian | uint8: %03d  | uint16: %05d\n"
      "string output: %s",
      u1Value,
      u2Value,
      stringPreview.c_str()
   );

   if (playerHasClipboardControl)
   {
      uint8_t clipboardPreviewClamp = std::min((uint8_t)HEXED_CLIPBOARD_PREVIEW_LENGTH, clipboardLength);
      for (uint8_t i = 0; i < clipboardPreviewClamp; i++)
      {
         sprintf(clipboardPreview + (i * 2), "%02X", *(clipboard + i));
      }
      if (clipboardLength > HEXED_CLIPBOARD_PREVIEW_LENGTH)
      {
         const auto offset = (HEXED_CLIPBOARD_PREVIEW_LENGTH * 2);
         clipboardPreview[offset] = '.';
         clipboardPreview[offset + 1] = '.';
         clipboardPreview[offset + 2] = '.';
      }
      sprintf(headerString + strlen(headerString), " | CP: 0x%s", clipboardPreview);
   }
   frameBuffer->DrawText(headerString, 0xffff, HEXED_BYTE_OFFSET_X, HEXED_BYTE_FOOTER_OFFSET_Y + (HEXED_BYTE_HEIGHT * (hexRows + 2)));
>>>>>>> scriptFixes
}

void MageHexEditor::Draw()
{
<<<<<<< HEAD
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
=======
   if (!hexEditorOn)
   {
      return;
   }
>>>>>>> scriptFixes

   if ((hexCursorOffset / bytesPerPage) == currentMemPage)
   {
      frameBuffer->DrawFilledRect(
         (hexCursorOffset % bytesPerPage % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
         (hexCursorOffset % bytesPerPage / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
         HEXED_BYTE_WIDTH, HEXED_BYTE_HEIGHT, 0x38FF);
      if (isCopying)
      {
         for (uint8_t i = 1; i < clipboardLength; i++)
         {
            uint16_t copyCursorOffset = (hexCursorOffset + i) % bytesPerPage;
            frameBuffer->DrawFilledRect(
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
   auto pageOffset = currentMemPage * bytesPerPage;

   constexpr char hexmap[] = { '0', '1', '2', '3', '4', '5', '6', '7',
                     '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

   auto entityDataPointer = mapControl->GetEntityDataPointer();
   auto dataPage = entityDataPointer + pageOffset;
   uint16_t i = 0;
   std::string s(HEXED_BYTES_PER_ROW * 3, ' ');
   while (i < bytesPerPage && i + pageOffset < memTotal)
   {
      auto color = COLOR_WHITE;
      auto playerEntityIndex = mapControl->getPlayerEntityIndex();
      if (NO_PLAYER_INDEX != playerEntityIndex
         && i + pageOffset >= sizeof(MageEntityData) * playerEntityIndex
         && i + pageOffset < sizeof(MageEntityData) * (playerEntityIndex + 1))
      {
         color = COLOR_RED;
      }
      for (uint16_t j = 0; j < HEXED_BYTES_PER_ROW; i++, j++)
      {
         s[3 * j] = hexmap[(dataPage[i] & 0xF0) >> 4];
         s[3 * j + 1] = hexmap[dataPage[i] & 0x0F];
      }
      frameBuffer->DrawText(s.c_str(), color,
         HEXED_BYTE_OFFSET_X, HEXED_BYTE_OFFSET_Y + ((i - 1) / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT);
   }
}

void MageHexEditor::runHex(uint8_t value)
{
<<<<<<< HEAD
	uint8_t *currentByte = (((uint8_t *) hackableDataAddress) + hexCursorLocation);
	uint8_t changedValue = *currentByte;
	switch (currentOp) {
		case HEX_OPS_XOR: changedValue ^= value; break;
		case HEX_OPS_ADD: changedValue += value; break;
		case HEX_OPS_SUB: changedValue -= value; break;
		default: break;
	}
	*currentByte = changedValue;
=======
   uint8_t* currentByte = mapControl->GetEntityDataPointer() + hexCursorOffset;
   uint8_t changedValue = *currentByte;
   switch (currentOp)
   {
   case HEX_OPS_XOR: changedValue ^= value; break;
   case HEX_OPS_ADD: changedValue += value; break;
   case HEX_OPS_SUB: changedValue -= value; break;
   default: break;
   }
   *currentByte = changedValue;
>>>>>>> scriptFixes
}

void MageHexEditor::openToEntity(uint8_t entityIndex)
{
   disableMovement = true;
   SetCursorOffset(entityIndex * sizeof(MageEntityData));
   setPageToCursorLocation();
   setHexEditorOn(true);
}


