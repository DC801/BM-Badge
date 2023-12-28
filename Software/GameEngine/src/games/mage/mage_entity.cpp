#include "mage_entity.h"
#include "mage_script_control.h"

//void MageEntity::OnTick(MageEntityData& entity, MageScriptControl* scriptControl)
//{
//   //Non-null scripts will run every tick, restarting from the beginning as it completes
//   onTick.scriptIsRunning = entity.onTickScriptId != 0;
//   scriptControl->processScript(onTick, entity.onTickScriptId);
//}
//
//void MageEntity::OnInteract(MageEntityData& entity, MageScriptControl* scriptControl)
//{
//   onInteract.scriptIsRunning = true;
//   scriptControl->processScript(onInteract, entity.onInteractScriptId);
//}

void RenderableData::Update(const MageEntityData& entity)
{
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

   auto oldCenter = center();

   // hacking can change the resulting tile size, update tile size accordingly
   if (lastTilesetId != tilesetId)
   {
      //get the difference between entity centers:
      const auto adjustmentPoint = oldCenter - center();
      /*entity.position.x += adjustmentPoint.x;
      entity.position.y += adjustmentPoint.y;*/
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
//
//void Mage::DrawGeometry(const EntityPoint& camera) const
//{
//   bool isColliding = false;
//   auto playerPosition = renderableData.center();
//   //for (uint16_t i = 0; i < GeometryCount(); i++)
//   //{
//   //   // auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(getGlobalGeometryId(i));
//   //   //geometry->draw(camera.x, camera.y, isColliding ? COLOR_RED : COLOR_GREEN);
//   //}
//}

void RenderableData::Draw(const std::shared_ptr<TileManager>& tileManager, const EntityPoint& cameraPosition) const
{
   tileManager->DrawTile(tilesetId, tileId, origin - cameraPosition, renderFlags);
}

void RenderableData::updateAsTileset(const MageEntityData& entity)
{
   tilesetId = entity.primaryId;
   tileId = entity.secondaryId;
   duration = 0; //unused
   frameCount = 0; //unused
   renderFlags = entity.flags; //no need to check, it shouldn't cause a crash.
}

void RenderableData::updateAsAnimation(const MageEntityData& entity)
{
   //check for frame change and adjust if needed:
   if (currentFrameTicks >= duration)
   {
      //increment frame and reset tick counter:
      currentFrameIndex++;
      currentFrameTicks = 0;
   }
   else
   {
      //reset animation to first frame after max frame is reached:
      if (currentFrameIndex >= frameCount)
      {
         currentFrameIndex = 0;
      }
      auto animation = ROM()->GetReadPointerByIndex<MageAnimation>(entity.primaryId);
      tilesetId = animation->tilesetId;
      tileId = animation->GetFrame(currentFrameIndex).tileId;
      duration = animation->GetFrame(currentFrameIndex).duration; //no need to check, it shouldn't cause a crash.
      frameCount = animation->frameCount; //no need to check, it shouldn't cause a crash.
      renderFlags = entity.flags; //no need to check, it shouldn't cause a crash.
   }
}

void RenderableData::updateAsEntity(const MageEntityData& entity)
{
   auto entityType = ROM()->GetReadPointerByIndex<MageEntityType>(entity.primaryId);

   //If the entity has no animations defined, return default:
   if (entityType->animationCount == 0)
   {
      tilesetId = MAGE_TILESET_FAILOVER_ID;
      tileId = MAGE_TILE_FAILOVER_ID;
      duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
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
      duration = 0; //does not animate;
      frameCount = 0; //does not animate
      renderFlags = entity.flags; //no need to check, it shouldn't cause a crash.
   }
   else
   {
      //check for frame change and adjust if needed:
      if (currentFrameTicks >= duration)
      {
         //increment frame and reset tick counter:
         currentFrameIndex++;
         currentFrameTicks = 0;
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
      duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
      frameCount = animation->frameCount; //no need to check, it shouldn't cause a crash.
      renderFlags = animationDirection.renderFlags | (entity.flags & 0x80); //no need to check, it shouldn't cause a crash.
   }
}