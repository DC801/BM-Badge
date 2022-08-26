#include "mage_animation.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageAnimation::MageAnimation(uint32_t address)
{
	offset = address;
	//read tilesetId
	EngineROM_Read(
		offset,
		sizeof(tilesetId),
		(uint8_t *)&tilesetId,
		"Failed to read Animation property 'tilesetId'"
	);

	// Endianness conversion
	tilesetId = ROM_ENDIAN_U2_VALUE(tilesetId);

	// Increment offset
	offset += sizeof(tilesetId);

	//read frameCount
	EngineROM_Read(
		offset,
		sizeof(frameCount),
		(uint8_t *)&frameCount,
		"Failed to read Animation property 'frameCount'"
	);

	// Endianness conversion
	frameCount = ROM_ENDIAN_U2_VALUE(frameCount);

	// Increment offset
	offset += sizeof(frameCount);
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
	MageAnimationFrame frame = {};
	index = index < frameCount
		? index
		: frameCount;
	EngineROM_Read(
		offset + (index * sizeof(frame)),
		sizeof(frame),
		(uint8_t *)&frame,
		"Failed to read AnimationFrame"
	);
	frame.tileId = ROM_ENDIAN_U2_VALUE(frame.tileId);
	frame.duration = ROM_ENDIAN_U2_VALUE(frame.duration);
	return frame;
}

uint32_t MageAnimation::Size() const
{
	return (
		sizeof(tilesetId) +
		sizeof(frameCount)
	);
}

uint32_t MageAnimation::end() const
{
	return (
		Size() +
		(frameCount * sizeof(MageAnimationFrame))
	);
}
