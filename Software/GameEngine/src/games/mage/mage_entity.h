#ifndef _MAGE_ENTITY_H
#define _MAGE_ENTITY_H

#include "mage_rom.h"
#include "mage_geometry.h"
#include "FrameBuffer.h"
#include <stdint.h>
#include <vector>
#include <memory>
#include <variant>

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
   EntityPoint targetPosition{ 0 };
   uint16_t onInteractScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t primaryId{ 0 };
   uint16_t secondaryId{ 0 };
   MageEntityPrimaryIdType primaryIdType{ 0 };

   uint8_t  current_animation;
   uint8_t  current_frame;
   uint8_t flags;

   uint8_t hackableStateA{ 0 };
   uint8_t hackableStateB{ 0 };
   uint8_t hackableStateC{ 0 };
   uint8_t hackableStateD{ 0 };

   inline void SetName(std::string s)
   {
      for (auto i = 0; i < MAGE_ENTITY_NAME_LENGTH; i++)
      {
         name[i] = i < s.length() ? s[i] : 0;
      }
   }

   constexpr void SetDirection(MageEntityAnimationDirection dir) { flags = (flags & 0x80) | (static_cast<uint8_t>(dir) & RENDER_FLAGS_ENTITY_DIRECTION_MASK); }
   constexpr MageEntityAnimationDirection GetDirection() const { return static_cast<MageEntityAnimationDirection>(flags & RENDER_FLAGS_ENTITY_DIRECTION_MASK); }
   constexpr bool IsDebug() const { return flags & RENDER_FLAGS_IS_DEBUG; }
   constexpr bool IsGlitched() const { return flags & RENDER_FLAGS_IS_GLITCHED; }
   constexpr void SetGlitched(bool glitched) { if (glitched) { flags |= RENDER_FLAGS_IS_GLITCHED; } }
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
   uint8_t renderFlags;

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