#include "mage_entity.h"
#include "mage_script_control.h"

void RenderableData::UpdateFrom(const MageEntityData& entity)
{
   currentFrameMs += IntegrationStepSize.count();

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

   // hacking can change the resulting tile size, update tile size accordingly
   if (lastTilesetId != tilesetId)
   {
      //get the difference between entity centers:
      //entity.position.x += adjustmentPoint.x;
      //entity.position.y += adjustmentPoint.y;
      lastTilesetId = tilesetId;
   }

   auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
   auto halfWidth = uint16_t(tileset->TileWidth / 2);
   auto halfHeight = uint16_t(tileset->TileHeight / 2);
   
   origin.x = entity.position.x;
   origin.y = entity.position.y;
   hitBox.origin.x = entity.position.x + halfWidth / 2;
   hitBox.origin.y = entity.position.y + halfHeight / 2;
   hitBox.w = halfWidth;
   hitBox.h = halfHeight;
}

void RenderableData::Draw(const std::shared_ptr<ScreenManager>& screenManager) const
{
   screenManager->DrawTileWorldCoords(tilesetId, tileId, origin.x, origin.y, renderFlags);
}

void RenderableData::updateAsTileset(const MageEntityData& entity)
{
   tilesetId = entity.primaryId;
   tileId = entity.secondaryId;
   duration = std::chrono::milliseconds{ 0 }; //unused
   frameCount = 0; //unused
   renderFlags = entity.flags; //no need to check, it shouldn't cause a crash.
}

void RenderableData::updateAsAnimation(const MageEntityData& entity)
{
   //check for frame change and adjust if needed:
   if (std::chrono::milliseconds{ currentFrameMs } >= duration)
   {
      //increment frame and reset tick counter:
      currentFrameIndex++;
      currentFrameMs = 0;
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
   frameCount = animation->frameCount; //no need to check, it shouldn't cause a crash.
   renderFlags = entity.flags; //no need to check, it shouldn't cause a crash.
}

void RenderableData::updateAsEntity(const MageEntityData& entity)
{
   auto entityType = ROM()->GetReadPointerByIndex<MageEntityType>(entity.primaryId);

   //If the entity has no animations defined, return default:
   if (entityType->animationCount == 0)
   {
      tilesetId = MAGE_TILESET_FAILOVER_ID;
      tileId = MAGE_TILE_FAILOVER_ID;
      duration = std::chrono::milliseconds{ MAGE_ANIMATION_DURATION_FAILOVER_VALUE };
      frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
      renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
   }

   auto& animation = entityType->GetAnimation(currentAnimation);

   //create a animationDirection entity based on direction:
   auto dirValue = static_cast<MageEntityAnimationDirection>(entity.flags & RENDER_FLAGS_DIRECTION_MASK);
   auto& animationDirection = animation[dirValue];

   //based on animationDirection.type, you can get two different outcomes:
   // animationDirection.type != 0, animationDirection.Type - 1 = tileset id, animationDirection.typeId is the tileId.
   // animationDirection.type == 0, TypeID is an animation ID:
   if (animationDirection.type)
   {
      tilesetId = animationDirection.type - 1;
      tileId = animationDirection.typeId;
      duration = std::chrono::milliseconds{ 0 }; //does not animate;
      frameCount = 0; //does not animate
      renderFlags = entity.flags; //no need to check, it shouldn't cause a crash.
   }
   else
   {
      //check for frame change and adjust if needed:
      if (std::chrono::milliseconds{ currentFrameMs } >= duration)
      {
         //increment frame and reset tick counter:
         currentFrameIndex++;
         currentFrameMs = 0;
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
      duration = std::chrono::milliseconds{ currentFrame.durationMs }; //no need to check, it shouldn't cause a crash.
      frameCount = animation->frameCount; //no need to check, it shouldn't cause a crash.
      renderFlags = animationDirection.renderFlags | (entity.flags & 0x80); //no need to check, it shouldn't cause a crash.
   }
}