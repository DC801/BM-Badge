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
#include "mage_camera.h"
#include "mage_color_palette.h"
#include "mage_geometry.h"
#include <memory>
#include <vector>

constexpr auto TilesetNameLength = 16;

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


class ScreenManager
{
   friend class MageCommandControl;
public:
   ScreenManager(std::shared_ptr<EngineInput> inputManager, std::shared_ptr<FrameBuffer> frameBuffer, const MageCamera* camera) noexcept
      : inputManager(inputManager), frameBuffer(frameBuffer), camera(camera)
   {}

   inline void DrawFilledRect(int x, int y, int w, int h, uint16_t color) const
   {
      frameBuffer->fillRect(x, y, w, h, color);
   }

   inline void DrawTileWorldCoords(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags = 0) const
   {
      drawTile(tilesetId, tileId, tileDrawX - camera->positionX, tileDrawY - camera->positionY, flags);
   }

   inline void DrawTileScreenCoords(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags = 0) const
   {
      drawTile(tilesetId, tileId, tileDrawX, tileDrawY, flags);
   }

   void DrawText(const std::string_view& text, uint16_t color, int x, int y) const;

   const MageCamera* camera;

   inline void ToggleDrawGeometry() { drawGeometry = !drawGeometry; }

private:
   bool drawGeometry{ false };

   void drawTile(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags) const;

   std::shared_ptr<EngineInput> inputManager;
   std::shared_ptr<FrameBuffer> frameBuffer;
};

#endif //_MAGE_TILESET_H
