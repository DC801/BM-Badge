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


void MageHexEditor::Update()
{
   applyMemRecallInputs();

   currentOp = inputHandler->IsPressed(KeyPress::Xor) ? HexOperation::XOR
      : inputHandler->IsPressed(KeyPress::Add) ? HexOperation::ADD
      : inputHandler->IsPressed(KeyPress::Sub) ? HexOperation::SUB
      : currentOp;

   if (!hexEditorOn || !playerHasHexEditorControl || disableMovement)
   {
      return;
   }

   const auto hexOpValue = static_cast<uint8_t>(
      (inputHandler->IsPressed(KeyPress::Bit128) ? 0b10000000 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit64) ? 0b01000000 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit32) ? 0b00100000 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit16) ? 0b00010000 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit8) ? 0b00001000 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit4) ? 0b00000100 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit2) ? 0b00000010 : 0) |
      (inputHandler->IsPressed(KeyPress::Bit1) ? 0b00000001 : 0)
      );

   uint8_t* currentByte = mapControl->GetEntityDataPointer() + hexCursorOffset;
   switch (currentOp)
   {
   case HexOperation::XOR:  *currentByte ^= hexOpValue; break;
   case HexOperation::ADD:  *currentByte += hexOpValue; break;
   case HexOperation::SUB:  *currentByte -= hexOpValue; break;
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
      //check to see if the page button was pressed and released quickly
      if (previousPageButtonState && GameClock::now() - lastPageButtonPressTime < TimeBetweenHexUpdates)
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
   if (anyHexMovement) {}

   bytesPerPage = dialogState ? 64 : 192;
   hexRows = ceil(float(bytesPerPage) / float(HEXED_BYTES_PER_ROW));
   memTotal = std::tuple_size<MapControl::EntityDataArray>{};
   totalMemPages = ceil(float(memTotal) / float(bytesPerPage));
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
   char headerString[128]{ " " };
   char clipboardPreview[24]{ " " };
   const auto entityDataPointer = mapControl->GetEntityDataPointer();
   const auto currentByteAddress = entityDataPointer + hexCursorOffset;
   const auto u1Value = *currentByteAddress;
   const auto u2Value = *(uint16_t*)((currentByteAddress - (hexCursorOffset % 2)));
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
}

void MageHexEditor::Draw()
{
   ledSet(LED_XOR, currentOp == HexOperation::XOR ? 0xFF : 0x00);
   ledSet(LED_ADD, currentOp == HexOperation::ADD ? 0xFF : 0x00);
   ledSet(LED_SUB, currentOp == HexOperation::SUB ? 0xFF : 0x00);

   ledSet(LED_PAGE, inputHandler->IsPressed(KeyPress::Page) ? 0xFF : 0x00);

   const auto entityDataPointer = mapControl->GetEntityDataPointer();
   const auto currentByte = *(entityDataPointer + hexCursorOffset);

   ledSet(LED_BIT128, ((currentByte >> 7) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT64, ((currentByte >> 6) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT32, ((currentByte >> 5) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT16, ((currentByte >> 4) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT8, ((currentByte >> 3) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT4, ((currentByte >> 2) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT2, ((currentByte >> 1) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_BIT1, ((currentByte >> 0) & 0x01) ? 0xFF : 0x00);
   ledSet(LED_MEM0, hexCursorOffset % sizeof(MageEntityData) == memOffsets[0] ? 0xFF : 0x00);
   ledSet(LED_MEM1, hexCursorOffset % sizeof(MageEntityData) == memOffsets[1] ? 0xFF : 0x00);
   ledSet(LED_MEM2, hexCursorOffset % sizeof(MageEntityData) == memOffsets[2] ? 0xFF : 0x00);
   ledSet(LED_MEM3, hexCursorOffset % sizeof(MageEntityData) == memOffsets[3] ? 0xFF : 0x00);

   if (!hexEditorOn)
   {
      return;
   }

   renderHexHeader();

   if ((hexCursorOffset / bytesPerPage) == currentMemPage)
   {
      const auto xCursorOffset = (hexCursorOffset % bytesPerPage % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X;
      const auto yCursorOffset = (hexCursorOffset % bytesPerPage / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y;
      frameBuffer->DrawFilledRect(xCursorOffset, yCursorOffset, HEXED_BYTE_WIDTH, HEXED_BYTE_HEIGHT, 0x38FF);
      if (isCopying)
      {
         for (uint8_t i = 1; i < clipboardLength; i++)
         {
            const auto copyCursorOffset = (hexCursorOffset + i) % bytesPerPage;
            const auto xCopyCursorOffset = (copyCursorOffset % bytesPerPage % HEXED_BYTES_PER_ROW) * HEXED_BYTE_WIDTH + HEXED_BYTE_OFFSET_X + HEXED_BYTE_CURSOR_OFFSET_X;
            const auto yCopyCursorOffset = (copyCursorOffset % bytesPerPage / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT + HEXED_BYTE_OFFSET_Y + HEXED_BYTE_CURSOR_OFFSET_Y;

            frameBuffer->DrawFilledRect(xCopyCursorOffset, yCopyCursorOffset, HEXED_BYTE_WIDTH, HEXED_BYTE_HEIGHT, 0x00EE);
         }
      }
   }

   constexpr char hexmap[] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

   const auto pageOffset = currentMemPage * bytesPerPage;
   const auto dataPage = entityDataPointer + pageOffset;
   auto i = 0;
   std::string s(HEXED_BYTES_PER_ROW * 3, ' ');
   while (i < bytesPerPage && i + pageOffset < memTotal)
   {
      const auto playerEntityIndex = mapControl->getPlayerEntityIndex();
      const auto color = NO_PLAYER_INDEX != playerEntityIndex
         && i + pageOffset >= sizeof(MageEntityData) * playerEntityIndex
         && i + pageOffset < sizeof(MageEntityData) * (playerEntityIndex + 1)
         ? COLOR_RED : COLOR_WHITE;

      for (uint16_t j = 0; j < HEXED_BYTES_PER_ROW; i++, j++)
      {
         s[3 * j] = hexmap[(dataPage[i] & 0xF0) >> 4];
         s[3 * j + 1] = hexmap[dataPage[i] & 0x0F];
      }
      frameBuffer->DrawText(s.c_str(), color,
         HEXED_BYTE_OFFSET_X, HEXED_BYTE_OFFSET_Y + ((i - 1) / HEXED_BYTES_PER_ROW) * HEXED_BYTE_HEIGHT);
   }
}

void MageHexEditor::openToEntity(uint8_t entityIndex)
{
   disableMovement = true;
   SetCursorOffset(entityIndex * sizeof(MageEntityData));
   setPageToCursorLocation();
   setHexEditorOn(true);
}


