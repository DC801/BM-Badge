/*
This class contains the MageEntity class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "EngineROM.h"
#include "mage_defines.h"

class MageEntityTypeAnimationDirection
{
private:
	std::shared_ptr<EngineROM> ROM;
	uint16_t typeId{0};
	uint8_t type{0};
	uint8_t renderFlags{ 0 };
public:
	MageEntityTypeAnimationDirection() = default;
	MageEntityTypeAnimationDirection(std::shared_ptr<EngineROM> ROM, uint32_t address);

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
	MageEntityTypeAnimationDirection north{};
	MageEntityTypeAnimationDirection east{};
	MageEntityTypeAnimationDirection south{};
	MageEntityTypeAnimationDirection west{};
public:
	MageEntityTypeAnimation() = default;
	MageEntityTypeAnimation(std::shared_ptr<EngineROM> ROM, uint32_t address);

	MageEntityTypeAnimationDirection North() const;
	MageEntityTypeAnimationDirection East() const;
	MageEntityTypeAnimationDirection South() const;
	MageEntityTypeAnimationDirection West() const;
	uint32_t Size() const;

}; //class MageEntityTypeAnimation

class MageEntityType
{
public:
	MageEntityType() = default;
	MageEntityType(std::shared_ptr<EngineROM> ROM, uint32_t address);
	uint8_t PortraitId() const;
	uint8_t AnimationCount() const;
	MageEntityTypeAnimation EntityTypeAnimation(uint32_t index) const;
	uint32_t Size() const;

private:
	uint8_t portraitId{ 0 };
	uint8_t animationCount{ 0 };
	std::unique_ptr<MageEntityTypeAnimation[]> entityTypeAnimations{ std::make_unique<MageEntityTypeAnimation[]>(animationCount) };
}; //class MageEntityType

#endif //_MAGE_ENTITY_TYPE_H