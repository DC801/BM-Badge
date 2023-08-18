#ifndef AUDIO_H
#define AUDIO_H

#include <atomic>
#include "cmwavegen.h"

// This is the minimal standards-compliant mutex implementation which does not use
// pure assembly. However, modern C++ std::atomic is extremely optimized under the hood.
class AudioMutex
{
	std::atomic<bool> flag{false};

public:
	// When compiled, lock() builds down to ~18 bytes in Thumb mode with -Os
	// It utilizes the ldrexb/strexb "exclusive" instructions for atomicity.
	// The largest part of this function is actually the spinlock while loop.

	// This also generates a DMB ISH instruction, which ensures that all
	// instructions in the "Inner Shareable Region" are executed in order,
	// ie the atomic operations, comparisons, and branches happen in explicit
	// order.
	void lock()
	{
		while (flag.exchange(true, std::memory_order_relaxed));
		std::atomic_thread_fence(std::memory_order_acquire);
	}

	// Compiles down to ~8 bytes. This function does not utilize any exclusive
	// instructions, because it's not necessary. It loads false, issues a data
	// barrier, and sets the flag.
	void unlock()
	{
		std::atomic_thread_fence(std::memory_order_release);
		flag.store(false, std::memory_order_relaxed);
	}
};

class AudioPlayer
{
public:
	void play(const char *name, double gain);
	void play(cm_WaveGenSawtooth *sawtooth, double gain);
	void loop(const char *name, double gain);
	void loop(cm_WaveGenSawtooth *sawtooth, double gain);
	void stop_loop();
	void update();

	AudioPlayer();
	~AudioPlayer();
};

extern AudioPlayer *audio_player;

#endif
