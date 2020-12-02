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
			.w = 8,
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
			.x = 11,
			.y = 5,
			.w = 8,
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
			.w = 8,
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
			.x = 11,
			.y = 6,
			.w = 8,
			.h = 3,
		}
	}
};

MageDialogControl::MageDialogControl() {
	isOpen = false;
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

void MageDialogControl::load(uint16_t dialogId) {
	currentDialogIndex = dialogId;
	currentScreenIndex = 0;
	currentDialogAddress = MageGame->getDialogAddress(dialogId);
	currentDialogAddress += 32; // skip past the name

	if (EngineROM_Read(
		currentDialogAddress,
		sizeof(currentDialogScreenCount),
		(uint8_t *)&currentDialogScreenCount
	) != sizeof(currentDialogScreenCount))
	{
		ENGINE_PANIC("Failed to load dialog data.");
	}
	currentDialogScreenCount = convert_endian_u4_value(currentDialogScreenCount);
	currentDialogAddress += sizeof(currentDialogScreenCount);

	loadNextScreen();

	isOpen = true;
}

void MageDialogControl::loadNextScreen() {
	currentMessageIndex = 0;
	if(currentScreenIndex >= currentDialogScreenCount) {
		isOpen = false;
		return;
	}
	uint8_t sizeOfDialogScreenStruct = sizeof(currentScreen);
	if (EngineROM_Read(
		currentDialogAddress,
		sizeOfDialogScreenStruct,
		(uint8_t *)&currentScreen
	) != sizeOfDialogScreenStruct)
	{
		ENGINE_PANIC("Failed to load dialog data.");
	}
	currentScreen.nameIndex = convert_endian_u2_value(currentScreen.nameIndex);
	currentScreen.borderTilesetIndex = convert_endian_u2_value(currentScreen.borderTilesetIndex);
	currentDialogAddress += sizeOfDialogScreenStruct;

	uint8_t sizeOfMessageIndex = sizeof(uint16_t);
	uint32_t sizeOfScreenMessageIds = sizeOfMessageIndex * currentScreen.messageCount;
	messageIds.reset();
	messageIds = std::make_unique<uint16_t[]>(currentScreen.messageCount);
	if (EngineROM_Read(
		currentDialogAddress,
		sizeOfScreenMessageIds,
		(uint8_t *)messageIds.get()
	) != sizeOfScreenMessageIds)
	{
		ENGINE_PANIC("Failed to load dialog data.");
	}
	convert_endian_u2_buffer(messageIds.get(), currentScreen.messageCount);
	currentDialogAddress += sizeOfScreenMessageIds;
	currentDialogAddress += (currentScreen.messageCount % 2) * sizeOfMessageIndex;

	currentFrameTileset = MageGame->getValidTileset(currentScreen.borderTilesetIndex);
	currentImageAddress = MageGame->getImageAddress(
		currentFrameTileset->ImageId()
	);
	currentScreenIndex++;
}

void MageDialogControl::advanceMessage() {
	currentMessageIndex++;
	if (currentMessageIndex >= currentScreen.messageCount) {
		loadNextScreen();
	}
}

void MageDialogControl::draw() {
	std::string currentEntityName = MageGame->getString(currentScreen.nameIndex);
	std::string currentMessage = MageGame->getString(
		messageIds[currentMessageIndex]
	);
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
