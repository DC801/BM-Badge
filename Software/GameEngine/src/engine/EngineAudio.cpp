#ifdef DC801_EMBEDDED

#include <common.h>
#include "EngineAudio.h"

#include "cmixer.h"

// Used in place of std::mutex because of size constraints when including
// C++ threading and synchronization. More info here:
// https://developer.arm.com/documentation/dht0008/a/arm-synchronization-primitives/practical-uses/implementing-a-mutex

AudioPlayer *audio_player = nullptr;

// Frequency of the file
#define AUDIO_FREQUENCY 48000

// 1 mono, 2 stereo, 4 quad, 6 (5.1)
#define AUDIO_CHANNELS 2

// Specifies a unit of audio data to be used at a time. Must be a power of 2
#define AUDIO_SAMPLES 512

// Max number of sounds that can be in the audio queue at anytime, stops too much mixing
#define AUDIO_MAX_SOUNDS 25

// #define BUFFER_SIZE (AUDIO_SAMPLES / AUDIO_CHANNELS)
#define BUFFER_SIZE 512
uint32_t stream[2][BUFFER_SIZE];
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

void lockAudio(cm_Event *e)
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

void freeAudio(Audio *audio)
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

void callback(nrfx_i2s_buffers_t const *p_released, uint32_t status)
{
	if ((status & NRFX_I2S_STATUS_NEXT_BUFFERS_NEEDED) == 0)
	{
		return;
	}

	// Capture the root of the list
	Audio *previous = &head;
	// Pull the first audio sample
	Audio *audio = previous->next;

	int length = sizeof(stream[1]) * sizeof(stream[1][0]) / sizeof(cm_Int16);
	memset(reinterpret_cast<cm_Int16*>(stream[1]), 0, length);

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

			int length = sizeof(stream[1]) * sizeof(stream[1][0]) / sizeof(cm_Int16);

			// Mix with cmixer
			cm_process(reinterpret_cast<cm_Int16*>(stream[1]), length);

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

	if (!p_released->p_rx_buffer)
	{
		nau8810_next(stream[1]);
	}
	else
	{
		nau8810_next(p_released->p_tx_buffer);
	}
}

// Indicate that an audio sample should be faded out and removed
// The current driver only allows one looped audio sample
void fadeAudio(Audio *audio)
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
void addAudio(Audio *root, Audio *audio)
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

// Loads a wave file and adds it to the list of samples to be played
void playAudio(const char *filename, bool loop, double gain)
{
	// Sanity check
	if (filename == NULL)
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

	// Ask cmixer to load our wave file
	audio->source = cm_new_source_from_file(filename);
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

void AudioPlayer::play(const char *name, double gain)
{
	playAudio(name, false, gain);
}

void AudioPlayer::loop(const char *name, double gain)
{
	playAudio(name, true, gain);
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
	// Initialize Audio chip
	nau8810_init(callback);

	head.fade = false;
	head.free = false;
	head.end = false;

	head.source = NULL;
	head.next = NULL;

	// Initialize cmixer
	cm_init(AUDIO_FREQUENCY);
	cm_set_lock(lockAudio);
	cm_set_master_gain(1.0);

	// Start DMA
	nau8810_start(stream[0], BUFFER_SIZE);
}

// Not really necessary on embedded, but...
AudioPlayer::~AudioPlayer()
{
	// Delete all audio samples
	freeAudio(head.next);
}

#endif
