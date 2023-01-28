#ifndef MAGE_ROM_H_
#define MAGE_ROM_H_

#include "Header.h"
#include "EngineROM.h"

class MapData;
class MageTileset;
class MageAnimation;
class MageEntityType;
class MageEntity;
class MageGeometry;
class MageScript;
class MagePortrait;
class MageDialog;
class MageSerialDialog;
class MageColorPalette;
struct MageSaveGame;

template<typename Tag>
struct TaggedType
{};

using MageStringValue = TaggedType<struct stringTag>;
using MageVariableValue = TaggedType<struct variableTag>;
using MagePixels = uint8_t;

typedef EngineROM<
   MapData,
   MageTileset,
   MageAnimation,
   MageEntityType,
   MageEntity,
   MageGeometry,
   MageScript,
   MagePortrait,
   MageDialog,
   MageSerialDialog,
   MageColorPalette,
   MageStringValue,
   MageSaveGame,
   MageVariableValue,
   MagePixels> MageROM;


std::unique_ptr<MageROM>& ROM();

#endif
