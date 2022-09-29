#include "mage_portrait.h"

MagePortrait::MagePortrait(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
	address += 32; // name
	address += sizeof(uint8_t); // paddingA
	address += sizeof(uint8_t); // paddingB
	address += sizeof(uint8_t); // paddingC

	auto emoteCount = uint8_t{ 0 };
	ROM->Read(&emoteCount, address);

	emotes = std::vector<MageEntityTypeAnimation::Direction>(emoteCount);
	for(uint32_t i = 0; i < emoteCount; i++) {
		emotes[i] = MageEntityTypeAnimation::Direction{ ROM, address };
	}
}
