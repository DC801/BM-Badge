#include "mage_input.h"
#include "../../engine/FrameBuffer.h"

void apply_input_to_game()
{
	apply_input_to_hex_state();
}

uint8_t mageSpeed = 1;
bool isMoving = false;
void apply_input_to_player (uint8_t *data)
{
	if (*hexEditorState)
	{
		return;
	}
	uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
	isMoving = false;
	if(buttons.ljoy_left ) { playerEntity->x -= mageSpeed; playerEntity->direction = 3; isMoving = true; }
	if(buttons.ljoy_right) { playerEntity->x += mageSpeed; playerEntity->direction = 1; isMoving = true; }
	if(buttons.ljoy_up   ) { playerEntity->y -= mageSpeed; playerEntity->direction = 0; isMoving = true; }
	if(buttons.ljoy_down ) { playerEntity->y += mageSpeed; playerEntity->direction = 2; isMoving = true; }
	playerEntity->currentAnimation = isMoving ? 1 : 0;
	if (previousPlayerAnimation != playerEntity->currentAnimation)
	{
		playerEntity->currentFrame = 0;
	}
	get_renderable_data_from_entity(
		data,
		playerEntity,
		&renderableEntityData
	);
	cameraPosition.x = playerEntity->x - HALF_WIDTH + ((*renderableEntityData.tileset->tileWidth) / 2);
	cameraPosition.y = playerEntity->y - HALF_HEIGHT - ((*renderableEntityData.tileset->tileHeight) / 2);
}
