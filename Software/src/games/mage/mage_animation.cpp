#include "mage_animation.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageAnimationFrame::MageAnimationFrame(uint32_t address)
{
	uint32_t size = 0; 
	//read tileindex
	if (EngineROM_Read(address, sizeof(tileId), (uint8_t *)&tileId) != sizeof(tileId))
	{
		goto MageAnimationFrame_Error;
	}

	// Endianness conversion
	convert_endian_u2(&tileId);

	// Increment offset
	address += sizeof(tileId);

	//read duration
	if (EngineROM_Read(address, sizeof(duration), (uint8_t *)&duration) != sizeof(duration))
	{
		goto MageAnimationFrame_Error;
	}

	// Endianness conversion
	convert_endian_u2(&duration);

	return;

MageAnimationFrame_Error:
	ENGINE_PANIC("Failed to read animation frame data");
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
	if (EngineROM_Read(address, sizeof(tilesetId), (uint8_t *)&tilesetId) != sizeof(tilesetId))
	{
		goto MageAnimation_Error;
	}

	// Endianness conversion
	convert_endian_u2(&tilesetId);

	// Increment offset
	address += sizeof(tilesetId);

	//read frameCount
	if (EngineROM_Read(address, sizeof(frameCount), (uint8_t *)&frameCount) != sizeof(frameCount))
	{
		goto MageAnimation_Error;
	}

	// Endianness conversion
	convert_endian_u2(&frameCount);

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

MageAnimation_Error:
	ENGINE_PANIC("Failed to read animation data");
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
