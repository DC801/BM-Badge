#include "mage.h"

#include "common.h"
#include "mage_defines.h"

#include "EngineROM.h"
#include "EnginePanic.h"

//uncomment to print main game loop timing debug info to terminal or over serial
//#define TIMING_DEBUG

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

void handleBlockingDelay()
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
	if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }
	//the map's onTick script will run every tick, restarting from the beginning as it completes
	MageScript->handleMapOnTickScript();
	if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }
	for(uint8_t i = 0; i < MageGame->filteredEntityCountOnThisMap; i++)
	{
		//this script will not initiate any new onInteract scripts. It will simply run an
		//onInteract script based on the state of the entityInteractResumeStates[i] struct
		//the struct is initialized in MageGame->applyUniversalInputs() when the interact
		//button is pressed.
		MageScript->handleEntityOnInteractScript(i);
		if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }
		//handle Entity onTick scripts for the local entity at Id 'i':
		//these scripts will run every tick, starting from the beginning as they complete.
		MageScript->handleEntityOnTickScript(i);
		if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }
	}
}

void GameUpdate(uint32_t deltaTime)
{
	//apply inputs that work all the time
	MageGame->applyUniversalInputs();

	//check for loadMap:
	if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }

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
		MageGame->applyGameModeInputs(deltaTime);

		//update the entities based on the current state of their (hackable) data array.
		MageGame->UpdateEntities(deltaTime);

		//handle scripts:
		handleScripts();

		//check for loadMap:
		if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }

		MageGame->applyCameraEffects(deltaTime);
	}
}

void GameRender()
{
	#ifdef TIMING_DEBUG
	uint32_t now = millis();
	uint32_t diff = 0;
	#endif
	//make hax do
	if (MageHex->getHexEditorState())
	{
		//run hex editor if appropriate
		mage_canvas->clearScreen(RGB(0,0,0));
		#ifdef TIMING_DEBUG
			diff = millis() - now;
			debug_print("screen clear time: %d",diff);
			now = millis();
		#endif
		MageHex->renderHexEditor();
		#ifdef TIMING_DEBUG
			diff = millis() - now;
			debug_print("hex render time: %d",diff);
		#endif
	}

	//otherwise be boring and normal
	else
	{
		//otherwise run mage game:
		uint16_t backgroundColor = RGB(0,0,0);
		mage_canvas->clearScreen(mage_canvas->applyFadeColor(backgroundColor));
		#ifdef TIMING_DEBUG
			diff = millis() - now;
			debug_print("screen clear time: %d",diff);
			now = millis();
		#endif

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
				MageGame->DrawMap(layerIndex);
				#ifdef TIMING_DEBUG
					diff = millis() - now;
					debug_print("Layer Time: %d",diff);
					now = millis();
				#endif
			}
		}
		else
		{
			//if there is only one map layer, it will always be drawn before the entities.
			MageGame->DrawMap(0);
			#ifdef TIMING_DEBUG
				diff = millis() - now;
				debug_print("Layer Time: %d",diff);
				now = millis();
			#endif
		}

		//now that the entities are updated, draw them to the screen.
		MageGame->DrawEntities();
		#ifdef TIMING_DEBUG
			diff = millis() - now;
			debug_print("Entity Time: %d",diff);
			now = millis();
		#endif

		if (layerCount > 1)
		{
			//draw the final layer above the entities.
			MageGame->DrawMap(layerCount - 1);
			#ifdef TIMING_DEBUG
				diff = millis() - now;
				debug_print("Layer n Time: %d",diff);
				now = millis();
			#endif
		}

		if (MageGame->isCollisionDebugOn) {
			MageGame->DrawGeometry();
			if(MageGame->playerEntityIndex != NO_PLAYER) {
				MageGame->getPushBackFromTilesThatCollideWithPlayer();
			}
			#ifdef TIMING_DEBUG
				diff = millis() - now;
				debug_print("Geometry Time: %d",diff);
				now = millis();
			#endif
		}
		if(MageDialog->isOpen) {
			MageDialog->draw();
			#ifdef TIMING_DEBUG
				diff = millis() - now;
				debug_print("Dialog Time: %d",diff);
				now = millis();
			#endif
		}
	}
	//update the state of the LEDs
	MageHex->updateHexLights();

	//update the screen
	mage_canvas->blt();
	#ifdef TIMING_DEBUG
		diff = millis() - now;
		debug_print("blt time: %d",diff);
	#endif
}

void MAGE()
{
#ifdef DC801_DESKTOP
	EngineWindowFrameInit();
#endif
	//turn off LEDs
	ledsOff();

	// Initialize ROM and reload game.dat if a different version is on the SD card.
	EngineROM_Init();

	// Construct MageGameControl object, loading all headers
	MageGame = std::make_unique<MageGameControl>();

	//construct MageHexEditor object, set hex editor defaults
	MageHex = std::make_unique<MageHexEditor>();

	LOG_COLOR_PALETTE_CORRUPTION(
		"After HexEditor constructor"
	);

	//construct MageHexEditor object, set hex editor defaults
	MageDialog = std::make_unique<MageDialogControl>();

	LOG_COLOR_PALETTE_CORRUPTION(
		"After MageDialogControl constructor"
	);

	//construct MageScriptControl object to handle scripts for the game
	MageScript = std::make_unique<MageScriptControl>();

	LOG_COLOR_PALETTE_CORRUPTION(
		"After MageScriptControl constructor"
	);

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
	#ifdef DC801_EMBEDDED
		check_ram_usage();
	#endif

	MageGame->LoadMap(DEFAULT_MAP);

	LOG_COLOR_PALETTE_CORRUPTION(
		"MageGame->LoadMap(DEFAULT_MAP);"
	);

	//note the time the first loop is running
	lastTime = millis();
	lastLoopTime = lastTime;

	//main game loop:
	while (EngineIsRunning())
	{
		//update timing information at the start of every game loop
		now = millis();
		deltaTime = now - lastTime;
		#ifdef TIMING_DEBUG
			debug_print("Current Loop Time: %d",now);
		#endif
		lastTime = now;

		//frame limiter code to keep game running at a specific FPS:
		//only do this on the real hardware:
		#ifdef DC801_EMBEDDED
		// if(now < (lastLoopTime + MAGE_MIN_MILLIS_BETWEEN_FRAMES) )
		// { continue; }

		// //code below here will only be run if enough ms have passed since the last frame:
		// lastLoopTime = now;
		#endif

		//handles hardware inputs and makes their state available
		EngineHandleInput();

		LOG_COLOR_PALETTE_CORRUPTION(
			"EngineHandleInput();"
		);

		//updates the state of all the things before rendering:
		GameUpdate(deltaTime);

		LOG_COLOR_PALETTE_CORRUPTION(
			"GameUpdate(deltaTime)"
		);

		//If the loadMap() action has set a new map, we will load it before we render this frame.
		if(MageScript->mapLoadId != MAGE_NO_MAP) {
			//load the new map data into MageGame
			MageGame->LoadMap(MageScript->mapLoadId);
			//clear the mapLoadId to prevent infinite reloads
			MageScript->mapLoadId = MAGE_NO_MAP;
			//Update the game for the new map
			GameUpdate(deltaTime);

			LOG_COLOR_PALETTE_CORRUPTION(
				"MageScript->mapLoadId != MAGE_NO_MAP"
			);
		}

		#ifdef DC801_DESKTOP
		// intentionally corrupt the dialog color palette BEFORE rendering,
		// just so we can SEE if it works
		if(
			EngineInput_Buttons.op_page
			&& EngineInput_Buttons.mem3
		) {
			MageColorPalette *colorPalette = MageGame->getValidColorPalette(0);
			colorPalette->colors[0] = 0xDEAD;
		}
		#endif //DC801_DESKTOP

		//This renders the game to the screen based on the loop's updated state.
		GameRender();

		LOG_COLOR_PALETTE_CORRUPTION(
			"GameRender()"
		);
		uint32_t fullLoopTime = millis() - lastTime;

		//this pauses for MageScript->blockingDelayTime before continuing to the next loop:
		handleBlockingDelay();

		uint32_t updateAndRenderTime = millis() - lastTime;

		#ifdef TIMING_DEBUG
			debug_print("End of Loop Total: %d", fullLoopTime);
			debug_print("----------------------------------------");
		#endif
		#ifdef DC801_DESKTOP
			if (updateAndRenderTime < MAGE_MIN_MILLIS_BETWEEN_FRAMES) {
				SDL_Delay(MAGE_MIN_MILLIS_BETWEEN_FRAMES - updateAndRenderTime);
			}
		#endif
	}

	// Close rom and any open files
	EngineROM_Deinit();

	LOG_COLOR_PALETTE_CORRUPTION(
		"EngineROM_Deinit();"
	);

	#ifdef DC801_DESKTOP
		// Clean up
		EngineWindowFrameDestroy();
	#endif

	return;
}
