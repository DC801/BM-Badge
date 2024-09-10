#include "mage_entity.h"
#include "mage_rom.h"

void RenderableData::UpdateFrom(const MageEntityData& entity)
{
   curFrameDuration += IntegrationStepSize;

   // hacking can change the resulting tile size, update tile size accordingly
   if (lastTilesetId != tilesetId)
   {
      //get the difference between entity centers:
      //entity.targetPosition.x += adjustmentPoint.x;
      //entity.targetPosition.y += adjustmentPoint.y;
   }

   auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
   auto halfWidth = uint16_t(tileset->TileWidth / 2);
   auto halfHeight = uint16_t(tileset->TileHeight / 2);
   
   origin.x = entity.targetPosition.x;
   origin.y = entity.targetPosition.y - tileset->TileHeight;
   hitBox.origin.x = entity.targetPosition.x + halfWidth / 2;
   hitBox.origin.y = entity.targetPosition.y + halfHeight / 2;
   hitBox.w = halfWidth;
   hitBox.h = halfHeight;

   if (entity.primaryIdType == MageEntityPrimaryIdType::TILESET)
   {
      updateAsTileset(entity);
   }
   else if (entity.primaryIdType == MageEntityPrimaryIdType::ANIMATION)
   {
      updateAsAnimation(entity);
   }
   else if (entity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      updateAsEntity(entity);
   }
   lastTilesetId = tilesetId;
}

void RenderableData::Draw(const std::shared_ptr<FrameBuffer>& frameBuffer) const
{
   frameBuffer->DrawTileWorldCoords(tilesetId, tileId, origin.x, origin.y, renderFlags);
}

void RenderableData::updateAsTileset(const MageEntityData& entity)
{
   tilesetId = entity.primaryId;
   tileId = entity.secondaryId;
   duration = std::chrono::milliseconds{ 0 };
   frameCount = 0;
   renderFlags = entity.flags.value;
}

void RenderableData::updateAsAnimation(const MageEntityData& entity)
{
   //check for frame change and adjust if needed:
   if (curFrameDuration >= duration)
   {
      //increment frame and reset tick counter:
      currentFrameIndex++;
      curFrameDuration = GameClock::duration{ 0 };
   }
   //reset animation to first frame after max frame is reached:
   else if (currentFrameIndex >= frameCount)
   {
      currentFrameIndex = 0;
   }
   auto animation = ROM()->GetReadPointerByIndex<MageAnimation>(entity.primaryId);
   tilesetId = animation->tilesetId;
   tileId = animation->GetFrame(currentFrameIndex).tileId;
   duration = std::chrono::milliseconds{ animation->GetFrame(currentFrameIndex).durationMs }; //no need to check, it shouldn't cause a crash.
   frameCount = animation->frameCount;
}

void RenderableData::updateAsEntity(const MageEntityData& entity)
{
   const auto entityType = ROM()->GetReadPointerByIndex<MageEntityType>(entity.primaryId);

   //If the entity has no animations defined, return default:
   if (entityType->animationCount == 0)
   {
      tilesetId = MAGE_TILESET_FAILOVER_ID;
      tileId = MAGE_TILE_FAILOVER_ID;
      duration = std::chrono::milliseconds{ MAGE_ANIMATION_DURATION_FAILOVER_VALUE };
      frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
      renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
   }

   const auto& animation = entityType->GetAnimation(currentAnimation);

   const auto& animationDirection = animation[entity.direction];

   //based on animationDirection.type, you can get two different outcomes:
   // * Not animated - animationDirection.type != 0:
   //    ** tileSetId = animationDirection.type - 1
   //    ** tileId = animationDirection.typeId
   // * Animated - animationDirection.type == 0
   //    ** animationId = animationDirection.typeID

   if (animationDirection.type) // not animated
   {
      tilesetId = animationDirection.type - 1;
      tileId = animationDirection.typeId;
      duration = std::chrono::milliseconds{ 0 }; 
      frameCount = 0;
      renderFlags = animationDirection.renderFlags;
   }
   else // animated
   {
      if (curFrameDuration >= duration)
      {
         currentFrameIndex++;
         curFrameDuration = GameClock::duration{ 0 };
      }

      //reset animation to first frame after max frame is reached:
      if (currentFrameIndex >= frameCount)
      {
         currentFrameIndex = 0;
      }
      auto animation = ROM()->GetReadPointerByIndex<MageAnimation>(animationDirection.typeId);
      auto& currentFrame = animation->GetFrame(currentFrameIndex);
      tilesetId = animation->tilesetId;
      tileId = currentFrame.tileId;
      duration = GameClock::duration{ currentFrame.durationMs };
      frameCount = animation->frameCount;
      renderFlags = animationDirection.renderFlags | (entity.flags.value & 0x80);
   }
}