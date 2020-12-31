#ifndef MAGE_DIALOG_CONTROL_H
#define MAGE_DIALOG_CONTROL_H

#include "src/engine/EnginePanic.h"
#include "mage_defines.h"
#include "mage_tileset.h"
#include "mage_game_control.h"
#include "fonts/Monaco9.h"

#define DIALOG_TILES_TOP_LEFT 0
#define DIALOG_TILES_TOP_REPEAT 1
#define DIALOG_TILES_TOP_RIGHT 2
#define DIALOG_TILES_LEFT_REPEAT 4
#define DIALOG_TILES_CENTER_REPEAT 5
#define DIALOG_TILES_RIGHT_REPEAT 6
#define DIALOG_TILES_BOTTOM_LEFT 8
#define DIALOG_TILES_BOTTOM_REPEAT 9
#define DIALOG_TILES_BOTTOM_RIGHT 10

#define DIALOG_TILES_SCROLL_TOP 3
#define DIALOG_TILES_SCROLL_REPEAT 7
#define DIALOG_TILES_SCROLL_POSITION 11
#define DIALOG_TILES_SCROLL_BOTTOM 15

#define DIALOG_TILES_CHECKBOX 12
#define DIALOG_TILES_CHECKBOX_CHECKED 13
#define DIALOG_TILES_HIGHLIGHT 14

enum MageDialogScreenAlignment : uint8_t {
	BOTTOM_LEFT = 0,
	BOTTOM_RIGHT = 1,
	TOP_LEFT = 2,
	TOP_RIGHT = 3,
	ALIGNMENT_COUNT
};


typedef struct {
	// TODO: portraits, after we have some graphics for them
	uint16_t nameStringIndex;
	uint16_t borderTilesetIndex;
	MageDialogScreenAlignment alignment;
	uint8_t fontIndex;
	uint8_t messageCount;
	uint8_t padding;
} MageDialogScreen;

typedef struct {
	Rect text;
	Rect label;
} MageDialogAlignmentCoords;

class MageDialogControl {
	private:
		// char dialogName[32];
		MageTileset *currentFrameTileset;
		int16_t triggeringEntityId;
		int32_t currentDialogIndex;
		uint32_t currentDialogAddress;
		uint32_t currentDialogScreenCount;
		int32_t currentScreenIndex;
		int32_t currentMessageIndex;
		uint16_t currentImageIndex;
		uint32_t currentImageAddress;
		MageDialogScreen currentScreen;
		std::unique_ptr<uint16_t[]>messageIds;
		std::string currentEntityName;
		std::string currentMessage;
		uint8_t getTileIdFromXY(
			uint8_t x,
			uint8_t y,
			Rect box
		);
		void drawDialogBox(
			const std::string &string,
			Rect box
		);

	public:
		bool isOpen;
		MageDialogControl();
		uint32_t size();
		void load(
			uint16_t dialogId,
			int16_t currentEntityId
		);
		void loadNextScreen();
		void advanceMessage();
		void closeDialog();
		void draw();

};

#endif //MAGE_DIALOG_CONTROL_H
