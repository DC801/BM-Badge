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
class MageScriptState;
class MagePortrait;
class MageDialog;
class MageSerialDialog;
class MageColorPalette;
struct MageSaveGame;

template<typename Tag>
struct StringValue
{
   std::string value;
};

using MageStringValue = StringValue<struct stringTag>;
using MageVariableValue = StringValue<struct variableTag>;
using MagePixels = const uint8_t*;

typedef EngineROM<
MapData,MageTileset,MageAnimation,MageEntityType,MageEntity,MageGeometry,MageScriptState,MagePortrait,MageDialog,MageSerialDialog,MageColorPalette,MageStringValue,MageSaveGame,MageVariableValue,MagePixels   > MageROM;


std::unique_ptr<MageROM>& ROM();

#endif
