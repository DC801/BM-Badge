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
	now = millis();
	deltaTime = now - lastTime;

	if (*hexEditorState)
	{
		mage_canvas->clearScreen(RGB(0,0,0));
		update_hex_editor();
		render_hex_editor();
	}
	else
	{
		mage_canvas->clearScreen(RGB(0,0,255));
		MageGame->applyInputToGame();

		uint8_t layerCount = MageGame->Map().LayerCount();

		if (layerCount > 1)
		{
			for (
				uint8_t layerIndex = 0;
				layerIndex < (layerCount - 1);
				layerIndex++
			)
			{
				MageGame->DrawMap(layerIndex, cameraPosition.x, cameraPosition.y);
			}
		}
		else
		{
			MageGame->DrawMap(0, cameraPosition.x, cameraPosition.y);
		}

		//update_entities();
		MageGame->UpdateEntities(deltaTime);

		//draw_entities();
		MageGame->DrawEntities(cameraPosition.x, cameraPosition.y);

		if (layerCount > 1)
		{
			MageGame->DrawMap(layerCount - 1, cameraPosition.x, cameraPosition.y);
		}
	}

	// update_hex_lights();
	mage_canvas->blt();
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

	// Construct MageRom object, loading all headers
	MageGame = std::make_unique<MageGameControl>();

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = MageGame->entities.get();

	mage_canvas = p_canvas();
	lastTime = millis();
	set_hex_op(HEX_OPS_XOR);

	while (EngineIsRunning())
	{
		EngineHandleInput();
		mage_game_loop();
	}

	// Close rom and any open files
	EngineROM_Deinit();

	return;
}