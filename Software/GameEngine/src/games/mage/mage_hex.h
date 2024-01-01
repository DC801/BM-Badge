/*
This class contains all the code related to the hex editor hacking interface.
*/
#ifndef _MAGE_HEX_H
#define _MAGE_HEX_H

#include "mage_rom.h"
#include "mage_defines.h"
#include "mage_map.h"
#include "modules/led.h"
#include "fonts/Monaco9.h"
#include "fonts/DeterminationMono.h"
#include "fonts/Scientifica.h"
#include "FrameBuffer.h"
#include "EngineInput.h"
#include <chrono>

class MageDialogControl;

#define HEXED_BYTES_PER_ROW 16
#define HEXED_BYTE_OFFSET_X 12
#define HEXED_BYTE_OFFSET_Y 30
#define HEXED_BYTE_FOOTER_OFFSET_Y 6
#define HEXED_BYTE_WIDTH 18
#define HEXED_BYTE_HEIGHT 14
#define HEXED_BYTE_CURSOR_OFFSET_X -4
#define HEXED_BYTE_CURSOR_OFFSET_Y 5
#define HEXED_DEFAULT_BYTES_PER_PAGE 64
#define HEXED_CLIPBOARD_PREVIEW_LENGTH 6
#define HEXED_CLIPBOARD_MAX_LENGTH 64

#define HEXED_QUICK_PRESS_TIMEOUT 500
#define HEXED_TICK_DELAY 1

enum HEX_OPS {
	HEX_OPS_XOR,
	HEX_OPS_ADD,
	HEX_OPS_SUB
};

//this class handles the hex editor mode, including input and drawing to the screen.
class MageHexEditor
{
public:
	MageHexEditor(std::shared_ptr<FrameBuffer> frameBuffer, std::shared_ptr<EngineInput> inputHandler, std::shared_ptr<MapControl>  mapControl, std::array<uint8_t, MAGE_NUM_MEM_BUTTONS> memOffsets)
		: frameBuffer(frameBuffer),
		inputHandler(inputHandler),
		mapControl(mapControl),
		memOffsets(memOffsets)
	{};

	constexpr void disableMovementUntilRJoyUpRelease()
	{
		disableMovement = true;
	}

	//returns true if hex editor is open.
	constexpr bool isHexEditorOn() const
	{
		return hexEditorOn;
	}

	//returns true if hex editor is open.
	constexpr bool getHexDialogState() const
	{
		return dialogState;
	}

	//this turns the hex editor mode on or off.
	void setHexEditorOn(bool on);

	//this changes the hex editor layout to allow for a dialog window
	//to be present on the bottom of the screen.
	void toggleHexDialog();

	//sets the current operation to be applied when pressing the bit buttons.
	void setHexOp(enum HEX_OPS op);

	constexpr auto GetCursorOffset() const
	{
		return hexCursorOffset;
	}

	inline void SetCursorOffset(uint16_t offset)
	{
		hexCursorOffset = offset;
	}

	//this calculates which memory page the hexCursorOffset appears on.
	inline void setPageToCursorLocation()
	{
		currentMemPage = hexCursorOffset / bytesPerPage;
	}

	uint16_t getCurrentMemPage();

	//this updates the variables used by the hex editor when applying inputs and rendering.
	void updateHexStateVariables();

	//this applies inputs to the hex editor state.u
	void applyHexModeInputs(const DeltaState& delta);
	void applyMemRecallInputs();

	//this writes all the hex editor data to the screen.
	void Draw();

	//this applies input to the current byte value based on the state of currentOp.
	void runHex(uint8_t value);
	void openToEntity(uint8_t entityIndex);
	bool IsMovementDisabled() const { return disableMovement; }
	void SetPlayerHasClipboardControl(bool playerHasControl) { playerHasClipboardControl = playerHasControl; }

	std::array<uint8_t, 4> memOffsets;
	bool playerHasHexEditorControl{ false };

private:
	std::shared_ptr<FrameBuffer> frameBuffer;
	std::shared_ptr<MapControl>  mapControl;
	std::shared_ptr<EngineInput> inputHandler;

	uint8_t clipboard[HEXED_CLIPBOARD_MAX_LENGTH]{ 0 };
	uint8_t clipboardLength{ 0 };

	bool disableMovement{ false };

	//Some byte values are renderable. Some are not. Get length of what our font renderer can display.
	uint16_t getRenderableStringLength(const char* string, uint16_t maxLength) const;

	//this writes the header bit of the hex editor screen.
	void renderHexHeader();

	//this variable stores the operation that will be preformed when pressing the bit buttons.
	HEX_OPS currentOp{ HEX_OPS::HEX_OPS_XOR };

	//tells the game if the hex editor should be visible or not.
	bool hexEditorOn{ false };

	//true if there has been any button presses that change the cursor position.
	bool anyHexMovement{ false };

	//delays all hex input by this many ticks
	uint8_t hexTickDelay{ 0 };

	//true if the hex editor screen is reduced in size to allow for a
	//dialog window to be displayed.
	bool dialogState{ false };

	//how many bytes are visible per page. Changes depending on dialogOpen state.
	uint8_t bytesPerPage{ HEXED_DEFAULT_BYTES_PER_PAGE };

	//this is how many rows of bytes are to be displayed on a page.
	uint8_t hexRows{ 0 };

	//this is the total number of bytes that will be accessible to the hex editor.
	//it updates based on the MageGame map.entityCount()
	uint16_t memTotal{ 0 };

	//this holds the current page that is displayed on the hex editor.
	uint16_t currentMemPage{ 0 };

	//this holds the total number of pages needed to display memTotal bytes.
	uint16_t totalMemPages{ 0 };

	//this is a variable that stores the byte that is currently selected for hacking.
	uint16_t hexCursorOffset{ 0 };

	//these two variables allow for a 'quick press' action on the page button to advance one memory page.
	bool previousPageButtonState{ false }; //tracks previous button state

	//clipboard GUI state
	bool isCopying{ false };
	bool playerHasClipboardControl{ false };
};

#endif //_MAGE_HEX_H
