#include "mage_dialog_control.h"

#include "mage_entity.h"
#include "mage_map.h"
#include "mage_portrait.h"
#include "FrameBuffer.h"
#include <utility>

static const inline auto TimeBetweenSelectionChange = GameClock::duration{ 150 };

const MageDialogAlignmentCoords alignments[ALIGNMENT_COUNT] = {
   { // BOTTOM_LEFT
      .text = { 0, 8, 19, 6 },
      .label = { 0, 6, 7, 3 },
      .portrait = { 0, 1, 6, 6 }
   },
   { // BOTTOM_RIGHT
      .text = { 0, 8, 19, 6 },
      .label = { 12, 6, 7, 3 },
      .portrait = { 13, 1, 6, 6 }
   },
   { // TOP_LEFT
      .text = { 0, 0, 19, 6 },
      .label = { 0, 5, 7, 3 },
      .portrait = { 0, 7, 6, 6 }
   },
   { // TOP_RIGHT
      .text = { 0, 0, 19, 6 },
      .label = { 12, 5, 7, 3 },
      .portrait = { 13, 7, 6, 6 }
   }
};

void MageDialogControl::load(uint16_t dialogId, std::string name)
{
   triggeringEntityName = name;

   currentScreenIndex = 0;
   currentResponseIndex = 0;
   currentDialog = ROM()->GetReadPointerByIndex<MageDialog>(dialogId);
   loadNextScreen();
   open = true;
}

void MageDialogControl::StartModalDialog(std::string messageString)
{
   if (currentDialog)
   {
      // Recycle all of the values set by the previous dialog to preserve look and feel
      // If there was no previous dialog... uhhhhhhh good luck with that?
      currentResponseIndex = 0;
      currentMessageId = 0;
      currentMessage = messageString;
      open = true;
      nextUpdateAllowed = GameClock::now() + TimeBetweenSelectionChange;
   }
}

void MageDialogControl::loadNextScreen()
{
   currentMessageId = 0;
   if (currentScreenIndex >= currentDialog->ScreenCount)
   {
      open = false;
      return;
   }

   const auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   loadCurrentScreenPortrait();

   currentMessage = currentScreen.GetMessage(stringLoader, currentMessageId, triggeringEntityName);
   currentFrameTilesetIndex = currentScreen.borderTilesetIndex;

   currentScreenIndex++;
   nextUpdateAllowed = GameClock::now() + TimeBetweenSelectionChange;
}

std::optional<uint16_t> MageDialogControl::Update()
{
   cursorPhase += IntegrationStepSize.count();
   if (!isOpen())
   {
      return std::nullopt;
   }

   const auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   if (shouldShowResponses(currentScreen))
   {
      if (GameClock::now() > nextUpdateAllowed)
      {
         if (inputHandler->PreviousDialogResponse())
         {
            currentResponseIndex++;
         }
         if (inputHandler->NextDialogResponse())
         {
            currentResponseIndex--;
         }
         currentResponseIndex %= currentScreen.responseCount;

         nextUpdateAllowed = GameClock::now() + TimeBetweenSelectionChange;
      }

      if (inputHandler->SelectDialogResponse())
      {
         open = false;
         if (currentResponseIndex < currentScreen.responseCount)
         {
            return currentScreen.GetResponse(currentResponseIndex).scriptId;
         }
         nextUpdateAllowed = GameClock::now() + TimeBetweenSelectionChange;
      }
   }

   const auto shouldAdvance = inputHandler->AdvanceDialog() || MAGE_NO_MAP != mapControl->mapLoadId;

   if (shouldAdvance)
   {
      currentMessageId++;
      if (currentMessageId >= currentScreen.messageCount)
      {
         loadNextScreen();
      }
      else
      {
         currentMessage = currentScreen.GetMessage(stringLoader, currentMessageId, triggeringEntityName);
      }
   }
   return std::nullopt;
}

void MageDialogControl::Draw() const
{
   if (!open)
   {
      return;
   }

   const auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
   const auto coords = alignments[(uint8_t)currentScreen.alignment % ALIGNMENT_COUNT];
   const auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentFrameTilesetIndex);

   if (!currentEntityName.empty())
   {
      const auto labelX = (uint16_t)((coords.label.origin.x * tileset->TileWidth) + (tileset->TileWidth / 2));
      const auto labelY = (uint16_t)((coords.label.origin.y * tileset->TileHeight) + (tileset->TileHeight / 2));
      drawBackground(EntityRect{ labelX, labelY, coords.label.w, coords.label.h });
      frameBuffer->DrawText(currentEntityName, COLOR_WHITE, labelX + tileset->TileWidth + 8, labelY + tileset->TileHeight - 2);
   }

   const auto messageX = (uint16_t)((coords.text.origin.x * tileset->TileWidth) + (tileset->TileWidth / 2));
   const auto messageY = (uint16_t)((coords.text.origin.y * tileset->TileHeight) + (tileset->TileHeight / 2));
   drawBackground(EntityRect{ messageX, messageY, coords.text.w, coords.text.h });
   frameBuffer->DrawText(currentMessage, COLOR_WHITE, messageX + tileset->TileWidth + 8, messageY + tileset->TileHeight - 2);
   
   static const auto TAU = 6.28318f;
   const auto bounce = static_cast<int8_t>(cos((static_cast<float>(cursorPhase) / 1000.0f) * TAU) * 3);
   auto arrowX = 0;
   auto arrowY = 0;
   if (shouldShowResponses(currentScreen))
   {
      arrowX = messageX + tileset->TileWidth + bounce;
      arrowY = messageY + ((currentResponseIndex + 2) * tileset->TileHeight * 0.75) + 6;
      // render all of the response labels
      for (int responseIndex = 0; responseIndex < currentScreen.responseCount; ++responseIndex)
      {
         const auto responseText = stringLoader->GetString(currentScreen.GetResponse(responseIndex).stringId, triggeringEntityName);
         const auto responseX = messageX + tileset->TileWidth + 6;
         const auto responseY = tileset->TileHeight * (responseIndex + 1) + messageY + tileset->TileHeight - 2;
         if (responseIndex == currentResponseIndex)
         {
            frameBuffer->DrawText(responseText, COLOR_WHITE, responseX + tileset->TileWidth, responseY);
         }
         else
         {
            frameBuffer->DrawText(responseText, COLOR_WHITE, responseX, responseY);
         }
      }
   }
   else
   {
      // bounce the arrow at the bottom when we don't have responses
      arrowX = messageX + ((coords.text.w - 2) * tileset->TileWidth);
      arrowY = messageY + ((coords.text.h - 2) * tileset->TileHeight) + bounce;
   }
   frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_ARROW, arrowX, arrowY, RENDER_FLAGS_FLIP_DIAG);

   if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
   {
      frameBuffer->DrawTileScreenCoords(currentPortraitRenderableData.tilesetId, currentPortraitRenderableData.tileId, messageX + tileset->TileWidth, messageY + tileset->TileHeight, currentPortraitRenderableData.renderFlags);
   }
}

void MageDialogControl::drawBackground(const EntityRect& box) const
{
   const auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(currentFrameTilesetIndex);
   for (auto x = 0; x < box.w; x++)
   {
      for (auto y = box.h; y < box.h; y++)
      {
         const auto leftEdge = x == 0;
         const auto rightEdge = x == (box.w - 1);
         const auto topEdge = y == 0;
         const auto bottomEdge = y == (box.h - 1);

         const auto drawX = x * tileset->TileWidth + box.origin.x;
         const auto drawY = y * tileset->TileHeight + box.origin.y;

         if (leftEdge)
         {
            if (topEdge)
            {
               frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_TOP_LEFT, drawX, drawY);
            }
            else if (bottomEdge)
            {
               frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_BOTTOM_LEFT, drawX, drawY);
            }
            else
            {
               frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_LEFT_REPEAT, drawX, drawY);
            }
         }
         else if (rightEdge)
         {
            if (topEdge)
            {
               frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_TOP_RIGHT, drawX, drawY);
            }
            else if (bottomEdge)
            {
               frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_BOTTOM_RIGHT, drawX, drawY);
            }
            else
            {
               frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_RIGHT_REPEAT, drawX, drawY);
            }
         }
         else if (topEdge)
         {
            frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_TOP_REPEAT, drawX, drawY);
         }
         else if (bottomEdge)
         {
            frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_BOTTOM_REPEAT, drawX, drawY);
         }
         else //background
         {
            frameBuffer->DrawTileScreenCoords(currentFrameTilesetIndex, DIALOG_TILES_CENTER_REPEAT, drawX, drawY);
         }
      }
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
         auto& currentEntity = mapControl->Get<MageEntityData>(currentScreen.entityIndex);
         if (currentEntity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
         {
            currentPortraitId = ROM()->GetReadPointerByIndex<MageEntityType>(currentEntity.primaryId)->portraitId;
         }

         auto portrait = ROM()->GetReadPointerByIndex<MagePortrait>(currentPortraitId);
         auto animationDirection = portrait->getEmoteById(currentScreen.emoteIndex);
         currentEntity.flags = animationDirection->renderFlags;

         // if the portrait is on the right side of the screen, flip the portrait on the X axis
         if (((uint8_t)currentScreen.alignment % 2))
         {
            currentPortraitRenderableData.renderFlags |= RENDER_FLAGS_FLIP_X;
         }
      }
   }
}
