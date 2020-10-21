/*
This class contains all the code related to the hex editor hacking interface.
*/
#ifndef _MAGE_HEX_H
#define _MAGE_HEX_H

#include "mage_defines.h"
#include "mage.h"
#include "mage_game_control.h"
#include "modules/led.h"
#include "fonts/Monaco9.h"
#include "fonts/DeterminationMono.h"
#include "fonts/Scientifica.h"
#include "FrameBuffer.h"

#define HEXED_BYTES_PER_ROW 16
#define HEXED_BYTE_OFFSET_X 12
#define HEXED_BYTE_OFFSET_Y 30
#define HEXED_BYTE_FOOTER_OFFSET_Y 6
#define HEXED_BYTE_WIDTH 19
#define HEXED_BYTE_HEIGHT 14
#define HEXED_BYTE_CURSOR_OFFSET_X -4
#define HEXED_BYTE_CURSOR_OFFSET_Y 5
#define HEXED_TICK_DELAY 7
#define HEXED_DEFAULT_BYTES_PER_PAGE 64

enum HEX_OPS {
	HEX_OPS_XOR,
	HEX_OPS_ADD,
	HEX_OPS_SUB
};

extern FrameBuffer *mage_canvas;
extern std::unique_ptr<MageGameControl> MageGame;
extern MageEntity *hackableDataAddress;

//this class handles the hex editor mode, including input and drawing to the screen.
class MageHexEditor
{
private:
	//this variable stores the operation that will be preformed when pressing the bit buttons.
	HEX_OPS currentOp;

	//tells the game if the hex editor should be visible or not.
	bool hexEditorState;

	//true if there has been any button presses that change the cursor position.
	bool anyHexMovement;

	//true if the hex editor screen is reduced in size to allow for a 
	//dialog window to be displayed.
	bool dialogOpen;

	//how many bytes are visible per page. Changes depending on dialogOpen state.
	uint8_t bytesPerPage;

	//this is how many rows of bytes are to be displayed on a page.
	uint8_t hexRows;

	//this is the total number of bytes that will be accessible to the hex editor.
	//it updates based on the MageGame map.entityCount()
	uint16_t memTotal;

	//this holds the current page that is displayed on the hex editor.
	uint16_t currentMemPage;

	//this holds the total number of pages needed to display memTotal bytes.
	uint16_t totalMemPages;

	//this is a vairable that stores the byte that is currently selected for hacking.
	uint16_t hexCursorLocation;
public:
	//initialize the class with default values.
	//No need for a constructor with arguments and non-default values.
	MageHexEditor() : currentOp{HEX_OPS::HEX_OPS_XOR},
		hexEditorState{false},
		anyHexMovement{false},
		dialogOpen{false},
		bytesPerPage{HEXED_DEFAULT_BYTES_PER_PAGE},
		hexRows{0},
		memTotal{0},
		currentMemPage{0},
		totalMemPages{0},
		hexCursorLocation{0}
	{};

	//returns true if hex editor is open.
	bool getHexEditorState();

	//this turns the hex editor mode on or off.
	void toggleHexEditor();

	//this changes the hex editor layout to allow for a dialog window
	//to be present on the bottom of the screen.
	void toggleHexDialog();

	//sets the current operation to be applied when pressing the bit buttons.
	void setHexOp(enum HEX_OPS op);

	//this converts input from the buttons into actions for the hex editor.
	void applyInputToHexState();

	//this updated the lights on the badge to match the bit state 
	//of the current byte in the hex editor.
	void updateHexLights();

	//this updates the hex editor to show the current state of memory.
	void updateHexEditor();

	//This sets a char array starting at the current byte with any printable characters.
	//The string will terminate when the first non-printable char is found.
	void get_hex_string_for_byte (uint8_t byte, char* outputString);

	//this writes the header bit of the hex editor screen.
	void renderHexHeader();

	//this writes all the hex editor data to the screen.
	void renderHexEditor();

	//this applies input to the current byte value based on the state of currentOp.
	void runHex(uint8_t value);
};

#endif //_MAGE_HEX_H
