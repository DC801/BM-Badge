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
	HEX_OPS currentOp;
	bool hexEditorState;
	bool anyHexMovement;
	bool dialog_open;
	uint8_t bytes_per_page;
	uint8_t hex_rows;
	uint16_t mem_total;
	uint16_t mem_page;
	uint16_t mem_pages;
	uint16_t hex_cursor;
public:
	MageHexEditor() : currentOp{HEX_OPS::HEX_OPS_XOR},
		hexEditorState{false},
		anyHexMovement{false},
		dialog_open{false},
		bytes_per_page{HEXED_DEFAULT_BYTES_PER_PAGE},
		hex_rows{0},
		mem_total{0},
		mem_page{0},
		mem_pages{0},
		hex_cursor{0}
	{};

	//returns true if hex editor is open.
	bool getHexEditorState();

	//this turns the hex editor mode on or off.
	void toggleHexEditor();

	//this changes the hex editor layout to allow for a dialog window
	//to be present on the bottom of the screen
	void toggleHexDialog();

	//sets the current operation to be applied when pressing the bit buttons.
	void setHexOp(enum HEX_OPS op);

	//this converts input from the buttons into actions for the hex editor.
	void applyInputToHexState();

	//this updated the lights on the badge to match the bit state 
	//of the current byte in the hex editor.
	void updateHexLights();

	//this updates the hex editor to show the current state of memory
	void updateHexEditor();

	//This sets a char array starting at the current byte with any printable characters.
	//The string will terminate when the first non-printable char is found.
	void get_hex_string_for_byte (uint8_t byte, char* outputString);

	//this writes the header bit of the hex editor screen
	void renderHexHeader();

	//this writes all the hex editor data to the screen
	void renderHexEditor();

	//this applies input to the current byte value based on the state of currentOp
	void runHex(uint8_t value);
};

#endif //_MAGE_HEX_H
