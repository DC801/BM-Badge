#include "EngineWindowFrame.h"

SDL_Window *window = nullptr;
SDL_Renderer *renderer = nullptr;
SDL_Surface *frameSurface = nullptr;
SDL_Texture *frameTexture = nullptr;
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
	SDL_RenderPresent(renderer);
}

void EngineWindowFrameDestroy()
{
	SDL_DestroyTexture(gameViewportTexture);
	gameViewportTexture = nullptr;
	SDL_DestroyTexture(frameTexture);
	frameTexture = nullptr;
	SDL_FreeSurface(frameSurface);
	frameSurface = nullptr;
	SDL_DestroyWindow(window);
	window = nullptr;
}
