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

typedef std::string MageStringValue;
typedef std::string MageVariableValue;
typedef uint8_t* MagePixels;

typedef EngineROM<
      MapData,
      MageTileset,
      MageAnimation,
      MageEntityType,
      MageEntity,
      MageGeometry,
      MageScriptState,
      MagePortrait,
      MageDialog,
      MageSerialDialog,
      MageColorPalette,
      MageStringValue,
      MageSaveGame,
      MageVariableValue,
      MagePixels
   > MageROM;

static std::unique_ptr<MageROM> ROM{};

#endif
