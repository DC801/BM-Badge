#include "mage_dialog_control.h"

#include <utility>
#include "mage_portrait.h"
extern FrameBuffer *mage_canvas;
extern MageGameControl *MageGame;
extern MageScriptControl *MageScript;

MageDialogAlignmentCoords alignments[ALIGNMENT_COUNT] = {
	{ // BOTTOM_LEFT
		.text = {
			.x = 0,
			.y = 8,
			.w = 19,
			.h = 6,
		},
		.label = {
			.x = 0,
			.y = 6,
			.w = 7,
			.h = 3,
		},
		.portrait = {
			.x = 0,
			.y = 1,
			.w = 6,
			.h = 6,
		}
	},
	{ // BOTTOM_RIGHT
		.text = {
			.x = 0,
			.y = 8,
			.w = 19,
			.h = 6,
		},
		.label = {
			.x = 12,
			.y = 6,
			.w = 7,
			.h = 3,
		},
		.portrait = {
			.x = 13,
			.y = 1,
			.w = 6,
			.h = 6,
		}
	},
	{ // TOP_LEFT
		.text = {
			.x = 0,
			.y = 0,
			.w = 19,
			.h = 6,
		},
		.label = {
			.x = 0,
			.y = 5,
			.w = 7,
			.h = 3,
		},
		.portrait = {
			.x = 0,
			.y = 7,
			.w = 6,
			.h = 6,
		}
	},
	{ // TOP_RIGHT
		.text = {
			.x = 0,
			.y = 0,
			.w = 19,
			.h = 6,
		},
		.label = {
			.x = 12,
			.y = 5,
			.w = 7,
			.h = 3,
		},
		.portrait = {
			.x = 13,
			.y = 7,
			.w = 6,
			.h = 6,
		}
	}
};

MageDialogControl::MageDialogControl() {
	isOpen = false;
	mapLocalJumpScriptId = MAGE_NO_SCRIPT;
	triggeringEntityId = 0;
	currentDialogIndex = 0;
	currentDialogAddress = 0;
	currentDialogScreenCount = 0;
	currentScreenIndex = 0;
	currentMessageIndex = 0;
	currentImageAddress = 0;
	cursorPhase = 0;
	currentResponseIndex = 0;
	currentPortraitId = DIALOG_SCREEN_NO_PORTRAIT;
	currentPortraitRenderableData = {};
	messageIds = std::make_unique<uint16_t[]>(0);
	responses = std::make_unique<MageDialogResponse[]>(0);
	currentScreen = {0};
}

uint32_t MageDialogControl::size() {
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
		+ sizeof(uint16_t) * currentScreen.messageCount // messageIds
		+ sizeof(MageDialogResponse) * currentScreen.responseCount // responses
		+ sizeof(isOpen)
	);
}

void MageDialogControl::load(
	uint16_t dialogId,
	int16_t currentEntityId
) {
	triggeringEntityId = currentEntityId;
	currentDialogIndex = dialogId;
	currentScreenIndex = 0;
	currentResponseIndex = 0;
	currentDialogAddress = MageGame->getDialogAddress(dialogId);
	currentDialogAddress += 32; // skip past the name

	EngineROM_Read(
		currentDialogAddress,
		sizeof(currentDialogScreenCount),
		(uint8_t *)&currentDialogScreenCount,
		"Failed to read Dialog property 'currentDialogScreenCount'"
	);
	currentDialogScreenCount = ROM_ENDIAN_U4_VALUE(currentDialogScreenCount);
	currentDialogAddress += sizeof(currentDialogScreenCount);

	loadNextScreen();

	isOpen = true;
	mapLocalJumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::showSaveMessageDialog(std::string messageString) {
	// Recycle all of the values set by the previous dialog to preserve look and feel
	// If there was no previous dialog... uhhhhhhh good luck with that?
	// Saves should always be confirmed. That is my strong opinion.
	currentResponseIndex = 0;
	currentMessageIndex = 0;
	messageIds.reset();
	messageIds = std::make_unique<uint16_t[]>(1);
	currentMessage = std::move(messageString);
	currentScreen.responseCount = 0;
	currentScreen.messageCount = 1;
	currentScreen.responseType = NO_RESPONSE;
	responses.reset();
	responses = std::make_unique<MageDialogResponse[]>(0);
	cursorPhase += 250;
	isOpen = true;
	mapLocalJumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::loadNextScreen() {
	currentMessageIndex = 0;
	if((uint32_t)currentScreenIndex >= currentDialogScreenCount) {
		isOpen = false;
		return;
	}
	uint8_t sizeOfDialogScreenStruct = sizeof(currentScreen);
	EngineROM_Read(
		currentDialogAddress,
		sizeOfDialogScreenStruct,
		(uint8_t *)&currentScreen,
		"Failed to read Dialog property 'currentScreen'"
	);
	currentScreen.nameStringIndex = ROM_ENDIAN_U2_VALUE(currentScreen.nameStringIndex);
	currentScreen.borderTilesetIndex = ROM_ENDIAN_U2_VALUE(currentScreen.borderTilesetIndex);
	currentDialogAddress += sizeOfDialogScreenStruct;
	currentEntityName = MageGame->getString(currentScreen.nameStringIndex, triggeringEntityId);
	loadCurrentScreenPortrait();

	uint8_t sizeOfMessageIndex = sizeof(uint16_t);
	uint32_t sizeOfScreenMessageIds = sizeOfMessageIndex * currentScreen.messageCount;
	messageIds.reset();
	messageIds = std::make_unique<uint16_t[]>(currentScreen.messageCount);
	EngineROM_Read(
		currentDialogAddress,
		sizeOfScreenMessageIds,
		(uint8_t *)messageIds.get(),
		"Failed to read Dialog property 'messageIds'"
	);
	ROM_ENDIAN_U2_BUFFER(messageIds.get(), currentScreen.messageCount);
	currentDialogAddress += sizeOfScreenMessageIds;
	currentMessage = MageGame->getString(
		messageIds[currentMessageIndex],
		triggeringEntityId
	);
	uint8_t sizeOfResponse = sizeof(MageDialogResponse);
	uint32_t sizeOfResponses = sizeOfResponse * currentScreen.responseCount;
	responses.reset();
	responses = std::make_unique<MageDialogResponse[]>(currentScreen.responseCount);
	EngineROM_Read(
		currentDialogAddress,
		sizeOfResponses,
		(uint8_t *)responses.get(),
		"Failed to read Dialog property 'responses'"
	);
	for (int responseIndex = 0; responseIndex < currentScreen.responseCount; ++responseIndex) {
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
	currentDialogAddress += ((currentScreen.messageCount) % 2) * sizeOfMessageIndex;

	currentFrameTileset = MageGame->getValidTileset(currentScreen.borderTilesetIndex);
	currentImageIndex = currentFrameTileset->ImageId();
	currentImageAddress = MageGame->getImageAddress(
		currentImageIndex
	);
	currentScreenIndex++;
	cursorPhase += 250;
}

void MageDialogControl::advanceMessage() {
	currentMessageIndex++;
	cursorPhase = 250;
	if (currentMessageIndex >= currentScreen.messageCount) {
		loadNextScreen();
	} else {
		currentMessage = MageGame->getString(
			messageIds[currentMessageIndex],
			triggeringEntityId
		);
	}
}

void MageDialogControl::closeDialog() {
	isOpen = false;
	mapLocalJumpScriptId = MAGE_NO_SCRIPT;
}

void MageDialogControl::update() {
	cursorPhase += MAGE_MIN_MILLIS_BETWEEN_FRAMES;
	bool shouldAdvance = (
		EngineInput_Activated.rjoy_down
		|| EngineInput_Activated.rjoy_left
		|| EngineInput_Activated.rjoy_right
		|| (MageScript->mapLoadId != MAGE_NO_MAP)
	);
	if(shouldShowResponses()) {
		if(EngineInput_Activated.ljoy_up) { currentResponseIndex -= 1; }
		if(EngineInput_Activated.ljoy_down) { currentResponseIndex += 1; }
		currentResponseIndex %= currentScreen.responseCount;
		if(shouldAdvance) {
			mapLocalJumpScriptId = responses[currentResponseIndex].mapLocalScriptIndex;
			isOpen = false;
		}
	}
	else if(shouldAdvance) {
		advanceMessage();
	}
}

bool MageDialogControl::shouldShowResponses() const {
	return (
		// last page of messages on this screen
		currentMessageIndex == (currentScreen.messageCount - 1)
		// and we have responses
		&& (
			currentScreen.responseType == SELECT_FROM_SHORT_LIST
			|| currentScreen.responseType == SELECT_FROM_LONG_LIST
		)
	);
}

void MageDialogControl::draw() {
	MageDialogAlignmentCoords coords = alignments[currentScreen.alignment];
	drawDialogBox(currentMessage, coords.text, true);
	drawDialogBox(currentEntityName, coords.label);
	if(currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT) {
		drawDialogBox("", coords.portrait, false, true);
	}
}

void MageDialogControl::drawDialogBox(
	const std::string &string,
	Rect box,
	bool drawArrow,
	bool drawPortrait
) {
	uint16_t tileWidth = currentFrameTileset->TileWidth();
	uint16_t tileHeight = currentFrameTileset->TileHeight();
	uint16_t offsetX = (box.x * tileWidth) + (tileWidth / 2);
	uint16_t offsetY = (box.y * tileHeight) + (tileHeight / 2);
	uint16_t tilesetColumns = currentFrameTileset->Cols();
	uint16_t imageWidth = currentFrameTileset->ImageWidth();
	uint16_t x;
	uint16_t y;
	uint8_t tileId;
	for (uint8_t i = 0; i < box.w; ++i) {
		for (uint8_t j = 0; j < box.h; ++j) {
			x = offsetX + (i * tileWidth);
			y = offsetY + (j * tileHeight);
			tileId = getTileIdFromXY(i, j, box);
			canvas.drawChunkWithFlags(
				currentImageAddress,
				MageGame->getValidColorPalette(currentImageIndex),
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
	mage_canvas->printMessage(
		string.c_str(),
		Monaco9,
		0xffff,
		offsetX + tileWidth + 8,
		offsetY + tileHeight - 2
	);
	if (drawArrow) {
		int8_t bounce = cos(((float)cursorPhase / 1000.0) * TAU) * 3;
		uint8_t flags = 0;
		if(shouldShowResponses()) {
			flags = 0b00000011;
			x = offsetX + tileWidth + bounce;
			y = offsetY + ((currentResponseIndex + 2) * tileHeight * 0.75) + 6;
			// render all of the response labels
			for (int responseIndex = 0; responseIndex < currentScreen.responseCount; ++responseIndex) {
				mage_canvas->printMessage(
					MageGame->getString(
						responses[responseIndex].stringIndex,
						triggeringEntityId
					).c_str(),
					Monaco9,
					0xffff,
					offsetX + (2 * tileWidth) + 8,
					offsetY + ((responseIndex + 2) * tileHeight * 0.75) + 2
				);
			}
		} else {
			// bounce the arrow at the bottom
			x = offsetX + ((box.w - 2) * tileWidth);
			y = offsetY + ((box.h - 2) * tileHeight) + bounce;
		}
		canvas.drawChunkWithFlags(
			currentImageAddress,
			MageGame->getValidColorPalette(currentImageIndex),
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
	if(drawPortrait) {
		x = offsetX + tileWidth;
		y = offsetY + tileHeight;
		tileId = currentPortraitRenderableData.tileId;
		MageTileset* tileset = MageGame->getValidTileset(currentPortraitRenderableData.tilesetId);
		uint8_t portraitFlags = currentPortraitRenderableData.renderFlags;
		canvas.drawChunkWithFlags(
			MageGame->getImageAddress(tileset->ImageId()),
			MageGame->getValidColorPalette(tileset->ImageId()),
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
) {
	uint8_t tileId = DIALOG_TILES_CENTER_REPEAT;
	bool leftEdge = x == 0;
	bool rightEdge = x == (box.w - 1);
	bool topEdge = y == 0;
	bool bottomEdge = y == (box.h - 1);
	if (leftEdge && topEdge) {
		tileId = DIALOG_TILES_TOP_LEFT;
	} else if (rightEdge && topEdge) {
		tileId = DIALOG_TILES_TOP_RIGHT;
	} else if (topEdge) {
		tileId = DIALOG_TILES_TOP_REPEAT;
	} else 	if (leftEdge && bottomEdge) {
		tileId = DIALOG_TILES_BOTTOM_LEFT;
	} else if (rightEdge && bottomEdge) {
		tileId = DIALOG_TILES_BOTTOM_RIGHT;
	} else if (bottomEdge) {
		tileId = DIALOG_TILES_BOTTOM_REPEAT;
	} else if (rightEdge) {
		tileId = DIALOG_TILES_RIGHT_REPEAT;
	} else if (leftEdge) {
		tileId = DIALOG_TILES_LEFT_REPEAT;
	}
	return tileId;
}

void MageDialogControl::loadCurrentScreenPortrait() {
	MageEntity currentEntity = {};
	currentPortraitId = currentScreen.portraitIndex;
	if(currentScreen.entityIndex != NO_PLAYER) {
		uint8_t entityIndex = MageScript->getUsefulEntityIndexFromActionEntityId(
			currentScreen.entityIndex,
			triggeringEntityId
		);
		currentEntity = *MageGame->getEntityByMapLocalId(entityIndex);
		uint8_t sanitizedPrimaryType = currentEntity.primaryIdType % NUM_PRIMARY_ID_TYPES;
		if(sanitizedPrimaryType == ENTITY_TYPE) {
			MageEntityType *entityType = MageGame->getValidEntityType(currentEntity.primaryId);
			currentPortraitId = entityType->PortraitId();
		}
	}
	if(
		currentPortraitId != DIALOG_SCREEN_NO_PORTRAIT // we have a portrait
	) {
		uint32_t portraitAddress = MageGame->getPortraitAddress(currentPortraitId);
		MagePortrait* portrait = new MagePortrait(portraitAddress);
		MageEntityTypeAnimationDirection *animationDirection = portrait->getEmoteById(
			currentScreen.emoteIndex
		);
		currentPortraitRenderableData = {};
		MageGame->getRenderableStateFromAnimationDirection(
			&currentPortraitRenderableData,
			&currentEntity,
			animationDirection
		);
		currentPortraitRenderableData.renderFlags = animationDirection->RenderFlags();
		currentPortraitRenderableData.renderFlags |= (currentEntity.direction & 0x80);
		// if the portrait is on the right side of the screen, flip the portrait on the X axis
		if((currentScreen.alignment % 2) == 1) {
			currentPortraitRenderableData.renderFlags ^= 0x04;
		}
	}
}
