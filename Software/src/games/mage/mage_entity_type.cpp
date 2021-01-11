#include "mage_entity_type.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "FrameBuffer.h"

MageEntityTypeAnimationDirection::MageEntityTypeAnimationDirection(uint32_t address)
{
	EngineROM_Read(
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
	EngineROM_Read(
		address,
		sizeof(type),
		(uint8_t *)&type,
		"Failed to read EntityTypeAnimationDirection property 'type'"
	);

	// Increment offset
	address += sizeof(type);

	// Read count
	EngineROM_Read(
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
	uint32_t size = 0;

	// Read name
	EngineROM_Read(
		address,
		16,
		(uint8_t *)name,
		"Failed to read EntityType property 'name'"
	);

	name[16] = 0; // Null terminate
	//increment address
	address += 16 + sizeof(uint8_t) + sizeof(uint8_t) + sizeof(uint8_t); //padding

	// Read animationCount
	EngineROM_Read(
		address,
		sizeof(animationCount),
		(uint8_t *)&animationCount,
		"Failed to read EntityType property 'name'"
	);

	//increment address
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

std::string MageEntityType::Name() const
{
	return std::string(name);
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
	uint32_t size = sizeof(name) +
		sizeof(paddingA) +
		sizeof(paddingB) +
		sizeof(paddingC) +
		sizeof(animationCount);

	for (uint32_t i = 0; i < animationCount; i++)
	{
		size += entityTypeAnimations[i].Size();
	}

	return size;
}
