#include "mage_header.h"
#include "EnginePanic.h"
#include "convert_endian.h"

MageHeader::MageHeader(std::shared_ptr<EngineROM> ROM, uint32_t& offset)
{
	ROM->Read(counts, offset);
	ROM->GetPointerTo(offsets, offset, counts);
	ROM->GetPointerTo(lengths, offset, counts);
}