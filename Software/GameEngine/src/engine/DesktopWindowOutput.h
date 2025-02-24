#ifndef _ENGINEWINDOWFRAME_H
#define _ENGINEWINDOWFRAME_H

#ifndef DC801_EMBEDDED

#include "EngineInput.h"
#include "modules/keyboard.h"
#include "modules/led.h"

#include <SDL.h>
#include <SDL_image.h>
#include <memory>

#ifndef SDL_CreateWindowAndRenderer
extern int SDL_CreateWindowAndRenderer(int width, int height, uint32_t window_flags, SDL_Window** window, SDL_Renderer** renderer);
#endif

#ifndef SDL_CreateWindowAndRenderer
extern int SDL_RenderSetLogicalSize(SDL_Renderer* renderer, int w, int h);
#endif


class DesktopWindowOutput
{
public:
   DesktopWindowOutput(std::shared_ptr<EngineInput> inputHandler) noexcept
      : inputHandler(inputHandler)
   {}
   void GameBlt(const uint16_t frame[]) const;
   void DrawButtonStates() const;
   void DrawLEDStates() const;
   void Resize(int change);
private:
   std::shared_ptr<EngineInput> inputHandler;
   struct EngineWindowFrameComponents
   {
      EngineWindowFrameComponents();
      ~EngineWindowFrameComponents() noexcept;

      SDL_Window* window = nullptr;
      SDL_Renderer* renderer = nullptr;
      SDL_Surface* frameSurface = nullptr;
      SDL_Texture* frameTexture = nullptr;
      SDL_Surface* frameButtonSurface = nullptr;
      SDL_Texture* frameButtonTexture = nullptr;
      SDL_Surface* frameLEDSurface = nullptr;
      SDL_Texture* frameLEDTexture = nullptr;
      SDL_Texture* gameViewportTexture = nullptr;
   } components{};

static inline const auto LedSize = 42;
static inline const auto gameViewportSrcRect = SDL_Rect{ 0, 0, 320, 240 };
static inline const auto gameViewportDstRect = SDL_Rect{ 112, 56, 320, 240 };
static inline const auto LEDHalf = SDL_Point{ 8, 4 };

   const SDL_Point buttonDestPoints[27] = {
      // Mem0-3
      {506, 98 + 0 * LedSize},
      {506, 98 + 1 * LedSize},
      {506, 98 + 2 * LedSize},
      {506, 98 + 3 * LedSize},

      // Bit7-0
      {126 + 0 * LedSize, 364},
      {126 + 1 * LedSize, 364},
      {126 + 2 * LedSize, 364},
      {126 + 3 * LedSize, 364},
      {126 + 4 * LedSize, 364},
      {126 + 5 * LedSize, 364},
      {126 + 6 * LedSize, 364},
      {126 + 7 * LedSize, 364},

      // xor, add, sub, page
      {38, 98 + 0 * LedSize},
      {38, 98 + 1 * LedSize},
      {38, 98 + 2 * LedSize},
      {38, 98 + 3 * LedSize},

      // ljoy CUDLR
      {54, 344},
      {54, 344 - 32},
      {54, 344 + 32},
      {54 - 32, 344},
      {54 + 32, 344},

      // rjoy CUDLR
      {490, 344},
      {490, 344 - 32},
      {490, 344 + 32},
      {490 - 32, 344},
      {490 + 32, 344},

      // hax
      {38, 98 - LedSize},
   };

   const SDL_Point LEDDestPoints[LED_COUNT] = {
       {468, 112 + 0 * LedSize         }, //LED_MEM0
       {468, 112 + 1 * LedSize         }, //LED_MEM1
       {468, 112 + 2 * LedSize         }, //LED_MEM2
       {468, 112 + 3 * LedSize         }, //LED_MEM3

       {126 + 0 * LedSize, 328         }, //LED_BIT128
       {126 + 1 * LedSize, 328         }, //LED_BIT64
       {126 + 2 * LedSize, 328         }, //LED_BIT32
       {126 + 3 * LedSize, 328         }, //LED_BIT16
       {126 + 4 * LedSize, 328         }, //LED_BIT8
       {126 + 5 * LedSize, 328         }, //LED_BIT4
       {126 + 6 * LedSize, 328         }, //LED_BIT2
       {126 + 7 * LedSize, 328         }, //LED_BIT1

       {76, 112 + 0 * LedSize          }, //LED_XOR
       {76, 112 + 1 * LedSize          }, //LED_ADD
       {76, 112 + 2 * LedSize          }, //LED_SUB
       {76, 112 + 3 * LedSize          }, //LED_PAGE
       {76, 112 - LedSize              }, //LED_HAX

       {468, 112 - LedSize - LedSize / 2 }, //LED_USB
       {468, 112 - LedSize             }, //LED_SD
   };

};
extern uint8_t led_states[LED_COUNT];
#endif
#endif //_ENGINEWINDOWFRAME_H
