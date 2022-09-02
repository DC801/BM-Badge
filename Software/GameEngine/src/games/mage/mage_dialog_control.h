#ifndef MAGE_DIALOG_CONTROL_H
#define MAGE_DIALOG_CONTROL_H

#include "src/engine/EnginePanic.h"
#include "mage_defines.h"
#include "mage_tileset.h"
#include "mage_game_control.h"
#include "fonts/Monaco9.h"
#include "mage_script_control.h"

#define DIALOG_SCREEN_NO_PORTRAIT 255

#define DIALOG_TILES_TOP_LEFT 0
#define DIALOG_TILES_TOP_REPEAT 1
#define DIALOG_TILES_TOP_RIGHT 2
#define DIALOG_TILES_LEFT_REPEAT 4
#define DIALOG_TILES_CENTER_REPEAT 5
#define DIALOG_TILES_RIGHT_REPEAT 6
#define DIALOG_TILES_BOTTOM_LEFT 8
#define DIALOG_TILES_BOTTOM_REPEAT 9
#define DIALOG_TILES_BOTTOM_RIGHT 10

#define DIALOG_TILES_SCROLL_END 3
#define DIALOG_TILES_SCROLL_REPEAT 7
#define DIALOG_TILES_SCROLL_POSITION 11

#define DIALOG_TILES_CHECKBOX 12
#define DIALOG_TILES_CHECK 13
#define DIALOG_TILES_HIGHLIGHT 14
#define DIALOG_TILES_ARROW 15

enum MageDialogScreenAlignment : uint8_t {
	BOTTOM_LEFT = 0,
	BOTTOM_RIGHT = 1,
	TOP_LEFT = 2,
	TOP_RIGHT = 3,
	ALIGNMENT_COUNT
};

enum MageDialogResponseType : uint8_t {
	NO_RESPONSE = 0,
	SELECT_FROM_SHORT_LIST = 1,
	SELECT_FROM_LONG_LIST = 2,
	ENTER_NUMBER = 3,
	ENTER_ALPHANUMERIC = 4,
};


struct MageDialogScreen
{
	// TODO: portraits, after we have some graphics for them
	uint16_t nameStringIndex;
	uint16_t borderTilesetIndex;
	MageDialogScreenAlignment alignment;
	uint8_t fontIndex;
	uint8_t messageCount;
	MageDialogResponseType responseType;
	uint8_t responseCount;
	uint8_t entityIndex;
	uint8_t portraitIndex;
	uint8_t emoteIndex;
};

struct MageDialogResponse
{
	uint16_t stringIndex;
	uint16_t mapLocalScriptIndex;
};

struct MageDialogAlignmentCoords
{
	Rect text;
	Rect label;
	Rect portrait;
};

class MageDialogControl {
	public:
		bool isOpen;
		int32_t mapLocalJumpScriptId;
		MageDialogControl();
		uint32_t size();
		void load(
			uint16_t dialogId,
			int16_t currentEntityId
		);
		void loadNextScreen();
		void showSaveMessageDialog(std::string messageString);
		void advanceMessage();
		void closeDialog();
		void update();
		void draw();

	void loadCurrentScreenPortrait();

private:
	// char dialogName[32];
	MageTileset* currentFrameTileset;
	int16_t triggeringEntityId;
	int32_t currentDialogIndex;
	uint32_t currentDialogAddress;
	uint32_t currentDialogScreenCount;
	int32_t currentScreenIndex;
	int32_t currentMessageIndex;
	uint16_t currentImageIndex;
	uint32_t currentImageAddress;
	uint32_t cursorPhase;
	uint8_t currentResponseIndex;
	uint8_t currentPortraitId;
	MageEntityRenderableData currentPortraitRenderableData;
	MageDialogScreen currentScreen;
	std::string currentEntityName;
	std::string currentMessage;
	std::unique_ptr<uint16_t[]>messageIds;
	std::unique_ptr<MageDialogResponse[]>responses;
	uint8_t getTileIdFromXY(
		uint8_t x,
		uint8_t y,
		Rect box
	);
	void drawDialogBox(
		const std::string& string,
		Rect box,
		bool drawArrow = false,
		bool drawPortrait = false
	);
	bool shouldShowResponses() const;

};

#endif //MAGE_DIALOG_CONTROL_H
