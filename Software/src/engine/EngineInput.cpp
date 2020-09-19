#include "common.h"
#include "EngineInput.h"
#include "modules/keyboard.h"

bool running = true;

#ifdef DC801_DESKTOP
void EngineGetDesktopInputState(uint32_t *keyboardBitmask)
{
	SDL_PumpEvents();
	const uint8_t *keys = SDL_GetKeyboardState(nullptr);
	SDL_Event e;
	if (application_quit != 0)
	{
		running = false;
	}
	while (SDL_PollEvent(&e))
	{
		if (e.type == SDL_QUIT)
		{
			running = false;
			break;
		}
		if (e.type == SDL_KEYDOWN)
		{
			if (
				e.key.keysym.sym == SDLK_ESCAPE
				)
			{
				running = false;
				break;
			}
		}
	}
	uint32_t newValue = 0x00000000;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_O] << KEYBOARD_KEY_MEM0;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_P] << KEYBOARD_KEY_MEM1;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_LEFTBRACKET] << KEYBOARD_KEY_MEM2;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_RIGHTBRACKET] << KEYBOARD_KEY_MEM3;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_1] << KEYBOARD_KEY_BIT128;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_2] << KEYBOARD_KEY_BIT64;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_3] << KEYBOARD_KEY_BIT32;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_4] << KEYBOARD_KEY_BIT16;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_5] << KEYBOARD_KEY_BIT8;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_6] << KEYBOARD_KEY_BIT4;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_7] << KEYBOARD_KEY_BIT2;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_8] << KEYBOARD_KEY_BIT1;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_9] << KEYBOARD_KEY_XOR;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_0] << KEYBOARD_KEY_ADD;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_MINUS] << KEYBOARD_KEY_SUB;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_EQUALS] << KEYBOARD_KEY_PAGE;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_Q] << KEYBOARD_KEY_LJOY_CENTER;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_LEFT] << KEYBOARD_KEY_LJOY_LEFT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_DOWN] << KEYBOARD_KEY_LJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_UP] << KEYBOARD_KEY_LJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_RIGHT] << KEYBOARD_KEY_LJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_E] << KEYBOARD_KEY_RJOY_CENTER;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_A] << KEYBOARD_KEY_RJOY_LEFT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_LSHIFT] << KEYBOARD_KEY_RJOY_DOWN;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_W] << KEYBOARD_KEY_RJOY_UP;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_D] << KEYBOARD_KEY_RJOY_RIGHT;
	newValue ^= (uint32_t) keys[SDL_SCANCODE_TAB] << KEYBOARD_KEY_HAX;
	*keyboardBitmask = newValue;
	// printf("EngineGetDesktopInputState keyboardBitmask: %" PRIu32 "\n", *keyboardBitmask);
}
#endif

void EngineSetHardwareBitmaskToButtonStates (
	uint32_t keyboardBitmask,
	ButtonStates* buttons
)
{
	uint32_t oneBit = 0x80000000;
	if(needs_endian_correction) {
		oneBit = 0x00000001;
	}
	buttons->mem0 = (oneBit << KEYBOARD_KEY_MEM0) & keyboardBitmask;
	buttons->mem1 = (oneBit << KEYBOARD_KEY_MEM1) & keyboardBitmask;
	buttons->mem2 = (oneBit << KEYBOARD_KEY_MEM2) & keyboardBitmask;
	buttons->mem3 = (oneBit << KEYBOARD_KEY_MEM3) & keyboardBitmask;
	buttons->bit_128 = (oneBit << KEYBOARD_KEY_BIT128) & keyboardBitmask;
	buttons->bit_64 = (oneBit << KEYBOARD_KEY_BIT64) & keyboardBitmask;
	buttons->bit_32 = (oneBit << KEYBOARD_KEY_BIT32) & keyboardBitmask;
	buttons->bit_16 = (oneBit << KEYBOARD_KEY_BIT16) & keyboardBitmask;
	buttons->bit_8 = (oneBit << KEYBOARD_KEY_BIT8) & keyboardBitmask;
	buttons->bit_4 = (oneBit << KEYBOARD_KEY_BIT4) & keyboardBitmask;
	buttons->bit_2 = (oneBit << KEYBOARD_KEY_BIT2) & keyboardBitmask;
	buttons->bit_1 = (oneBit << KEYBOARD_KEY_BIT1) & keyboardBitmask;
	buttons->op_xor = (oneBit << KEYBOARD_KEY_XOR) & keyboardBitmask;
	buttons->op_add = (oneBit << KEYBOARD_KEY_ADD) & keyboardBitmask;
	buttons->op_sub = (oneBit << KEYBOARD_KEY_SUB) & keyboardBitmask;
	buttons->op_page = (oneBit << KEYBOARD_KEY_PAGE) & keyboardBitmask;
	buttons->ljoy_center = (oneBit << KEYBOARD_KEY_LJOY_CENTER) & keyboardBitmask;
	buttons->ljoy_left = (oneBit << KEYBOARD_KEY_LJOY_LEFT) & keyboardBitmask;
	buttons->ljoy_down = (oneBit << KEYBOARD_KEY_LJOY_DOWN) & keyboardBitmask;
	buttons->ljoy_up = (oneBit << KEYBOARD_KEY_LJOY_UP) & keyboardBitmask;
	buttons->ljoy_right = (oneBit << KEYBOARD_KEY_LJOY_RIGHT) & keyboardBitmask;
	buttons->rjoy_center = (oneBit << KEYBOARD_KEY_RJOY_CENTER) & keyboardBitmask;
	buttons->rjoy_left = (oneBit << KEYBOARD_KEY_RJOY_LEFT) & keyboardBitmask;
	buttons->rjoy_down = (oneBit << KEYBOARD_KEY_RJOY_DOWN) & keyboardBitmask;
	buttons->rjoy_up = (oneBit << KEYBOARD_KEY_RJOY_UP) & keyboardBitmask;
	buttons->rjoy_right = (oneBit << KEYBOARD_KEY_RJOY_RIGHT) & keyboardBitmask;
	buttons->hax = (oneBit << KEYBOARD_KEY_HAX) & keyboardBitmask;
}

void EngineHandleInput (ButtonStates* buttons)
{
	uint32_t keyboardBitmask = 0x00000000;
	#ifdef DC801_DESKTOP
	EngineGetDesktopInputState(&keyboardBitmask);
	#endif
	#ifdef DC801_EMBEDDED
	app_usbd_event_queue_process();
	// ??? EngineGetEmbeddedInputState(&keyboardBitmask);
	#endif
	EngineSetHardwareBitmaskToButtonStates(keyboardBitmask, buttons);
}

bool EngineIsRunning()
{
	return running;
}