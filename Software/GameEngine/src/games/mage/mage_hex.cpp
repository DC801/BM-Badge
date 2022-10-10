#include "mage_hex.h"
#include "EngineInput.h"
#include "EngineROM.h"
#include "convert_endian.h"
#include "utility.h"
#include "shim_err.h"
#include "mage_game_control.h"


bool MageHexEditor::isHexEditorOn()
{
   return hexEditorOn;
}

bool MageHexEditor::getHexDialogState()
{
   return dialogState;
}
uint16_t MageHexEditor::getMemoryAddress(uint8_t index)
{
   return gameEngine->gameControl->currentSave.memOffsets[index % MAGE_NUM_MEM_BUTTONS];
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

void MageHexEditor::setHexCursorLocation(uint16_t address)
{
   hexCursorLocation = address;
}

void MageHexEditor::setPageToCursorLocation()
{
   currentMemPage = getCurrentMemPage();
}

void MageHexEditor::updateHexLights()
{
   const uint8_t currentByte = *(((uint8_t*)gameEngine->gameControl->Map()->entities.data()) + hexCursorLocation);
   uint8_t* memOffsets = gameEngine->gameControl->currentSave.memOffsets;
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
      //if the address doesn't get to 0, it must be on a higher page.
      if (adjustedMem >= 0)
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
   memTotal = gameEngine->gameControl->Map()->FilteredEntityCount() * sizeof(MageEntity);
   totalMemPages = ceil((0.0 + memTotal) / (0.0 + bytesPerPage));
}

void MageHexEditor::applyHexModeInputs()
{
   if (!gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Rjoy_up))
   {
      disableMovement = false;
   }
   //check to see if player input is allowed:
   if (
      gameEngine->gameControl->dialogControl->isOpen()
      || !gameEngine->gameControl->playerHasControl
      || !gameEngine->gameControl->playerHasHexEditorControl
      || disableMovement
      )
   {
      return;
   }
   uint8_t* currentByte = (((uint8_t*)gameEngine->gameControl->Map()->entities.data()) + hexCursorLocation);
   uint8_t* memOffsets = gameEngine->gameControl->currentSave.memOffsets;
   //exiting the hex editor by pressing the hax button will happen immediately
   //before any other input is processed:
   if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Hax)) { toggleHexEditor(); }

   //debounce timer check.
   if (!hexTickDelay)
   {
      anyHexMovement = (
         gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left)
         || gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right)
         || gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)
         || gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)
         || gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_up) // triangle for increment
         || gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_down) // x for decrement
         );
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Page))
      {
         //reset last press time only when the page button switches from unpressed to pressed
         if (!previousPageButtonState)
         {
            lastPageButtonPressTime = millis();
         }
         //change the state to show the button has been pressed.
         previousPageButtonState = true;

         //check to see if there is any directional button action while the page button is pressed
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)
            || gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left))
         {
            currentMemPage = (currentMemPage + totalMemPages - 1) % totalMemPages;
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)
            || gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right))
         {
            currentMemPage = (currentMemPage + 1) % totalMemPages;
         }
         //check for memory button presses:
         int8_t memIndex = -1;
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem0)) { memIndex = 0; }
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem1)) { memIndex = 1; }
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem2)) { memIndex = 2; }
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem3)) { memIndex = 3; }
         if (memIndex != -1)
         {
            memOffsets[memIndex] = hexCursorLocation % sizeof(MageEntity);
         }
      }
      else
      {
         applyMemRecallInputs();
         //check to see if the page button was pressed and released quickly
         if (
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
         if (!gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_right))
         {
            // not if in multi-byte selection mode
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left))
            {
               //move the cursor left:
               hexCursorLocation = (hexCursorLocation + memTotal - 1) % memTotal;
               //change the current page to wherever the cursor is:
               setPageToCursorLocation();
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right))
            {
               //move the cursor right:
               hexCursorLocation = (hexCursorLocation + 1) % memTotal;
               //change the current page to wherever the cursor is:
               setPageToCursorLocation();
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up))
            {
               //move the cursor up:
               hexCursorLocation = (hexCursorLocation + memTotal - HEXED_BYTES_PER_ROW) % memTotal;
               //change the current page to wherever the cursor is:
               setPageToCursorLocation();
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down))
            {
               //move the cursor down:
               hexCursorLocation = (hexCursorLocation + HEXED_BYTES_PER_ROW) % memTotal;
               //change the current page to wherever the cursor is:
               setPageToCursorLocation();
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_up))
            {
               //decrement the value
               *currentByte += 1;
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_down))
            {
               //decrement the value
               *currentByte -= 1;
            }
         }
         if (gameEngine->gameControl->playerHasHexEditorControlClipboard)
         {
            if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Rjoy_right))
            {
               //start copying
               gameEngine->gameControl->currentSave.clipboardLength = 1;
               isCopying = true;
            }
            if (!gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_right))
            {
               isCopying = false;
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_right))
            {
               if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left))
               {
                  gameEngine->gameControl->currentSave.clipboardLength = MAX(
                     (uint8_t)1,
                     gameEngine->gameControl->currentSave.clipboardLength - 1
                  );
               }
               if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right))
               {
                  gameEngine->gameControl->currentSave.clipboardLength = MIN(
                     (uint8_t)sizeof(MageEntity),
                     gameEngine->gameControl->currentSave.clipboardLength + 1
                  );
               }
               memcpy(
                  gameEngine->gameControl->currentSave.clipboard,
                  currentByte,
                  gameEngine->gameControl->currentSave.clipboardLength
               );
            }
            if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_left))
            {
               //paste
               memcpy(
                  currentByte,
                  gameEngine->gameControl->currentSave.clipboard,
                  gameEngine->gameControl->currentSave.clipboardLength
               );
               gameEngine->gameControl->UpdateEntities(0);
               memcpy(
                  currentByte,
                  gameEngine->gameControl->currentSave.clipboard,
                  gameEngine->gameControl->currentSave.clipboardLength
               );
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
   if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem0)) { memIndex = 0; }
   if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem1)) { memIndex = 1; }
   if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem2)) { memIndex = 2; }
   if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Mem3)) { memIndex = 3; }
   if (memIndex != -1)
   {
      setHexCursorLocation(
         currentEntityStart
         + getMemoryAddress(memIndex)
      );
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

void MageHexEditor::renderHexHeader()
{
   char headerString[128]{ " " };
   char clipboardPreview[24]{ " " };
   uint8_t* currentByteAddress = (uint8_t*)gameEngine->gameControl->Map()->entities.data() + hexCursorLocation;
   uint8_t u1Value = *currentByteAddress;
   uint16_t u2Value = *(uint16_t*)((currentByteAddress - (hexCursorLocation % 2)));
   sprintf(
      headerString,
      "CurrentPage: %03u  CurrentByte: 0x%04X\n"
      "TotalPages:  %03u  Entities: %05u  Mem: 0x%04X",
      currentMemPage, hexCursorLocation,
      totalMemPages, gameEngine->gameControl->Map()->FilteredEntityCount(),
      memTotal
   );

   auto hackableData = (uint8_t*)gameEngine->gameControl->Map()->entities.data();
   gameEngine->frameBuffer->printMessage(headerString, Monaco9, 0xffff, HEXED_BYTE_OFFSET_X, 0);
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

   if (gameEngine->gameControl->playerHasHexEditorControlClipboard)
   {
      uint8_t clipboardPreviewClamp = MIN(
         (uint8_t)HEXED_CLIPBOARD_PREVIEW_LENGTH,
         gameEngine->gameControl->currentSave.clipboardLength
      );
      for (uint8_t i = 0; i < clipboardPreviewClamp; i++)
      {
         sprintf(
            clipboardPreview + (i * 2),
            "%02X",
            *(gameEngine->gameControl->currentSave.clipboard + i)
         );
      }
      if (gameEngine->gameControl->currentSave.clipboardLength > HEXED_CLIPBOARD_PREVIEW_LENGTH)
      {
         const auto offset = (HEXED_CLIPBOARD_PREVIEW_LENGTH * 2);
         clipboardPreview[offset] = '.';
         clipboardPreview[offset+1] = '.';
         clipboardPreview[offset+2] = '.';
      }
      sprintf(
         headerString + strlen(headerString),
         " | CP: 0x%s",
         clipboardPreview
      );
   }
   gameEngine->frameBuffer->printMessage(
      headerString,
      Monaco9,
      0xffff,
      HEXED_BYTE_OFFSET_X,
      HEXED_BYTE_FOOTER_OFFSET_Y + (HEXED_BYTE_HEIGHT * (hexRows + 2))
   );
}

void MageHexEditor::renderHexEditor()
{
   if ((hexCursorLocation / bytesPerPage) == currentMemPage)
   {
      gameEngine->frameBuffer->fillRect(
         (hexCursorLocation % bytesPerPage % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X,
         (hexCursorLocation % bytesPerPage / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y,
         HEXED_BYTE_WIDTH,
         HEXED_BYTE_HEIGHT,
         0x38FF
      );
      if (isCopying)
      {
         for (uint8_t i = 1; i < gameEngine->gameControl->currentSave.clipboardLength; i++)
         {
            uint16_t copyCursorOffset = (hexCursorLocation + i) % bytesPerPage;
            gameEngine->frameBuffer->fillRect(
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

   auto dataPage = (uint8_t*)gameEngine->gameControl->Map()->entities.data() + pageOffset;
   uint16_t i = 0;
   std::string s(HEXED_BYTES_PER_ROW * 3, ' ');
   while (i < bytesPerPage && i + pageOffset < memTotal)
   {
      auto color = COLOR_WHITE;
      if (NO_PLAYER != gameEngine->gameControl->playerEntityIndex
         && i + pageOffset >= sizeof(MageEntity) * gameEngine->gameControl->playerEntityIndex
         && i + pageOffset < sizeof(MageEntity) * (gameEngine->gameControl->playerEntityIndex + 1))
      {
         color = COLOR_RED;
      }
      for (uint16_t j = 0; j < HEXED_BYTES_PER_ROW; i++, j++)
      {
         s[3 * j] = hexmap[(dataPage[i] & 0xF0) >> 4];
         s[3 * j + 1] = hexmap[dataPage[i] & 0x0F];
      }
      gameEngine->frameBuffer->printMessage(s.c_str(), Monaco9, color, 
         HEXED_BYTE_OFFSET_X, HEXED_BYTE_OFFSET_Y + ((i - 1) / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT);
   }
}

void MageHexEditor::runHex(uint8_t value)
{
   uint8_t* currentByte = (((uint8_t*)gameEngine->gameControl->Map()->entities.data()) + hexCursorLocation);
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
