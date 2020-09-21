#include "EngineWindowFrame.h"

SDL_Window *window = nullptr;
SDL_Renderer *renderer = nullptr;
SDL_Surface *frameSurface = nullptr;
SDL_Texture *frameTexture = nullptr;
SDL_Surface *frameButtonSurface = nullptr;
SDL_Texture *frameButtonTexture = nullptr;
SDL_Surface *frameLEDSurface = nullptr;
SDL_Texture *frameLEDTexture = nullptr;
SDL_Texture *gameViewportTexture = nullptr;

const int SCREEN_MULTIPLIER = 1;
int SCREEN_WIDTH = 0;
int SCREEN_HEIGHT = 0;

void EngineWindowFrameInit()
{
	frameSurface = IMG_Load("MAGE/window_frame.png");
	if (!frameSurface)
	{
		printf("IMG_Load: %s\n", IMG_GetError());
		exit(1);
	}
	frameButtonSurface = IMG_Load("MAGE/window_frame-button.png");
	if (!frameButtonSurface)
	{
		printf("IMG_Load: %s\n", IMG_GetError());
		exit(1);
	}
	frameLEDSurface = IMG_Load("MAGE/window_frame-led.png");
	if (!frameLEDSurface)
	{
		printf("IMG_Load: %s\n", IMG_GetError());
		exit(1);
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
	if(window == nullptr)
	{
		printf("Window could not be created! SDL_Error: %s\n", SDL_GetError());
		exit(1);
	}
	else
	{
		SDL_RenderSetLogicalSize(renderer, SCREEN_WIDTH, SCREEN_HEIGHT);
	}
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
const SDL_Rect buttonOffSrcRect = {0, 0, 32, 32};
const SDL_Rect buttonOnSrcRect = {0, 32, 32, 32};
const SDL_Rect LEDOffSrcRect = {0, 0, 16, 8};
const SDL_Rect LEDOnSrcRect = {0, 8, 16, 8};
SDL_Rect buttonTargetRect = {.x = 0, .y = 0, .w = 32, .h = 32};
SDL_Rect LEDTargetRect = {.x = 0, .y = 0, .w = 16, .h = 8};
const SDL_Point buttonHalf = {16, 16};
const SDL_Point LEDHalf = {8, 4};

const SDL_Point buttonDestPoints[] = {
	{506, 98},
	{506, 98 + 42},
	{506, 98 + 42 + 42},
	{506, 98 + 42 + 42 + 42},
	{126, 364},
	{126 + 42, 364},
	{126 + 42 + 42, 364},
	{126 + 42 + 42 + 42, 364},
	{126 + 42 + 42 + 42 + 42, 364},
	{126 + 42 + 42 + 42 + 42 + 42, 364},
	{126 + 42 + 42 + 42 + 42 + 42 + 42, 364},
	{126 + 42 + 42 + 42 + 42 + 42 + 42 + 42, 364},
	{38, 98},
	{38, 98 + 42},
	{38, 98 + 42 + 42},
	{38, 98 + 42 + 42 + 42},
	{54, 344},
	{54 - 32, 344},
	{54, 344 + 32},
	{54, 344 - 32},
	{54 + 32, 344},
	{490, 344},
	{490 - 32, 344},
	{490, 344 + 32},
	{490, 344 - 32},
	{490 + 32, 344},
	{38, 98 - 42},
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
		SDL_RenderCopy(
			renderer,
			frameButtonTexture,
			buttonState ? &buttonOnSrcRect : &buttonOffSrcRect,
			&buttonTargetRect
		);
	}
}

#define LED_COUNT 17
const SDL_Point LEDDestPoints[] = {
	{468, 112},
	{468, 112 + 42},
	{468, 112 + 42 + 42},
	{468, 112 + 42 + 42 + 42},
	{126, 328},
	{126 + 42, 328},
	{126 + 42 + 42, 328},
	{126 + 42 + 42 + 42, 328},
	{126 + 42 + 42 + 42 + 42, 328},
	{126 + 42 + 42 + 42 + 42 + 42, 328},
	{126 + 42 + 42 + 42 + 42 + 42 + 42, 328},
	{126 + 42 + 42 + 42 + 42 + 42 + 42 + 42, 328},
	{76, 112},
	{76, 112 + 42},
	{76, 112 + 42 + 42},
	{76, 112 + 42 + 42 + 42},
	{76, 112 - 42},
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

	SDL_LockTexture(gameViewportTexture, nullptr, &pixels, &pitch);
	memcpy(pixels, frame, FRAMEBUFFER_SIZE * sizeof(uint16_t));
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
	SDL_DestroyTexture(frameLEDTexture);
	frameLEDTexture = nullptr;
	SDL_FreeSurface(frameSurface);
	frameSurface = nullptr;
	SDL_DestroyWindow(window);
	window = nullptr;
}
