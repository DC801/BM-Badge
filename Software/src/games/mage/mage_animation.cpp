#include "mage_animation.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageAnimationFrame::MageAnimationFrame(uint32_t address)
{
	//read tileindex
	EngineROM_Read(
		address,
		sizeof(tileId),
		(uint8_t *)&tileId,
		"Failed to read AnimationFrame property 'tileId'"
	);

	// Endianness conversion
	tileId = ROM_ENDIAN_U2_VALUE(tileId);

	// Increment offset
	address += sizeof(tileId);

	//read duration
	EngineROM_Read(
		address,
		sizeof(duration),
		(uint8_t *)&duration,
		"Failed to read AnimationFrame property 'duration'"
	);

	// Endianness conversion
	duration = ROM_ENDIAN_U2_VALUE(duration);

	return;
}

uint16_t MageAnimationFrame::TileId() const
{
	return tileId;
}

uint16_t MageAnimationFrame::Duration() const
{
	return duration;
}

uint32_t MageAnimationFrame::Size() const
{
	uint32_t size = sizeof(tileId) +
		sizeof(duration);

	return size;
}

MageAnimation::MageAnimation(uint32_t address)
{
	uint32_t size = 0;
	//read tilesetId
	EngineROM_Read(
		address,
		sizeof(tilesetId),
		(uint8_t *)&tilesetId,
		"Failed to read Animation property 'tilesetId'"
	);

	// Endianness conversion
	tilesetId = ROM_ENDIAN_U2_VALUE(tilesetId);

	// Increment offset
	address += sizeof(tilesetId);

	//read frameCount
	EngineROM_Read(
		address,
		sizeof(frameCount),
		(uint8_t *)&frameCount,
		"Failed to read Animation property 'frameCount'"
	);

	// Endianness conversion
	frameCount = ROM_ENDIAN_U2_VALUE(frameCount);

	// Increment offset
	address += sizeof(frameCount);

	// Construct array
	animationFrames = std::make_unique<MageAnimationFrame[]>(frameCount);

	//fill array
	for(uint32_t frameIndex = 0; frameIndex < frameCount; frameIndex++)
	{
		animationFrames[frameIndex] = MageAnimationFrame(address);
		address += animationFrames[frameIndex].Size();
	}

	return;
}

uint16_t MageAnimation::TilesetId() const
{
	return tilesetId;
}

uint16_t MageAnimation::FrameCount() const
{
	return frameCount;
}

MageAnimationFrame MageAnimation::AnimationFrame(uint32_t index) const
{
	if(index < frameCount)
	{
		return animationFrames[index];
	}
	else
	{
		return animationFrames[frameCount];
	}
}

uint32_t MageAnimation::Size() const
{
	uint32_t size = sizeof(tilesetId) +
		sizeof(frameCount);

	for (uint32_t i = 0; i < frameCount; i++)
	{
		size += animationFrames[i].Size();
	}

	return size;
}
