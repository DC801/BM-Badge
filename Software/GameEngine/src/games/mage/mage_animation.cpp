#include "mage_animation.h"
#include "EnginePanic.h"

#include "convert_endian.h"

MageAnimation::MageAnimation(std::shared_ptr<EngineROM> ROM, uint32_t& address) noexcept
{
	//read tilesetId
	ROM->Read(&tilesetId, address);

	auto frameCount = uint16_t{ 0 };
	//read frameCount
	ROM->Read(&frameCount, address);

	frames = std::vector<MageAnimation::Frame>{ frameCount };
	ROM->Read(frames.data(), address, frameCount);
}
