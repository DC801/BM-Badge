/*
This class contains the MageHeader class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_HEADER_H
#define _MAGE_HEADER_H

#include "mage_geometry.h"
#include "mage_defines.h"
#include "EngineROM.h"

typedef enum : uint8_t
{
   x = 12,
   y = 14,
   onInteractScriptId = 16,
   onTickScriptId = 18,
   primaryId = 20,
   secondaryId = 22,
   primaryIdType = 24,
   currentAnimation = 25,
   currentFrame = 26,
   direction = 27,
   hackableStateA = 28,
   hackableStateB = 29,
   hackableStateC = 30,
   hackableStateD = 31
} MageEntityField;

class MageHeader
{
public:
	MageHeader(std::shared_ptr<EngineROM> ROM, uint32_t& offset);

	constexpr uint32_t count() const { return counts; }
   uint32_t offset(uint32_t num) const { return offsets[num % counts]; }
	uint32_t length(uint32_t num) const { return lengths[num % counts]; }

private:
	uint32_t counts{ 0 };
   const uint32_t* offsets{ nullptr };
   const uint32_t* lengths{ nullptr };

}; //class MageHeader

#endif //_MAGE_HEADER_H
