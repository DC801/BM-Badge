#ifndef AUDIO_H
#define AUDIO_H

#include <stdint.h>
#include "cmixer.h"
#include <memory>

#ifndef DC801_EMBEDDED
#include <SDL.h>
#endif

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


#ifndef DC801_EMBEDDED
// Contains SDL Audio Device information
struct AudioDevice
{
	SDL_AudioDeviceID id;		// SDL Audio Device ID
	SDL_AudioSpec spec;			// Secifications of our audio
	bool enabled;				// Whether the audio driver is loaded and ready
};
#endif

// The audio player uses a linked list to play up to 25 sounds and one background track simultaneously
class Audio
{
	friend class AudioPlayer;
public:
	Audio(const char* filename)
		:Audio(cm_new_source_from_file(filename)) { }
	Audio(cm_Source* src = nullptr)
		:source(src) { }
	~Audio() {
		// Stop playing
		cm_stop(source);

		if (free && source)
		{
			cm_destroy_source(source);
		}
		// collapse the audio list
		for (auto audio = std::move(next);
			audio;
			audio = std::move(audio->next))
		{}
	}
	
private:
	uint8_t fade{ 0 };					// Sample has been dropped, fade it out
	bool free{ false };					// Whether to free the cmixer source
	bool end{ false };					// The sample is done playing, free it

	cm_Source* source; 		// cmixer audio source

#ifndef DC801_EMBEDDED
	SDL_AudioSpec spec{};			// Specifications of the audio sample
#endif

	std::unique_ptr<Audio> next{ nullptr };			// Next item in the list
};

class AudioPlayer
{
public:
	void play(const char *name, double gain);
	void loop(const char *name, double gain);
	void stop_loop();

	static void forwardCallback(void* userdata, uint8_t* stream, int len)
	{
		static_cast<AudioPlayer*>(userdata)->callback(stream, len);
	}

	AudioPlayer();
	~AudioPlayer();

private:
	void callback(uint8_t* stream, int len);
	void addAudio(Audio* root, std::unique_ptr<Audio> audio);
	void playAudio(const char* filename, bool loop, double gain);
	void fadeAudio();
	//void lockAudio(cm_Event* e);

	uint32_t soundCount = 0;			// Current number of simultaneous audio samples
	AudioMutex mutex{};

#ifndef DC801_EMBEDDED
	AudioDevice device{ 0, 
		SDL_AudioSpec{
		AUDIO_FREQUENCY,
		AUDIO_FORMAT,
		AUDIO_CHANNELS,
		(uint8_t)0, //silence (calculated)
		AUDIO_SAMPLES,
		(uint16_t)0, //padding
		(uint32_t)0, // audio buffer size in bytes (calculated)
		AudioPlayer::forwardCallback,
		this
	}, false };
#endif
	std::unique_ptr<Audio> head;
};

#endif
