#include "mage_header.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageHeader::MageHeader(std::shared_ptr<EngineROM> ROM, uint32_t& offset)
{
	// Read count
	ROM->Read(offset,
		sizeof(counts),
		(uint8_t*)&counts,
		"Failed to load Header property 'counts'"
	);

	// Endianness conversion
	counts = ROM_ENDIAN_U4_VALUE(counts);

	// Increment offset	
	offset += sizeof(counts);

	// Construct arrays
	offsets = std::make_unique<uint32_t[]>(counts);

	// Read arrays
	ROM->Read(offset,
		counts * sizeof(uint32_t),
		(uint8_t*)offsets.get(),
		"Failed to load Header property 'offsets'"
	);

	//ROM_ENDIAN_U4_BUFFER(offsets.get(), counts);
	offset += counts * sizeof(uint32_t);
	lengths = std::make_unique<uint32_t[]>(counts);

	ROM->Read(offset,
		counts * sizeof(uint32_t),
		(uint8_t*)lengths.get(),
		"Failed to load Header property 'lengths'"
	);

	offset += counts * sizeof(uint32_t);

	//ROM_ENDIAN_U4_BUFFER(lengths.get(), counts);
}