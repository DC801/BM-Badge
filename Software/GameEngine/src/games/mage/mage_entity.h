#ifndef _MAGE_ENTITY_H
#define _MAGE_ENTITY_H

#include "mage_geometry.h"
#include <stdint.h>
#include <vector>
#include <memory>
#include <variant>

// forward declaration
class FrameBuffer;

//this contains the possible options for an entity PrimaryIdType value.
enum class MageEntityPrimaryIdType : uint8_t
{
   TILESET = 0,
   ANIMATION = 1,
   ENTITY_TYPE = 2,
   INVALID = 3
};

struct MageAnimation
{
   struct Frame
   {
      uint16_t tileId;
      uint16_t durationMs;
   };

   const MageAnimation::Frame& GetFrame(uint32_t index) const noexcept
   {
      auto frames = (MageAnimation::Frame*)((uint8_t*)&frameCount + sizeof(uint16_t));
      return frames[index % frameCount];
   }

   uint16_t tilesetId{ 0 };
   uint16_t frameCount{ 1 };
};

struct MageEntityTypeAnimation
{
   constexpr const AnimationDirection& operator[](MageEntityAnimationDirection direction) const
   {
      switch (direction)
      {
      case MageEntityAnimationDirection::NORTH: return North;
      case MageEntityAnimationDirection::EAST: return East;
      case MageEntityAnimationDirection::WEST: return West;
      case MageEntityAnimationDirection::SOUTH:
      default:
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
   EntityPoint targetPosition{ 0 };
   uint16_t onInteractScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t primaryId{ 0 };
   uint16_t secondaryId{ 0 };
   MageEntityPrimaryIdType primaryIdType{ MageEntityPrimaryIdType::INVALID };

   uint8_t current_animation{ 0 };
   uint8_t current_frame{ 0 };
   union
   {
      uint8_t value;
      struct RenderFlags
      {
         bool flipDiag : 1;
         bool flipY : 1;
         bool flipX : 1;
         uint8_t _ : 3;
         bool debug : 1;
         bool glitched : 1;
      } render;

      struct EntityFlags
      {
         MageEntityAnimationDirection direction : 2;
         uint8_t _ : 4;
         bool debug : 1;
         bool glitched : 1;
      } entity;
   } flags;

   MageEntityAnimationDirection direction{ MageEntityAnimationDirection::NORTH };
   uint16_t pathId{ 0 };
   uint16_t onLookScriptId{ 0 };

   inline void SetName(std::string s)
   {
      for (auto i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         name[i] = i < s.length() ? s[i] : 0;
      }
   }

   constexpr void SetDirection(MageEntityAnimationDirection dir) 
   {
      direction = dir;
      flags.entity.direction = dir;
   }
   constexpr bool IsDebug() const { return flags.entity.debug; }
   constexpr bool IsGlitched() const { return flags.entity.glitched; }
   constexpr void SetGlitched(bool glitched) { flags.entity.glitched = 1; }
};

class RenderableData
{
public:
   EntityPoint origin{ 0 };
   EntityRect hitBox{ 0 };
   GameClock::duration curFrameDuration{ 0 };
   uint16_t tilesetId{ 0 };
   uint16_t lastTilesetId{ 0 };
   uint16_t tileId{ 0 };
   GameClock::duration duration{ 0 };
   uint16_t frameCount{ 0 };
   uint8_t currentAnimation{ 0 };
   uint8_t currentFrameIndex{ 0 };
   uint8_t renderFlags{ 0 };

   constexpr EntityPoint center() const
   {
      return EntityPoint{ uint16_t(origin.x + hitBox.w / 2), uint16_t(origin.y + hitBox.h / 2) };
   }

   inline void SetAnimation(uint8_t animation)
   {
      //if the animation changed since the start of this function, reset to the first frame and restart the timer:
      if (animation != currentAnimation)
      {
         curFrameDuration = GameClock::duration{ 0 };
         currentFrameIndex = 0;
         currentAnimation = animation;
      }
   }

   void UpdateFrom(const MageEntityData& entity);

   void Draw(const std::shared_ptr<FrameBuffer>& frameBuffer) const;

private:
   void updateAsAnimation(const MageEntityData& entity);
   void updateAsEntity(const MageEntityData& entity);
   void updateAsTileset(const MageEntityData& entity);
};

#endif //_MAGE_ENTITY_TYPE_H  