#include <common.h>
#include "EngineAudio.h"
#include "EnginePanic.h"
#include "cmixer.h"

#ifdef DC801_DESKTOP
#include <SDL.h>
#endif

// Used in place of std::mutex because of size constraints when including
// C++ threading and synchronization. More info here:
// https://developer.arm.com/documentation/dht0008/a/arm-synchronization-primitives/practical-uses/implementing-a-mutex

AudioPlayer *audio_player = NULL;

// Frequency of the file
#define AUDIO_FREQUENCY 48000

// 1 mono, 2 stereo, 4 quad, 6 (5.1)
#define AUDIO_CHANNELS 2

// Max number of sounds that can be in the audio queue at anytime, stops too much mixing
#define AUDIO_MAX_SOUNDS 25

// Specifies a unit of audio data to be used at a time. Must be a power of 2
#define AUDIO_SAMPLES 512
#define BUFFER_SIZE (AUDIO_SAMPLES * AUDIO_CHANNELS)

#ifdef DC801_EMBEDDED
uint32_t stream[2][BUFFER_SIZE * sizeof(cm_Int16) / sizeof(uint32_t)];
#else
SDL_AudioDeviceID sdl_audio_id = 0;
#endif

uint32_t soundCount = 0;
AudioMutex audio_mutex;

typedef struct sound
{
	bool fade;
	bool free;
	bool end;

	cm_Source *source;

	struct sound *next;
} Audio;

Audio head;

static void lockAudio(cm_Event *e)
{
	if (e->type == CM_EVENT_LOCK)
	{
		audio_mutex.lock();
	}

	if (e->type == CM_EVENT_UNLOCK)
	{
		audio_mutex.unlock();
	}
}

static void freeAudio(Audio *audio)
{
	Audio *temp;

	while (audio != NULL)
	{
		// If the SDL sample is loaded, free it
		if (audio->free)
		{
			if (audio->source != NULL)
			{
				cm_destroy_source(audio->source);
			}
		}

		// Unlink this item from the list
		temp = audio;
		audio = audio->next;
		// And free it
		delete temp;
	}
}

#ifdef DC801_EMBEDDED
static void callback(nrfx_i2s_buffers_t const *p_released, uint32_t status)
#else
static void callback(void *userdata, Uint8 *sdl_stream, int sdl_len)
#endif
{
	cm_Int16 *cm_stream;
	int length;
#ifdef DC801_EMBEDDED
	if ((status & NRFX_I2S_STATUS_NEXT_BUFFERS_NEEDED) == 0)
	{
		return;
	}
	cm_stream = (cm_Int16 *)stream[1];
	length = sizeof(stream[1]) / sizeof(cm_Int16);
#else
	cm_stream = (cm_Int16 *)sdl_stream;
	length = sdl_len / sizeof(cm_Int16);
#endif

	// Capture the root of the list
	Audio *previous = &head;
	// Pull the first audio sample
	Audio *audio = previous->next;

	memset(cm_stream, 0, length * sizeof(cm_Int16));

	// Walk the list
	while (audio != NULL)
	{
		cm_Source *source = audio->source;

		// If this sample has remaining data to play
		if (audio->end == false)
		{
			// And the audio is being faded
			if (audio->fade == 1)
			{
				// Fade until gain is zero, then truncate sample to zero length
				if (source->gain > 0.0)
				{
					cm_set_gain(source, source->gain - 0.1);
				}
				else
				{
					audio->end = true;
				}
			}

			// Mix with cmixer
			cm_process(cm_stream, length);

			// Continue to the next item
			previous = audio;
		}
		// Otherwise, this sample is finished
		else
		{
			// Stop playing
			cm_stop(audio->source);

			// Unlink the sample
			previous->next = audio->next;
			// Offset our sample count for non-looped samples
			if (audio->source->loop == 0)
			{
				soundCount -= 1;
			}

			// Unlink the next sample
			audio->next = NULL;
			// Free the sample and delete the audio object
			freeAudio(audio);
		}

		// Iterate to the next sample
		audio = previous->next;
	}

#ifdef DC801_EMBEDDED
	if (!p_released->p_rx_buffer)
	{
		nau8810_next((const uint32_t *)cm_stream);
	}
	else
	{
		nau8810_next(p_released->p_tx_buffer);
	}
#else
	// Use SDL_AudioDevice
	if (sdl_audio_id == 0)
	{
	}
#endif
}

// Indicate that an audio sample should be faded out and removed
// The current driver only allows one looped audio sample
static void fadeAudio(Audio *audio)
{
	// Walk the tree
	while ((audio != NULL) && (audio->source != NULL))
	{
		cm_Source *source = audio->source;
		// Find any looped samples and fade them
		if (source->loop == 1)
		{
			source->loop = 0;
			audio->fade = 1;
		}

		// Iterate to the next sample
		audio = audio->next;
	}
}

// Add an audio sample to the end of the list
static void addAudio(Audio *root, Audio *audio)
{
	// Sanity check
	if (root == NULL)
	{
		return;
	}

	// Walk the tree to the end
	while (root->next != NULL)
	{
		root = root->next;
	}

	// Link the new item to the end
	root->next = audio;
}

// Play audio from CMixer source
static void playAudioFromCMixer(cm_Source *src, bool loop, double gain)
{
	// Sanity check
	if (src == NULL)
	{
		return;
	}

	// If we've reached the maximum number of audio samples
	if (soundCount >= AUDIO_MAX_SOUNDS)
	{
		return;
	}

	// Increment sample counts
	soundCount += 1;

	// Allocate a new audio object
	Audio *audio = new Audio();

	audio->next = NULL;				// At the end of the list
	audio->fade = false;			// New sample, don't fade
	audio->free = false;			// Sample isn't loaded yet

	audio->source = src; 
	cm_set_gain(audio->source, gain);

	if (loop == true)
	{
		audio->source->loop = 1;
	}
	else
	{
		audio->source->loop = 0;
	}

	// Tell cmixer to play the audio source
	cm_play(audio->source);

	// Sample is loaded, it's good to free
	audio->free = true;

	audio_mutex.lock();

	// If the sample we're adding is looped, fade any and all existing looped samples
	if (loop == true)
	{
		fadeAudio(&head);
	}

	// Append the sample to the end of the list
	addAudio(&head, audio);

	audio_mutex.unlock();
}

// Loads a wave file and adds it to the list of samples to be played
static void playAudioFromFilename(const char *filename, bool loop, double gain)
{
	// Sanity check
	if (filename == NULL)
	{
		return;
	}
	// Ask cmixer to load our wave file
	playAudioFromCMixer(cm_new_source_from_file(filename), loop, gain);
}



void AudioPlayer::play(const char *name, double gain)
{
	playAudioFromFilename(name, false, gain);
}

void AudioPlayer::play(cm_WaveGenSawtooth *sawtooth, double gain)
{
	playAudioFromCMixer(cm_new_sawtooth(sawtooth), false, gain);
}

void AudioPlayer::loop(const char *name, double gain)
{
	playAudioFromFilename(name, true, gain);
}

void AudioPlayer::loop(cm_WaveGenSawtooth *sawtooth, double gain)
{
	playAudioFromCMixer(cm_new_sawtooth(sawtooth), true, gain);
}

void AudioPlayer::stop_loop()
{
	Audio *item = &head;

	while (item != NULL)
	{
		if (item->source != NULL)
		{
			if (item->source->loop != 0)
			{
				item->end = true;
				return;
			}
		}

		item = item->next;
	}
}

AudioPlayer::AudioPlayer()
{
#ifdef DC801_EMBEDDED
	// Initialize Audio chip
	nau8810_init(callback);
#endif

	head.fade = false;
	head.free = false;
	head.end = false;

	head.source = NULL;
	head.next = NULL;

	// Initialize cmixer
	cm_init(AUDIO_FREQUENCY);
	cm_set_lock(lockAudio);
	cm_set_master_gain(1.0);

#ifdef DC801_EMBEDDED
	// Start DMA
	nau8810_start(stream[0], BUFFER_SIZE);
#else
	if (SDL_Init(SDL_INIT_AUDIO) < 0)
	{
		ENGINE_PANIC("SDL_Init Audio error!: %s", SDL_GetError());
	}
	SDL_AudioSpec spec;
	spec.freq = AUDIO_FREQUENCY;
	spec.format = 16 | SDL_AUDIO_MASK_SIGNED;
	spec.channels = 2;
	spec.samples = BUFFER_SIZE * sizeof(uint32_t);
	spec.callback = callback;
	spec.userdata = NULL;
	sdl_audio_id = SDL_OpenAudioDevice(
			NULL,
			false,
			&spec,
			NULL,
			0);
	if (sdl_audio_id == 0)
	{
		ENGINE_PANIC("SDL_OpenAudioDevice error!: %s", SDL_GetError());
	}
	SDL_PauseAudioDevice(sdl_audio_id, 0);
#endif
}

// Not really necessary on embedded, but...
AudioPlayer::~AudioPlayer()
{
	// Delete all audio samples
	freeAudio(head.next);
}
