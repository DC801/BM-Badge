#ifndef _ENGINEWINDOWFRAME_H
#define _ENGINEWINDOWFRAME_H
#include "FrameBuffer.h"
#include "EngineInput.h"
#include "modules/keyboard.h"

#ifdef __cplusplus
extern "C" {
#endif

void EngineWindowFrameInit();

void EngineWindowFrameGameBlt(uint16_t *frame);

void EngineWindowFrameDestroy();

void EngineWindowFrameResize(int change);

void EngineWindowFrameCleanup();

#ifdef __cplusplus
}
#endif

#endif //_ENGINEWINDOWFRAME_H
