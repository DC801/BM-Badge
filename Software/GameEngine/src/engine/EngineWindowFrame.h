#ifndef _ENGINEWINDOWFRAME_H
#define _ENGINEWINDOWFRAME_H

#include "FrameBuffer.h"
#include "EngineInput.h"
#include "modules/keyboard.h"
#include "modules/led.h"


#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include <SDL.h>
#include <SDL_image.h>



#ifndef SDL_CreateWindowAndRenderer
extern int SDL_CreateWindowAndRenderer(int width, int height, uint32_t window_flags, SDL_Window** window, SDL_Renderer** renderer);
#endif

#ifndef SDL_CreateWindowAndRenderer
extern int SDL_RenderSetLogicalSize(SDL_Renderer* renderer, int w, int h);
#endif

class EngineWindowFrame
{
public:
   EngineWindowFrame(std::shared_ptr<EngineInput> inputHandler) noexcept
      : inputHandler(inputHandler)
   {}
   void GameBlt(uint16_t* frame);
   void Resize(int change);
private:
   std::shared_ptr<EngineInput> inputHandler;
   void drawButtonStates();
   void drawLEDStates();

   /*void util_gfx_init()
   {
      area_t area = { 0, 0, WIDTH, HEIGHT };
      p_canvas()->setTextArea(&area);

      p_canvas()->clearScreen(COLOR_BLACK);

      p_canvas()->blt();
   }*/
   struct EngineWindowFrameComponents
   {
      EngineWindowFrameComponents() noexcept;
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
   };
   EngineWindowFrameComponents components{};
   const SDL_Rect gameViewportSrcRect = { 0, 0, WIDTH, HEIGHT };
   const SDL_Rect gameViewportDstRect = { 112, 56, WIDTH, HEIGHT };
   const SDL_Rect buttonOffSrcRect = { 0, 0, 32, 32 };
   const SDL_Rect buttonOnSrcRect = { 0, 32, 32, 32 };
   const SDL_Rect LEDOffSrcRect = { 0, 0, 16, 8 };
   const SDL_Rect LEDOnSrcRect = { 0, 8, 16, 8 };
   SDL_Rect buttonTargetRect = { 0, 0, 32, 32 };
   SDL_Rect LEDTargetRect = { 0, 0, 16, 8 };
   const SDL_Point buttonHalf = { 16, 16 };
   const SDL_Point LEDHalf = { 8, 4 };

   const SDL_Point buttonDestPoints[27] = {
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
       {468, 112 - 42 - 21}, //LED_USB
       {76, 112 - 42}, //LED_HAX
       {468, 112 - 42}, //LED_SD
   };

};


#endif //_ENGINEWINDOWFRAME_H
