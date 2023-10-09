#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_rom.h"
#include "mage_script_state.h"
#include "mage_geometry.h"
#include "mage_tileset.h"
#include <stdint.h>
#include <vector>
#include <memory>

class MageGameControl;
class MageScriptControl;

//this contains the possible options for an entity PrimaryIdType value.
typedef enum : uint8_t
{
    TILESET = 0,
    ANIMATION = 1,
    ENTITY_TYPE = 2
} MageEntityPrimaryIdType;
#define NUM_PRIMARY_ID_TYPES 3


struct MageEntityTypeAnimation
{
    const AnimationDirection North;
    const AnimationDirection East;
    const AnimationDirection South;
    const AnimationDirection West;
};

struct MageEntityType
{
    char name[32]{ 0 };
    uint8_t paddingA{ 0 };
    uint8_t paddingB{ 0 };
    uint8_t portraitId{ 0 };
    uint8_t animationCount{ 0 };

    constexpr const MageEntityTypeAnimation& GetAnimation(uint32_t index) const
    {
        auto animations = (const MageEntityTypeAnimation*)((uint8_t*)&animationCount + 1);
        return animations[index % animationCount];
    }
};

struct MageEntityData
{
    char name[MAGE_ENTITY_NAME_LENGTH]{ 0 }; // bob's club
    // put the sheep back in the pen, rake in the lake
    EntityPoint position{ 0 };
    uint16_t onInteractScriptId{ 0 };
    uint16_t onTickScriptId{ 0 };
    uint16_t primaryId{ 0 };
    uint16_t secondaryId{ 0 };
    uint8_t primaryIdType{ 0 };
    uint8_t currentAnimation{ 0 };
    uint8_t currentFrameIndex{ 0 };
    uint8_t direction{ 0 };
    uint8_t hackableStateA{ 0 };
    uint8_t hackableStateB{ 0 };
    uint8_t hackableStateC{ 0 };
    uint8_t hackableStateD{ 0 };
};

class MageEntity
{
public:
    MageEntity() noexcept {}

    MageEntity(MageEntityData&& sourceEntity) noexcept
    : data(std::move(sourceEntity)), onInteract(data.onInteractScriptId), onTick(data.onTickScriptId) {}

    MageEntityData data;
    RenderableData renderableData;
    MageScriptState onInteract;
    MageScriptState onTick;

    inline void SetAnimation(uint8_t animationId)
    {
        data.currentAnimation = animationId;
        data.currentFrameIndex = 0;
    }

    void SetName(std::string s)
    {
        for (auto i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
        {
            data.name[i] = i < s.length() ? s[i] : 0;
        }
    }

    void OnInteract(MageScriptControl* scriptControl);
    void OnTick(MageScriptControl* scriptControl);

    void UpdateRenderableData();

    //inline bool isDebug() const { return direction & RENDER_FLAGS_IS_DEBUG; }
};


#endif //_MAGE_ENTITY_TYPE_H