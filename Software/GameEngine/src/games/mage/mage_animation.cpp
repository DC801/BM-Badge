#include "mage_animation.h"
#include "EnginePanic.h"

#include "convert_endian.h"

MageAnimation::MageAnimation(std::shared_ptr<EngineROM> ROM, uint32_t address)
noexcept
{
	offset = address;
	//read tilesetId
	ROM->Read(offset,
		sizeof(tilesetId),
		(uint8_t *)&tilesetId,
		"Failed to read Animation property 'tilesetId'"
	);

	// Endianness conversion
	tilesetId = ROM_ENDIAN_U2_VALUE(tilesetId);

	// Increment offset
	offset += sizeof(tilesetId);

	auto frameCount = uint16_t{ 0 };
	//read frameCount
	ROM->Read(offset,
		sizeof(frameCount),
		(uint8_t *)&frameCount,
		"Failed to read Animation property 'frameCount'"
	);

	// Endianness conversion
	frameCount = ROM_ENDIAN_U2_VALUE(frameCount);

	// Increment offset
	offset += sizeof(frameCount);

	frames = std::vector<MageAnimation::Frame>{ frameCount };
	for (auto i = 0; i < frameCount; ++i)
	{
		ROM->Read(offset + (i * sizeof(MageAnimation::Frame)),
			sizeof(MageAnimation::Frame),
			(uint8_t*)&frames[i],
			"Failed to read AnimationFrame"
		);
		frames[i].tileId = ROM_ENDIAN_U2_VALUE(frames[i].tileId);
		frames[i].duration = ROM_ENDIAN_U2_VALUE(frames[i].duration);
	}
}
