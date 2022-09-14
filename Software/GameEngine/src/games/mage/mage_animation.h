/*
This class contains the MageAnimation class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/

#ifndef _MAGE_ANIMATION_H
#define _MAGE_ANIMATION_H

#include "mage_defines.h"
#include "EngineROM.h"
#include <vector>

class MageGameEngine;

//this is the numerical translation for entity direction.
enum MageEntityAnimationDirection : uint8_t
{
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
};

class MageAnimation
{
public:
	struct Frame
	{
		uint16_t tileId;
		uint16_t duration;
	};

	MageAnimation() noexcept = default;
	MageAnimation(std::shared_ptr<EngineROM> ROM, uint32_t address) noexcept;

	constexpr uint16_t TilesetId() const { return tilesetId; }
	constexpr uint16_t TileId() const { return 0; }
	uint16_t FrameCount() const { return frames.size(); }
	MageAnimation::Frame AnimationFrame(uint32_t index) const { return frames[index % frames.size()]; }

private:
	uint16_t tilesetId{ 0 };
	uint32_t offset{ 0 };
	std::vector<MageAnimation::Frame> frames;

};

#endif //_MAGE_ANIMATION_H