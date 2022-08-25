/*
** Copyright (c) 2017 rxi
**
** This library is free software; you can redistribute it and/or modify it
** under the terms of the MIT license. See `cmixer.c` for details.
**/

#ifndef CMIXER_H
#define CMIXER_H



#define CM_VERSION "0.1.1"

typedef short           cm_Int16;
typedef int             cm_Int32;
typedef long long       cm_Int64;
typedef unsigned char   cm_UInt8;
typedef unsigned short  cm_UInt16;
typedef unsigned        cm_UInt32;

#define CM_BUFFER_SIZE		(512)

typedef struct {
  int type;
  void *udata;
  const char *msg;
  cm_Int16 *buffer;
  int length;
} cm_Event;

typedef void (*cm_EventHandler)(cm_Event *e);

typedef struct {
  cm_EventHandler handler;
  void *udata;
  int samplerate;
  int length;
} cm_SourceInfo;


enum {
  CM_STATE_STOPPED,
  CM_STATE_PLAYING,
  CM_STATE_PAUSED
};

enum {
  CM_EVENT_LOCK,
  CM_EVENT_UNLOCK,
  CM_EVENT_DESTROY,
  CM_EVENT_SAMPLES,
  CM_EVENT_REWIND
};

typedef struct cm_Source_t
{
  struct cm_Source_t *next;				/* Next source in list */
  cm_Int16 buffer[CM_BUFFER_SIZE];		/* Internal buffer with raw stereo PCM */
  cm_EventHandler handler;				/* Event handler */
  void *udata;							/* Stream's udata (from cm_SourceInfo) */
  int samplerate;						/* Stream's native samplerate */
  int length;							/* Stream's length in frames */
  int end;								/* End index for the current play-through */
  int state;							/* Current state (playing|paused|stopped) */
  cm_Int64 position;					/* Current playhead position (fixed point) */
  int lgain, rgain;						/* Left and right gain (fixed point) */
  int rate;								/* Playback rate (fixed point) */
  int nextfill;							/* Next frame idx where the buffer needs to be filled */
  int loop;								/* Whether the source will loop when `end` is reached */
  int rewind;							/* Whether the source will rewind before playing */
  int active;							/* Whether the source is part of `sources` list */
  double gain;							/* Gain set by `cm_set_gain()` */
  double pan;							/* Pan set by `cm_set_pan()` */
} cm_Source;


const char* cm_get_error(void);
void cm_init(int samplerate);
void cm_set_lock(cm_EventHandler lock);
void cm_set_master_gain(double gain);
void cm_process(cm_Int16 *dst, int len);

cm_Source* cm_new_source(const cm_SourceInfo *info);
cm_Source* cm_new_source_from_file(const char *filename);
cm_Source* cm_new_source_from_mem(void *data, int size);
void cm_destroy_source(cm_Source *src);
double cm_get_length(cm_Source *src);
double cm_get_position(cm_Source *src);
int cm_get_state(cm_Source *src);
void cm_set_gain(cm_Source *src, double gain);
void cm_set_pan(cm_Source *src, double pan);
void cm_set_pitch(cm_Source *src, double pitch);
void cm_set_loop(cm_Source *src, int loop);
void cm_play(cm_Source *src);
void cm_pause(cm_Source *src);
void cm_stop(cm_Source *src);



#endif
