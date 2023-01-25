#include "mage_entity_type.h"
#include "mage_animation.h"
#include "mage.h"
#include "FrameBuffer.h"
#include "convert_endian.h"

MageEntityType::MageEntityType(uint32_t& offset)
{
#ifndef DC801_EMBEDDED
   ROM()->Read(name, offset, 32);
#else
   offset += 32; // skip over reading the name, no need to hold that in ram
#endif

   offset += sizeof(uint8_t) + sizeof(uint8_t); // paddingA + paddingB

   ROM()->Read(portraitId, offset);

   auto animationCount = uint16_t{ 0 };
   ROM()->Read(animationCount, offset);

   //ROM()->InitializeCollectionOf(animations, offset, animationCount);
}

MageEntity::MageEntity(uint32_t& offset)
{
   ROM()->Read(name, offset, MAGE_ENTITY_NAME_LENGTH);
   uint16_t xLoc, yLoc;
   ROM()->Read(xLoc, offset);
   ROM()->Read(yLoc, offset);
   location = Point{ xLoc, yLoc };

   ROM()->Read(onInteractScriptId, offset);
   ROM()->Read(onTickScriptId, offset);
   ROM()->Read(primaryId, offset);
   ROM()->Read(secondaryId, offset);
   ROM()->Read(primaryIdType, offset);
   ROM()->Read(currentAnimation, offset);
   ROM()->Read(currentFrameIndex, offset);
   ROM()->Read(renderFlags, offset);

   ROM()->Read(hackableStateA, offset);
   ROM()->Read(hackableStateB, offset);
   ROM()->Read(hackableStateC, offset);
   ROM()->Read(hackableStateD, offset);
}

void MageEntity::updateRenderableData(uint32_t deltaTime)
{
   renderableData.currentFrameTicks += deltaTime;
   if (primaryIdType == MageEntityPrimaryIdType::TILESET)
   {
      renderableData.tilesetId = primaryId;
      renderableData.tileId = secondaryId;
      renderableData.duration = 0; //unused
      renderableData.frameCount = 0; //unused
      renderableData.renderFlags = renderFlags; //no need to check, it shouldn't cause a crash.
   }
   else if (primaryIdType == MageEntityPrimaryIdType::ANIMATION)
   {
      //check for frame change and adjust if needed:
      if (renderableData.currentFrameTicks >= renderableData.duration)
      {
         //increment frame and reset tick counter:
         currentFrameIndex++;
         renderableData.currentFrameTicks = 0;

         //reset animation to first frame after max frame is reached:
         if (currentFrameIndex >= renderableData.frameCount)
         {
            currentFrameIndex = 0;
         }
      }
      auto animation = ROM()->Get<MageAnimation>(primaryId);
      renderableData.tilesetId = animation->TilesetId();
      renderableData.tileId = animation->TileId();
      renderableData.duration = animation->GetFrame(currentFrameIndex)->duration; //no need to check, it shouldn't cause a crash.
      renderableData.frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
      renderableData.renderFlags = renderFlags; //no need to check, it shouldn't cause a crash.
   }
   else if (primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      auto entityType = ROM()->Get<MageEntityType>(primaryId);

      //If the entity has no animations defined, return default:
      if (entityType->AnimationCount() == 0)
      {
         renderableData.tilesetId = MAGE_TILESET_FAILOVER_ID;
         renderableData.tileId = MAGE_TILE_FAILOVER_ID;
         renderableData.duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
         renderableData.frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
         renderableData.renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
      }

      auto animation = entityType->GetAnimation(currentAnimation);

      //create a animationDirection entity based on direction:
      auto dirValue = (MageEntityAnimationDirection)(renderFlags & RENDER_FLAGS_DIRECTION_MASK);
      const AnimationDirection* animationDirection =
         dirValue == MageEntityAnimationDirection::NORTH ? animation->North()
         : dirValue == MageEntityAnimationDirection::EAST ? animation->East()
         : dirValue == MageEntityAnimationDirection::SOUTH ? animation->South()
         : animation->West();

      //based on animationDirection->Type(), you can get two different outcomes:
      //Scenario A: Type is 0, TypeID is an animation ID:
      //Scenario B: Type is not 0, so Type is a tileset(you will need to subtract 1 to get it 0-indexed), and TypeId is the tileId.
      if (animationDirection->type == 0)
      {
         //TODO FIXME:
         //auto animation = ROM()->Get<MageAnimation>(animationDirection->TypeId());
         //MageAnimation::Frame currentFrame = animation->GetFrame(currentFrameIndex);
         //renderableData.tilesetId = animation->TilesetId();
         //renderableData.tileId = currentFrame.tileId;
         //renderableData.duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
         //renderableData.frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
         //renderableData.renderFlags = animationDirection->RenderFlags(); //no need to check, it shouldn't cause a crash.
         //renderableData.renderFlags += direction & 0x80;
      }
      else
      {
         renderableData.tilesetId = animationDirection->type - 1;
         renderableData.tileId = animationDirection->typeId;
         renderableData.duration = 0; //does not animate;
         renderableData.frameCount = 0; //does not animate
         renderableData.renderFlags = renderFlags; //no need to check, it shouldn't cause a crash.
      }
   }

   auto tileset = ROM()->Get<MageTileset>(renderableData.tilesetId);
   uint16_t halfWidth = tileset->TileWidth() / 2;
   uint16_t halfHeight = tileset->TileHeight() / 2;

   Point oldCenter = { renderableData.center.x, renderableData.center.y };
   // accounting for possible change in tile size due to hacking;
   // adjust entity position so that the center will not change
   // from the previous tileset to the new tileset.

   if (renderableData.lastTilesetId != renderableData.tilesetId)
   {
      //get the difference between entity centers:
      location += oldCenter - renderableData.center;
   }
   renderableData.lastTilesetId = renderableData.tilesetId;

   renderableData.hitBox.origin.x = location.x + halfWidth / 2;
   renderableData.hitBox.origin.y = location.y + halfHeight - tileset->TileHeight();
   renderableData.hitBox.w = halfWidth;
   renderableData.hitBox.h = halfHeight;
   renderableData.center.x = renderableData.hitBox.origin.x + (renderableData.hitBox.w / 2);
   renderableData.center.y = renderableData.hitBox.origin.y + (renderableData.hitBox.h / 2);
}


