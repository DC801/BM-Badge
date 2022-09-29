#include "mage_entity_type.h"
#include "FrameBuffer.h"
#include "convert_endian.h"

MageEntityTypeAnimation::Direction::Direction(std::shared_ptr<EngineROM> ROM, uint32_t& offset)
{
   ROM->Read(&typeId, offset);
   ROM->Read(&type, offset);
   ROM->Read(&renderFlags, offset);
}


MageEntityType::MageEntityType(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
   address += 32; // skip over reading the name, no need to hold that in ram
   address += sizeof(uint8_t) + sizeof(uint8_t); // paddingA + paddingB

   ROM->Read(&portraitId, address);

   auto animationCount = uint16_t{ 0 };
   ROM->Read(&animationCount, address);

   entityTypeAnimations = std::vector<MageEntityTypeAnimation>{ animationCount };
   for (auto i = 0; i < animationCount; i++)
   {
      entityTypeAnimations[i] = MageEntityTypeAnimation{ ROM, address };
   }
}

MageEntity::MageEntity(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
   ROM->Read(name, address, MAGE_ENTITY_NAME_LENGTH);
   ROM->Read(&x, address);
   ROM->Read(&y, address);
   ROM->Read(&onInteractScriptId, address);
   ROM->Read(&onTickScriptId, address);
   ROM->Read(&primaryId, address);
   ROM->Read(&secondaryId, address);
   ROM->Read(&primaryIdType, address);
   ROM->Read(&currentAnimation, address);
   ROM->Read(&currentFrameIndex, address);
   ROM->Read(&direction, address);
   ROM->Read(&hackableStateA, address);
   ROM->Read(&hackableStateB, address);
   ROM->Read(&hackableStateC, address);
   ROM->Read(&hackableStateD, address);
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
      renderableData.duration = animation->AnimationFrame(currentFrameIndex).duration; //no need to check, it shouldn't cause a crash.
      renderableData.frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
      renderableData.renderFlags = direction; //no need to check, it shouldn't cause a crash.
   }
   else if (primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
   {
      //ensure the entityType (in this scenario, the entity's primaryId) is valid.
      uint16_t entityTypeId = gameControl->getValidEntityTypeId(primaryId);

      //If the entity has no animations defined, return default:
      if ((gameControl->entityTypes[entityTypeId].AnimationCount()) == 0)
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
      auto currentAnimation = gameControl->entityTypes[entityTypeId].EntityTypeAnimation(entityTypeAnimationId);

      //create a directedAnimation entity based on direction:
      auto dirValue = (MageEntityAnimationDirection)direction % NUM_DIRECTIONS;
      MageEntityTypeAnimation::Direction directedAnimation;
      if (dirValue == MageEntityAnimationDirection::NORTH)
      {
         directedAnimation = currentAnimation.North();
      }
      else if (dirValue == MageEntityAnimationDirection::EAST)
      {
         directedAnimation = currentAnimation.East();
      }
      else if (dirValue == MageEntityAnimationDirection::SOUTH)
      {
         directedAnimation = currentAnimation.South();
      }
      else if (dirValue == MageEntityAnimationDirection::WEST)
      {
         directedAnimation = currentAnimation.West();
      }
      //renderableData.getRenderableState(entityPointer, currentAnimation);

   }

   auto tileset = gameControl->GetTileset(renderableData.tilesetId);
   Point oldCenter = { renderableData.center.x, renderableData.center.y };
   // accounting for possible change in tile size due to hacking;
   // adjust entity position so that the center will not change
   // from the previous tileset to the new tileset.

   if (renderableData.lastTilesetId != renderableData.tilesetId)
   {
      //get the difference between entity centers:
      x += oldCenter.x - renderableData.center.x;
      y += oldCenter.y - renderableData.center.y;
   }
   renderableData.updateRenderableBoxes(this, tileset);
   renderableData.lastTilesetId = renderableData.tilesetId;
}

void MageEntity::RenderableData::updateRenderableBoxes(const MageEntity* entity, const MageTileset* tileset)
{
   uint16_t width = tileset->TileWidth();
   uint16_t height = tileset->TileHeight();
   uint16_t halfWidth = width / 2;
   uint16_t halfHeight = height / 2;
   hitBox.x = entity->x + (halfWidth / 2);
   hitBox.y = entity->y + (halfHeight)-height;
   hitBox.w = halfWidth;
   hitBox.h = halfHeight;
   center.x = hitBox.x + (hitBox.w / 2);
   center.y = hitBox.y + (hitBox.h / 2);
}

void MageEntity::RenderableData::getRenderableState(MageGameControl* gameControl, const MageEntity* entity, const MageEntityTypeAnimation::Direction* animationDirection)
{
   //based on animationDirection.Type(), you can get two different outcomes:
   //Scenario A: Type is 0, TypeID is an animation ID:
   //Scenario B: Type is not 0, so Type is a tileset(you will need to subtract 1 to get it 0-indexed), and TypeId is the tileId.
   if (animationDirection->Type() == 0)
   {
      auto animation = gameControl->getAnimation(animationDirection->TypeId());

      MageAnimation::Frame currentFrame = animation->AnimationFrame(entity->currentFrameIndex);
      tilesetId = animation->TilesetId();
      tileId = currentFrame.tileId;

      duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
      frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
      renderFlags = animationDirection->RenderFlags(); //no need to check, it shouldn't cause a crash.
      renderFlags += entity->direction & 0x80;
   }
   else
   {
      tilesetId = animationDirection->Type() - 1;
      tileId = animationDirection->TypeId();
      duration = 0; //does not animate;
      frameCount = 0; //does not animate
      renderFlags = entity->direction; //no need to check, it shouldn't cause a crash.
   }
}

