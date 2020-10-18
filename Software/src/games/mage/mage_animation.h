#ifndef _MAGE_ANIMATION_H
#define _MAGE_ANIMATION_H

#include "mage_defines.h"

class MageAnimationFrame
{
private:
	uint16_t tileId;
	uint16_t duration;
public:
	MageAnimationFrame() : tileId{0},
		duration{0}
	{};

	MageAnimationFrame(uint32_t address);

	uint16_t TileId() const;
	uint16_t Duration() const;
	uint32_t Size() const;
}; //class MageAnimationFrame


class MageAnimation
{
private:
	uint16_t tilesetId;
	uint16_t frameCount;

	std::unique_ptr<MageAnimationFrame[]> animationFrames;
public:
	MageAnimation() : tilesetId{0},
		frameCount{0},
		animationFrames{std::make_unique<MageAnimationFrame[]>(frameCount)}
	{};

	MageAnimation(uint32_t address);

	uint16_t TilesetId() const;
	uint16_t FrameCount() const;
	MageAnimationFrame AnimationFrame(uint32_t index) const;
	uint32_t Size() const;
}; //class MageAnimation

#endif //_MAGE_ANIMATION_H