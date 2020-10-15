#include "mage_input.h"
#include "FrameBuffer.h"

void apply_input_to_game()
{
	apply_input_to_hex_state();
}

uint8_t mageSpeed = 1;
bool isMoving = false;

void apply_input_to_player (uint8_t *data)
{
	/*if (*hexEditorState)
	{
		return;
	}

	uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
	isMoving = false;

	if(EngineInput_Buttons.ljoy_left ) { playerEntity->x -= mageSpeed; playerEntity->direction = 3; isMoving = true; }
	if(EngineInput_Buttons.ljoy_right) { playerEntity->x += mageSpeed; playerEntity->direction = 1; isMoving = true; }
	if(EngineInput_Buttons.ljoy_up   ) { playerEntity->y -= mageSpeed; playerEntity->direction = 0; isMoving = true; }
	if(EngineInput_Buttons.ljoy_down ) { playerEntity->y += mageSpeed; playerEntity->direction = 2; isMoving = true; }

	playerEntity->currentAnimation = isMoving ? 1 : 0;

	if (previousPlayerAnimation != playerEntity->currentAnimation)
	{
		playerEntity->currentFrame = 0;
	}

	get_renderable_data_from_entity(playerEntity, &renderableEntityData);

	if (
		!renderableEntityData.entityType
		|| playerEntity->currentAnimation > (renderableEntityData.entityType->animationCount - 1)
	)
	{
		playerEntity->currentAnimation = 0;
	}*/

	uint8_t panSpeed = EngineInput_Buttons.rjoy_down ? 5 : 1;
	if(EngineInput_Buttons.ljoy_left ) { cameraPosition.x -= panSpeed; isMoving = true; }
	if(EngineInput_Buttons.ljoy_right) { cameraPosition.x += panSpeed; isMoving = true; }
	if(EngineInput_Buttons.ljoy_up   ) { cameraPosition.y -= panSpeed; isMoving = true; }
	if(EngineInput_Buttons.ljoy_down ) { cameraPosition.y += panSpeed; isMoving = true; }

	// cameraPosition.x = playerEntity->x - HALF_WIDTH + ((*renderableEntityData.tileset->tileWidth) / 2);
	// cameraPosition.y = playerEntity->y - HALF_HEIGHT - ((*renderableEntityData.tileset->tileHeight) / 2);
}
