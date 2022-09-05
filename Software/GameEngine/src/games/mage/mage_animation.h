/*
This class contains the MageAnimation class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/

#ifndef _MAGE_ANIMATION_H
#define _MAGE_ANIMATION_H

#include "mage_defines.h"
#include "EngineROM.h"

struct MageAnimationFrame{
	uint16_t tileId;
	uint16_t duration;
};

class MageGameEngine;

class MageAnimation
{
public:
	MageAnimation() noexcept = default;
	MageAnimation(std::shared_ptr<EngineROM> ROM, uint32_t address) noexcept;

	uint16_t TilesetId() const { return tilesetId; }

	uint16_t FrameCount() const { return frameCount; }

	uint32_t Size() const { return sizeof(tilesetId) + sizeof(frameCount);	}

	uint32_t end() const
	{
		return Size() + (frameCount * sizeof(MageAnimationFrame));
	}

	MageAnimationFrame AnimationFrame(uint32_t index) const
	{
		return frames[index];
	}


private:
	uint16_t tilesetId{ 0 };
	uint16_t frameCount{ 0 };
	uint32_t offset{ 0 };
	std::unique_ptr<MageAnimationFrame[]> frames;

}; //class MageAnimation

#endif //_MAGE_ANIMATION_H