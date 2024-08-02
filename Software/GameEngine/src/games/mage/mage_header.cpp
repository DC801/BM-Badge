#include "mage_header.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageHeader::MageHeader(uint32_t address)
{
	// Read count
	EngineROM_Read(
		address,
		sizeof(counts),
		(uint8_t *)&counts,
		"Failed to load Header property 'counts'"
	);

	// Endianness conversion
	counts = ROM_ENDIAN_U4_VALUE(counts);

	// Increment offset
	address += sizeof(counts);

	start = address;

}

uint32_t MageHeader::count() const
{
	return counts;
}

uint32_t MageHeader::offset(uint32_t num) const
{
	if (!start) return 0;

	if (counts > num)
	{
		uint32_t offset = 0;
		EngineROM_Read(
			(
				start +
				(sizeof(uint32_t) * num)
			),
			sizeof(offset),
			(uint8_t *) &offset,
			"Could not read header length"
		);
		offset = ROM_ENDIAN_U4_VALUE(offset);
		return offset;
	}

	return 0;
}

uint32_t MageHeader::length(uint32_t num) const
{
	if (!start) return 0;

	if (counts > num)
	{
		uint32_t offset = 0;
		EngineROM_Read(
			(
				start +
				(sizeof(uint32_t) * counts) +
				(sizeof(uint32_t) * num)
			),
			sizeof(offset),
			(uint8_t *) &offset,
			"Could not read header length"
		);
		offset = ROM_ENDIAN_U4_VALUE(offset);
		return offset;
	}

	return 0;
}

uint32_t MageHeader::size() const
{
	return sizeof(counts) + 			// Count
		counts * sizeof(uint32_t) +		// Offsets
		counts * sizeof(uint32_t);		// Lengths
}

uint32_t MageHeader::ramSize() const {
	return (
		sizeof(counts) +
		sizeof(start)
	);
}


bool MageHeader::valid() const
{
	if (!start)
	{
		return false;
	}

	return true;
}
