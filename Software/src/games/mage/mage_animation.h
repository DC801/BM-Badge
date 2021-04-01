/*
This class contains the MageAnimation class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/

#ifndef _MAGE_ANIMATION_H
#define _MAGE_ANIMATION_H

#include "mage_defines.h"

typedef struct {
	uint16_t tileId;
	uint16_t duration;
} MageAnimationFrame;


class MageAnimation
{
private:
	uint16_t tilesetId;
	uint16_t frameCount;
	uint32_t offset;

public:
	MageAnimation() :
		tilesetId{0},
		frameCount{0}
	{};

	MageAnimation(uint32_t address);

	uint16_t TilesetId() const;
	uint16_t FrameCount() const;
	MageAnimationFrame AnimationFrame(uint32_t index) const;
	uint32_t Size() const;
	uint32_t end() const;
}; //class MageAnimation

#endif //_MAGE_ANIMATION_H