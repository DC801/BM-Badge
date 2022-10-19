/*
This class contains the MageTileset class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_TILESET_H
#define _MAGE_TILESET_H

#include "EngineROM.h"
#include "FrameBuffer.h"
#include "mage_color_palette.h"
#include "mage_header.h"
#include "mage_entity_type.h"
#include <memory>
#include <vector>

#define TILESET_NAME_SIZE 16

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

class TileManager
{
   friend class MageCommandControl;
public:
   TileManager(std::shared_ptr<FrameBuffer> frameBuffer, std::shared_ptr<EngineROM> ROM, const MageHeader& tilesetHeader, const MageHeader& colorPaletteHeader, const MageHeader& imageHeader);

   
   const MageColorPalette* getColorPalette(uint16_t colorPaletteId) const
   {
      return &colorPalettes[colorPaletteId % colorPalettes.size()];
   }

   //this will return a specific MageTileset object by index.
   std::unique_ptr<const MageTileset> GetTileset(uint16_t index) const
   {
      auto tilesetOffset = tilesetHeader.offset(index);
      return std::make_unique<MageTileset>(ROM, tilesetOffset);
   }

   constexpr uint32_t getTilesetCount() const
   {
      return tilesetHeader.count();
   }

   inline void DrawTile(const MageTileset* tileset, uint16_t tileId, int32_t x, int32_t y, std::optional<uint8_t> flags = std::nullopt) const
   {
      auto tileAddress = imageHeader.offset(tileset->ImageId()) + tileId * sizeof(MageMapTile);
      const MageMapTile* tile;
      ROM->GetPointerTo(tile, tileAddress);
      DrawTile(tileset, tile, x, y, flags.value_or(tile->flags));
   }

   inline void DrawTile(const RenderableData* renderableData, int32_t x, int32_t y) const
   {
      const auto tileset = GetTileset(renderableData->tilesetId);
      auto tileAddress = imageHeader.offset(tileset->ImageId()) + renderableData->tileId * sizeof(MageMapTile);
      const MageMapTile* tile;
      ROM->GetPointerTo(tile, tileAddress);
      DrawTile(tileset.get(), tile, x, y, renderableData->renderFlags);
   }
   inline void DrawTile(const MageMapTile* tile, int32_t x, int32_t y) const
   {
      DrawTile(GetTileset(tile->tilesetId).get(), tile->tileId, x, y, tile->flags);
   }

   inline void DrawTile(uint8_t tilesetId, const MageMapTile* tile, int32_t x, int32_t y, std::optional<uint8_t> flags = std::nullopt) const
   {
      const auto tileset = GetTileset(tilesetId);
      DrawTile(tileset.get(), tile, x, y, flags.value_or(tile->flags));
   }
   void DrawTile(const MageTileset* tileset, const MageMapTile* tile, int32_t x, int32_t y, uint8_t flags) const;

private:
   std::shared_ptr<EngineROM> ROM;
   std::vector<MageColorPalette> colorPalettes;
   std::shared_ptr<FrameBuffer> frameBuffer;

   MageHeader tilesetHeader;
   MageHeader colorPaletteHeader;
   MageHeader imageHeader;
};

#endif //_MAGE_TILESET_H
