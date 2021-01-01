#include "mage_header.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageHeader::MageHeader(uint32_t address)
{
	uint32_t size = 0;

	// Read count
	EngineROM_Read(
		address,
		sizeof(counts),
		(uint8_t *)&counts,
		"Failed to load Header property 'counts'"
	);

	// Endianness conversion
	counts = convert_endian_u4_value(counts);

	// Increment offset
	address += sizeof(counts);

	// Construct arrays
	offsets = std::make_unique<uint32_t[]>(counts);
	lengths = std::make_unique<uint32_t[]>(counts);

	// Size of array in bytes
	size = counts * sizeof(uint32_t);

	// Read arrays
	EngineROM_Read(
		address,
		size,
		(uint8_t *)offsets.get(),
		"Failed to load Header property 'offsets'"
	);

	convert_endian_u4_buffer(offsets.get(), counts);
	address += counts * sizeof(uint32_t);

	EngineROM_Read(
		address,
		size,
		(uint8_t *)lengths.get(),
		"Failed to load Header property 'lengths'"
	);

	convert_endian_u4_buffer(lengths.get(), counts);
	return;
}

uint32_t MageHeader::count() const
{
	return counts;
}

uint32_t MageHeader::offset(uint32_t num) const
{
	if (!offsets) return 0;

	if (counts > num)
	{
		return offsets[num];
	}

	return 0;
}

uint32_t MageHeader::length(uint32_t num) const
{
	if (!lengths) return 0;

	if (counts > num)
	{
		return lengths[num];
	}

	return 0;
}

uint32_t MageHeader::size() const
{
	return sizeof(counts) + 			// Count
		counts * sizeof(uint32_t) +		// Offsets
		counts * sizeof(uint32_t);		// Lengths
}

bool MageHeader::valid() const
{
	if (offsets == nullptr || lengths == nullptr)
	{
		return false;
	}

	return true;
}
