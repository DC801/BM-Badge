#include "mage_animation.h"
#include "EnginePanic.h"

#include "convert_endian.h"

MageAnimation::MageAnimation(uint32_t& offset) noexcept
{
	//read tilesetId
	ROM()->Read(tilesetId, offset);

	auto frameCount = uint16_t{ 0 };
	//read frameCount
	ROM()->Read(frameCount, offset);
}
