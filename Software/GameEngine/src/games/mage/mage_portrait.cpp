#include "mage_portrait.h"

MagePortrait::MagePortrait(uint32_t& offset)
{
	offset += 32; // name
	offset += sizeof(uint8_t); // paddingA
	offset += sizeof(uint8_t); // paddingB
	offset += sizeof(uint8_t); // paddingC

	auto emoteCount = uint8_t{ 0 };
	ROM()->Read(emoteCount, offset);

	ROM()->InitializeCollectionOf(emotes, offset, emoteCount);
}
