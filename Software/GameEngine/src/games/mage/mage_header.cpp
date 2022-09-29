#include "mage_header.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageHeader::MageHeader(std::shared_ptr<EngineROM> ROM, uint32_t& offset)
{
	ROM->Read(&counts, offset);
	counts = ROM_ENDIAN_U4_VALUE(counts);

	// Construct then read the offsets & length arrays based on counts
	offsets = std::make_unique<uint32_t[]>(counts);
	ROM->Read(offsets.get(), offset, counts);

	lengths = std::make_unique<uint32_t[]>(counts);
	ROM->Read(lengths.get(), offset, counts);
}