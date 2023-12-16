#include "mage_entity.h"
#include "mage_script_control.h"

void MageEntity::OnTick(MageScriptControl* scriptControl)
{
   //Non-null scripts will run every tick, restarting from the beginning as it completes
   onTick.scriptIsRunning = data.onTickScriptId != 0;
   scriptControl->processScript(onTick, data.onTickScriptId);
}

void MageEntity::OnInteract(MageScriptControl* scriptControl)
{
   onInteract.scriptIsRunning = true;
   scriptControl->processScript(onInteract, data.onInteractScriptId);
}

void MageEntity::UpdateRenderableData()
{
   if (data.primaryIdType == MageEntityPrimaryIdType::TILESET)
   {
      renderableData.tilesetId = data.primaryId;
      renderableData.tileId = data.secondaryId;
      renderableData.duration = 0; //unused
      renderableData.frameCount = 0; //unused
      renderableData.renderFlags = data.direction; //no need to check, it shouldn't cause a crash.
   }
   else if (data.primaryIdType == MageEntityPrimaryIdType::ANIMATION)
   {
      //check for frame change and adjust if needed:
      if (renderableData.currentFrameTicks >= renderableData.duration)
      {
         //increment frame and reset tick counter:
         renderableData.currentFrameIndex++;
         renderableData.currentFrameTicks = 0;
      }

      //reset animation to first frame after max frame is reached:
      if (renderableData.currentFrameIndex >= renderableData.frameCount)
      {
         renderableData.currentFrameIndex = 0;
      }
      auto animation = ROM()->GetReadPointerByIndex<MageAnimation>(data.primaryId);
      renderableData.tilesetId = animation->tilesetId;
      renderableData.tileId = animation->GetFrame(renderableData.currentFrameIndex).tileId;
      renderableData.duration = animation->GetFrame(renderableData.currentFrameIndex).duration; //no need to check, it shouldn't cause a crash.
      renderableData.frameCount = animation->frameCount; //no need to check, it shouldn't cause a crash.
      renderableData.renderFlags = data.direction; //no need to check, it shouldn't cause a crash.
   }
   else if (data.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      auto entityType = ROM()->GetReadPointerByIndex<MageEntityType>(data.primaryId);

      //If the entity has no animations defined, return default:
      if (entityType->animationCount == 0)
      {
         renderableData.tilesetId = MAGE_TILESET_FAILOVER_ID;
         renderableData.tileId = MAGE_TILE_FAILOVER_ID;
         renderableData.duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
         renderableData.frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
         renderableData.renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
      }

      auto& animation = entityType->GetAnimation(renderableData.currentAnimation);

      //create a animationDirection entity based on direction:
      auto dirValue = (MageEntityAnimationDirection)(data.direction & RENDER_FLAGS_DIRECTION_MASK);
      auto& animationDirection =
         dirValue == MageEntityAnimationDirection::NORTH ? animation.North
         : dirValue == MageEntityAnimationDirection::EAST ? animation.East
         : dirValue == MageEntityAnimationDirection::SOUTH ? animation.South
         : animation.West;

      //based on animationDirection.type, you can get two different outcomes:
      //Scenario A: Type is 0, TypeID is an animation ID:
      //Scenario B: Type is not 0, so Type is a tileset(you will need to subtract 1 to get it 0-indexed), and TypeId is the tileId.
      if (animationDirection.type == 0)
      {
         //check for frame change and adjust if needed:
         if (renderableData.currentFrameTicks >= renderableData.duration)
         {
            //increment frame and reset tick counter:
            renderableData.currentFrameIndex++;
            renderableData.currentFrameTicks = 0;
         }

         //reset animation to first frame after max frame is reached:
         if (renderableData.currentFrameIndex >= renderableData.frameCount)
         {
            renderableData.currentFrameIndex = 0;
         }
         auto animation = ROM()->GetReadPointerByIndex<MageAnimation>(animationDirection.typeId);
         auto& currentFrame = animation->GetFrame(renderableData.currentFrameIndex);
         renderableData.tilesetId = animation->tilesetId;
         renderableData.tileId = currentFrame.tileId;
         renderableData.duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
         renderableData.frameCount = animation->frameCount; //no need to check, it shouldn't cause a crash.
         renderableData.renderFlags = animationDirection.renderFlags | (data.direction & 0x80); //no need to check, it shouldn't cause a crash.
      }
      else
      {
         renderableData.tilesetId = animationDirection.type - 1;
         renderableData.tileId = animationDirection.typeId;
         renderableData.duration = 0; //does not animate;
         renderableData.frameCount = 0; //does not animate
         renderableData.renderFlags = data.direction; //no need to check, it shouldn't cause a crash.
      }
   }

   auto oldCenter = renderableData.center();

   // hacking can change the resulting tile size, update tile size accordingly
   if (renderableData.lastTilesetId != renderableData.tilesetId)
   {
      //get the difference between entity centers:
      const auto adjustmentPoint = oldCenter - renderableData.center();
      data.position.x += adjustmentPoint.x;
      data.position.y += adjustmentPoint.y;
      renderableData.lastTilesetId = renderableData.tilesetId;
   }

   auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(renderableData.tilesetId);
   auto halfWidth = uint16_t(tileset->TileWidth / 2);
   auto halfHeight = uint16_t(tileset->TileHeight / 2);

   renderableData.origin.x = data.position.x;
   renderableData.origin.y = data.position.y - tileset->TileHeight;
   renderableData.hitBox.origin.x = data.position.x + halfWidth / 2;
   renderableData.hitBox.origin.y = data.position.y - tileset->TileHeight + halfHeight / 2;
   renderableData.hitBox.w = halfWidth;
   renderableData.hitBox.h = halfHeight;
}

void MageEntity::Draw(const std::shared_ptr<TileManager>& tileManager, const EntityPoint& cameraPosition) const
{
   tileManager->DrawTile(renderableData.tilesetId, renderableData.tileId, renderableData.origin - cameraPosition, renderableData.renderFlags);
}

void MageEntity::DrawGeometry(const EntityPoint& camera) const
{
   bool isColliding = false;
   auto playerPosition = renderableData.center();
   //for (uint16_t i = 0; i < GeometryCount(); i++)
   //{
   //   // auto geometry = ROM()->GetReadPointerByIndex<MageGeometry>(getGlobalGeometryId(i));
   //   //geometry->draw(camera.x, camera.y, isColliding ? COLOR_RED : COLOR_GREEN);
   //}
}