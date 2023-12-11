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

class EngineWindowFrame
{
public:
   void GameBlt(const uint16_t frame[]) const;
   void DrawButtonStates(ButtonState button) const;
   void DrawLEDStates() const;
   void Resize(int change);
private:

   struct EngineWindowFrameComponents
   {
      EngineWindowFrameComponents();
      ~EngineWindowFrameComponents();

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
   
   const SDL_Rect gameViewportSrcRect = { 0, 0, 320, 240 };
   const SDL_Rect gameViewportDstRect = { 112, 56, 320, 240 };
   const SDL_Rect buttonOffSrcRect = { 0, 0, 32, 32 };
   const SDL_Rect buttonOnSrcRect = { 0, 32, 32, 32 };
   const SDL_Rect LEDOffSrcRect = { 0, 0, 16, 8 };
   const SDL_Rect LEDOnSrcRect = { 0, 8, 16, 8 };
   const SDL_Point buttonHalf = { 16, 16 };
   const SDL_Point LEDHalf = { 8, 4 };

   const SDL_Point buttonDestPoints[27] = {
       // Mem0-3
       {506, 98},
       {506, 98 + 42},
       {506, 98 + 42 + 42},
       {506, 98 + 42 + 42 + 42},

       // Bit7-0
       {126, 364},
       {126 + 42, 364},
       {126 + 42 + 42, 364},
       {126 + 42 + 42 + 42, 364},
       {126 + 42 + 42 + 42 + 42, 364},
       {126 + 42 + 42 + 42 + 42 + 42, 364},
       {126 + 42 + 42 + 42 + 42 + 42 + 42, 364},
       {126 + 42 + 42 + 42 + 42 + 42 + 42 + 42, 364},

       // xor, add, sub, page
       {38, 98},
       {38, 98 + 42},
       {38, 98 + 42 + 42},
       {38, 98 + 42 + 42 + 42},

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
       {38, 98 - 42},
   };

   const SDL_Point LEDDestPoints[LED_COUNT] = {
       {468, 112}, //LED_MEM0
       {468, 112 + 42}, //LED_MEM1
       {468, 112 + 42 + 42}, //LED_MEM2
       {468, 112 + 42 + 42 + 42}, //LED_MEM3

       {126, 328}, //LED_BIT128
       {126 + 42, 328}, //LED_BIT64
       {126 + 42 + 42, 328}, //LED_BIT32
       {126 + 42 + 42 + 42, 328}, //LED_BIT16
       {126 + 42 + 42 + 42 + 42, 328}, //LED_BIT8
       {126 + 42 + 42 + 42 + 42 + 42, 328}, //LED_BIT4
       {126 + 42 + 42 + 42 + 42 + 42 + 42, 328}, //LED_BIT2
       {126 + 42 + 42 + 42 + 42 + 42 + 42 + 42, 328}, //LED_BIT1
       {76, 112}, //LED_XOR
       {76, 112 + 42}, //LED_ADD
       {76, 112 + 42 + 42}, //LED_SUB
       {76, 112 + 42 + 42 + 42}, //LED_PAGE
       {76, 112 - 42}, //LED_HAX

       {468, 112 - 42 - 21}, //LED_USB
       {468, 112 - 42}, //LED_SD
   };

};

#endif //  DC801_EMBEDDED
#endif //_ENGINEWINDOWFRAME_H
