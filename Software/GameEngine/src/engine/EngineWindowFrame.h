#ifndef _ENGINEWINDOWFRAME_H
#define _ENGINEWINDOWFRAME_H
#include "FrameBuffer.h"
#include "EngineInput.h"
#include "modules/keyboard.h"
#include <SDL.h>
#include <SDL_image.h>

void EngineWindowFrameInit();

void EngineWindowFrameGameBlt(uint16_t *frame);

void EngineWindowFrameDestroy();

void EngineWindowFrameResize(int change);

void EngineWindowFrameCleanup();

#endif //_ENGINEWINDOWFRAME_H
