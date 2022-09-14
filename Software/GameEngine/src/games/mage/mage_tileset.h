/*
This class contains the MageTileset class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_TILESET_H
#define _MAGE_TILESET_H

#include "EngineROM.h"
#include <memory>

#define TILESET_NAME_SIZE 16

class EngineROM;

class MageTileset
{
public:
   MageTileset() noexcept = default;
   MageTileset(std::shared_ptr<EngineROM> ROM, uint8_t index, uint32_t address);

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

   uint16_t getLocalGeometryIdByTileIndex(uint16_t tileIndex) const;

private:
   std::shared_ptr<EngineROM> ROM;
#ifndef DC801_EMBEDDED
   char name[TILESET_NAME_SIZE + 1]{ 0 };
#endif
   uint32_t offset{ 0 };
   uint16_t imageId{ 0 };
   uint16_t imageWidth{ 0 };
   uint16_t imageHeight{ 0 };
   uint16_t tileWidth{ 0 };
   uint16_t tileHeight{ 0 };
   uint16_t cols{ 0 };
   uint16_t rows{ 0 };

}; //class MageTileset

#endif //_MAGE_TILESET_H
