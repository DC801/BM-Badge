/*
This class contains the MageEntity class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_defines.h"

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

class MageEntityType
{
private:
	uint8_t portraitId;
	uint8_t animationCount;
	std::unique_ptr<MageEntityTypeAnimation[]> entityTypeAnimations;
	std::unique_ptr<MageEntityTypeAnimationDirection[]> emotes;
public:
	MageEntityType() :
		portraitId{0},
		animationCount{0},
		entityTypeAnimations{std::make_unique<MageEntityTypeAnimation[]>(animationCount)}
	{};

	MageEntityType(uint32_t address);
	uint8_t PortraitId() const;
	uint8_t AnimationCount() const;
	MageEntityTypeAnimation EntityTypeAnimation(uint32_t index) const;
	uint32_t Size() const;
}; //class MageEntityType

#endif //_MAGE_ENTITY_TYPE_H