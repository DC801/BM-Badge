#ifndef DC801_EMBEDDED

#include "EngineAudio.h"

#include "cmixer.h"
#include <functional>

// Used in place of std::mutex because of size constraints when including
// C++ threading and synchronization. More info here:
// https://developer.arm.com/documentation/dht0008/a/arm-synchronization-primitives/practical-uses/implementing-a-mutex

// Frequency of the file
#define AUDIO_FREQUENCY 48000

// 1 mono, 2 stereo, 4 quad, 6 (5.1)
#define AUDIO_CHANNELS 2

// Specifies a unit of audio data to be used at a time. Must be a power of 2
#define AUDIO_SAMPLES 512

// Max number of sounds that can be in the audio queue at anytime, stops too much mixing
#define AUDIO_MAX_SOUNDS 25

#define BUFFER_SIZE (AUDIO_SAMPLES / AUDIO_CHANNELS)
uint32_t stream[2][BUFFER_SIZE];
uint32_t soundCount = 0;

AudioMutex audio_mutex{};
Audio head{};

void AudioPlayer::lockAudio(cm_Event* e)
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

void AudioPlayer::callback(const nrfx_i2s_buffers_t* p_released, uint32_t status)
{
	if ((status & NRFX_I2S_STATUS_NEXT_BUFFERS_NEEDED) == 0)
	{
		return;
	}

	// Capture the root of the list
	auto previous = head.get();
	// Pull the first audio sample
	auto audio = previous->next.get();

	int length = sizeof(stream[1]) * sizeof(stream[1][0]) / sizeof(cm_Int16);
	memset(reinterpret_cast<cm_Int16*>(stream[1]), 0, length);

	// Walk the list
	while (audio)
	{
		auto source = audio->source;

		// If this sample has remaining data to play
		if (!audio->end)
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
			cm_process(reinterpret_cast<cm_Int16*>(stream[1]), length);

			// Continue to the next item
			previous = audio;
		}
		// Otherwise, this sample is finished
		else
		{
			// // Stop playing
			// cm_stop(audio->source);

			// // Offset our sample count for non-looped samples
			// if (audio->source->loop == 0)
			// {
			// 	soundCount -= 1;
			// }

			// Unlink the sample
			previous->next = std::move(audio->next);
		}

		// Iterate to the next sample
		audio = previous->next.get();
	}

#ifdef DC801_EMBEDDED
	if (!p_released->p_rx_buffer)
	{
		nrfx_i2s_buffers_t buffers = { nullptr, stream[1] };

		nrfx_i2s_next_buffers_set(&buffers);
	}
	else
	{
		nrfx_i2s_buffers_t buffers = { nullptr, p_released->p_tx_buffer };

		nrfx_i2s_next_buffers_set(&buffers);
	}
#endif
}

// Indicate that an audio sample should be faded out and removed
// The current driver only allows one looped audio sample
void AudioPlayer::fadeAudio()
{
	// Walk the tree
	auto audio = head.get();
	while ((audio) && (audio->source))
	{
		cm_Source* source = audio->source;
		// Find any looped samples and fade them
		if (source->loop == 1)
		{
			source->loop = 0;
			audio->fade = 1;
		}

		// Iterate to the next sample
		audio = audio->next.get();
	}
}

// Loads a wave file and adds it to the list of samples to be played
void AudioPlayer::playAudio(const char* filename, bool loop, double gain)
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
	auto audio = std::make_unique<Audio>();

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
		fadeAudio();
	}

	// Prepend the sample to the list
	audio->next = std::move(head);
	head = std::move(audio);

	audio_mutex.unlock();
}

void AudioPlayer::play(const char* name, double gain)
{
	playAudio(name, false, gain);
}

void AudioPlayer::loop(const char* name, double gain)
{
	playAudio(name, true, gain);
}

void AudioPlayer::stop_loop()
{
	for (auto audio = head.get(); audio; audio = audio->next.get())
	{
		if (audio->source && audio->source->loop)
		{
			audio->end = true;
		}		
	}
}

AudioPlayer::AudioPlayer()
{
#ifdef DC801_EMBEDDED
	// Initialize Audio chip
	nau8810_init(callback);
#endif

	// Initialize cmixer
	cm_init(AUDIO_FREQUENCY);
	static auto lockFn = [this](cm_Event* e) { lockAudio(e); };
	cm_set_lock([](cm_Event* e) { lockFn(e); });
	cm_set_master_gain(1.0);

#ifdef DC801_EMBEDDED
	// Initialize audio chip
	nau8810_init(callback);

	// Start DMA
	nau8810_start(stream[0], BUFFER_SIZE);
#endif
}

#endif
