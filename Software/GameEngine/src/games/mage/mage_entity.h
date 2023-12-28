#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_rom.h"
#include "mage_script_state.h"
#include "mage_geometry.h"
#include "mage_tileset.h"
#include <stdint.h>
#include <vector>
#include <memory>

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
   constexpr const AnimationDirection& operator[](uint8_t direction) const
   {
      switch (direction)
      {
      case MageEntityAnimationDirection::NORTH: return North;
      case MageEntityAnimationDirection::EAST: return East;
      case MageEntityAnimationDirection::WEST: return West;

      default:
      case MageEntityAnimationDirection::SOUTH: 
      return South;
      }
   }
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
   char name[MAGE_ENTITY_NAME_LENGTH]{ 0 };
   EntityPoint position{ 0 };
   uint16_t onInteractScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t primaryId{ 0 };
   uint16_t secondaryId{ 0 };
   uint8_t primaryIdType{ 0 };

   uint8_t  current_animation;
   uint8_t  current_frame;
   uint8_t  flags;
   uint8_t hackableStateA{ 0 };
   uint8_t hackableStateB{ 0 };
   uint8_t hackableStateC{ 0 };
   uint8_t hackableStateD{ 0 };


   void SetName(std::string s)
   {
      for (auto i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         name[i] = i < s.length() ? s[i] : 0;
      }
   }

   inline bool IsDebug() const { return flags & RENDER_FLAGS_IS_DEBUG; }
};


//this is info needed to render entities that can be determined
//at run time from the MageEntity class info.
struct RenderableData
{
   friend class MapControl;

   EntityPoint origin{ 0 };
   EntityRect hitBox{ 0 };
   uint16_t currentFrameTicks{ 0 };
   uint16_t tilesetId{ 0 };
   uint16_t lastTilesetId{ 0 };
   uint16_t tileId{ 0 };
   uint32_t duration{ 0 };
   uint16_t frameCount{ 0 };
   uint8_t currentAnimation{ 0 };
   uint8_t currentFrameIndex{ 0 };
   uint8_t renderFlags{ 0 };
   bool isInteracting{ 0 };

   constexpr EntityPoint center() const
   {
      return EntityPoint{ uint16_t(origin.x + hitBox.w / 2), uint16_t(origin.y + hitBox.h / 2) };
   }

   void SetAnimation(uint8_t animation)
   {
      currentFrameTicks = 0;
      currentFrameIndex = 0;
      currentAnimation = animation;
   }

   void Update(const MageEntityData& entity);

   void Draw(const std::shared_ptr<TileManager>& tileManager, const EntityPoint& cameraPosition) const;

private:
   void updateAsAnimation(const MageEntityData& entity);
   void updateAsEntity(const MageEntityData& entity);
   void updateAsTileset(const MageEntityData& entity);
};

#endif //_MAGE_ENTITY_TYPE_H