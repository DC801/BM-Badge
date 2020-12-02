#include "mage.h"

#include "common.h"
#include "mage_defines.h"

#include "EngineROM.h"
#include "EnginePanic.h"

#ifdef DC801_DESKTOP
#include "EngineWindowFrame.h"
#endif

#include "mage_hex.h"
#include "mage_dialog_control.h"
#include "mage_script_control.h"

std::unique_ptr<MageGameControl> MageGame;
std::unique_ptr<MageHexEditor> MageHex;
std::unique_ptr<MageDialogControl> MageDialog;
std::unique_ptr<MageScriptControl> MageScript;
MageEntity *hackableDataAddress;
FrameBuffer *mage_canvas;

uint32_t lastTime;
uint32_t now;
uint32_t deltaTime;
uint32_t lastLoopTime;

Point cameraPosition = {
	.x = 0,
	.y = 0,
};

//temporary globals to make SD reads faster:

//this is the path to the game.dat file on the SD card.
//if an SD card is inserted with game.dat in this location, it will automatically be loaded.
#define MAGE_GAME_DAT_PATH "MAGE/game.dat"
char * filename = MAGE_GAME_DAT_PATH;
FIL raw_file;

void handleBLockingDelay()
{
	//if a blocking delay was added by any actions, pause before returning to the game loop:
	if(MageScript->blockingDelayTime)
	{
		//delay for the right amount of time
		nrf_delay_ms(MageScript->blockingDelayTime);
		//reset delay time when done so we don't do this every loop.
		MageScript->blockingDelayTime = 0;
	}
}

void handleScripts()
{
	//Note: all script handlers check for hex editor mode internally and will only continue
	//scripts that have already started and are not yet complete when in hex editor mode.
	
	//the map's onLoad script is called with a false isFirstRun flag. This allows it to 
	//complete any non-blocking actions that were called when the map was first loaded,
	//but it will not allow it to run the script again once it is completed.
	MageScript->handleMapOnLoadScript(false);
	//the map's onTick script will run every tick, restarting from the beginning as it completes
	MageScript->handleMapOnTickScript();
	for(uint8_t i = 0; i < MageGame->Map().EntityCount(); i++)
	{
		//handle Entity onTick scripts for the local entity at Id 'i':
		//these scripts will run every tick, starting from the beginning as they complete.
		MageScript->handleEntityOnTickScript(i);
		//this script will not initiate any new onInteract scripts. It will simply run an
		//onInteract script based on the state of the entityInteractResumeStates[i] struct
		//the struct is initialized in MageGame->applyUniversalInputs() when the interact
		//button is pressed.
		MageScript->handleEntityOnInteractScript(i);
	}
}

void GameUpdate()
{
	//apply inputs that work all the time
	MageGame->applyUniversalInputs();

	//update universally used hex editor state variables:
	MageHex->updateHexStateVariables();

	//either do hax inputs:
	if (MageHex->getHexEditorState())
	{
		//apply inputs to the hex editor:
		MageHex->applyHexModeInputs();

		//then handle any still-running scripts:
		handleScripts();
	}

	//or be boring and normal:
	else
	{
		//this handles buttons and state updates based on button presses in game mode:
		MageGame->applyGameModeInputs();

		//handle scripts:
		handleScripts();

		//update the entities based on the current state of their (hackable) data array.
		MageGame->UpdateEntities(deltaTime);
	}
}

void GameRender()
{
	//make hax do
	if (MageHex->getHexEditorState())
	{
		//run hex editor if appropriate
		mage_canvas->clearScreen(RGB(0,0,0));
		MageHex->renderHexEditor();
	}
	//otherwise be boring and normal
	else
	{
		//otherwise run mage game:
		mage_canvas->clearScreen(RGB(0,0,255));

		//then draw the map and entities:
		uint8_t layerCount = MageGame->Map().LayerCount();

		if (layerCount > 1)
		{
			for (
				uint8_t layerIndex = 0;
				layerIndex < (layerCount - 1);
				layerIndex++
			)
			{
				//draw all map layers except the last one before drawing entities.
				MageGame->DrawMap(layerIndex, cameraPosition.x, cameraPosition.y);
			}
		}
		else
		{
			//if there is only one map layer, it will always be drawn before the entities.
			MageGame->DrawMap(0, cameraPosition.x, cameraPosition.y);
		}

		//now that the entities are updated, draw them to the screen.
		MageGame->DrawEntities(cameraPosition.x, cameraPosition.y);

		if (layerCount > 1)
		{	
			//draw the final layer above the entities.
			MageGame->DrawMap(layerCount - 1, cameraPosition.x, cameraPosition.y);
		}

		if (MageGame->isCollisionDebugOn) {
			MageGame->DrawGeometry(cameraPosition.x, cameraPosition.y);
		}
		if(MageDialog->isOpen) {
			MageDialog->draw();
		}
	}

	//update the state of the LEDs
	MageHex->updateHexLights();

	//update the screen
	mage_canvas->blt();
}

void MAGE()
{
#ifdef DC801_DESKTOP
	EngineWindowFrameInit();
#endif
	//turn off LEDs
	ledsOff();

	// Initialize ROM and drivers
	EngineROM_Init();

	#ifdef DC801_EMBEDDED
		//Temporary: Open the game.dat file so we don't need to do it every read:
		// Remove this once we're using the ROM chip. -Tim
		FRESULT result;
		// Open magegame.dat file on SD card
		result = f_open(&raw_file, filename, FA_READ | FA_OPEN_EXISTING);
		if (result != FR_OK) {
			ENGINE_PANIC("Unable to Open MAGE/game.dat on SD Card");
		}
	#endif
	// Verify magic
	if (EngineROM_Magic((const uint8_t*)"MAGEGAME", 8) != true)
	{
		ENGINE_PANIC("Failed to match Game Magic");
	}
	
	// Construct MageGameControl object, loading all headers
	MageGame = std::make_unique<MageGameControl>();
	
	//construct MageHexEditor object, set hex editor defaults
	MageHex = std::make_unique<MageHexEditor>();

	//construct MageHexEditor object, set hex editor defaults
	MageDialog = std::make_unique<MageDialogControl>();

	//construct MageScriptControl object to handle scripts for the game
	MageScript = std::make_unique<MageScriptControl>();

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = MageGame->entities.get();

	//initialize the canvas object for the screen buffer.
	mage_canvas = p_canvas();

	//set a default hacking option.
	MageHex->setHexOp(HEX_OPS_XOR);

	#ifdef DC801_DESKTOP
		fprintf(stderr, "MageGameControl RAM use:   %8d bytes.\r\n", MageGame->Size());
		fprintf(stderr, "MageScriptControl RAM use: %8d bytes.\r\n", MageScript->size());
		fprintf(stderr, "MageHexControl RAM use:    %8d bytes.\r\n", MageHex->size());
		fprintf(stderr, "FrameBuffer RAM use:       %8d bytes.\r\n", FRAMEBUFFER_SIZE * sizeof(uint16_t));
		fprintf(stderr, "-------------------------------------------\r\n");
		fprintf(stderr, "Minimum RAM overhead use:  %8d bytes.\r\n", 
			(MageGame->Size() + MageScript->size() + MageHex->size() + (FRAMEBUFFER_SIZE * sizeof(uint16_t))));
	#endif

	MageGame->LoadMap(DEFAULT_MAP);

	//note the time the first loop is running
	lastTime = millis();
	lastLoopTime = lastTime;

	//main game loop:
	while (EngineIsRunning())
	{
		//update timing information at the start of every game loop
		now = millis();
		deltaTime = now - lastTime;
		lastTime = now;

		//frame limiter code to keep game running at a specific FPS:
		//only do this on the real hardware:
		#ifdef DC801_EMBEDDED
		// if( now < (lastLoopTime + MAGE_MIN_MILLIS_BETWEEN_FRAMES) )
		// { continue; }

		// //code below here will only be run if enough ms have passed since the last frame:
		// lastLoopTime = now;
		#endif

		//handles hardware inputs and makes their state available
		EngineHandleInput();

		//updates the state of all the things before rendering:
		GameUpdate();

		//This renders the game to the screen based on the loop's updated state.
		GameRender();

		//this pauses for MageScript->blockingDelayTime before continuing to the next loop:
		handleBLockingDelay();
	}

	// Close rom and any open files
	EngineROM_Deinit();

	#ifdef DC801_EMBEDDED
		//close game.dat file:
		result = f_close(&raw_file);
	#endif
	#ifdef DC801_DESKTOP
		// Clean up
		EngineWindowFrameDestroy();
	#endif

	return;
}