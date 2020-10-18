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

class MageEntityTypeAnimationDirection
{
private:
	uint16_t typeId;
	uint8_t type;
	uint8_t renderFlags;
public:
	MageEntityTypeAnimationDirection() : typeId{0},
		type{0},
		renderFlags{0}
	{};

	MageEntityTypeAnimationDirection(uint32_t address);

	uint16_t TypeId() const;
	uint8_t Type() const;
	uint8_t RenderFlags() const;
	bool FlipX() const;
	bool FlipY() const;
	bool FlipDiag() const;
	uint32_t Size() const;

}; //class MageEntityTypeAnimationDirection

class MageEntityTypeAnimation
{
private:
	MageEntityTypeAnimationDirection north;
	MageEntityTypeAnimationDirection east;
	MageEntityTypeAnimationDirection south;
	MageEntityTypeAnimationDirection west;
public:
	MageEntityTypeAnimation() : 
		north{MageEntityTypeAnimationDirection(0)},
		east{MageEntityTypeAnimationDirection(0)},
		south{MageEntityTypeAnimationDirection(0)},
		west{MageEntityTypeAnimationDirection(0)}
	{};

	MageEntityTypeAnimation(uint32_t address);

	MageEntityTypeAnimationDirection North() const;
	MageEntityTypeAnimationDirection East() const;
	MageEntityTypeAnimationDirection South() const;
	MageEntityTypeAnimationDirection West() const;
	uint32_t Size() const;

}; //class MageEntityTypeAnimation


#endif //_MAGE_ANIMATION_H