#include "DesktopWindowOutput.h"

#include "EnginePanic.h"
#include <SDL_image.h>

#define FRAME_ASSETS_PATH "./MAGE/desktop_assets/"

int SCREEN_MULTIPLIER = 1;

DesktopWindowOutput::EngineWindowFrameComponents::EngineWindowFrameComponents()
{
   if (SDL_Init(SDL_INIT_VIDEO) < 0)
   {
      ENGINE_PANIC("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
   }

   frameSurface = IMG_Load(FRAME_ASSETS_PATH "window_frame.png");

   if (!frameSurface)
   {
      ENGINE_PANIC("Failed to load Window Frame\nIMG_Load: %s\n", IMG_GetError());
   }

   frameButtonSurface = IMG_Load(FRAME_ASSETS_PATH "window_frame-button.png");

   if (!frameButtonSurface)
   {
      ENGINE_PANIC("Failed to load Window Frame Button\nIMG_Load: %s\n", IMG_GetError());
   }

   frameLEDSurface = IMG_Load(FRAME_ASSETS_PATH "window_frame-led.png");

   if (!frameLEDSurface)
   {
      ENGINE_PANIC("Failed to load Window Frame LED\nIMG_Load: %s\n", IMG_GetError());
   }

   //Create window
   SDL_CreateWindowAndRenderer(frameSurface->w * SCREEN_MULTIPLIER, frameSurface->h * SCREEN_MULTIPLIER, SDL_WINDOW_SHOWN, &window, &renderer);
   SDL_SetWindowTitle(window, "DC801 MAGE GAME");

   if (window == nullptr)
   {
      ENGINE_PANIC("Failed to create SDL Window\nSDL_Error: %s\n", SDL_GetError());
   }

   SDL_RenderSetLogicalSize(renderer, frameSurface->w, frameSurface->h);

   frameTexture = SDL_CreateTextureFromSurface(renderer, frameSurface);
   frameButtonTexture = SDL_CreateTextureFromSurface(renderer, frameButtonSurface);
   frameLEDTexture = SDL_CreateTextureFromSurface(renderer, frameLEDSurface);

   SDL_SetTextureBlendMode(frameLEDTexture, SDL_BLENDMODE_BLEND);

   gameViewportTexture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB565, SDL_TEXTUREACCESS_STREAMING, 320, 240);
}

DesktopWindowOutput::EngineWindowFrameComponents::~EngineWindowFrameComponents() noexcept
{
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

void DesktopWindowOutput::DrawButtonStates() const
{
   const auto& inputs = inputHandler->GetInputStates();

   for (auto i = 0; i < inputs.size(); i++)
   {
      const SDL_Rect buttonOffSrcRect = { i * 32, 0, 32, 32 };
      const SDL_Rect buttonOnSrcRect = { i * 32, 32, 32, 32 };
      const SDL_Point buttonHalf = { 16, 16 };
      const auto& keyState = inputs[i];
      const auto& buttonPoint = buttonDestPoints[i];
      const auto buttonTargetRect = SDL_Rect{ buttonPoint.x - buttonHalf.x, buttonPoint.y - buttonHalf.y, 32, 32 };
      SDL_RenderCopy(components.renderer, components.frameButtonTexture, keyState.Pressed() ? &buttonOnSrcRect : &buttonOffSrcRect, &buttonTargetRect);
   }
}

void DesktopWindowOutput::DrawLEDStates() const
{
   const SDL_Rect LEDOffSrcRect = { 0, 0, 16, 8 };
   const SDL_Rect LEDOnSrcRect = { 0, 8, 16, 8 };
   for (int i = 0; i < LED_COUNT; ++i)
   {
      const auto& LEDPoint = LEDDestPoints[i];
      const auto LEDTargetRect = SDL_Rect{ LEDPoint.x - LEDHalf.x, LEDPoint.y - LEDHalf.y, 16, 8 };
      //SDL_SetTextureAlphaMod(components.frameLEDTexture, 255);
      const auto ledSrcRect = led_states[i] ? &LEDOnSrcRect : &LEDOffSrcRect;
      SDL_RenderCopy(components.renderer, components.frameLEDTexture, ledSrcRect, &LEDTargetRect);
   }
}

void DesktopWindowOutput::GameBlt(const uint16_t frame[]) const
{
   int pitch{ 0 };

   void* targetPixelBuffer;
   if (0 == SDL_LockTexture(components.gameViewportTexture, nullptr, &targetPixelBuffer, &pitch))
   {
      memmove(targetPixelBuffer, frame, 320 * 240 * sizeof(uint16_t));
      SDL_UnlockTexture(components.gameViewportTexture);
   }
   SDL_RenderCopy(components.renderer, components.frameTexture, &components.frameSurface->clip_rect, &components.frameSurface->clip_rect);
   SDL_RenderCopy(components.renderer, components.gameViewportTexture, &gameViewportSrcRect, &gameViewportDstRect);
   DrawButtonStates();
   DrawLEDStates();

   SDL_RenderPresent(components.renderer);
}

void DesktopWindowOutput::Resize(int change)
{
   SCREEN_MULTIPLIER += change;
   if (SCREEN_MULTIPLIER < 1)
   {
      SCREEN_MULTIPLIER = 1;
   }
   if (SCREEN_MULTIPLIER > 2)
   {
      SCREEN_MULTIPLIER = 2;
   }
   components = EngineWindowFrameComponents{};
}