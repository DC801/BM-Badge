#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_rom.h"
#include "FrameBuffer.h"
#include "mage_geometry.h"
#include "mage_tileset.h"
#include <stdint.h>
#include <vector>
#include <memory>

class MageGameControl;

//this contains the possible options for an entity PrimaryIdType value.
typedef enum : uint8_t
{
   TILESET = 0,
   ANIMATION = 1,
   ENTITY_TYPE = 2
} MageEntityPrimaryIdType;
#define NUM_PRIMARY_ID_TYPES 3


class MageEntityTypeAnimation
{
public:

   MageEntityTypeAnimation() = default;
   MageEntityTypeAnimation(uint32_t& offset);

   const AnimationDirection* North() const { return &north; }
   const AnimationDirection* East() const { return &east; }
   const AnimationDirection* South() const { return &south; }
   const AnimationDirection* West() const { return &west; }
private:
   const AnimationDirection north;
   const AnimationDirection east;
   const AnimationDirection south;
   const AnimationDirection west;
};

class MageEntityType
{
public:
   MageEntityType() noexcept = default;
   MageEntityType(uint32_t& offset);

   uint8_t PortraitId() const { return portraitId; }
   uint8_t AnimationCount() const { return animationCount; }

   const MageEntityTypeAnimation* GetAnimation(uint32_t index) const
   {
      return &((const MageEntityTypeAnimation *)&animationCount + 1)[index % animationCount];
   }

private:
   char name[32]{ 0 };
   uint8_t paddingA{ 0 };
   uint8_t paddingB{ 0 };
   uint8_t portraitId{ 0 };
   uint8_t animationCount{ 0 };
};

class MageEntity
{
public:
   MageEntity() noexcept = default;
   MageEntity(uint32_t& offset);

   void SetLocation(const Point& p) { location = p; }
   void SetName(std::string s)
   {
      for (auto i = 0; i < s.length() && i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         name[i] = s[i];
      }
   }

   bool isDebug() const { return renderFlags.rf.i & RENDER_FLAGS_IS_DEBUG; }
   void SetRenderDirection(uint8_t renderFlags)
   {
      this->renderFlags = renderFlags;
   }
   void updateRenderableData(uint32_t deltaTime = 0);

   RenderableData* getRenderableData() { return &renderableData; }
   const RenderableData* getRenderableData() const { return &renderableData; }



   char name[MAGE_ENTITY_NAME_LENGTH]{ 0 }; // bob's club
   // put the sheep back in the pen, rake in the lake
   Point location{ 0 };
   uint16_t onInteractScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t primaryId{ 0 };
   uint16_t secondaryId{ 0 };
   uint8_t primaryIdType{ 0 };
   uint8_t currentAnimation{ 0 };
   uint8_t currentFrameIndex{ 0 };
   RenderFlags renderFlags{ 0 };
   uint8_t hackableStateA{ 0 };
   uint8_t hackableStateB{ 0 };
   uint8_t hackableStateC{ 0 };
   uint8_t hackableStateD{ 0 };

private:
   RenderableData renderableData{ };
};


#endif //_MAGE_ENTITY_TYPE_H