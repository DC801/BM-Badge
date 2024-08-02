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
	uint32_t start;

public:
	MageHeader() : counts{0},
	start{0}
	{ };

	MageHeader(uint32_t address);

	uint32_t count() const;
	uint32_t offset(uint32_t num) const;
	uint32_t length(uint32_t num) const;
	uint32_t size() const;
	uint32_t ramSize() const;
	bool valid() const;
}; //class MageHeader

#endif //_MAGE_HEADER_H
