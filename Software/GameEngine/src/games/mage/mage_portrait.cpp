#include "mage_portrait.h"

MagePortrait::MagePortrait(uint32_t& address)
{
	address += 32; // name
	address += sizeof(uint8_t); // paddingA
	address += sizeof(uint8_t); // paddingB
	address += sizeof(uint8_t); // paddingC

	auto emoteCount = uint8_t{ 0 };
	ROM->Read(emoteCount, address);

	ROM->InitializeCollectionOf(emotes, address, emoteCount);
}
