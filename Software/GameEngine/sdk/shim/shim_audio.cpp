#include <EngineAudio.h>

#include <iostream>

#ifndef DC801_EMBEDDED
#include <SDL.h>

AudioPlayer audio{};

/*

	The Audio Player is implemented as a single linked list. This could have been done in a more
	C++ way (ie with a std::vector), however this implementation more or less reflects how EasyDMA
	works on the NRF52840.

	The SDL audio subsytem has you load a file, then unpause audio. From there, a callback is called
	asking you to feed the configured number of bytes (in this case, (n_channels * samples) 8192 bytes)
	each iteration. The audio subsystem then plays that audio through the configured device.

	The EasyDMA subsystem will ask you to configure a buffer then trigger a transfer. During that transfer,
	a callback function is called asking for more data based on the configured size. This design works
	and will make it easier to port to the embedded system.

 */

 // SDL_AudioFormat of files, such as s16 little endian
#define AUDIO_FORMAT AUDIO_S16LSB

// Frequency of the file
#define AUDIO_FREQUENCY 48000

// 1 mono, 2 stereo, 4 quad, 6 (5.1)
#define AUDIO_CHANNELS 2

// Specifies a unit of audio data to be used at a time. Must be a power of 2
#define AUDIO_SAMPLES 512

// Max number of sounds that can be in the audio queue at anytime, stops too much mixing
#define AUDIO_MAX_SOUNDS 25

// Constructor:
//  - Initialize SDL audio
//  - Configure the SDL device structure
//  - Setup the root to the list of audio samples
//  - Unpause SDL audio (callbacks start now)
AudioPlayer::AudioPlayer()
{
	if (SDL_Init(SDL_INIT_AUDIO) < 0)
	{
		std::cout << "Audio Player: Failed to init SDL audio" << std::endl;
		return;
	}

	device.spec.freq = AUDIO_FREQUENCY;
	device.spec.format = AUDIO_FORMAT;
	device.spec.channels = AUDIO_CHANNELS;
	device.spec.samples = AUDIO_SAMPLES;
	device.spec.userdata = this;
	device.spec.callback = AudioPlayer::forwardCallback;

	device.spec.userdata = head;

	device.id = SDL_OpenAudioDevice(NULL, 0, &device.spec, NULL, SDL_AUDIO_ALLOW_ANY_CHANGE);

	if (device.id == 0)
	{
		std::cout << "Audio Player: Failed to open audio device" << std::endl;
		std::cout << "    " << SDL_GetError() << std::endl;
		return;
	}

	device.enabled = true;

	// Initialize cmixer
	cm_init(AUDIO_FREQUENCY);
	cm_set_mutex(&mutex);
	cm_set_master_gain(1.0);

	SDL_PauseAudioDevice(device.id, 0);
}

// Destructor:
// - Pause the Audio device
// - Free and delete all audio samples
// - Close the audio device

// Whether the SDL calls here are actually necessary remains to be seen.
// main() calls SDL_Quit() before this destructor is called, which should
// be cleaning up everything SDL, including pausing an closing.
AudioPlayer::~AudioPlayer()
{
	if (device.enabled)
	{
		// Pause SDL audio
		SDL_PauseAudioDevice(device.id, 1);
		// Free and delete all samples
		freeAudio(reinterpret_cast<Audio*>(device.spec.userdata));
		// Close SDL audio device
		SDL_CloseAudioDevice(device.id);
	}
	delete head;
}

#endif

// Walk the list and free items
void AudioPlayer::freeAudio(Audio* audio)
{
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
		Audio* temp = audio;
		audio->next = temp->next;
		// And free it
		delete temp;
	}
}

// Callbacks issued by SDL
//  Here we:
//   - Silence the SDL buffer (done by cmixer)
//   - Walk the tree, mixing all samples in progress
//   - Loop audio samples, fading the volume when necessary
//   - Free finished samples
void AudioPlayer::callback(uint8_t* stream, int len)
{
	// Capture the root of the list
	Audio* previous = head;
	if (previous) {
		// Pull the first audio sample
		Audio* audio = previous->next;

		memset(stream, 0, len);

		// Walk the list
		while (audio != NULL)
		{
			cm_Source* source = audio->source;

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
				cm_process(reinterpret_cast<cm_Int16*>(stream), len / sizeof(cm_Int16));

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
	}
}

// Indicate that an audio sample should be faded out and removed
// The current driver only allows one looped audio sample
void AudioPlayer::fadeAudio(Audio* audio)
{
	// Walk the tree
	while ((audio != NULL) && (audio->source != NULL))
	{
		cm_Source* source = audio->source;
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
void AudioPlayer::addAudio(Audio* root, Audio* audio)
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
void AudioPlayer::playAudio(const char* filename, bool loop, double gain)
{
	// Sanity check
	if (filename == NULL)
	{
		return;
	}

	// If the audio player isn't enabled
	if (device.enabled == false)
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
	Audio* audio = new Audio{ filename };

	if (audio->source == NULL)
	{
		delete audio;
		return;
	}

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
	audio->free = 1;

	// The callback is issued for the head of the list, and the head only.
	// We don't need a callback for each individual sample, since the head
	// callback walks the entire tree and mixes all samples.
	audio->spec.callback = NULL;
	audio->spec.userdata = NULL;

	// Temporarily stop the audio callback
	SDL_LockAudioDevice(device.id);

	// If the sample we're adding is looped, fade any and all existing looped samples
	if (loop == true)
	{
		fadeAudio(reinterpret_cast<Audio*>(device.spec.userdata));
	}

	// Append the sample to the end of the list
	addAudio(reinterpret_cast<Audio*>(device.spec.userdata), audio);

	// Resume audio callback
	SDL_UnlockAudioDevice(device.id);
}

// Public interface: Play an audio sound
void AudioPlayer::play(const char* name, double gain)
{
	playAudio(name, false, gain);
}

// Public interface: Play a looped sound
void AudioPlayer::loop(const char* name, double gain)
{
	playAudio(name, true, gain);
}

void AudioPlayer::stop_loop()
{
	Audio* item = reinterpret_cast<Audio*>(device.spec.userdata);

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
