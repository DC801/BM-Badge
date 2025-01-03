#include "mage.h"

#include "common.h"
#include "mage_defines.h"

#include "EngineROM.h"
#include "EnginePanic.h"

//uncomment to print main game loop timing debug info to terminal or over serial
//#define TIMING_DEBUG

#ifdef EMSCRIPTEN
#include "emscripten.h"
#endif

#include "mage_hex.h"
#include "mage_dialog_control.h"
#include "mage_script_control.h"
#include "mage_command_control.h"

std::unique_ptr<MageGameControl> MageGame;
std::unique_ptr<MageHexEditor> MageHex;
std::unique_ptr<MageDialogControl> MageDialog;
std::unique_ptr<MageScriptControl> MageScript;
std::unique_ptr<MageCommandControl> MageCommand;
MageEntity *hackableDataAddress;
FrameBuffer *mage_canvas;

bool engineIsInitialized;

uint32_t lastTime;
uint32_t now;
uint32_t lastFrameTime;
uint32_t frameTimes[5];
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

void renderTextOutlined(char *text, int y, int x) {
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y - 1,
		x - 1
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y + 1,
		x - 1
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y - 1,
		x + 1
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y + 1,
		x + 1
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y - 1,
		x
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y + 1,
		x
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y,
		x - 1
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0x0000,
		y,
		x + 1
	);
	mage_canvas->printMessage(
		text,
		Monaco9,
		0xffff,
		y,
		x
	);
}

void recordAndRenderFPS() {
	now = millis();
	uint32_t fullLoopTime = now - lastFrameTime;
	lastFrameTime = now;
	char fpsText [48] = "";
	uint32_t total = fullLoopTime;
	for (int i = 1; i < 5; ++i) {
		total += frameTimes[i];
		frameTimes[i - 1] = frameTimes[i];
	}
	frameTimes[4] = fullLoopTime;
	float fps = 1000.0f / ((float)total / 5.0f);

	// Normally, you could just use %.02f, but in embedded, you cannot.
	// %.02f with a float produces an empty string. Thus this rigamarole.
	const char *sign = (fps < 0) ? "-" : "+";
	float tmpVal = (fps < 0) ? -fps : fps;
	int tmpInt1 = (int)tmpVal;                  // Get the integer
	float tmpFrac = tmpVal - (float)tmpInt1;    // Get fraction
	int tmpInt2 = (int)trunc(tmpFrac * 10000);  // Turn into integer
	sprintf(fpsText, "FPS: %s%d.%-4d | MS: %d", sign, tmpInt1, tmpInt2, fullLoopTime);
	int y = 96;
	int x = 8;
	renderTextOutlined(fpsText, y, x);
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

	if(!MageGame->isLEDControlEnabled) {
		// update the state of the LEDs
		MageHex->updateHexLights();
	}

	if(MageGame->isEntityDebugOn){
		recordAndRenderFPS();
	}

	//update the screen
	mage_canvas->blt();
	#ifdef TIMING_DEBUG
		diff = millis() - now;
		debug_print("blt time: %d",diff);
	#endif
}

void EngineMainGameLoop ()
{
	if(!engineIsInitialized) {
		// Why do this in the game loop instead of before the game loop?
		// Because Emscripten started throwing a new useless, meaningless,
		// recoverable runtime error that the client can just ignore, unless
		// EngineInit is called from inside the game loop. No idea why.
		EngineInit();
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
	EngineHandleKeyboardInput();

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
		//capture the mapLoadId before clearing
		uint16_t tempMapId = MageScript->mapLoadId;
		//clear the mapLoadId to prevent infinite reloads
		//this NEEDS to be empty before calling loadMap!
		MageScript->mapLoadId = MAGE_NO_MAP;
		//load the new map data into MageGame
		MageGame->LoadMap(tempMapId);
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
		&& EngineInput_Buttons.rjoy_center
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
	if (EngineShouldReloadGameDat()) {
		EngineInit();
	}
}

void onSerialStart () {
	MageCommand->handleStart();
}
void onSerialCommand (char* commandString) {
	if (MageCommand->isInputEnabled) {
		MageCommand->processCommand(commandString);
	}
}

void EngineInit () {
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

	//construct MageCommandControl object to handle serial/stdin command parsing
	MageCommand = std::make_unique<MageCommandControl>();
	EngineSerialRegisterEventHandlers(
		onSerialStart,
		onSerialCommand
	);

	LOG_COLOR_PALETTE_CORRUPTION(
		"After MageScriptControl constructor"
	);

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = MageGame->entities.get();

	//set a default hacking option.
	MageHex->setHexOp(HEX_OPS_XOR);

	#ifdef DC801_DESKTOP
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
	#ifdef DC801_EMBEDDED
		check_ram_usage();
	#endif

	MageGame->LoadMap(DEFAULT_MAP);

	#ifdef DC801_DESKTOP
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

void MAGE()
{
	//initialize the canvas object for the screen buffer.
	mage_canvas = p_canvas();

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
	EngineROM_Deinit();

	EngineSerialRegisterEventHandlers(
		nullptr,
		nullptr
	);

	LOG_COLOR_PALETTE_CORRUPTION(
		"EngineROM_Deinit();"
	);

}
