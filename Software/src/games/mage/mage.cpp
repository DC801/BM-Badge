#include "mage.h"

#include "common.h"
#include "mage_defines.h"

#include "EngineROM.h"
#include "EnginePanic.h"

#include "mage_hex.h"

std::unique_ptr<MageRom> MageROM;

FrameBuffer *mage_canvas;
uint32_t lastTime;
uint32_t now;
uint32_t deltaTime;

Point cameraPosition = {
	.x = 0,
	.y = 0,
};

MageEntity *hackableDataAddress;

void apply_input_to_game()
{
	apply_input_to_hex_state();
}

uint8_t mageSpeed = 1;
bool isMoving = false;

//-Tim Todo: Move this into MageRom as a class function to avoid messing with private variables.
void apply_input_to_player ()
{
	if (*hexEditorState)
	{
		return;
	}
	int32_t playerIndex = MageROM->playerEntityIndex;
	if(playerIndex != NO_PLAYER)
	{
		MageEntity playerEntity = hackableDataAddress[playerIndex];
		uint8_t previousPlayerAnimation = playerEntity.currentAnimation;
		isMoving = false;

		if(EngineInput_Buttons.ljoy_left ) { playerEntity.x -= mageSpeed; playerEntity.direction = 3; isMoving = true; }
		if(EngineInput_Buttons.ljoy_right) { playerEntity.x += mageSpeed; playerEntity.direction = 1; isMoving = true; }
		if(EngineInput_Buttons.ljoy_up   ) { playerEntity.y -= mageSpeed; playerEntity.direction = 0; isMoving = true; }
		if(EngineInput_Buttons.ljoy_down ) { playerEntity.y += mageSpeed; playerEntity.direction = 2; isMoving = true; }

		playerEntity.currentAnimation = isMoving ? 1 : 0;

		if (previousPlayerAnimation != playerEntity.currentAnimation)
		{
			playerEntity.currentFrame = 0;
		}

	/*
		get_renderable_data_from_entity(playerEntity, &renderableEntityData);

		if (
			!renderableEntityData.entityType
			|| playerEntity->currentAnimation > (renderableEntityData.entityType->animationCount - 1)
		)
		{
			playerEntity->currentAnimation = 0;
		}
	*/
		uint8_t panSpeed = EngineInput_Buttons.rjoy_down ? 5 : 1;
		if(EngineInput_Buttons.ljoy_left ) { cameraPosition.x -= panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_right) { cameraPosition.x += panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_up   ) { cameraPosition.y -= panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_down ) { cameraPosition.y += panSpeed; isMoving = true; }

		//set camera position to mage position
		//cameraPosition.x = playerEntity.x - HALF_WIDTH + ((*renderableEntityData.tileset->tileWidth) / 2);
		//cameraPosition.y = playerEntity.y - HALF_HEIGHT - ((*renderableEntityData.tileset->tileHeight) / 2);

		//write back to the array when done.
		hackableDataAddress[playerIndex] = playerEntity;
	}
	else //no player on map
	{
		uint8_t panSpeed = EngineInput_Buttons.rjoy_down ? 5 : 1;
		if(EngineInput_Buttons.ljoy_left ) { cameraPosition.x -= panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_right) { cameraPosition.x += panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_up   ) { cameraPosition.y -= panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_down ) { cameraPosition.y += panSpeed; isMoving = true; }
	}
	
}

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
		apply_input_to_player();

		uint8_t layerCount = MageROM->Map().LayerCount();

		if (layerCount > 1)
		{
			for (
				uint8_t layerIndex = 0;
				layerIndex < (layerCount - 1);
				layerIndex++
			)
			{
				MageROM->DrawMap(layerIndex, cameraPosition.x, cameraPosition.y);
			}
		}
		else
		{
			MageROM->DrawMap(0, cameraPosition.x, cameraPosition.y);
		}

		//update_entities();
		MageROM->UpdateEntities(deltaTime);

		//draw_entities();
		MageROM->DrawEntities(cameraPosition.x, cameraPosition.y);

		if (layerCount > 1)
		{
			MageROM->DrawMap(layerCount - 1, cameraPosition.x, cameraPosition.y);
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
	MageROM = std::make_unique<MageRom>();

	//load in the pointer to the array of MageEntities for use in hex editor mode:
	hackableDataAddress = MageROM->entities.get();

	mage_canvas = p_canvas();
	lastTime = millis();
	set_hex_op(HEX_OPS_XOR);

	while (EngineIsRunning())
	{
		EngineHandleInput();
		apply_input_to_game();
		mage_game_loop();
	}

	// Close rom and any open files
	EngineROM_Deinit();

	return;
}