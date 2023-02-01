/*
This class contains the MageAnimation class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/

#ifndef _MAGE_ANIMATION_H
#define _MAGE_ANIMATION_H

#include "mage_defines.h"
#include "mage_rom.h"
#include <vector>

class MageGameEngine;


struct MageAnimation
{
	struct Frame
	{
		uint16_t tileId;
		uint16_t duration;
	};

	const MageAnimation::Frame& GetFrame(uint32_t index) const noexcept
	{ 
		auto frames = (MageAnimation::Frame*)((uint8_t*)&frameCount + sizeof(uint16_t));
		return frames[index % frameCount]; 
	}

	uint16_t tilesetId{ 0 };
	uint16_t frameCount{ 1 };
};

#endif //_MAGE_ANIMATION_H