#ifndef SOFTWARE_MAGE_PORTRAIT_H
#define SOFTWARE_MAGE_PORTRAIT_H
#include "mage_entity_type.h"
#include "EngineROM.h"
#include <vector>

class MagePortrait {
public:

	MagePortrait() noexcept = default;
	MagePortrait(std::shared_ptr<EngineROM> ROM, uint32_t address);

	const MageEntityTypeAnimationDirection* getEmoteById(uint8_t emoteId) const
	{
		return &emotes[emoteId % emotes.size()];
	}
private:
	std::vector<MageEntityTypeAnimationDirection> emotes{};
};


#endif //SOFTWARE_MAGE_PORTRAIT_H
