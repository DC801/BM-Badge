#include "mage.h"

#include "common.h"
#include "mage_defines.h"

#include "EngineROM.h"
#include "EnginePanic.h"

#ifdef DC801_DESKTOP
#include "EngineWindowFrame.h"
#endif

#include "mage_hex.h"

std::unique_ptr<MageGameControl> MageGame;
std::unique_ptr<MageHexEditor> MageHex;
MageEntity *hackableDataAddress;

FrameBuffer *mage_canvas;
uint32_t lastTime;
uint32_t now;
uint32_t deltaTime;

Point cameraPosition = {
	.x = 0,
	.y = 0,
};

void GameUpdate()
{
	//check to see if player input is allowed:
	if(MageGame->playerHasControl)
	{
		//work out best order for scripting and button handling -Tim
		//apply inputs that work all the time
		MageHex->applyInputToHexState();

		//either do hax inputs:
		if (MageHex->getHexEditorState())
		{
			MageHex->updateHexEditor();
		}

		//or be boring and normal:
		else
		{
			//first apply input since the previous loop to the game state.
			//split reasonably into multiple functions - Tim
			MageGame->applyInputToPlayer();
			
			//call MageScript::onMapTick() -Tim

			//update the entities based on the current state of their (hackable) data array.
			MageGame->UpdateEntities(deltaTime);

			//run interact script on button press before drawing everything:
			if(EngineInput_Activated.rjoy_right)
			{ 
				//need a function to call interact scripts if player is interacting with things -Tim
				//MageScript::OnEntityInteract()
			}
		}
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

	// Initialize ROM and drivers
	EngineROM_Init();

	// Verify magic
	if (EngineROM_Magic((const uint8_t*)"MAGEGAME", 8) != true)
	{
		ENGINE_PANIC("Failed to match Game Magic");
	}

	// Construct MageGameControl object, loading all headers
	MageGame = std::make_unique<MageGameControl>();
	
	//construct MageHexEditor object, set hex editor defaults
	MageHex = std::make_unique<MageHexEditor>();

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = MageGame->entities.get();

	//initialize the canvas object for the screen buffer.
	mage_canvas = p_canvas();

	//note the time the first loop is running
	lastTime = millis();

	//set a default hacking option.
	MageHex->setHexOp(HEX_OPS_XOR);

	#ifdef DC801_DESKTOP
		fprintf(stderr, "MageGameControl RAM use: %d bytes.", MageGame->Size());
	#endif

	//main game loop:
	while (EngineIsRunning())
	{
		//update timing information at the start of every game loop
		now = millis();
		deltaTime = now - lastTime;
		lastTime = now;

		//handles hardware inputs and makes their state available
		EngineHandleInput();

		//updates the state of all the things before rendering:
		GameUpdate();

		//This renders the game to the screen based on the loop's updated state.
		GameRender();

		//more timing weirdness for desktop.
		#ifdef DC801_DESKTOP
			nrf_delay_ms(5);
		#endif
	}

	// Close rom and any open files
	EngineROM_Deinit();

#ifdef DC801_DESKTOP
	// Clean up
	EngineWindowFrameDestroy();
#endif

	return;
}