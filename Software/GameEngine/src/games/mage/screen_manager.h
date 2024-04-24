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
//
//
//
//class FrameBuffer
//{
//   friend class MageCommandControl;
//public:
//   FrameBuffer(std::shared_ptr<EngineInput> inputManager, std::shared_ptr<FrameBuffer> frameBuffer, const MageCamera* camera) noexcept
//      : inputManager(inputManager), frameBuffer(frameBuffer), camera(camera)
//   {}
//
//   inline void DrawFilledRect(int x, int y, int w, int h, uint16_t color) const
//   {
//      frameBuffer->DrawFilledRect(x, y, w, h, color);
//   }
//

//
//   void DrawText(const std::string_view& text, uint16_t color, int x, int y) const;
//
//   const MageCamera* camera;
//
//
//private:
//
//   void drawTile(uint16_t tilesetId, uint16_t tileId, int32_t tileDrawX, int32_t tileDrawY, uint8_t flags) const;
//
//   std::shared_ptr<EngineInput> inputManager;
//   std::shared_ptr<FrameBuffer> frameBuffer;
//};

#endif //_MAGE_TILESET_H
