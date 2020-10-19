#include "mage_header.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageHeader::MageHeader(uint32_t address)
{
	uint32_t size = 0;

	// Read count
	if (EngineROM_Read(address, sizeof(counts), (uint8_t *)&counts) != sizeof(counts))
	{
		goto MageHeader_Error;
	}

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
	if (EngineROM_Read(address, size, (uint8_t *)offsets.get()) != size)
	{
		goto MageHeader_Error;
	}

	convert_endian_u4_buffer(offsets.get(), counts);
	address += counts * sizeof(uint32_t);

	if (EngineROM_Read(address, size, (uint8_t *)lengths.get()) != size)
	{
		goto MageHeader_Error;
	}

	convert_endian_u4_buffer(lengths.get(), counts);
	return;

MageHeader_Error:
	ENGINE_PANIC("Failed to read header data");
}

uint32_t MageHeader::count() const
{
	return counts;
}

uint32_t MageHeader::offset(uint8_t num) const
{
	if (!offsets) return 0;

	if (counts > num)
	{
		return offsets[num];
	}

	return 0;
}

uint32_t MageHeader::length(uint8_t num) const
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
