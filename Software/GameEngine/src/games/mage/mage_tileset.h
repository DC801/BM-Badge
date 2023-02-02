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
#include <memory>
#include <vector>

#define FLIPPED_DIAGONALLY_FLAG   0x01
#define FLIPPED_VERTICALLY_FLAG   0x02
#define FLIPPED_HORIZONTALLY_FLAG 0x04

#define TILESET_NAME_SIZE 16

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

   uint16_t getLocalGeometryIdByTileIndex(uint16_t tileIndex) const
   {
      auto geometriesPtr = (uint8_t*)&Rows + sizeof(uint16_t);
      if (tileIndex >= Cols * Rows)
      {
         return geometriesPtr[0];
      }
      return geometriesPtr[tileIndex];
   }

   char     Name[TILESET_NAME_SIZE]{ 0 };
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
   uint8_t FlipX() const { return renderFlags ^ FLIPPED_HORIZONTALLY_FLAG; }
   uint8_t FlipY() const { return renderFlags ^ FLIPPED_VERTICALLY_FLAG; }
   uint8_t FlipDiag() const { return renderFlags ^ FLIPPED_DIAGONALLY_FLAG; }

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

   void DrawTile(uint16_t tilesetId, uint16_t tileId, const Point& tileDrawPoint, uint8_t flags = 0) const
   {
      auto tileset = ROM()->GetReadPointerByIndex<MageTileset>(tilesetId);
      auto pixels = ROM()->GetReadPointerByIndex<MagePixels>(tilesetId);
      auto colorPalette = ROM()->GetReadPointerByIndex<MageColorPalette>(tilesetId);

      pixels += tileId *tileset->TileWidth* tileset->TileHeight;
      
      frameBuffer->drawChunkWithFlags(
         pixels,
         colorPalette,
         Rect{
            Point{ tileDrawPoint.x, tileDrawPoint.y },
            tileset->TileWidth,
            tileset->TileHeight
         },
         tileset->ImageWidth,
         flags);
   }

private:
   std::shared_ptr<FrameBuffer> frameBuffer;
};

#endif //_MAGE_TILESET_H
