#include "mage_entity_type.h"
#include "mage_animation.h"
#include "mage.h"
#include "FrameBuffer.h"
#include "convert_endian.h"

MageEntityTypeAnimation::Direction::Direction(std::shared_ptr<EngineROM> ROM, uint32_t& offset)
{
   ROM->Read(typeId, offset);
   ROM->Read(type, offset);
   ROM->Read(renderFlags, offset);
}

MageEntityTypeAnimation::MageEntityTypeAnimation(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
   ROM->GetPointerTo(north, address);
   ROM->GetPointerTo(south, address);
   ROM->GetPointerTo(east, address);
   ROM->GetPointerTo(west, address);
}


MageEntityType::MageEntityType(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
#ifndef DC801_EMBEDDED
   ROM->Read(name, address, 32);
#else
   address += 32; // skip over reading the name, no need to hold that in ram
#endif

   address += sizeof(uint8_t) + sizeof(uint8_t); // paddingA + paddingB

   ROM->Read(portraitId, address);

   auto animationCount = uint16_t{ 0 };
   ROM->Read(animationCount, address);

   for (auto i = 0; i < animationCount; i++)
   {
      const MageEntityTypeAnimation* entityTypeAnimation;
      ROM->GetPointerTo(entityTypeAnimation, address);
      entityTypeAnimations.push_back(entityTypeAnimation);
   }
}

MageEntity::MageEntity(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
   ROM->Read(name, address, MAGE_ENTITY_NAME_LENGTH);
   uint16_t xLoc, yLoc;
   ROM->Read(xLoc, address);
   ROM->Read(yLoc, address);
   location = Point{ xLoc, yLoc };

   ROM->Read(onInteractScriptId, address);
   ROM->Read(onTickScriptId, address);
   ROM->Read(primaryId, address);
   ROM->Read(secondaryId, address);
   ROM->Read(primaryIdType, address);
   ROM->Read(currentAnimation, address);
   ROM->Read(currentFrameIndex, address);
   ROM->Read(direction, address);
   ROM->Read(hackableStateA, address);
   ROM->Read(hackableStateB, address);
   ROM->Read(hackableStateC, address);
   ROM->Read(hackableStateD, address);
}

void MageEntity::updateRenderableData(MageGameControl* gameControl)
{
   //make a local copy of the entity so the hacked values remain unchanged:
   //MageEntity entity = *entityPointer;

   //ensure the primaryIdType is valid
   primaryIdType =  (MageEntityPrimaryIdType)(primaryIdType % NUM_PRIMARY_ID_TYPES);

   //then get valid tileset renderableData based on primaryId type:
   if (primaryIdType == MageEntityPrimaryIdType::TILESET)
   {
      //ensure the tilesetId (in this scenario, the entity's primaryId) is valid.
      renderableData.tilesetId = primaryId;
      renderableData.tileId = secondaryId;
      renderableData.duration = 0; //unused
      renderableData.frameCount = 0; //unused
      renderableData.renderFlags = direction; //no need to check, it shouldn't cause a crash.
   }
   else if (primaryIdType == MageEntityPrimaryIdType::ANIMATION)
   {
      auto animation = gameControl->getAnimation(primaryId);
      renderableData.tilesetId = animation->TilesetId();
      renderableData.tileId = animation->TileId();
      renderableData.duration = animation->GetFrame(currentFrameIndex).duration; //no need to check, it shouldn't cause a crash.
      renderableData.frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
      renderableData.renderFlags = direction; //no need to check, it shouldn't cause a crash.
   }
   else if (primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      //ensure the entityType (in this scenario, the entity's primaryId) is valid.
      uint16_t entityTypeId = gameControl->getValidEntityTypeId(primaryId);

      //If the entity has no animations defined, return default:
      if ((gameControl->entityTypes[entityTypeId]->AnimationCount()) == 0)
      {
         //the entity has no animations, so return default values and give up.
#ifndef DC801_EMBEDDED
         fprintf(stderr, "An entityType with no animations exists. Using fallback values.");
#endif
         renderableData.tilesetId = MAGE_TILESET_FAILOVER_ID;
         renderableData.tileId = MAGE_TILE_FAILOVER_ID;
         renderableData.duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
         renderableData.frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
         renderableData.renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
      }

      //get a valid entity type animation ID:
      //note that entityType was already validated above.
      uint8_t entityTypeAnimationId = currentAnimation;

      //make a local copy of the current entity type animation:
      auto currentAnimation = gameControl->entityTypes[entityTypeId]->EntityTypeAnimation(entityTypeAnimationId);

      //create a directedAnimation entity based on direction:
      auto dirValue = (MageEntityAnimationDirection)( direction % NUM_DIRECTIONS );
      const MageEntityTypeAnimation::Direction* directedAnimation;
      if (dirValue == MageEntityAnimationDirection::NORTH)
      {
         directedAnimation = currentAnimation->North();
      }
      else if (dirValue == MageEntityAnimationDirection::EAST)
      {
         directedAnimation = currentAnimation->East();
      }
      else if (dirValue == MageEntityAnimationDirection::SOUTH)
      {
         directedAnimation = currentAnimation->South();
      }
      else if (dirValue == MageEntityAnimationDirection::WEST)
      {
         directedAnimation = currentAnimation->West();
      }
      renderableData.getRenderableState(gameControl, currentFrameIndex, directedAnimation);

   }

   auto tileset = gameControl->tileManager->GetTileset(renderableData.tilesetId);
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

   uint16_t width = tileset->TileWidth();
   uint16_t height = tileset->TileHeight();
   uint16_t halfWidth = width / 2;
   uint16_t halfHeight = height / 2;
   renderableData.hitBox.origin.x = x + (halfWidth / 2);
   renderableData.hitBox.origin.y = y + (halfHeight)-height;
   renderableData.hitBox.w = halfWidth;
   renderableData.hitBox.h = halfHeight;
   renderableData.center.x = renderableData.hitBox.origin.x + (renderableData.hitBox.w / 2);
   renderableData.center.y = renderableData.hitBox.origin.y + (renderableData.hitBox.h / 2);
}

void RenderableData::getRenderableState(MageGameControl* gameControl, uint8_t currentFrameIndex, const MageEntityTypeAnimation::Direction* animationDirection)
{
   //based on animationDirection.Type(), you can get two different outcomes:
   //Scenario A: Type is 0, TypeID is an animation ID:
   //Scenario B: Type is not 0, so Type is a tileset(you will need to subtract 1 to get it 0-indexed), and TypeId is the tileId.
   if (animationDirection->Type() == 0)
   {
      auto animation = gameControl->getAnimation(animationDirection->TypeId());

      MageAnimation::Frame currentFrame = animation->GetFrame(currentFrameIndex);
      tilesetId = animation->TilesetId();
      tileId = currentFrame.tileId;

      duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
      frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
      renderFlags = animationDirection->RenderFlags(); //no need to check, it shouldn't cause a crash.
      renderFlags += direction & 0x80;
   }
   else
   {
      tilesetId = animationDirection->Type() - 1;
      tileId = animationDirection->TypeId();
      duration = 0; //does not animate;
      frameCount = 0; //does not animate
      renderFlags = direction; //no need to check, it shouldn't cause a crash.
   }
}

