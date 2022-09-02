#include "mage_entity_type.h"
#include "EngineROM.h"
#include "FrameBuffer.h"
#include "convert_endian.h"



MageEntityTypeAnimationDirection::MageEntityTypeAnimationDirection(uint32_t address)
{
	ROM->Read(
		address,
		sizeof(typeId),
		(uint8_t *)&typeId,
		"Failed to read EntityTypeAnimationDirection property 'typeId'"
	);
	// Endianness conversion
	typeId = ROM_ENDIAN_U2_VALUE(typeId);

	// Increment offset
	address += sizeof(typeId);

	// Read count
	ROM->Read(
		address,
		sizeof(type),
		(uint8_t *)&type,
		"Failed to read EntityTypeAnimationDirection property 'type'"
	);

	// Increment offset
	address += sizeof(type);

	// Read count
	ROM->Read(
		address,
		sizeof(renderFlags),
		(uint8_t *)&renderFlags,
		"Failed to read EntityTypeAnimationDirection property 'typeId'"
	);

	return;
}

uint16_t MageEntityTypeAnimationDirection::TypeId() const
{
	return typeId;
}

uint8_t MageEntityTypeAnimationDirection::Type() const
{
	return type;
}

uint8_t MageEntityTypeAnimationDirection::RenderFlags() const
{
	return renderFlags;
}

bool MageEntityTypeAnimationDirection::FlipX() const
{
	return renderFlags & FLIPPED_HORIZONTALLY_FLAG;
}

bool MageEntityTypeAnimationDirection::FlipY() const
{
	return renderFlags & FLIPPED_VERTICALLY_FLAG;
}

bool MageEntityTypeAnimationDirection::FlipDiag() const
{
	return renderFlags & FLIPPED_DIAGONALLY_FLAG;
}

uint32_t MageEntityTypeAnimationDirection::Size() const
{
	uint32_t size = sizeof(typeId) +
		sizeof(type) +
		sizeof(renderFlags);

	return size;
}

MageEntityTypeAnimation::MageEntityTypeAnimation(uint32_t address)
{
	north = MageEntityTypeAnimationDirection(address);
	address += north.Size();
	east = MageEntityTypeAnimationDirection(address);
	address += east.Size();
	south = MageEntityTypeAnimationDirection(address);
	address += south.Size();
	west = MageEntityTypeAnimationDirection(address);

	return;
}

MageEntityTypeAnimationDirection MageEntityTypeAnimation::North() const
{
	return north;
}

MageEntityTypeAnimationDirection MageEntityTypeAnimation::East() const
{
	return east;
}

MageEntityTypeAnimationDirection MageEntityTypeAnimation::South() const
{
	return south;
}

MageEntityTypeAnimationDirection MageEntityTypeAnimation::West() const
{
	return west;
}

uint32_t MageEntityTypeAnimation::Size() const
{
	uint32_t size = north.Size() +
		south.Size() +
		east.Size() +
		west.Size();

	return size;
}

MageEntityType::MageEntityType(uint32_t address)
{
	address += 32; // skip over reading the name, no need to hold that in ram
	address += sizeof(uint8_t); // paddingA
	address += sizeof(uint8_t); // paddingB

	// Read portraitId
	ROM->Read(
		address,
		sizeof(portraitId),
		(uint8_t *)&portraitId,
		"Failed to read EntityType property 'name'"
	);
	address += sizeof(portraitId);

	// Read animationCount
	ROM->Read(
		address,
		sizeof(animationCount),
		(uint8_t *)&animationCount,
		"Failed to read EntityType property 'name'"
	);
	address += sizeof(animationCount);

	// Construct array
	entityTypeAnimations = std::make_unique<MageEntityTypeAnimation[]>(animationCount);

	//increment through animations to fill entityTypeAnimations array:
	for(uint32_t animationIndex = 0; animationIndex < animationCount; animationIndex++)
	{
		entityTypeAnimations[animationIndex] = MageEntityTypeAnimation(address);
		address += entityTypeAnimations[animationIndex].Size();
	}

	return;
}

uint8_t MageEntityType::PortraitId() const
{
	return portraitId;
}

uint8_t MageEntityType::AnimationCount() const
{
	return animationCount;
}

MageEntityTypeAnimation MageEntityType::EntityTypeAnimation(uint32_t index) const
{
	if(index < animationCount)
	{
		return entityTypeAnimations[index];
	}
	else
	{
		return entityTypeAnimations[animationCount];
	}
}

uint32_t MageEntityType::Size() const
{
	uint32_t size = (
		sizeof(portraitId) +
		sizeof(animationCount)
	);

	for (uint32_t i = 0; i < animationCount; i++)
	{
		size += entityTypeAnimations[i].Size();
	}

	return size;
}
