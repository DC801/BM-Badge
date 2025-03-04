#include "EngineWindowFrame.h"
#include "EnginePanic.h"
#define FRAME_ASSETS_PATH "MAGE/desktop_assets"

SDL_Window *window = nullptr;
SDL_Renderer *renderer = nullptr;
SDL_Surface *frameSurface = nullptr;
SDL_Texture *frameTexture = nullptr;
SDL_Surface *frameButtonSurface = nullptr;
SDL_Texture *frameButtonTexture = nullptr;
SDL_Surface *frameLEDSurface = nullptr;
SDL_Texture *frameLEDTexture = nullptr;
SDL_Texture *gameViewportTexture = nullptr;

int SCREEN_MULTIPLIER = 1;
int SCREEN_WIDTH = 0;
int SCREEN_HEIGHT = 0;

void EngineWindowFrameInit()
{
	if(SDL_Init(SDL_INIT_VIDEO) < 0)
	{
		ENGINE_PANIC("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
	}

	frameSurface = IMG_Load(FRAME_ASSETS_PATH "/window_frame.png");

	if (!frameSurface)
	{
		ENGINE_PANIC("Failed to load Window Frame\nIMG_Load: %s\n", IMG_GetError());
	}

	frameButtonSurface = IMG_Load(FRAME_ASSETS_PATH "/window_frame-keyboard.png");

	if (!frameButtonSurface)
	{
		ENGINE_PANIC("Failed to load Window Frame Button\nIMG_Load: %s\n", IMG_GetError());
	}

	frameLEDSurface = IMG_Load(FRAME_ASSETS_PATH "/window_frame-led.png");

	if (!frameLEDSurface)
	{
		ENGINE_PANIC("Failed to load Window Frame LED\nIMG_Load: %s\n", IMG_GetError());
	}

	//Create window
	SCREEN_WIDTH = frameSurface->w * SCREEN_MULTIPLIER;
	SCREEN_HEIGHT = frameSurface->h * SCREEN_MULTIPLIER;

	SDL_CreateWindowAndRenderer(
		SCREEN_WIDTH,
		SCREEN_HEIGHT,
		SDL_WINDOW_SHOWN,
		&window,
		&renderer
	);

	SDL_SetWindowTitle(
		window,
		"DC801 MAGE GAME"
	);

	if(window == nullptr)
	{
		ENGINE_PANIC("Failed to create SDL Window\nSDL_Error: %s\n", SDL_GetError());
	}

	SDL_RenderSetLogicalSize(renderer, frameSurface->w, frameSurface->h);

	frameTexture = SDL_CreateTextureFromSurface(renderer, frameSurface);
	frameButtonTexture = SDL_CreateTextureFromSurface(renderer, frameButtonSurface);
	frameLEDTexture = SDL_CreateTextureFromSurface(renderer, frameLEDSurface);

	SDL_SetTextureBlendMode(frameLEDTexture, SDL_BLENDMODE_BLEND);

	gameViewportTexture = SDL_CreateTexture(
		renderer,
		SDL_PIXELFORMAT_RGB565,
		SDL_TEXTUREACCESS_STREAMING,
		WIDTH,
		HEIGHT
	);
}

const SDL_Rect gameViewportSrcRect = {0, 0, WIDTH, HEIGHT};
const SDL_Rect gameViewportDstRect = {112, 56, WIDTH, HEIGHT};
SDL_Rect buttonOffSrcRect = {0, 0, 32, 32};
SDL_Rect buttonOnSrcRect = {0, 32, 32, 32};
const SDL_Rect LEDOffSrcRect = {0, 0, 16, 8};
const SDL_Rect LEDOnSrcRect = {0, 8, 16, 8};
SDL_Rect buttonTargetRect = {.x = 0, .y = 0, .w = 32, .h = 32};
SDL_Rect LEDTargetRect = {.x = 0, .y = 0, .w = 16, .h = 8};
const SDL_Point buttonHalf = {16, 16};
const SDL_Point LEDHalf = {8, 4};

const SDL_Point buttonDestPoints[KEYBOARD_NUM_KEYS] = {
	{506, 98}, // KEY_MEM0
	{506, 98 + 42}, // KEY_MEM1
	{506, 98 + 42 + 42}, // KEY_MEM2
	{506, 98 + 42 + 42 + 42}, // KEY_MEM3
	{126, 364}, // KEY_BIT128
	{126 + 42, 364}, // KEY_BIT64
	{126 + 42 + 42, 364}, // KEY_BIT32
	{126 + 42 + 42 + 42, 364}, // KEY_BIT16
	{126 + 42 + 42 + 42 + 42, 364}, // KEY_BIT8
	{126 + 42 + 42 + 42 + 42 + 42, 364}, // KEY_BIT4
	{126 + 42 + 42 + 42 + 42 + 42 + 42, 364}, // KEY_BIT2
	{126 + 42 + 42 + 42 + 42 + 42 + 42 + 42, 364}, // KEY_BIT1
	{38, 98}, // KEY_XOR
	{38, 98 + 42}, // KEY_ADD
	{38, 98 + 42 + 42}, // KEY_SUB
	{38, 98 + 42 + 42 + 42}, // KEY_PAGE
	{54, 344}, // KEY_LJOY_CENTER
	{54, 344 - 32}, // KEY_LJOY_UP
	{54, 344 + 32}, // KEY_LJOY_DOWN
	{54 - 32, 344}, // KEY_LJOY_LEFT
	{54 + 32, 344}, // KEY_LJOY_RIGHT
	{490, 344}, // KEY_RJOY_CENTER
	{490, 344 - 32}, // KEY_RJOY_UP
	{490, 344 + 32}, // KEY_RJOY_DOWN
	{490 - 32, 344}, // KEY_RJOY_LEFT
	{490 + 32, 344}, // KEY_RJOY_RIGHT
	{272 - 16, 98 - 42 - 28}, // KEY_HAX
};

void drawButtonStates ()
{
	SDL_Point buttonPoint;
	bool buttonState;
	for (int i = 0; i < KEYBOARD_NUM_KEYS; ++i)
	{
		buttonPoint = buttonDestPoints[i];
		buttonState = *buttonBoolPointerArray[i];
		buttonTargetRect.x = buttonPoint.x - buttonHalf.x;
		buttonTargetRect.y = buttonPoint.y - buttonHalf.y;
		buttonOnSrcRect.x = i * 32;
		buttonOffSrcRect.x = i * 32;
		SDL_RenderCopy(
			renderer,
			frameButtonTexture,
			buttonState ? &buttonOnSrcRect : &buttonOffSrcRect,
			&buttonTargetRect
		);
	}
}

const SDL_Point LEDDestPoints[LED_COUNT] = {
	{76, 112}, //LED_XOR
	{76, 112 + 42}, //LED_ADD
	{76, 112 + 42 + 42}, //LED_SUB
	{76, 112 + 42 + 42 + 42}, //LED_PAGE
	{126, 328}, //LED_BIT128
	{126 + 42, 328}, //LED_BIT64
	{126 + 42 + 42, 328}, //LED_BIT32
	{126 + 42 + 42 + 42, 328}, //LED_BIT16
	{126 + 42 + 42 + 42 + 42, 328}, //LED_BIT8
	{126 + 42 + 42 + 42 + 42 + 42, 328}, //LED_BIT4
	{126 + 42 + 42 + 42 + 42 + 42 + 42, 328}, //LED_BIT2
	{126 + 42 + 42 + 42 + 42 + 42 + 42 + 42, 328}, //LED_BIT1
	{468, 112 + 42 + 42 + 42}, //LED_MEM3
	{468, 112 + 42 + 42}, //LED_MEM2
	{468, 112 + 42}, //LED_MEM1
	{468, 112}, //LED_MEM0
	{468, 112 - 42 - 42}, //LED_USB
	{272 + 16, 112 - 42 - 42}, //LED_HAX
	{76, 112 - 42 - 42}, //LED_SD
};

void drawLEDStates ()
{
	SDL_Point LEDPoint;
	uint8_t LEDState;
	for (int i = 0; i < LED_COUNT; ++i)
	{
		LEDPoint = LEDDestPoints[i];
		LEDState = led_states[i];
		LEDTargetRect.x = LEDPoint.x - LEDHalf.x;
		LEDTargetRect.y = LEDPoint.y - LEDHalf.y;
		SDL_SetTextureAlphaMod(frameLEDTexture, 255);
		SDL_RenderCopy(
			renderer,
			frameLEDTexture,
			&LEDOffSrcRect,
			&LEDTargetRect
		);
		if(LEDState > 0) {
			SDL_SetTextureAlphaMod(frameLEDTexture, LEDState);
			SDL_RenderCopy(
				renderer,
				frameLEDTexture,
				&LEDOnSrcRect,
				&LEDTargetRect
			);
		}
	}
}

void EngineWindowFrameGameBlt(uint16_t *frame)
{
	void *pixels;
	int pitch;

	if (frame == nullptr) {
		return;
	}
	uint16_t correctEndianScreenBuffer[FRAMEBUFFER_SIZE] = {0};
	memcpy(correctEndianScreenBuffer, frame, FRAMEBUFFER_SIZE * sizeof(uint16_t));
	// Sorry for this monster;
	// The game.dat stores the image buffer data in BigEndian
	// SDL reads FrameBuffers in Platform Native Endian,
	// so we need to convert if Desktop is LittleEndian
	#ifndef IS_SCREEN_BIG_ENDIAN
		#ifdef IS_LITTLE_ENDIAN
			convert_endian_u2_buffer(correctEndianScreenBuffer, FRAMEBUFFER_SIZE);
		#endif
	#endif
	SDL_LockTexture(gameViewportTexture, nullptr, &pixels, &pitch);
	memcpy(pixels, correctEndianScreenBuffer, FRAMEBUFFER_SIZE * sizeof(uint16_t));
	SDL_UnlockTexture(gameViewportTexture);

	SDL_RenderCopy(
		renderer,
		frameTexture,
		&frameSurface->clip_rect,
		&frameSurface->clip_rect
	);

	SDL_RenderCopy(
		renderer,
		gameViewportTexture,
		&gameViewportSrcRect,
		&gameViewportDstRect
	);

	drawButtonStates();
	drawLEDStates();

	SDL_RenderPresent(renderer);
}

void EngineWindowFrameDestroy()
{
	SDL_DestroyTexture(gameViewportTexture);
	gameViewportTexture = nullptr;
	SDL_DestroyTexture(frameTexture);
	frameTexture = nullptr;
	SDL_DestroyTexture(frameButtonTexture);
	frameButtonTexture = nullptr;
	SDL_FreeSurface(frameButtonSurface);
	frameButtonSurface = nullptr;
	SDL_DestroyTexture(frameLEDTexture);
	frameLEDTexture = nullptr;
	SDL_FreeSurface(frameLEDSurface);
	frameLEDSurface = nullptr;
	SDL_FreeSurface(frameSurface);
	frameSurface = nullptr;
	SDL_DestroyRenderer(renderer);
	renderer = nullptr;
	SDL_DestroyWindow(window);
	window = nullptr;
}

void EngineWindowFrameResize(int change) {
	SCREEN_MULTIPLIER += change;
	if (SCREEN_MULTIPLIER < 1) {
		SCREEN_MULTIPLIER = 1;
	}
	if (SCREEN_MULTIPLIER > 2) {
		SCREEN_MULTIPLIER = 2;
	}
	EngineWindowFrameDestroy();
	EngineWindowFrameInit();
}

void EngineWindowFrameCleanup()
{
	EngineWindowFrameDestroy();
	SDL_Quit();
}
