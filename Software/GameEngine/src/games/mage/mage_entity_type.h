#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_header.h"
#include "mage_geometry.h"
#include "mage_tileset.h"
#include <stdint.h>
#include <vector>
#include <memory>

class MageGameControl;
class EngineROM;

#define RENDER_FLAGS_IS_GLITCHED_MASK		0b01111111
#define RENDER_FLAGS_IS_GLITCHED			0b10000000
#define RENDER_FLAGS_IS_DEBUG				0b01000000
#define RENDER_FLAGS_FLIP_X					0b00000100
#define RENDER_FLAGS_FLIP_Y					0b00000010
#define RENDER_FLAGS_FLIP_DIAG				0b00000001
#define RENDER_FLAGS_FLIP_MASK				0b00000111
#define RENDER_FLAGS_DIRECTION_MASK			0b00000011
#define NUM_DIRECTIONS 4

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
   MageEntityTypeAnimation(std::shared_ptr<EngineROM> ROM, uint32_t& address);

   const AnimationDirection* North() const { return north; }
   const AnimationDirection* East() const { return east; }
   const AnimationDirection* South() const { return south; }
   const AnimationDirection* West() const { return west; }
private:
   const AnimationDirection* north;
   const AnimationDirection* east;
   const AnimationDirection* south;
   const AnimationDirection* west;
};

class MageEntity
{
public:
   MageEntity() noexcept = default;
   MageEntity(std::shared_ptr<EngineROM> ROM, uint32_t& address, MageGameControl* gameControl);

   void SetLocation(const Point& p) { location = p; }
   void SetName(std::string s)
   {
      for (auto i = 0; i < s.length() && i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         name[i] = s[i];
      }
   }

   bool isDebug() const { return renderFlags & RENDER_FLAGS_IS_DEBUG; }
   void SetRenderDirection(uint8_t renderFlags)
   {
      this->renderFlags = renderFlags;
   }
   void updateRenderableData(uint32_t deltaTime = 0);

   RenderableData* getRenderableData() { return &renderableData; }
   const RenderableData* getRenderableData() const { return &renderableData; }

   const MageGeometry* getGeometry()
   {
      return nullptr;
   }

   std::string name{MAGE_ENTITY_NAME_LENGTH, 0 }; // bob's club
   // put the sheep back in the pen, rake in the lake
   Point location{ 0 };
   uint16_t onInteractScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t primaryId{ 0 };
   uint16_t secondaryId{ 0 };
   uint8_t primaryIdType{ 0 };
   uint8_t currentAnimation{ 0 };
   uint8_t currentFrameIndex{ 0 };
   uint8_t renderFlags{ 0 };
   uint8_t hackableStateA{ 0 };
   uint8_t hackableStateB{ 0 };
   uint8_t hackableStateC{ 0 };
   uint8_t hackableStateD{ 0 };
   

private:
   RenderableData renderableData{ };
   MageGameControl* gameControl;
};

class MageEntityType
{
public:
   MageEntityType() = default;
   MageEntityType(std::shared_ptr<EngineROM> ROM, uint32_t& address);

   uint8_t PortraitId() const { return portraitId; }
   uint8_t AnimationCount() const { return entityTypeAnimations.size(); }

   const MageEntityTypeAnimation* EntityTypeAnimation(uint32_t index) const
   {
      return entityTypeAnimations[index % entityTypeAnimations.size()];
   }

private:
#ifndef DC801_EMBEDDED
   char name[32]{0};
#endif
   uint8_t portraitId{ 0 };
   std::vector<const MageEntityTypeAnimation*> entityTypeAnimations{ };
};

#endif //_MAGE_ENTITY_TYPE_H