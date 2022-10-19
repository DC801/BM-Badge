/*
This class contains the MageEntity class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_defines.h"
#include "mage_geometry.h"
#include <vector>
#include <memory>

#define FLIPPED_DIAGONALLY_FLAG   0x01
#define FLIPPED_VERTICALLY_FLAG   0x02
#define FLIPPED_HORIZONTALLY_FLAG 0x04

class MageGameControl;
class EngineROM;

//this contains the possible options for an entity PrimaryIdType value.
typedef enum : uint8_t
{
   TILESET = 0,
   ANIMATION = 1,
   ENTITY_TYPE = 2
} MageEntityPrimaryIdType;
#define NUM_PRIMARY_ID_TYPES 3

//this is the numerical translation for entity direction.
enum MageEntityAnimationDirection : uint8_t
{
   NORTH = 0,
   EAST = 1,
   SOUTH = 2,
   WEST = 3,
};

class MageEntityTypeAnimation
{
public:
   class Direction
   {
   public:
      Direction() noexcept = default;
      Direction(std::shared_ptr<EngineROM> ROM, uint32_t& offset);

      constexpr uint16_t TypeId() const { return typeId; }
      constexpr uint8_t Type() const { return type; }
      constexpr uint8_t RenderFlags() const { return renderFlags; }
      constexpr bool FlipX() const { return renderFlags & FLIPPED_HORIZONTALLY_FLAG; }
      constexpr bool FlipY() const { return renderFlags & FLIPPED_VERTICALLY_FLAG; }
      constexpr bool FlipDiag() const { return renderFlags & FLIPPED_DIAGONALLY_FLAG; }

   private:
      uint16_t typeId{ 0 };
      uint8_t type{ 0 };
      uint8_t renderFlags{ 0 };
   };

   MageEntityTypeAnimation() = default;
   MageEntityTypeAnimation(std::shared_ptr<EngineROM> ROM, uint32_t& address);

   constexpr const Direction* North() const { return north; }
   constexpr const Direction* East() const { return east; }
   constexpr const Direction* South() const { return south; }
   constexpr const Direction* West() const { return west; }
private:
   const Direction* north;
   const Direction* east;
   const Direction* south;
   const Direction* west;
};

union RenderFlags
{
   uint8_t i;
   struct
   {
      bool diagonal : 1;
      bool vertical : 1;
      bool horizontal : 1;
      bool paddingA : 1;
      bool paddingB : 1;
      bool paddingC : 1;
      bool debug : 1;
      bool glitched : 1;
   };
};

//this is info needed to render entities that can be determined
//at run time from the MageEntity class info.
struct RenderableData
{
   Rect hitBox{ 0 };
   Rect interactBox{ 0 };
   Point center{ 0 };
   uint16_t currentFrameTicks{ 0 };
   uint16_t tilesetId{ 0 };
   uint16_t lastTilesetId{ 0 };
   uint16_t tileId{ 0 };
   uint32_t duration{ 0 };
   uint16_t frameCount{ 0 };
   uint8_t renderFlags{ 0 };
   bool isInteracting{ 0 };

   //this calculates the relevant info to be able to draw an entity based on the
   //current state of the data in MageGameControl and stores the info in entityRenderableData
   void getRenderableState(MageGameControl* gameControl, uint8_t currentFrameIndex, const MageEntityTypeAnimation::Direction* animationDirection);
};

//this is the structure of a MageEntity. All hackable info is contained within.
//the complete current entity state can be determined with only this info and
//the MageGame class interpreting the ROM data.
class MageEntity
{
public:
   MageEntity() noexcept = default;
   MageEntity(std::shared_ptr<EngineROM> ROM, uint32_t& address);

   void SetLocation(const Point& p) { location = p; }

   char name[MAGE_ENTITY_NAME_LENGTH]{ 0 }; // bob's club
   // put the sheep back in the pen, rake in the lake
   Point location{ 0 };
   uint16_t onInteractScriptId{ 0 };
   uint16_t onTickScriptId{ 0 };
   uint16_t primaryId{ 0 };
   uint16_t secondaryId{ 0 };
   MageEntityPrimaryIdType primaryIdType{ 0 };
   uint8_t currentAnimation{ 0 };
   uint8_t currentFrameIndex{ 0 };
   MageEntityAnimationDirection direction{ 0 };
   uint8_t hackableStateA{ 0 };
   uint8_t hackableStateB{ 0 };
   uint8_t hackableStateC{ 0 };
   uint8_t hackableStateD{ 0 };


   void updateRenderableData(MageGameControl* gameControl);
   RenderableData* getRenderableData() { return &renderableData; }
   const RenderableData* getRenderableData() const { return &renderableData; }
   const MageGeometry* getGeometry()
   {
      return nullptr;
   }
private:
   RenderableData renderableData{ };
};

class MageEntityType
{
public:
   MageEntityType() = default;
   MageEntityType(std::shared_ptr<EngineROM> ROM, uint32_t& address);

   uint8_t PortraitId() const { return portraitId; }
   uint8_t AnimationCount() const { return entityTypeAnimations.size(); }

   const MageEntityTypeAnimation* EntityTypeAnimation(uint32_t index) const
   {
      return entityTypeAnimations[index % entityTypeAnimations.size()];
   }

private:
#ifndef DC801_EMBEDDED
   char name[32]{0};
#endif
   uint8_t portraitId{ 0 };
   std::vector<const MageEntityTypeAnimation*> entityTypeAnimations{ };
};

class EntityManager
{
public:
   const MageEntity* getEntity(uint16_t id) const;
private:
};

#endif //_MAGE_ENTITY_TYPE_H