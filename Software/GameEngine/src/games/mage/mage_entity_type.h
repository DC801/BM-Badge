/*
This class contains the MageEntity class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_ENTITY_TYPE_H
#define _MAGE_ENTITY_TYPE_H

#include "mage_defines.h"
#include "mage_header.h"
#include "EngineROM.h"
#include <vector>
#include <memory>

#define FLIPPED_DIAGONALLY_FLAG   0x01
#define FLIPPED_VERTICALLY_FLAG   0x02
#define FLIPPED_HORIZONTALLY_FLAG 0x04
class MageGameControl;

class MageEntityTypeAnimation
{
public:
   class Direction
   {
   public:
      Direction() = default;
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
   MageEntityTypeAnimation(std::shared_ptr<EngineROM> ROM, uint32_t& address)
      : north{ ROM, address },
      east{ ROM, address },
      south{ ROM, address },
      west{ ROM, address }
   {}

   constexpr const Direction& North() const { return north; }
   constexpr const Direction& East() const { return east; }
   constexpr const Direction& South() const { return south; }
   constexpr const Direction& West() const { return west; }
private:
   Direction north{};
   Direction east{};
   Direction south{};
   Direction west{};
};

class MageEntityType
{
public:
   MageEntityType() = default;
   MageEntityType(std::shared_ptr<EngineROM> ROM, uint32_t& address);

   uint8_t PortraitId() const { return portraitId; }
   uint8_t AnimationCount() const { return entityTypeAnimations.size(); }

   MageEntityTypeAnimation EntityTypeAnimation(uint32_t index) const
   {
      return entityTypeAnimations[index % entityTypeAnimations.size()];
   }

private:
   uint8_t portraitId{ 0 };
   std::vector<MageEntityTypeAnimation> entityTypeAnimations{ };
};


//this is the structure of a MageEntity. All hackable info is contained within.
//the complete current entity state can be determined with only this info and
//the MageGame class interpreting the ROM data.
class MageEntity
{
public:
   MageEntity() noexcept = default;
   MageEntity(std::shared_ptr<EngineROM> ROM, uint32_t& address);
   char name[MAGE_ENTITY_NAME_LENGTH]{ 0 }; // bob's club
   uint16_t x{ 0 }; // put the sheep back in the pen, rake in the lake
   uint16_t y{ 0 };
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

   //this is info needed to render entities that can be determined
   //at run time from the MageEntity class info.
   struct RenderableData
   {
      Rect hitBox{0};
      Rect interactBox{0};
      Point center{0};
      uint16_t currentFrameTicks{0};
      uint16_t tilesetId{0};
      uint16_t lastTilesetId{0};
      uint16_t tileId{0};
      uint32_t duration{0};
      uint16_t frameCount{0};
      uint8_t renderFlags{0};
      bool isInteracting{0};

      //this calculates the relevant info to be able to draw an entity based on the
      //current state of the data in MageGameControl and stores the info in entityRenderableData
      void getRenderableState(MageGameControl* gameControl, const MageEntity* entity, const MageEntityTypeAnimation::Direction* animationDirection);
      void updateRenderableBoxes(const MageEntity* entity, const MageTileset* tileset);
   };
   void updateRenderableData(MageGameControl* gameControl);
   RenderableData* getRenderableData() { return &renderableData; }
   //const RenderableData* getRenderableData() const { return &renderableData; }
private:
   RenderableData renderableData{0};
};

class MageEntityControl
{
public:
   MageEntityControl(
      MageHeader tilesetHeader,
      MageHeader animationHeader,
      MageHeader entityTypeHeader,
      MageHeader entityHeader, 
      MageHeader geometryHeader, 
      MageHeader imageHeader, 
      MageHeader colorPaletteHeader) noexcept;
};

#endif //_MAGE_ENTITY_TYPE_H