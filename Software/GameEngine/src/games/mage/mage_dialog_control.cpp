#include "mage_dialog_control.h"

#include "EngineInput.h"
#include "StringLoader.h"
#include "mage_map.h"
#include "mage_portrait.h"
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
   triggeringEntityName = mapControl->getEntityByMapLocalId(currentEntityId).name;

   currentScreenIndex = 0;
   currentResponseIndex = 0;
   currentDialogId = dialogId;
   loadNextScreen();
   open = true;
}

void MageDialogControl::StartModalDialog(std::string messageString)
{
   // Recycle all of the values set by the previous dialog to preserve look and feel
   // If there was no previous dialog... uhhhhhhh good luck with that?
   currentResponseIndex = 0;
   currentMessageIndex = 0;
   currentMessage = messageString;
   responses.clear();
   cursorPhase += 250;
   open = true;
}

void MageDialogControl::loadNextScreen()
{
   currentDialog = ROM()->GetReadPointerByIndex<MageDialog>(currentDialogId);
   currentMessageIndex = 0;
   if (currentScreenIndex >= currentDialog->ScreenCount)
   {
      open = false;
      return;
   }

   auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   currentEntityName = stringLoader->getString(currentScreen.nameStringIndex, triggeringEntityName);
   loadCurrentScreenPortrait();

   auto messageId = currentScreen.GetMessage(currentMessageIndex);
   currentMessage = stringLoader->getString(messageId, triggeringEntityName);
   currentFrameTilesetIndex = currentScreen.borderTilesetIndex;
   currentScreenIndex++;
   cursorPhase += 250;
}

std::optional<uint16_t> MageDialogControl::update(const DeltaState& delta)
{
   cursorPhase += MAGE_MIN_MILLIS_BETWEEN_FRAMES;
   bool shouldAdvance = delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_down)
      || delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_left)
      || delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_right)
      || MAGE_NO_MAP != mapControl->mapLoadId;

   auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   if (shouldShowResponses())
   {
      currentResponseIndex += currentScreen.responseCount;
      if (delta.ActivatedButtons.IsPressed(KeyPress::Ljoy_up)) { currentResponseIndex -= 1; }
      if (delta.ActivatedButtons.IsPressed(KeyPress::Ljoy_down)) { currentResponseIndex += 1; }
      currentResponseIndex %= currentScreen.responseCount;
      if (shouldAdvance)
      {
         open = false;
         return responses[currentResponseIndex].scriptIndex;
      }
   }
   else if (shouldAdvance)
   {
      currentMessageIndex++;
      cursorPhase = 0;
      if (currentMessageIndex >= currentScreen.messageCount)
      {
         loadNextScreen();
      }
      else
      {
         auto currentMessageId = currentScreen.GetMessage(currentMessageIndex);
         currentMessage = stringLoader->getString(currentMessageId, triggeringEntityName);
      }
   }
   return std::nullopt;
}

void MageDialogControl::draw()
{
   if (currentScreenIndex >= currentDialog->ScreenCount)
   {
      open = false;
      return;
   }

   auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   MageDialogAlignmentCoords coords = alignments[(uint8_t)currentScreen.alignment % ALIGNMENT_COUNT];
   drawDialogBox(currentMessage, coords.text, true);
   drawDialogBox(currentEntityName, coords.label);
   if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
   {
      drawDialogBox("", coords.portrait, false, true);
   }
}

void MageDialogControl::drawDialogBox(const std::string& string, const Rect& box, bool drawArrow, bool drawPortrait) const
{
   auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentFrameTilesetIndex);
   auto tileWidth = tileset->TileWidth;
   auto tileHeight = tileset->TileHeight;
   auto offsetX = (box.origin.x * tileWidth) + (tileWidth / 2);
   auto offsetY = (box.origin.y * tileHeight) + (tileHeight / 2);
   for (uint8_t x = 0; x < box.w; ++x)
      for (uint8_t y = 0; y < box.h; ++y)
      {
         uint8_t tileId = DIALOG_TILES_CENTER_REPEAT;
         auto leftEdge = bool{ x == 0 };
         auto rightEdge = bool{ x == (box.w - 1) };
         auto topEdge = bool{ y == 0 };
         auto bottomEdge = bool{ y == (box.h - 1) };
         if (leftEdge)
         {
            tileId = DIALOG_TILES_LEFT_REPEAT;
            if (topEdge) { tileId = DIALOG_TILES_TOP_LEFT; }
            else if (bottomEdge) { tileId = DIALOG_TILES_BOTTOM_LEFT; }
         }
         else if (rightEdge)
         {
            tileId = DIALOG_TILES_RIGHT_REPEAT;
            if (topEdge) { tileId = DIALOG_TILES_TOP_RIGHT; }
            else if (bottomEdge) { tileId = DIALOG_TILES_BOTTOM_RIGHT; }
         }
         else if (topEdge) { tileId = DIALOG_TILES_TOP_REPEAT; }
         else if (bottomEdge) { tileId = DIALOG_TILES_BOTTOM_REPEAT; }

         auto target = Point{ offsetX + (x * tileWidth), offsetY + (y * tileHeight) };
         tileManager->DrawTile(currentFrameTilesetIndex, tileId, target);
      }

   frameBuffer->printMessage(string, Monaco9, 0xffff, offsetX + tileWidth + 8, offsetY + tileHeight - 2);

   if (drawArrow)
   {
      static const auto TAU = 6.283185307179586f;
      int8_t bounce = cos(((float)cursorPhase / 1000.0f) * TAU) * 3;
      if (shouldShowResponses())
      {
         auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
         // render all of the response labels
         for (int responseIndex = 0; responseIndex < currentScreen.responseCount; ++responseIndex)
         {
            frameBuffer->printMessage(
               stringLoader->getString(responses[responseIndex].stringIndex, triggeringEntityName),
               Monaco9, 0xffff,
               offsetX + (2 * tileWidth) + 8,
               offsetY + ((responseIndex + 2) * tileHeight * 0.75) + 2
            );
         }
         auto targetPoint = Point{ offsetX + tileWidth, offsetY + ((currentResponseIndex + 2) * (tileHeight / 2 + tileHeight / 4)) + 6  + bounce};
         tileManager->DrawTile(currentFrameTilesetIndex, tileset->ImageId, targetPoint);
      }
      else
      {
         auto targetPoint = Point{ offsetX + ((box.w - 2) * tileWidth), offsetY + ((box.h - 2) * tileHeight) + bounce };
         // bounce the arrow at the bottom
         tileManager->DrawTile(currentFrameTilesetIndex, tileset->ImageId, targetPoint);
      }
   }

   if (drawPortrait)
   {
      auto portraitDrawPoint = Point{ offsetX + tileWidth, offsetY + tileHeight };
      tileManager->DrawTile(currentPortraitRenderableData.tilesetId, currentPortraitRenderableData.tileId, portraitDrawPoint, currentPortraitRenderableData.renderFlags);
   }
}

void MageDialogControl::loadCurrentScreenPortrait()
{
   auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   currentPortraitId = currentScreen.portraitIndex;
   // only try rendering when we have a portrait
   if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
   {
      if (currentScreen.entityIndex != NO_PLAYER_INDEX)
      {
         auto currentEntity = mapControl->tryGetEntity(currentScreen.entityIndex);
         uint8_t sanitizedPrimaryType = currentEntity.value()->primaryIdType % NUM_PRIMARY_ID_TYPES;
         if (sanitizedPrimaryType == ENTITY_TYPE)
         {
            currentPortraitId = ROM()->GetReadPointerByIndex<MageEntityType>(currentEntity.value()->primaryId)->portraitId;
         }

         auto portrait = ROM()->GetReadPointerByIndex<MagePortrait>(currentPortraitId);
         auto animationDirection = portrait->getEmoteById(currentScreen.emoteIndex);
         currentEntity.value()->direction = animationDirection->renderFlags;
         currentPortraitRenderableData.renderFlags = animationDirection->renderFlags | (currentEntity.value()->direction & 0x80);
         // if the portrait is on the right side of the screen, flip the portrait on the X axis
         if (((uint8_t)currentScreen.alignment % 2))
         {
            currentPortraitRenderableData.renderFlags |= RENDER_FLAGS_FLIP_X;
         }
      }

   }

}