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
   MageTileset() noexcept = default;
   MageTileset(uint32_t& offset)
   {
#ifndef DC801_EMBEDDED
      ROM()->Read(name, offset, TILESET_NAME_SIZE);
#else
      offset += TILESET_NAME_SIZE;
#endif

      ROM()->Read(imageId, offset);
      ROM()->Read(imageWidth, offset);
      ROM()->Read(imageHeight, offset);
      ROM()->Read(tileWidth, offset);
      ROM()->Read(tileHeight, offset);
      ROM()->Read(cols, offset);
      ROM()->Read(rows, offset);
      offset += sizeof(uint16_t); // u2 padding before the geometry IDs
      ROM()->SetReadPointerToOffset(globalGeometryIds, offset);

      if (!Valid())
      {
         ENGINE_PANIC("Invalid Tileset detected!\n	Tileset address is: %d", offset);
      }
   }

   constexpr uint16_t ImageId() const { return imageId; }
   constexpr uint16_t ImageWidth() const { return imageWidth; }
   constexpr uint16_t ImageHeight() const { return imageHeight; }
   constexpr uint16_t TileWidth() const { return tileWidth; }
   constexpr uint16_t TileHeight() const { return tileHeight; }
   constexpr uint16_t Cols() const { return cols; }
   constexpr uint16_t Rows() const { return rows; }
   constexpr uint16_t Tiles() const { return rows * cols; }

   constexpr bool Valid() const
   {
      return imageWidth >= 1
         && imageHeight >= 1
         && tileWidth >= 1
         && tileHeight >= 1
         && cols >= 1
         && rows >= 1;
   }

   uint16_t getLocalGeometryIdByTileIndex(uint16_t tileIndex) const
   {
      if (tileIndex >= cols * rows)
      {
         return globalGeometryIds[0];
      }
      return globalGeometryIds[tileIndex];
   }

private:

#ifndef DC801_EMBEDDED
   char name[TILESET_NAME_SIZE]{ 0 };
#endif
   uint16_t imageId{ 0 };
   uint16_t imageWidth{ 0 };
   uint16_t imageHeight{ 0 };
   uint16_t tileWidth{ 0 };
   uint16_t tileHeight{ 0 };
   uint16_t cols{ 0 };
   uint16_t rows{ 0 };
   const uint16_t* globalGeometryIds{ nullptr };
}; //class MageTileset

struct AnimationDirection
{
   bool FlipX() const { return renderFlags & FLIPPED_HORIZONTALLY_FLAG; }
   bool FlipY() const { return renderFlags & FLIPPED_VERTICALLY_FLAG; }
   bool FlipDiag() const { return renderFlags & FLIPPED_DIAGONALLY_FLAG; }

   uint16_t typeId{ 0 };
   uint8_t type{ 0 };
   uint8_t renderFlags{ 0 };
};

class MagePortrait
{
public:

   MagePortrait() noexcept = default;
   MagePortrait(uint32_t& address);

   const AnimationDirection* getEmoteById(uint8_t emoteId) const
   {
      return &emotes[emoteId % emotes.size()];
   }
private:
   std::vector<AnimationDirection> emotes{};
};


class TileManager
{
   friend class MageCommandControl;
public:
   TileManager(std::shared_ptr<FrameBuffer> frameBuffer) noexcept
      : frameBuffer(frameBuffer)
   {}

   void DrawTile(const RenderableData* const renderableData, uint16_t x, uint16_t y) const;

   void DrawTile(const MageTileset* const tile, uint16_t tileId, uint16_t x, uint16_t y, uint8_t flags = 0) const;

private:
   std::vector<MageColorPalette> colorPalettes;
   std::shared_ptr<FrameBuffer> frameBuffer;
};

#endif //_MAGE_TILESET_H
