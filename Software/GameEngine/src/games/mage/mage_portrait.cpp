#include "mage_portrait.h"
#include "EngineROM.h"

MagePortrait::MagePortrait(uint32_t address)
{
	address += 32; // name
	address += sizeof(uint8_t); // paddingA
	address += sizeof(uint8_t); // paddingB
	address += sizeof(uint8_t); // paddingC
	EngineROM_Read(
		address,
		sizeof(emoteCount),
		(uint8_t *)&emoteCount,
		"Failed to read emoteCount property 'name'"
	);
	address += sizeof(emoteCount);

	emotes = std::make_unique<MageEntityTypeAnimationDirection[]>(emoteCount);
	for(uint32_t i = 0; i < emoteCount; i++) {
		emotes[i] = MageEntityTypeAnimationDirection(address);
		address += emotes[i].Size();
	}
}

uint32_t MagePortrait::size() const
{
	uint32_t size = sizeof(emoteCount);
	for(uint32_t i = 0; i < emoteCount; i++) {
		size += emotes[i].Size();
	}
	return size;
}

MageEntityTypeAnimationDirection* MagePortrait::getEmoteById(uint8_t emoteId) const
{
	return &emotes[emoteId % emoteCount];
}