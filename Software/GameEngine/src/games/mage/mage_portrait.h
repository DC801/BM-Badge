#ifndef SOFTWARE_MAGE_PORTRAIT_H
#define SOFTWARE_MAGE_PORTRAIT_H
#include "mage_entity_type.h"
#include "EngineROM.h"
#include <memory>

class MagePortrait {
public:
	uint8_t emoteCount{ 0 };
	std::unique_ptr<MageEntityTypeAnimationDirection[]> emotes{ std::make_unique<MageEntityTypeAnimationDirection[]>(emoteCount) };

	MagePortrait() = default;
	MagePortrait(std::shared_ptr<EngineROM> ROM, uint32_t address);

	uint32_t size() const;

	MageEntityTypeAnimationDirection* getEmoteById(uint8_t emoteId) const;
};


#endif //SOFTWARE_MAGE_PORTRAIT_H
