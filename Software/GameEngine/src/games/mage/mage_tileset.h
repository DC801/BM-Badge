/*
This class contains the MageTileset class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_TILESET_H
#define _MAGE_TILESET_H

#include "mage_rom.h"
#include "FrameBuffer.h"
#include "mage_animation.h"
#include "mage_color_palette.h"
#include "mage_geometry.h"
#include <memory>
#include <vector>

constexpr auto TilesetNameLength = 16;

//this is info needed to render entities that can be determined
//at run time from the MageEntity class info.
struct RenderableData
{
   EntityPoint origin{ 0 };
   EntityRect hitBox{ 0 };
   uint16_t currentFrameTicks{ 0 };
   uint16_t tilesetId{ 0 };
   uint16_t lastTilesetId{ 0 };
   uint16_t tileId{ 0 };
   uint32_t duration{ 0 };
   uint16_t frameCount{ 0 };
   uint8_t currentAnimation{ 0 };
   uint8_t currentFrameIndex{ 0 };
   uint8_t renderFlags{ 0 };
   bool isInteracting{ 0 };

   constexpr EntityPoint center() const
   {
      return EntityPoint{ uint16_t(origin.x + hitBox.w / 2), uint16_t(origin.y + hitBox.h / 2) };
   }
};

class MageTileset
{
public:
   constexpr uint16_t TileCount() const { return Rows * Cols; }

   constexpr bool Valid() const
   {
      return   ImageWidth >= 1
         && ImageHeight >= 1
         && TileWidth >= 1
         && TileHeight >= 1
         && Cols >= 1
         && Rows >= 1;
   }

   const MageGeometry* GetGeometryForTile(uint16_t tileIndex) const
   {
      auto geometriesPtr = (uint16_t*)((uint8_t*)&Rows + sizeof(uint16_t));
      
      if (tileIndex >= Cols * Rows || !geometriesPtr[tileIndex]) { return nullptr; }
      auto geometryIndex = geometriesPtr[tileIndex];
      
      return ROM()->GetReadPointerByIndex<MageGeometry>(geometryIndex - 1);
   }

   char     Name[TilesetNameLength]{ 0 };
   uint16_t ImageId{ 0 };
   uint16_t ImageWidth{ 0 };
   uint16_t ImageHeight{ 0 };
   uint16_t TileWidth{ 0 };
   uint16_t TileHeight{ 0 };
   uint16_t Cols{ 0 };
   uint16_t Rows{ 0 };
};

struct AnimationDirection
{
   uint16_t typeId{ 0 };
   uint8_t type{ 0 };
   uint8_t renderFlags{ 0 };
};

struct MagePortrait
{
   char portrait[32];
   char padding[3]{ 0 };
   uint8_t emoteCount{ 0 };

   const AnimationDirection* getEmoteById(uint8_t emoteId) const
   {
      auto animationPtr = (const AnimationDirection*)((uint8_t*)&emoteCount + sizeof(uint8_t));
      return &animationPtr[emoteId % emoteCount];
   }
};


class TileManager
{
   friend class MageCommandControl;
public:
   TileManager(std::shared_ptr<FrameBuffer> frameBuffer) noexcept
      : frameBuffer(frameBuffer)
   {}

   void DrawTile(uint16_t tilesetId, uint16_t tileId, const EntityPoint& tileDrawPoint, uint8_t flags = 0) const;

   inline void ToggleDrawGeometry() { drawGeometry = !drawGeometry; }

private:
   std::shared_ptr<FrameBuffer> frameBuffer;
   bool drawGeometry{ false };
};

#endif //_MAGE_TILESET_H
