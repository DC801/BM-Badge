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

class MageGameEngine;

class MageAnimation
{
public:
	MageAnimation() noexcept = default;

	MageAnimation(std::shared_ptr<MageGameEngine> gameEngine, uint32_t address);

	uint16_t TilesetId() const;
	uint16_t FrameCount() const;
	MageAnimationFrame AnimationFrame(uint32_t index) const;
	uint32_t Size() const;
	uint32_t end() const;

private:
	std::shared_ptr<MageGameEngine> gameEngine;
	uint16_t tilesetId{ 0 };
	uint16_t frameCount{ 0 };
	uint32_t offset{ 0 };

}; //class MageAnimation

#endif //_MAGE_ANIMATION_H