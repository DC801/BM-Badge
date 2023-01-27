#include "mage_dialog_control.h"

#include "EngineInput.h"
#include "StringLoader.h"
#include "mage_map.h"
#include "mage_portrait.h"
#include "mage_script_actions.h"
#include "mage_script_control.h"
#include "mage_tileset.h"
#include <utility>

MageDialogAlignmentCoords alignments[ALIGNMENT_COUNT] = {
   { // BOTTOM_LEFT
      { 0, 8, 19, 6 },
      { 0, 6, 7, 3 },
      { 0, 1, 6, 6 }
   },
   { // BOTTOM_RIGHT
      { 0, 8, 19, 6 },
      { 12, 6, 7, 3 },
      { 13, 1, 6, 6 }
   },
   { // TOP_LEFT
      { 0, 0, 19, 6 },
      { 0, 5, 7, 3 },
      { 0, 7, 6, 6 }
   },
   { // TOP_RIGHT
      { 0, 0, 19, 6 },
      { 12, 5, 7, 3 },
      { 13, 7, 6, 6 }
   }
};

void MageDialogControl::load(uint16_t dialogId, int16_t currentEntityId)
{
   triggeringEntityName = mapControl->getEntityByMapLocalId(currentEntityId)->name;

   currentScreenIndex = 0;
   currentResponseIndex = 0;
   currentDialog = ROM()->GetUniqueCopy<MageDialog>(dialogId);

   loadNextScreen();

   open = true;
}

void MageDialogControl::StartModalDialog(std::string messageString)
{
   // Recycle all of the values set by the previous dialog to preserve look and feel
   // If there was no previous dialog... uhhhhhhh good luck with that?
   currentResponseIndex = 0;
   currentMessageIndex = 0;
   messageIds.clear();
   currentMessage = messageString;
   currentScreen().responseCount = 0;
   currentScreen().messageCount = 1;
   currentScreen().responseType = MageDialogResponseType::NO_RESPONSE;
   responses.clear();
   cursorPhase += 250;
   open = true;
   scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::loadNextScreen()
{
   currentMessageIndex = 0;
   if ((uint32_t)currentScreenIndex >= currentDialog->ScreenCount)
   {
      open = false;
      return;
   }

   currentEntityName = stringLoader->getString(currentScreen().nameStringIndex, triggeringEntityName);
   loadCurrentScreenPortrait();

   currentMessage = stringLoader->getString(currentScreen().messages[currentMessageIndex % currentScreen().messageCount], triggeringEntityName);
   currentFrameTileset = ROM()->GetReadPointerTo<MageTileset>(currentScreen().borderTilesetIndex);
   currentImageIndex = currentFrameTileset->ImageId();
   currentScreenIndex++;
   cursorPhase += 250;
}

void MageDialogControl::update()
{
   cursorPhase += MAGE_MIN_MILLIS_BETWEEN_FRAMES;
   auto activatedButton = inputHandler->GetButtonActivatedState();
   bool shouldAdvance = activatedButton.IsPressed(KeyPress::Rjoy_down)
      || activatedButton.IsPressed(KeyPress::Rjoy_left)
      || activatedButton.IsPressed(KeyPress::Rjoy_right)
      || MAGE_NO_MAP != mapControl->mapLoadId;

   if (shouldShowResponses())
   {
      currentResponseIndex += currentScreen().responseCount;
      if (activatedButton.IsPressed(KeyPress::Ljoy_up)) { currentResponseIndex -= 1; }
      if (activatedButton.IsPressed(KeyPress::Ljoy_down)) { currentResponseIndex += 1; }
      currentResponseIndex %= currentScreen().responseCount;
      if (shouldAdvance)
      {
         scriptControl->jumpScriptId = responses[currentResponseIndex].scriptIndex;
         open = false;
      }
   }
   else if (shouldAdvance)
   {
      currentMessageIndex++;
      cursorPhase = 250;
      if (currentMessageIndex >= currentScreen().messageCount)
      {
         loadNextScreen();
      }
      else
      {
         currentMessage = stringLoader->getString(messageIds[currentMessageIndex], triggeringEntityName);
      }
   }
}

void MageDialogControl::draw()
{
   MageDialogAlignmentCoords coords = alignments[(uint8_t)currentScreen().alignment];
   drawDialogBox(currentMessage, coords.text, true);
   drawDialogBox(currentEntityName, coords.label);
   if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
   {
      drawDialogBox("", coords.portrait, false, true);
   }
}

void MageDialogControl::drawDialogBox(const std::string& string, Rect box, bool drawArrow, bool drawPortrait) const
{
   uint16_t tileWidth = currentFrameTileset->TileWidth();
   uint16_t tileHeight = currentFrameTileset->TileHeight();
   uint16_t offsetX = (box.origin.x * tileWidth) + (tileWidth / 2);
   uint16_t offsetY = (box.origin.y * tileHeight) + (tileHeight / 2);
   uint16_t tilesetColumns = currentFrameTileset->Cols();
   uint16_t x;
   uint16_t y;
   uint8_t tileId;
   for (uint8_t i = 0; i < box.w; ++i)
   {
      for (uint8_t j = 0; j < box.h; ++j)
      {
         x = offsetX + (i * tileWidth);
         y = offsetY + (j * tileHeight);
         tileId = getTileIdFromXY(i, j, box);
         tileManager->DrawTile(currentFrameTileset, tileId, x, y);
      }
   }
   frameBuffer->printMessage(string, Monaco9, 0xffff, offsetX + tileWidth + 8, offsetY + tileHeight - 2);
   if (drawArrow)
   {
      static const auto TAU = 6.283185307179586;
      int8_t bounce = cos(((float)cursorPhase / 1000.0) * TAU) * 3;
      uint8_t flags{ 0 };
      if (shouldShowResponses())
      {
         flags = 0b00000011;
         x = offsetX + tileWidth + bounce;
         y = offsetY + ((currentResponseIndex + 2) * tileHeight * 0.75) + 6;
         // render all of the response labels
         for (int responseIndex = 0; responseIndex < currentScreen().responseCount; ++responseIndex)
         {
            frameBuffer->printMessage(
               stringLoader->getString(responses[responseIndex].stringIndex, triggeringEntityName),
               Monaco9, 0xffff,
               offsetX + (2 * tileWidth) + 8,
               offsetY + ((responseIndex + 2) * tileHeight * 0.75) + 2
            );
         }
      }
      else
      {
         // bounce the arrow at the bottom
         x = offsetX + ((box.w - 2) * tileWidth);
         y = offsetY + ((box.h - 2) * tileHeight) + bounce;
      }

      tileManager->DrawTile(currentFrameTileset, x, y, flags);
   }
   if (drawPortrait)
   {
      x = offsetX + tileWidth;
      y = offsetY + tileHeight;
      //mapControl->GetTile(currentPortraitRenderableData.tileId);
      tileManager->DrawTile(&currentPortraitRenderableData, x, y);
   }
}

uint8_t MageDialogControl::getTileIdFromXY(uint8_t x, uint8_t y, Rect box) const
{
   uint8_t tileId = DIALOG_TILES_CENTER_REPEAT;
   bool leftEdge = x == 0;
   bool rightEdge = x == (box.w - 1);
   bool topEdge = y == 0;
   bool bottomEdge = y == (box.h - 1);
   if (leftEdge && topEdge)
   {
      tileId = DIALOG_TILES_TOP_LEFT;
   }
   else if (rightEdge && topEdge)
   {
      tileId = DIALOG_TILES_TOP_RIGHT;
   }
   else if (topEdge)
   {
      tileId = DIALOG_TILES_TOP_REPEAT;
   }
   else 	if (leftEdge && bottomEdge)
   {
      tileId = DIALOG_TILES_BOTTOM_LEFT;
   }
   else if (rightEdge && bottomEdge)
   {
      tileId = DIALOG_TILES_BOTTOM_RIGHT;
   }
   else if (bottomEdge)
   {
      tileId = DIALOG_TILES_BOTTOM_REPEAT;
   }
   else if (rightEdge)
   {
      tileId = DIALOG_TILES_RIGHT_REPEAT;
   }
   else if (leftEdge)
   {
      tileId = DIALOG_TILES_LEFT_REPEAT;
   }
   return tileId;
}

void MageDialogControl::loadCurrentScreenPortrait()
{
   currentPortraitId = currentScreen().portraitIndex;
   // only try rendering when we have a portrait
   if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
   {
      if (currentScreen().entityIndex != NO_PLAYER)
      {
         auto currentEntity = mapControl->getEntity(currentScreen().entityIndex);
         uint8_t sanitizedPrimaryType = currentEntity.primaryIdType % NUM_PRIMARY_ID_TYPES;
         if (sanitizedPrimaryType == ENTITY_TYPE)
         {
            currentPortraitId = ROM()->GetReadPointerTo<MageEntityType>(currentEntity.primaryId)->PortraitId();
         }

         auto portrait = ROM()->GetReadPointerTo<MagePortrait>(currentPortraitId);
         auto animationDirection = portrait->getEmoteById(currentScreen().emoteIndex);
         currentEntity.SetRenderDirection(animationDirection->renderFlags);
         currentPortraitRenderableData.renderFlags = animationDirection->renderFlags | (currentEntity.renderFlags & 0x80);
         // if the portrait is on the right side of the screen, flip the portrait on the X axis
         if (((uint8_t)currentScreen().alignment % 2))
         {
            currentPortraitRenderableData.renderFlags ^= 0x04;
         }
      }

   }

}