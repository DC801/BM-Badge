#ifndef AUDIO_H
#define AUDIO_H

#include <stdint.h>
#include "cmixer.h"

#ifndef DC801_EMBEDDED
#include <SDL.h>
#endif



// Contains SDL Audio Device information
struct AudioDevice
{
	SDL_AudioDeviceID id;		// SDL Audio Device ID
	SDL_AudioSpec spec;			// Secifications of our audio
	bool enabled;				// Whether the audio driver is loaded and ready
};

// The audio player uses a linked list to play up to 25 sounds and one background track simultaneously
struct Audio
{
	Audio(const char* filename)
		:Audio(cm_new_source_from_file(filename)) { }
	Audio(cm_Source* source = nullptr)
		:source(source) { }
	uint8_t fade{ 0 };					// Sample has been dropped, fade it out
	bool free{ false };					// Whether to free the cmixer source
	bool end{ false };					// The sample is done playing, free it

	cm_Source* source; 		// cmixer audio source
	SDL_AudioSpec spec{};			// Specifications of the audio sample

	Audio* next{ nullptr };			// Next item in the list
};

class AudioPlayer
{
public:
	void play(const char *name, double gain);
	void loop(const char *name, double gain);
	void stop_loop();

	static void forwardCallback(void* userdata, Uint8* stream, int len)
	{
		static_cast<AudioPlayer*>(userdata)->callback(stream, len);
	}

	AudioPlayer();
	~AudioPlayer();

private:
	
	void callback(uint8_t* stream, int len);
	void addAudio(Audio* root, Audio* audio);
	void playAudio(const char* filename, bool loop, double gain);
	void fadeAudio(Audio* audio);
	void lockAudio(cm_Event* e);
	void freeAudio(Audio* audio);

	uint32_t soundCount = 0;			// Current number of simultaneous audio samples
	AudioMutex mutex{};

	AudioDevice device{ 0, { 0 }, false };

	Audio* head{ nullptr };
};

extern AudioPlayer audio;





#endif
