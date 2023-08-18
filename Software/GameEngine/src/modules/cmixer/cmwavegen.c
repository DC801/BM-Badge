#include "cmwavegen.h"
#include <stdlib.h>

typedef struct
{
	uint32_t sampledelta;
	uint32_t sample;
} SawtoothUData;

/*
 * When implementing the handlers, the samples are cm_Int16
 * and the channels are stereo. The length describes number
 * of cm_Int16 in buffer rather than number of bytes.
 *
 * You can look at wav_handler in cmixer.c to see an example
 */
static void sawtooth_handler(cm_Event *e)
{
	SawtoothUData *sawtooth = (SawtoothUData *)e->udata;
	switch (e->type)
	{
		case CM_EVENT_DESTROY:
			free(sawtooth);
		case CM_EVENT_SAMPLES:
		{
			// Put variables in locals to reduce aliasing
			int buflen = e->length & ~1;
			cm_Int16 *buffer = e->buffer;
			uint32_t sample = sawtooth->sample;
			uint32_t sampledelta = sawtooth->sampledelta;
			for (int i = 0; i < buflen; i += 2)
			{
				buffer[i] = (sample += sampledelta);
				buffer[i + 1] = sample;
			}
			sawtooth->sample = sample;
			break;
		}
		case CM_EVENT_REWIND:
			sawtooth->sample = 0;
			break;
	}
}

static void cm_init_info_from_common(cm_SourceInfo *info, cm_WaveGenCommon *wavegen)
{
	info->samplerate = wavegen->samplerate;
	info->length = info->samplerate * wavegen->duration;
}

cm_Source *cm_new_sawtooth(cm_WaveGenSawtooth *sawtooth)
{
	cm_SourceInfo info;
	SawtoothUData *udata = (SawtoothUData *)malloc(sizeof(SawtoothUData));
	info.udata = udata;
	if (udata == NULL)
	{
		return NULL;
	}
	cm_init_info_from_common(&info, &sawtooth->common);
	info.handler = sawtooth_handler;
	float ratio = (float)sawtooth->common.frequency / info.samplerate;
	udata->sampledelta = (uint32_t)(ratio * (1 << 16));
	udata->sample = 0;
	cm_Source *src = cm_new_source(&info);
	if (src == NULL)
	{
		free(udata);
	}
	return src;
}
