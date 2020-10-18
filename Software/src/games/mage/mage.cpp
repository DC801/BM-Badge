#include "mage.h"

#include "common.h"
#include "mage_defines.h"

#include "EngineROM.h"
#include "EnginePanic.h"

#include "mage_hex.h"

std::unique_ptr<MageGameControl> MageGame;

FrameBuffer *mage_canvas;
uint32_t lastTime;
uint32_t now;
uint32_t deltaTime;

Point cameraPosition = {
	.x = 0,
	.y = 0,
};

MageEntity *hackableDataAddress;

uint8_t mageSpeed = 1;
bool isMoving = false;

void mage_game_loop()
{
	//update timing information at the start of every game loop
	now = millis();
	deltaTime = now - lastTime;

	if (*hexEditorState)
	{
		//run hex editor if appropriate
		mage_canvas->clearScreen(RGB(0,0,0));
		update_hex_editor();
		render_hex_editor();
	}
	else
	{
		//otherwise run mage game:
		mage_canvas->clearScreen(RGB(0,0,255));

		//first apply input since the previous loop to the game state.
		MageGame->applyInputToPlayer();

		//then drawthe map and entities:
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

		//update the entities based on the current state of their (hackable) data array.
		MageGame->UpdateEntities(deltaTime);

		//now that the entities are updated, draw them to the screen.
		MageGame->DrawEntities(cameraPosition.x, cameraPosition.y);

		if (layerCount > 1)
		{	
			//draw the final layer above the entities.
			MageGame->DrawMap(layerCount - 1, cameraPosition.x, cameraPosition.y);
		}
	}

	//update the state of the LEDs
	update_hex_lights();

	//update the screen
	mage_canvas->blt();

	//note the time of the completion of the loop
	lastTime = now;

#ifdef DC801_DESKTOP
	nrf_delay_ms(5);
#endif
}

void MAGE()
{
	// Initialize ROM and drivers
	EngineROM_Init();

	// Verify magic
	if (EngineROM_Magic((const uint8_t*)"MAGEGAME", 8) != true)
	{
		ENGINE_PANIC("Failed to match Game Magic");
	}

	// Construct MageGameControl object, loading all headers
	MageGame = std::make_unique<MageGameControl>();

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = MageGame->entities.get();

	//initialize the canvas object for the screen buffer.
	mage_canvas = p_canvas();

	//note the time the first loop is running
	lastTime = millis();

	//set a default hacking option.
	set_hex_op(HEX_OPS_XOR);

	//main game loop:
	while (EngineIsRunning())
	{
		//handles hardware inputs and makes their state available
		EngineHandleInput();

		//applies input states to the hacking functions
		apply_input_to_hex_state();

		//updates the game based on inputs and hacked state
		mage_game_loop();
	}

	// Close rom and any open files
	EngineROM_Deinit();

	return;
}