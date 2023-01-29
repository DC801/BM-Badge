#include "mage_hex.h"
#include "EngineInput.h"
#include "convert_endian.h"
#include "utility.h"
#include "shim_err.h"
#include "mage_dialog_control.h"

bool MageHexEditor::isHexEditorOn()
{
   return hexEditorOn;
}

void MageHexEditor::toggleHexEditor()
{
   hexEditorOn = !hexEditorOn;
   //set LED to the state
   ledSet(LED_HAX, hexEditorOn ? 0xff : 0x00);
}

void MageHexEditor::toggleHexDialog()
{
   dialogState = !dialogState;
   // bytes_per_page = (bytes_per_page % 192) + HEXED_BYTES_PER_ROW;
}

void MageHexEditor::setHexOp(enum HEX_OPS op)
{
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
}

void MageHexEditor::setHexCursorLocation(uint16_t offset)
{
   hexCursorLocation = offset;
}

void MageHexEditor::setPageToCursorLocation()
{
   currentMemPage = getCurrentMemPage();
}

void MageHexEditor::updateHexLights(const uint8_t* entityDataPointer) const
{
   const uint8_t currentByte = *(entityDataPointer + hexCursorLocation);
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

   while (adjustedMem >= 0)
   {
      //subtract a page worth of memory from the memory location
      adjustedMem -= bytesPerPage;
      //if the offset doesn't get to 0, it must be on a higher page.
      if (adjustedMem >= 0)
      {
         memPage++;
      }
   }
   //once it's <0, that should be the correct mem page:
   return memPage;

}

void MageHexEditor::updateHexStateVariables(uint8_t entityCount)
{
   bytesPerPage = dialogState ? 64 : 192;
   hexRows = ceil((0.0 + bytesPerPage) / (0.0 + HEXED_BYTES_PER_ROW));
   memTotal = entityCount * sizeof(MageEntity);
   totalMemPages = ceil((0.0 + memTotal) / (0.0 + bytesPerPage));
}

void MageHexEditor::applyHexModeInputs(uint8_t* currentByte)
{
   currentByte += hexCursorLocation;
   const auto activatedButton = inputHandler->GetButtonActivatedState();
   const auto button = inputHandler->GetButtonState();
   if (!activatedButton.IsPressed(KeyPress::Rjoy_up))
   {
      disableMovement = false;
   }
   //exiting the hex editor by pressing the hax button will happen immediately
   //before any other input is processed:
   if (activatedButton.IsPressed(KeyPress::Hax)) { toggleHexEditor(); }

   //debounce timer check.
   if (!hexTickDelay)
   {
      anyHexMovement = button.IsPressed(KeyPress::Ljoy_left)
         || button.IsPressed(KeyPress::Ljoy_right)
         || button.IsPressed(KeyPress::Ljoy_up)
         || button.IsPressed(KeyPress::Ljoy_down)
         || button.IsPressed(KeyPress::Rjoy_up) // triangle for increment
         || button.IsPressed(KeyPress::Rjoy_down); // x for decrement
         
      if (button.IsPressed(KeyPress::Page))
      {
         //reset last press time only when the page button switches from unpressed to pressed
         if (!previousPageButtonState)
         {
            lastPageButtonPressTime = millis();
         }
         //change the state to show the button has been pressed.
         previousPageButtonState = true;

         //check to see if there is any directional button action while the page button is pressed
         if (button.IsPressed(KeyPress::Ljoy_up)
            || button.IsPressed(KeyPress::Ljoy_left))
         {
            currentMemPage = (currentMemPage + totalMemPages - 1) % totalMemPages;
         }
         if (button.IsPressed(KeyPress::Ljoy_down)
            || button.IsPressed(KeyPress::Ljoy_right))
         {
            currentMemPage = (currentMemPage + 1) % totalMemPages;
         }
         //check for memory button presses:
         int8_t memIndex = -1;
         if (activatedButton.IsPressed(KeyPress::Mem0)) { memIndex = 0; }
         if (activatedButton.IsPressed(KeyPress::Mem1)) { memIndex = 1; }
         if (activatedButton.IsPressed(KeyPress::Mem2)) { memIndex = 2; }
         if (activatedButton.IsPressed(KeyPress::Mem3)) { memIndex = 3; }
         if (memIndex != -1)
         {
            memOffsets[memIndex] = hexCursorLocation % sizeof(MageEntity);
         }
      }
      else
      {
         applyMemRecallInputs();
         //check to see if the page button was pressed and released quickly
         if (previousPageButtonState
            && (millis() - lastPageButtonPressTime) < HEXED_QUICK_PRESS_TIMEOUT)
         {
            //if the page button was pressed and then released fast enough, advance one page.
            currentMemPage = (currentMemPage + 1) % totalMemPages;
         }
         //reset this to false:
         previousPageButtonState = false;

         //check directional inputs and move cursor.
         if (!button.IsPressed(KeyPress::Rjoy_right))
         {
            // not if in multi-byte selection mode
            if (button.IsPressed(KeyPress::Ljoy_left))
            {
               hexCursorLocation = (hexCursorLocation + memTotal - 1) % memTotal;
               setPageToCursorLocation();
            }
            if (button.IsPressed(KeyPress::Ljoy_right))
            {
               hexCursorLocation = (hexCursorLocation + 1) % memTotal;
               setPageToCursorLocation();
            }
            if (button.IsPressed(KeyPress::Ljoy_up))
            {
               hexCursorLocation = (hexCursorLocation + memTotal - HEXED_BYTES_PER_ROW) % memTotal;
               setPageToCursorLocation();
            }
            if (button.IsPressed(KeyPress::Ljoy_down))
            {
               hexCursorLocation = (hexCursorLocation + HEXED_BYTES_PER_ROW) % memTotal;
               setPageToCursorLocation();
            }
            if (button.IsPressed(KeyPress::Rjoy_up))
            {
               *currentByte += 1;
            }
            if (button.IsPressed(KeyPress::Rjoy_down))
            {
               *currentByte -= 1;
            }
         }
         if (playerHasClipboardControl)
         {
            if (activatedButton.IsPressed(KeyPress::Rjoy_right))
            {
               //start copying
               clipboardLength = 1;
               isCopying = true;
            }
            if (!button.IsPressed(KeyPress::Rjoy_right))
            {
               isCopying = false;
            }
            if (button.IsPressed(KeyPress::Rjoy_right))
            {
               if (button.IsPressed(KeyPress::Ljoy_left))
               {
                  clipboardLength = MAX(1, clipboardLength - 1);
               }
               if (button.IsPressed(KeyPress::Ljoy_right))
               {
                  clipboardLength = MIN(sizeof(MageEntity), clipboardLength + 1);
               }
               memcpy(clipboard, currentByte, clipboardLength);
            }
            if (button.IsPressed(KeyPress::Rjoy_left))
            {
               //paste
               memcpy(currentByte, clipboard, clipboardLength);
               mapControl->UpdateEntities(0);
               memcpy(currentByte, clipboard, clipboardLength);
            }
         }
      }
      if (anyHexMovement)
      {
         hexTickDelay = HEXED_TICK_DELAY;
      }
   }
   //decrement debounce timer
   else
   {
      hexTickDelay--;
   }
}

void MageHexEditor::applyMemRecallInputs()
{
   uint8_t currentEntityIndex = hexCursorLocation / sizeof(MageEntity);
   uint16_t currentEntityStart = currentEntityIndex * sizeof(MageEntity);
   //check for memory button presses and set the hex cursor to the memory location
   int8_t memIndex = -1;
   const auto activatedButton = inputHandler->GetButtonActivatedState();
   if (activatedButton.IsPressed(KeyPress::Mem0)) { memIndex = 0; }
   if (activatedButton.IsPressed(KeyPress::Mem1)) { memIndex = 1; }
   if (activatedButton.IsPressed(KeyPress::Mem2)) { memIndex = 2; }
   if (activatedButton.IsPressed(KeyPress::Mem3)) { memIndex = 3; }
   if (memIndex != -1)
   {
      auto memoryAddress = memOffsets[memIndex % MAGE_NUM_MEM_BUTTONS];
      setHexCursorLocation(currentEntityStart + memoryAddress);
   }
}

uint16_t MageHexEditor::getRenderableStringLength(const char* bytes, uint16_t maxLength) const
{
   uint16_t offset = 0;
   uint16_t renderableLength = 0;
   uint8_t currentByte = bytes[0];
   while (currentByte != 0 && offset < maxLength)
   {
      offset++;
      currentByte = bytes[renderableLength];
      if (currentByte >= 32 && currentByte < 128)
      {
         renderableLength++;
      }
   }
   return renderableLength;
}

void MageHexEditor::renderHexHeader(const uint8_t* entityDataPointer)
{
   char headerString[128]{ " " };
   char clipboardPreview[24]{ " " };
   const uint8_t* currentByteAddress = entityDataPointer + hexCursorLocation;
   uint8_t u1Value = *currentByteAddress;
   uint16_t u2Value = *(uint16_t*)((currentByteAddress - (hexCursorLocation % 2)));
   sprintf(headerString, "CurrentPage: %03u  CurrentByte: 0x%04X\n""TotalPages:  %03u  Entities: %05u  Mem: 0x%04X", 
      currentMemPage, hexCursorLocation, totalMemPages, mapControl->FilteredEntityCount(), memTotal);

   auto hackableData = mapControl->GetEntityDataPointer();
   frameBuffer->printMessage(headerString, Monaco9, 0xffff, HEXED_BYTE_OFFSET_X, 0);
   auto stringPreview = std::string{ hackableData + hexCursorLocation,
                                     hackableData + hexCursorLocation + MAGE_ENTITY_NAME_LENGTH };

   sprintf(
      headerString,
      "%s | uint8: %03d  | uint16: %05d\n"
      "string output: %s",
      endian_label,
      u1Value,
      u2Value,
      stringPreview.c_str()
   );

   if (playerHasClipboardControl)
   {
      uint8_t clipboardPreviewClamp = MIN(
         (uint8_t)HEXED_CLIPBOARD_PREVIEW_LENGTH,
         clipboardLength
      );
      for (uint8_t i = 0; i < clipboardPreviewClamp; i++)
      {
         sprintf(clipboardPreview + (i * 2), "%02X", *(clipboard + i));
      }
      if (clipboardLength > HEXED_CLIPBOARD_PREVIEW_LENGTH)
      {
         const auto offset = (HEXED_CLIPBOARD_PREVIEW_LENGTH * 2);
         clipboardPreview[offset] = '.';
         clipboardPreview[offset+1] = '.';
         clipboardPreview[offset+2] = '.';
      }
      sprintf(headerString + strlen(headerString), " | CP: 0x%s", clipboardPreview);
   }
   frameBuffer->printMessage(headerString, Monaco9, 0xffff, HEXED_BYTE_OFFSET_X, HEXED_BYTE_FOOTER_OFFSET_Y + (HEXED_BYTE_HEIGHT * (hexRows + 2)));
}

void MageHexEditor::renderHexEditor(uint8_t* entityDataPointer)
{
   if ((hexCursorLocation / bytesPerPage) == currentMemPage)
   {
      frameBuffer->fillRect(
         (hexCursorLocation % bytesPerPage % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
         (hexCursorLocation % bytesPerPage / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
         HEXED_BYTE_WIDTH, HEXED_BYTE_HEIGHT, 0x38FF);
      if (isCopying)
      {
         for (uint8_t i = 1; i < clipboardLength; i++)
         {
            uint16_t copyCursorOffset = (hexCursorLocation + i) % bytesPerPage;
            frameBuffer->fillRect(
               (copyCursorOffset % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
               (copyCursorOffset / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
               HEXED_BYTE_WIDTH,
               HEXED_BYTE_HEIGHT,
               0x00EE
            );
         }
      }
   }
   renderHexHeader(entityDataPointer);
   auto pageOffset = currentMemPage * bytesPerPage;

   constexpr char hexmap[] = { '0', '1', '2', '3', '4', '5', '6', '7',
                     '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

   auto dataPage = entityDataPointer + pageOffset;
   uint16_t i = 0;
   std::string s(HEXED_BYTES_PER_ROW * 3, ' ');
   while (i < bytesPerPage && i + pageOffset < memTotal)
   {
      auto color = COLOR_WHITE;
      auto playerEntityIndex = mapControl->getPlayerEntityIndex();
      if (NO_PLAYER != playerEntityIndex
         && i + pageOffset >= sizeof(MageEntity) * playerEntityIndex
         && i + pageOffset < sizeof(MageEntity) * (playerEntityIndex + 1))
      {
         color = COLOR_RED;
      }
      for (uint16_t j = 0; j < HEXED_BYTES_PER_ROW; i++, j++)
      {
         s[3 * j] = hexmap[(dataPage[i] & 0xF0) >> 4];
         s[3 * j + 1] = hexmap[dataPage[i] & 0x0F];
      }
      frameBuffer->printMessage(s.c_str(), Monaco9, color, 
         HEXED_BYTE_OFFSET_X, HEXED_BYTE_OFFSET_Y + ((i - 1) / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT);
   }
}

void MageHexEditor::runHex(uint8_t value)
{
   uint8_t* currentByte = mapControl->GetEntityDataPointer() + hexCursorLocation;
   uint8_t changedValue = *currentByte;
   switch (currentOp)
   {
   case HEX_OPS_XOR: changedValue ^= value; break;
   case HEX_OPS_ADD: changedValue += value; break;
   case HEX_OPS_SUB: changedValue -= value; break;
   default: break;
   }
   *currentByte = changedValue;
}

void MageHexEditor::openToEntityByIndex(uint8_t entityIndex)
{
   setHexCursorLocation(entityIndex * sizeof(MageEntity));
   setPageToCursorLocation();
   toggleHexEditor();
}
