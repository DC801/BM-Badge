#include "mage_dialog_control.h"
extern FrameBuffer *mage_canvas;
extern MageGameControl *MageGame;

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
			.y = 5,
			.w = 7,
			.h = 3,
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
			.y = 5,
			.w = 7,
			.h = 3,
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
			.y = 6,
			.w = 7,
			.h = 3,
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
			.y = 6,
			.w = 7,
			.h = 3,
		}
	}
};

MageDialogControl::MageDialogControl() {
	isOpen = false;
	triggeringEntityId = 0;
	currentDialogIndex = 0;
	currentDialogAddress = 0;
	currentDialogScreenCount = 0;
	currentScreenIndex = 0;
	currentMessageIndex = 0;
	currentImageAddress = 0;
	messageIds = std::make_unique<uint16_t[]>(0);
	currentScreen = {0};
}

uint32_t MageDialogControl::size() {
	return (
		0
		+ sizeof(currentFrameTileset)
		+ sizeof(currentDialogIndex)
		+ sizeof(currentDialogAddress)
		+ sizeof(currentScreenIndex)
		+ sizeof(currentMessageIndex)
		+ sizeof(currentImageAddress)
		+ sizeof(currentScreen)
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
	currentDialogAddress += (currentScreen.messageCount % 2) * sizeOfMessageIndex;
	currentMessage = MageGame->getString(
		messageIds[currentMessageIndex],
		triggeringEntityId
	);

	currentFrameTileset = MageGame->getValidTileset(currentScreen.borderTilesetIndex);
	currentImageIndex = currentFrameTileset->ImageId();
	currentImageAddress = MageGame->getImageAddress(
		currentImageIndex
	);
	currentScreenIndex++;
}

void MageDialogControl::advanceMessage() {
	currentMessageIndex++;
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
}

void MageDialogControl::draw() {
	MageDialogAlignmentCoords coords = alignments[currentScreen.alignment];
	drawDialogBox(currentMessage, coords.text);
	drawDialogBox(currentEntityName, coords.label);
}

void MageDialogControl::drawDialogBox(const std::string &string, Rect box) {
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
