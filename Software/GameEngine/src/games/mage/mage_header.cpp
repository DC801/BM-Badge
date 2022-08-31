#include "mage_header.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "convert_endian.h"

extern std::unique_ptr<EngineRom> EngineROM;

MageHeader::MageHeader(uint32_t address)
{
	uint32_t size = 0;

	// Read count
	EngineROM->Read(
		address,
		sizeof(counts),
		(uint8_t *)&counts,
		"Failed to load Header property 'counts'"
	);

	// Endianness conversion
	counts = ROM_ENDIAN_U4_VALUE(counts);

	// Increment offset
	address += sizeof(counts);

	// Construct arrays
	offsets = std::make_unique<uint32_t[]>(counts);
	lengths = std::make_unique<uint32_t[]>(counts);

	// Size of array in bytes
	size = counts * sizeof(uint32_t);

	// Read arrays
	EngineROM->Read(
		address,
		size,
		(uint8_t *)offsets.get(),
		"Failed to load Header property 'offsets'"
	);

	ROM_ENDIAN_U4_BUFFER(offsets.get(), counts);
	address += counts * sizeof(uint32_t);

	EngineROM->Read(
		address,
		size,
		(uint8_t *)lengths.get(),
		"Failed to load Header property 'lengths'"
	);

	ROM_ENDIAN_U4_BUFFER(lengths.get(), counts);
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
