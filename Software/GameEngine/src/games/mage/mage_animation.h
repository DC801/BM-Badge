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


class MageAnimation
{
public:
	struct Frame
	{
		uint16_t tileId;
		uint16_t duration;
	};

	MageAnimation() noexcept = default;
	MageAnimation(uint32_t& offset) noexcept;

	constexpr uint16_t TilesetId() const { return tilesetId; }
	constexpr uint16_t TileId() const { return 0; }
	uint16_t FrameCount() const { return frameCount; }
	const MageAnimation::Frame* GetFrame(uint32_t index) const { return &((MageAnimation::Frame*)&frameCount + 4)[index % frameCount]; }

private:
	uint16_t tilesetId{ 0 };
	uint16_t frameCount;

};

#endif //_MAGE_ANIMATION_H