/*
This class contains the MageHeader class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_HEADER_H
#define _MAGE_HEADER_H

#include "mage_defines.h"
#include "EngineROM.h"

class MageHeader
{
private:
	uint32_t counts{ 0 };
	std::unique_ptr<uint32_t[]> offsets;
	std::unique_ptr<uint32_t[]> lengths;

public:
	MageHeader(std::shared_ptr<EngineROM> ROM, uint32_t& offset);

	constexpr uint32_t count() const { return counts; }

	constexpr uint32_t offset(uint32_t num) const
	{
		return offsets && counts > num
			? offsets[num]
			: 0;
	}

	constexpr uint32_t length(uint32_t num) const
	{
		return lengths && counts > num
			? lengths[num]
			: 0;
	}

	constexpr uint32_t size() const
	{
		return sizeof(counts) + 			// Count
			counts * sizeof(uint32_t) +   // Offsets
			counts * sizeof(uint32_t);		// Lengths
	}

	bool valid() const { return offsets != nullptr && lengths != nullptr;	}
}; //class MageHeader

#endif //_MAGE_HEADER_H
