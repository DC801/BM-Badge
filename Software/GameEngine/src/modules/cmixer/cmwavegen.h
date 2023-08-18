#ifndef CMIXER_WAVEGEN_H
#define CMIXER_WAVEGEN_H

#include "cmixer.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C"
{
#endif

// A file with implementations for cmixer
// sources for simple waves like square,
// sawtooth, triangle, etc.
//
// This allows us to save a lot of bytes
// in memory and flash because they generate
// the sound rather than read it from memory

typedef struct
{
	uint32_t samplerate;
	uint32_t frequency;
	float duration;
} cm_WaveGenCommon;

typedef struct 
{
	cm_WaveGenCommon common;
} cm_WaveGenSawtooth;

cm_Source *cm_new_sawtooth(cm_WaveGenSawtooth *sawtooth);

#ifdef __cplusplus
}
#endif

#endif
