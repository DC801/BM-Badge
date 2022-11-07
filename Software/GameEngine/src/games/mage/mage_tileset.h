/*
This class contains the MageTileset class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_TILESET_H
#define _MAGE_TILESET_H

#include "EngineROM.h"
#include "FrameBuffer.h"
#include "mage_animation.h"
#include "mage_color_palette.h"
#include "mage_header.h"
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

struct MageMapTile
{
   uint16_t tileId{ 0 };
   uint8_t tilesetId{ 0 };
   uint8_t flags{ 0 };
};

class MageTileset
{
public:
   MageTileset() noexcept = default;
   MageTileset(std::shared_ptr<EngineROM> ROM, uint32_t& offset);

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
   MageTileset* getValidTileset(uint16_t tilesetId);

   uint16_t getLocalGeometryIdByTileIndex(uint16_t tileIndex) const
   {
      if (tileIndex >= cols * rows)
      {
         return globalGeometryIds[0];
      }
      return globalGeometryIds[tileIndex];
   }

private:
   std::shared_ptr<EngineROM> ROM;

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

class AnimationDirection
{
public:
   AnimationDirection() noexcept = default;
   AnimationDirection(std::shared_ptr<EngineROM> ROM, uint32_t& offset);

   uint16_t TypeId() const { return typeId; }
   uint8_t Type() const { return type; }
   uint8_t RenderFlags() const { return renderFlags; }
   bool FlipX() const { return renderFlags & FLIPPED_HORIZONTALLY_FLAG; }
   bool FlipY() const { return renderFlags & FLIPPED_VERTICALLY_FLAG; }
   bool FlipDiag() const { return renderFlags & FLIPPED_DIAGONALLY_FLAG; }

private:
   uint16_t typeId{ 0 };
   uint8_t type{ 0 };
   uint8_t renderFlags{ 0 };
};

class MagePortrait
{
public:

   MagePortrait() noexcept = default;
   MagePortrait(std::shared_ptr<EngineROM> ROM, uint32_t& address);

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
   TileManager(std::shared_ptr<FrameBuffer> frameBuffer, std::shared_ptr<EngineROM> ROM, const MageHeader& tilesetHeader, const MageHeader& animationHeader,
      const MageHeader& colorPaletteHeader, const MageHeader& imageHeader, const MageHeader& portraitHeader) noexcept
      : frameBuffer(frameBuffer), ROM(ROM), tilesetHeader(tilesetHeader), animationHeader(animationHeader), 
      colorPaletteHeader(colorPaletteHeader), imageHeader(imageHeader), portraitHeader(portraitHeader)
   {
      /*for (uint32_t i = 0; i < colorPaletteHeader.count(); i++)
      {
         auto colorPaletteOffset = colorPaletteHeader.offset(i);
         colorPalettes.push_back(MageColorPalette{ ROM, colorPaletteOffset });
      }*/
   }
   const MagePortrait* GetPortrait(uint16_t index) const
   {
      auto portraitOffset = portraitHeader.offset(index);
      const MagePortrait* portrait;
      ROM->GetPointerTo(portrait, portraitOffset);
      return portrait;
   }

   const MageAnimation* GetAnimation(uint16_t index) const
   {
      auto animationOffset = animationHeader.offset(index % animationHeader.count());
      const MageAnimation* animation;
      ROM->GetPointerTo(animation, animationOffset);
      return animation;
   }

   //this will return a specific MageTileset object by index.
   const MageTileset* GetTileset(uint16_t index) const
   {
      auto tilesetOffset = tilesetHeader.offset(index);
      const MageTileset* tileset;
      ROM->GetPointerTo(tileset, tilesetOffset);
      return tileset;
   }

   auto GetTilesetCount() const
   {
      return tilesetHeader.count();
   }
   auto GetAnimationCount() const
   {
      return animationHeader.count();
   }

   inline void DrawTile(const MageTileset* tileset, uint16_t tileId, int32_t x, int32_t y, std::optional<uint8_t> flags = std::nullopt) const
   {
      auto tileAddress = imageHeader.offset(tileset->ImageId()) + tileId * sizeof(MageMapTile);
      const MageMapTile* tile;
      ROM->GetPointerTo(tile, tileAddress);
      DrawTile(tileset, tile, x, y, flags.value_or(tile->flags));
   }

   void DrawTile(const RenderableData* renderableData, int32_t x, int32_t y) const;
   inline void DrawTile(const MageMapTile* tile, int32_t x, int32_t y) const
   {
      DrawTile(GetTileset(tile->tilesetId), tile->tileId, x, y, tile->flags);
   }

   inline void DrawTile(uint8_t tilesetId, const MageMapTile* tile, int32_t x, int32_t y, std::optional<uint8_t> flags = std::nullopt) const
   {
      const auto tileset = GetTileset(tilesetId);
      DrawTile(tileset, tile, x, y, flags.value_or(tile->flags));
   }
   void DrawTile(const MageTileset* tileset, const MageMapTile* tile, int32_t x, int32_t y, uint8_t flags) const;

private:
   std::shared_ptr<EngineROM> ROM;
   std::vector<MageColorPalette> colorPalettes;
   std::shared_ptr<FrameBuffer> frameBuffer;

   const MageHeader tilesetHeader;
   const MageHeader animationHeader;
   const MageHeader colorPaletteHeader;
   const MageHeader imageHeader;
   const MageHeader portraitHeader;
};

#endif //_MAGE_TILESET_H
