#ifndef SOFTWARE_MAGE_PORTRAIT_H
#define SOFTWARE_MAGE_PORTRAIT_H
#include "mage_entity_type.h"
#include <memory>

class MagePortrait {
public:
	uint8_t emoteCount;
	std::unique_ptr<MageEntityTypeAnimationDirection[]> emotes;

	MagePortrait() :
		emoteCount {0},
		emotes{std::make_unique<MageEntityTypeAnimationDirection[]>(emoteCount)}
	{};

	MagePortrait(uint32_t address);

	uint32_t size() const;

	MageEntityTypeAnimationDirection* getEmoteById(uint8_t emoteId) const;
};


#endif //SOFTWARE_MAGE_PORTRAIT_H
