#include "mage_dialog_control.h"
extern FrameBuffer *mage_canvas;
extern MageGameControl *MageGame;

MageDialogAlignmentCoords bottomLeft = {
	.box = {
		.x = 0,
		.y = 8,
		.w = 19,
		.h = 6,
	}
};

MageDialogControl::MageDialogControl() {
	isOpen = false;
	currentScreen = {0};
}

uint32_t MageDialogControl::size() {
	return (
		0
		+ sizeof(currentFrameTileset)
		+ sizeof(screenCount)
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
	currentMessageIndex = 0;
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

	loadNextScreen();

	isOpen = true;
}

void MageDialogControl::loadNextScreen() {
	// TODO: Figure out why we get different & random DialogScreens/messages at each launch?!??
	if (EngineROM_Read(
		currentDialogAddress,
		sizeof(currentScreen),
		(uint8_t *)&currentScreen
	) != sizeof(currentScreen))
	{
		ENGINE_PANIC("Failed to load dialog data.");
	}
	currentScreen.nameIndex = convert_endian_u2_value(currentScreen.nameIndex);
	currentDialogAddress += sizeof(currentScreen);

	uint32_t messageSize = sizeof(uint16_t) * currentScreen.messageCount;
	messageIds.reset();
	messageIds = std::make_unique<uint16_t[]>(currentScreen.messageCount);
	if (EngineROM_Read(
		currentDialogAddress,
		messageSize,
		(uint8_t *)messageIds.get()
	) != messageSize)
	{
		ENGINE_PANIC("Failed to load dialog data.");
	}
	convert_endian_u2_buffer(messageIds.get(), currentScreen.messageCount);
	currentDialogAddress += messageSize;

	currentFrameTileset = MageGame->getValidTileset(currentScreen.borderIndex);
	currentImageAddress = MageGame->getImageAddress(
		currentFrameTileset->ImageId()
	);
}

void MageDialogControl::advanceMessage() {

}

void MageDialogControl::draw() {
	uint16_t tileWidth = currentFrameTileset->TileWidth();
	uint16_t tileHeight = currentFrameTileset->TileHeight();
	uint16_t tilesetColumns = currentFrameTileset->Cols();
	uint16_t imageWidth = currentFrameTileset->ImageWidth();
	uint16_t offsetX = (bottomLeft.box.x * tileWidth) + (tileWidth / 2);
	uint16_t offsetY = (bottomLeft.box.y * tileHeight) + (tileHeight / 2);
	uint16_t x;
	uint16_t y;
	uint8_t tileId;
	std::string currentMessage = MageGame->getString(
		messageIds[currentMessageIndex]
	);
	for (uint8_t i = 0; i < bottomLeft.box.w; ++i) {
		for (uint8_t j = 0; j < bottomLeft.box.h; ++j) {
			x = offsetX + (i * tileWidth);
			y = offsetY + (j * tileHeight);
			tileId = getTileIdFromXY(i, j, bottomLeft.box);
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
		currentMessage.c_str(),
		Monaco9,
		0xffff,
		offsetX + tileWidth,
		offsetY + tileHeight
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
