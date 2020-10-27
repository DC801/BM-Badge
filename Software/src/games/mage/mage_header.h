/*
This class contains the MageHeader class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_HEADER_H
#define _MAGE_HEADER_H

#include "mage_defines.h"

class MageHeader
{
private:
	uint32_t counts;
	std::unique_ptr<uint32_t[]> offsets;
	std::unique_ptr<uint32_t[]> lengths;

public:
	MageHeader() : counts{0},
		offsets{std::make_unique<uint32_t[]>(1)},
		lengths{std::make_unique<uint32_t[]>(1)}
	{ };

	MageHeader(uint32_t address);

	uint32_t count() const;
	uint32_t offset(uint32_t num) const;
	uint32_t length(uint32_t num) const;
	uint32_t size() const;
	bool valid() const;
}; //class MageHeader

#endif //_MAGE_HEADER_H
