#include "mage_dialog_control.h"

#include <utility>
#include "EngineInput.h"
#include "mage_portrait.h"
#include "mage_script_actions.h"
#include "convert_endian.h"

MageDialogAlignmentCoords alignments[ALIGNMENT_COUNT] = {
   { // BOTTOM_LEFT
      {
         0,
         8,
         19,
         6,
      },
      {
         0,
         6,
         7,
         3,
      },
      {
         0,
         1,
         6,
         6,
      }
   },
   { // BOTTOM_RIGHT
      {
         0,
         8,
         19,
         6,
      },
      {
         12,
         6,
         7,
         3,
      },
      {
         13,
         1,
         6,
         6,
      }
   },
   { // TOP_LEFT
      {
         0,
         0,
         19,
         6,
      },
      {
         0,
         5,
         7,
         3,
      },
      {
         0,
         7,
         6,
         6,
      }
   },
   { // TOP_RIGHT
      {
         0,
         0,
         19,
         6,
      },
      {
         12,
         5,
         7,
         3,
      },
      {
         13,
         7,
         6,
         6,
      }
   }
};

uint32_t MageDialogControl::size()
{
   return (
      0
      + sizeof(currentFrameTileset)
      + sizeof(triggeringEntityId)
      + sizeof(currentDialogIndex)
      + sizeof(currentDialogAddress)
      + sizeof(currentDialogScreenCount)
      + sizeof(currentScreenIndex)
      + sizeof(currentMessageIndex)
      + sizeof(currentMessageIndex)
      + sizeof(currentImageAddress)
      + sizeof(cursorPhase)
      + sizeof(currentResponseIndex)
      + sizeof(currentPortraitId)
      + sizeof(currentScreen)
      + sizeof(std::string) // currentEntityName
      + sizeof(std::string) // currentMessage
      + sizeof(uint16_t) * currentScreen->messageCount // messageIds
      + sizeof(MageDialogResponse) * currentScreen->responseCount // responses
      + sizeof(isOpen)
      );
}

void MageDialogControl::load(
   uint16_t dialogId,
   int16_t currentEntityId
)
{
   if (gameEngine->hexEditor->getHexEditorState())
   {
      gameEngine->hexEditor->toggleHexEditor();
   }
   triggeringEntityId = currentEntityId;
   currentDialogIndex = dialogId;
   currentScreenIndex = 0;
   currentResponseIndex = 0;
   currentDialogAddress = gameEngine->gameControl->getDialogAddress(dialogId);
   currentDialogAddress += 32; // skip past the name

   gameEngine->ROM->Read(
      currentDialogAddress,
      sizeof(currentDialogScreenCount),
      (uint8_t*)&currentDialogScreenCount,
      "Failed to read Dialog property 'currentDialogScreenCount'"
   );
   currentDialogScreenCount = ROM_ENDIAN_U4_VALUE(currentDialogScreenCount);
   currentDialogAddress += sizeof(currentDialogScreenCount);

   loadNextScreen();

   isOpen = true;
   mapLocalJumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::showSaveMessageDialog(std::string messageString)
{
   // Recycle all of the values set by the previous dialog to preserve look and feel
   // If there was no previous dialog... uhhhhhhh good luck with that?
   // Saves should always be confirmed. That is my strong opinion.
   currentResponseIndex = 0;
   currentMessageIndex = 0;
   messageIds = std::make_unique<uint16_t[]>(1);
   currentMessage = messageString;
   currentScreen->responseCount = 0;
   currentScreen->messageCount = 1;
   currentScreen->responseType = NO_RESPONSE;
   responses = std::make_unique<MageDialogResponse[]>(0);
   cursorPhase += 250;
   isOpen = true;
   mapLocalJumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::loadNextScreen()
{
   currentMessageIndex = 0;
   if ((uint32_t)currentScreenIndex >= currentDialogScreenCount)
   {
      isOpen = false;
      return;
   }
   uint8_t sizeOfDialogScreenStruct = sizeof(currentScreen);
   gameEngine->ROM->Read(
      currentDialogAddress,
      sizeOfDialogScreenStruct,
      (uint8_t*)&currentScreen,
      "Failed to read Dialog property 'currentScreen'"
   );
   currentScreen->nameStringIndex = ROM_ENDIAN_U2_VALUE(currentScreen->nameStringIndex);
   currentScreen->borderTilesetIndex = ROM_ENDIAN_U2_VALUE(currentScreen->borderTilesetIndex);
   currentDialogAddress += sizeOfDialogScreenStruct;
   currentEntityName = gameEngine->gameControl->getString(currentScreen->nameStringIndex, triggeringEntityId);
   loadCurrentScreenPortrait();

   uint8_t sizeOfMessageIndex = sizeof(uint16_t);
   uint32_t sizeOfScreenMessageIds = sizeOfMessageIndex * currentScreen->messageCount;
   messageIds.reset();
   messageIds = std::make_unique<uint16_t[]>(currentScreen->messageCount);
   gameEngine->ROM->Read(
      currentDialogAddress,
      sizeOfScreenMessageIds,
      (uint8_t*)messageIds.get(),
      "Failed to read Dialog property 'messageIds'"
   );
   ROM_ENDIAN_U2_BUFFER(messageIds.get(), currentScreen->messageCount);
   currentDialogAddress += sizeOfScreenMessageIds;
   currentMessage = gameEngine->gameControl->getString(
      messageIds[currentMessageIndex],
      triggeringEntityId
   );
   uint8_t sizeOfResponse = sizeof(MageDialogResponse);
   uint32_t sizeOfResponses = sizeOfResponse * currentScreen->responseCount;
   responses.reset();
   responses = std::make_unique<MageDialogResponse[]>(currentScreen->responseCount);
   gameEngine->ROM->Read(
      currentDialogAddress,
      sizeOfResponses,
      (uint8_t*)responses.get(),
      "Failed to read Dialog property 'responses'"
   );
   for (int responseIndex = 0; responseIndex < currentScreen->responseCount; ++responseIndex)
   {
      responses[responseIndex].stringIndex = ROM_ENDIAN_U2_VALUE(responses[responseIndex].stringIndex);
      responses[responseIndex].mapLocalScriptIndex = ROM_ENDIAN_U2_VALUE(responses[responseIndex].mapLocalScriptIndex);
      // debug_print(
      // 	"currentDialogIndex: %d\r\n"
      // 	"responseIndex: %d\r\n"
      // 	"response.stringIndex: %d\r\n"
      // 	"response.mapLocalScriptIndex: %d\r\n",
      // 	currentDialogIndex,
      // 	responseIndex,
      // 	responses[responseIndex].stringIndex,
      // 	responses[responseIndex].mapLocalScriptIndex
      // );
   }
   currentDialogAddress += sizeOfResponses;

   // padding at the end of the screen struct
   currentDialogAddress += ((currentScreen->messageCount) % 2) * sizeOfMessageIndex;

   currentFrameTileset = gameEngine->gameControl->getValidTileset(currentScreen->borderTilesetIndex);
   currentImageIndex = currentFrameTileset->ImageId();
   currentImageAddress = gameEngine->gameControl->getImageAddress(
      currentImageIndex
   );
   currentScreenIndex++;
   cursorPhase += 250;
}

void MageDialogControl::advanceMessage()
{
   currentMessageIndex++;
   cursorPhase = 250;
   if (currentMessageIndex >= currentScreen->messageCount)
   {
      loadNextScreen();
   }
   else
   {
      currentMessage = gameEngine->gameControl->getString(
         messageIds[currentMessageIndex],
         triggeringEntityId
      );
   }
}

void MageDialogControl::closeDialog()
{
   isOpen = false;
   mapLocalJumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::update()
{
   cursorPhase += MAGE_MIN_MILLIS_BETWEEN_FRAMES;
   bool shouldAdvance = (
      gameEngine->inputHandler->GetButtonActivatedState(Button::rjoy_down)
      || gameEngine->inputHandler->GetButtonActivatedState(Button::rjoy_left)
      || gameEngine->inputHandler->GetButtonActivatedState(Button::rjoy_right)
      || (gameEngine->scriptControl->mapLoadId != MAGE_NO_MAP)
      );
   if (shouldShowResponses())
   {
      currentResponseIndex += currentScreen->responseCount;
      if (gameEngine->inputHandler->GetButtonActivatedState(Button::ljoy_up)) { currentResponseIndex -= 1; }
      if (gameEngine->inputHandler->GetButtonActivatedState(Button::ljoy_down)) { currentResponseIndex += 1; }
      currentResponseIndex %= currentScreen->responseCount;
      if (shouldAdvance)
      {
         mapLocalJumpScriptId = responses[currentResponseIndex].mapLocalScriptIndex;
         isOpen = false;
      }
   }
   else if (shouldAdvance)
   {
      advanceMessage();
   }
}

bool MageDialogControl::shouldShowResponses() const
{
   return (
      // last page of messages on this screen
      currentMessageIndex == (currentScreen->messageCount - 1)
      // and we have responses
      && (
         currentScreen->responseType == SELECT_FROM_SHORT_LIST
         || currentScreen->responseType == SELECT_FROM_LONG_LIST
         )
      );
}

void MageDialogControl::draw()
{
   MageDialogAlignmentCoords coords = alignments[currentScreen->alignment];
   drawDialogBox(currentMessage, coords.text, true);
   drawDialogBox(currentEntityName, coords.label);
   if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
   {
      drawDialogBox("", coords.portrait, false, true);
   }
}

void MageDialogControl::drawDialogBox(
   const std::string& string,
   Rect box,
   bool drawArrow,
   bool drawPortrait
)
{
   uint16_t tileWidth = currentFrameTileset->TileWidth();
   uint16_t tileHeight = currentFrameTileset->TileHeight();
   uint16_t offsetX = (box.x * tileWidth) + (tileWidth / 2);
   uint16_t offsetY = (box.y * tileHeight) + (tileHeight / 2);
   uint16_t tilesetColumns = currentFrameTileset->Cols();
   uint16_t imageWidth = currentFrameTileset->ImageWidth();
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
         gameEngine->frameBuffer->drawChunkWithFlags(
            currentImageAddress,
            gameEngine->gameControl->getValidColorPalette(currentImageIndex),
            x,
            y,
            tileWidth,
            tileHeight,
            (tileId % tilesetColumns) * tileWidth,
            (tileId / tilesetColumns) * tileHeight,
            imageWidth,
            TRANSPARENCY_COLOR,
            0
         );
      }
   }
   gameEngine->frameBuffer->printMessage(
      string.c_str(),
      Monaco9,
      0xffff,
      offsetX + tileWidth + 8,
      offsetY + tileHeight - 2
   );
   if (drawArrow)
   {
      static const auto TAU = 6.283185307179586;
      int8_t bounce = cos(((float)cursorPhase / 1000.0) * TAU) * 3;
      uint8_t flags = 0;
      if (shouldShowResponses())
      {
         flags = 0b00000011;
         x = offsetX + tileWidth + bounce;
         y = offsetY + ((currentResponseIndex + 2) * tileHeight * 0.75) + 6;
         // render all of the response labels
         for (int responseIndex = 0; responseIndex < currentScreen->responseCount; ++responseIndex)
         {
            gameEngine->frameBuffer->printMessage(
               gameEngine->gameControl->getString(
                  responses[responseIndex].stringIndex,
                  triggeringEntityId
               ).c_str(),
               Monaco9,
               0xffff,
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
      gameEngine->frameBuffer->drawChunkWithFlags(
         currentImageAddress,
         gameEngine->gameControl->getValidColorPalette(currentImageIndex),
         x,
         y,
         tileWidth,
         tileHeight,
         (DIALOG_TILES_ARROW % tilesetColumns) * tileWidth,
         (DIALOG_TILES_ARROW / tilesetColumns) * tileHeight,
         imageWidth,
         TRANSPARENCY_COLOR,
         flags
      );
   }
   if (drawPortrait)
   {
      x = offsetX + tileWidth;
      y = offsetY + tileHeight;
      tileId = currentPortraitRenderableData.tileId;
      MageTileset* tileset = gameEngine->gameControl->getValidTileset(currentPortraitRenderableData.tilesetId);
      uint8_t portraitFlags = currentPortraitRenderableData.renderFlags;
      gameEngine->frameBuffer->drawChunkWithFlags(
         gameEngine->gameControl->getImageAddress(tileset->ImageId()),
         gameEngine->gameControl->getValidColorPalette(tileset->ImageId()),
         x,
         y,
         tileset->TileWidth(),
         tileset->TileHeight(),
         (tileId % tileset->Cols()) * tileset->TileWidth(),
         (tileId / tileset->Cols()) * tileset->TileHeight(),
         tileset->ImageWidth(),
         TRANSPARENCY_COLOR,
         portraitFlags
      );
   }
}

uint8_t MageDialogControl::getTileIdFromXY(
   uint8_t x,
   uint8_t y,
   Rect box
)
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
   currentPortraitId = currentScreen->portraitIndex;
   if (currentScreen->entityIndex != NO_PLAYER)
   {
      uint8_t entityIndex = gameEngine->scriptActions->getUsefulEntityIndexFromActionEntityId(
         currentScreen->entityIndex,
         triggeringEntityId
      );
      auto currentEntity = gameEngine->gameControl->getEntityByMapLocalId(entityIndex);
      if (currentEntity)
      {
         uint8_t sanitizedPrimaryType = currentEntity->primaryIdType % NUM_PRIMARY_ID_TYPES;
         if (sanitizedPrimaryType == ENTITY_TYPE)
         {
            MageEntityType* entityType = gameEngine->gameControl->getValidEntityType(currentEntity->primaryId);
            currentPortraitId = entityType->PortraitId();
         }
      }

      // only try rendering when we have a portrait
      if (currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT)
      {
         uint32_t portraitAddress = gameEngine->gameControl->getPortraitAddress(currentPortraitId);
         auto portrait = std::make_unique<MagePortrait>(gameEngine->ROM, portraitAddress);
         MageEntityTypeAnimationDirection* animationDirection = portrait->getEmoteById(currentScreen->emoteIndex);
         gameEngine->gameControl->getRenderableStateFromAnimationDirection(
            &currentPortraitRenderableData,
            currentEntity,
            animationDirection
         );
         currentPortraitRenderableData.renderFlags = animationDirection->RenderFlags();
         currentPortraitRenderableData.renderFlags |= (currentEntity->direction & 0x80);
         // if the portrait is on the right side of the screen, flip the portrait on the X axis
         if ((currentScreen->alignment % 2) == 1)
         {
            currentPortraitRenderableData.renderFlags ^= 0x04;
         }
      }
   }

}
