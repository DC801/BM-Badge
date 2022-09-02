#include "mage.h"
#include "EngineROM.h"
#include "EngineInput.h"
#include "EnginePanic.h"
#include "EngineSerial.h"
#include <SDL.h>

#include "convert_endian.h"
#include "utility.h"

#include "mage_defines.h"

#ifndef DC801_EMBEDDED
#include "shim_timer.h"
#endif

//uncomment to print main game loop timing debug info to terminal or over serial
//#define TIMING_DEBUG

#ifdef EMSCRIPTEN
#include "emscripten.h"
#endif

void MageGameEngine::handleBlockingDelay()
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

void MageGameEngine::GameUpdate(uint32_t deltaTime)
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
		MageScript->tickScripts();
	}

	//or be boring and normal:
	else
	{
		//this handles buttons and state updates based on button presses in game mode:
		MageGame->applyGameModeInputs(deltaTime);

		//update the entities based on the current state of their (hackable) data array.
		MageGame->UpdateEntities(deltaTime);

		//handle scripts:
		MageScript->tickScripts();

		//check for loadMap:
		if(MageScript->mapLoadId != MAGE_NO_MAP) { return; }

		MageGame->applyCameraEffects(deltaTime);
	}
}

void MageGameEngine::GameRender()
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

void MageGameEngine::EngineMainGameLoop ()
{
	if(!engineIsInitialized) {
		// Why do this in the game loop instead of before the game loop?
		// Because Emscripten started throwing a new useless, meaningless,
		// recoverable runtime error that the client can just ignore, unless
		// EngineInit is called from inside the game loop. No idea why.
		
		//EngineInit();
		engineIsInitialized = true;
	}
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
	inputHandler->HandleKeyboard();

	//on desktop, interact with stdin
	//on embedded, interact with USBC com port over serial
	EngineHandleSerialInput();

	LOG_COLOR_PALETTE_CORRUPTION(
		"EngineHandleKeyboardInput();"
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

	#ifndef DC801_EMBEDDED
	// intentionally corrupt the dialog color palette BEFORE rendering,
	// just so we can SEE if it works
	if(
		EngineInput_Buttons.op_page
		&& EngineInput_Buttons.rjoy_center
	) {
		MageColorPalette *colorPalette = MageGame->getValidColorPalette(0);
		colorPalette->colors[0] = 0xDEAD;
	}
	#endif

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
	#ifndef DC801_EMBEDDED
	if (updateAndRenderTime < MAGE_MIN_MILLIS_BETWEEN_FRAMES) {
		SDL_Delay(MAGE_MIN_MILLIS_BETWEEN_FRAMES - updateAndRenderTime);
	}
	#endif
	if (EngineShouldReloadGameDat()) {
		//EngineInit();
	}
}

void MageGameEngine::onSerialStart () {
	MageCommand->handleStart();
}
void MageGameEngine::onSerialCommand (char* commandString) {
	MageCommand->processCommand(commandString);
}

MageGameEngine::MageGameEngine() noexcept
{
	//turn off LEDs
	ledsOff();

	// Initialize ROM and reload game.dat if a different version is on the SD card.
	EngineROM = std::make_unique<EngineROM>();

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

	//construct MageCommandControl object to handle serial/stdin command parsing
	MageCommand = std::make_unique<MageCommandControl>();
	//EngineSerialRegisterEventHandlers(
	//	std::invoke(&MageGameEngine::onSerialStart, this),
	//	std::invoke(&MageGameEngine::onSerialCommand, this);
	//);

	LOG_COLOR_PALETTE_CORRUPTION(
		"After MageScriptControl constructor"
	);

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = std::unique_ptr <MageEntity>{ MageGame->entities.get() };

	//set a default hacking option.
	MageHex->setHexOp(HEX_OPS_XOR);


#ifdef DC801_EMBEDDED
	check_ram_usage();
#else
		uint32_t gameSize = MageGame->Size();
		uint32_t scriptSize = MageScript->size();
		uint32_t hexSize = MageHex->size();
		uint32_t commandSize = MageCommand->size();
		uint32_t frameBufferSize = FRAMEBUFFER_SIZE * sizeof(uint16_t);
		uint32_t totalSize = (
			0
			+ gameSize
			+ scriptSize
			+ hexSize
			+ commandSize
			+ frameBufferSize
		);
		fprintf(stderr, "MageGameControl RAM use:    %8d bytes.\n", gameSize);
		fprintf(stderr, "MageScriptControl RAM use:  %8d bytes.\n", scriptSize);
		fprintf(stderr, "MageHexControl RAM use:     %8d bytes.\n", hexSize);
		fprintf(stderr, "MageCommandControl RAM use: %8d bytes.\n", commandSize);
		fprintf(stderr, "FrameBuffer RAM use:        %8d bytes.\n", frameBufferSize);
		fprintf(stderr, "-------------------------------------------\n");
		fprintf(stderr, "Minimum RAM overhead use:   %8d bytes.\n", totalSize);
		fflush(stderr);
		// for some reason, outputting to stderr and then flushing, this still comes out AFTER
		// the message output to stdout AFTER THIS, as triggered by `was_serial_started`.
		// so forcibly delaying by 50 ms on startup actually allows the stderr/stdout
		// messages to come out in the correct order. WHY. WHYYYYYYYYY. WHY.
		nrf_delay_ms(50);
	#endif

	MageGame->LoadMap(DEFAULT_MAP);

	#ifndef DC801_EMBEDDED
	// don't want to show welcome message until after map has loaded
	// in case map on_load has a `SET_CONNECT_SERIAL_DIALOG` action
	was_serial_started = true;
	#endif

	LOG_COLOR_PALETTE_CORRUPTION(
		"MageGame->LoadMap(DEFAULT_MAP);"
	);

	//note the time the first loop is running
	lastTime = millis();
	lastLoopTime = lastTime;
}

void MageGameEngine::Run()
{
	//initialize the canvas object for the screen buffer.
	mage_canvas = std::unique_ptr<FrameBuffer>{ &canvas };

	//main game loop:
#ifdef EMSCRIPTEN
	emscripten_set_main_loop(EngineMainGameLoop, 24, 1);
#else
	while (EngineIsRunning())
	{
		EngineMainGameLoop();
	}
#endif

	// Close rom and any open files
	EngineROM = nullptr;

	EngineSerialRegisterEventHandlers(
		nullptr,
		nullptr
	);

	LOG_COLOR_PALETTE_CORRUPTION(
		"EngineROM->Deinit();"
	);

}
