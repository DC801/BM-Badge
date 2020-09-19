#ifndef _ENGINEWINDOWFRAME_H
#define _ENGINEWINDOWFRAME_H
#include "FrameBuffer.h"
#include "EngineInput.h"
#include "modules/keyboard.h"
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>

void EngineWindowFrameInit();

void EngineWindowFrameGameBlt(uint16_t *frame);

void EngineWindowFrameDestroy();

#endif //_ENGINEWINDOWFRAME_H
