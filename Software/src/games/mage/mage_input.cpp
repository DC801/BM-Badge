#include "mage_input.h"
#include "../../engine/FrameBuffer.h"

ButtonStates buttonsLastTick = {};

bool buttonBoolsLastTick[KEYBOARD_NUM_KEYS];
#define BITS 8
#define BITS_BUTTONS_OFFSET 4
LEDID bit_leds[] = {
	LED_BIT128,
	LED_BIT64,
	LED_BIT32,
	LED_BIT16,
	LED_BIT8,
	LED_BIT4,
	LED_BIT2,
	LED_BIT1,
};

void apply_input_to_game()
{
	bool buttonState;
	bool buttonStateHasChanged;
	LEDID ledIndex;
	for (int i = 0; i < BITS; ++i)
	{
		buttonState = *buttonBoolPointerArray[i + BITS_BUTTONS_OFFSET];
		buttonStateHasChanged = buttonState != buttonBoolsLastTick[i + BITS_BUTTONS_OFFSET];
		if (buttonState && buttonStateHasChanged)
		{
			ledIndex = bit_leds[i];
			ledSet(ledIndex, led_states[ledIndex] ? 0x00 : 0xff);
		}
	}

	// hex
	buttonState = *buttonBoolPointerArray[KEYBOARD_KEY_HAX];
	buttonStateHasChanged = buttonState != buttonBoolsLastTick[KEYBOARD_KEY_HAX];
	if (buttonState && buttonStateHasChanged)
	{
		toggle_hex_editor();
	}

	memcpy(
		&buttonsLastTick,
		&buttons,
		sizeof(ButtonStates)
	);
	for (int i = 0; i < KEYBOARD_NUM_KEYS; ++i)
	{
		buttonBoolsLastTick[i] = *buttonBoolPointerArray[i];
	}
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
