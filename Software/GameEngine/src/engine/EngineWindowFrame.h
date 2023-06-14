#ifndef _ENGINEWINDOWFRAME_H
#define _ENGINEWINDOWFRAME_H
#include "FrameBuffer.h"
#include "EngineInput.h"
#include "modules/keyboard.h"
#include <SDL.h>
#include <SDL_image.h>

extern const SDL_Point buttonDestPoints[KEYBOARD_NUM_KEYS];
extern const SDL_Point buttonHalf;
extern SDL_Rect buttonTargetRect;

void EngineWindowFrameInit();

void EngineWindowFrameGameBlt(uint16_t *frame);

void EngineWindowFrameDestroy();

void EngineWindowFrameResize(int change);

void EngineWindowFrameCleanup();

#endif //_ENGINEWINDOWFRAME_H
