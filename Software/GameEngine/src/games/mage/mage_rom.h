#ifndef MAGE_ROM_H_
#define MAGE_ROM_H_

#include "Header.h"
#include "EngineROM.h"

//this is the path to the game.dat file on the SD card.
//if an SD card is inserted with game.dat in this location
//and its header hash is different from the one in the ROM chip
//it will automatically be loaded.
#define MAGE_GAME_DAT_PATH "MAGE/game.dat"

static const inline auto MAGE_SAVE_FLAG_COUNT= 2048;
static const inline auto MAGE_SAVE_FLAG_BYTE_COUNT= (MAGE_SAVE_FLAG_COUNT / 8);
static const inline auto MAGE_SCRIPT_VARIABLE_COUNT= 256;
static const inline auto MAGE_ENTITY_NAME_LENGTH = 12;
static const inline auto MAGE_NUM_MEM_BUTTONS = 4;
static const inline auto DEFAULT_MAP = 0;
static const inline auto MAGE_NO_WARP_STATE = ((uint16_t)-1);

#define DESKTOP_SAVE_FILE_PATH "MAGE/save_games/"
static const char* saveFileSlotNames[ENGINE_ROM_SAVE_GAME_SLOTS] = {
   DESKTOP_SAVE_FILE_PATH "save_0.dat",
   DESKTOP_SAVE_FILE_PATH "save_1.dat",
   DESKTOP_SAVE_FILE_PATH "save_2.dat"
};

enum struct MageEntityFieldOffset: uint8_t
{
   x = 12,
   y = 14,
   onInteractScriptId = 16,
   onTickScriptId = 18,
   primaryId = 20,
   secondaryId = 22,
   primaryIdType = 24,
   currentAnimation = 25,
   currentFrame = 26,
   direction = 27,
   hackableStateA = 28,
   hackableStateB = 29,
   hackableStateC = 30,
   hackableStateD = 31
};

struct MageSaveGame
{
   MageSaveGame() noexcept = default;
   MageSaveGame(const MageSaveGame&) noexcept = default;
   MageSaveGame& operator=(const MageSaveGame&) = default;
   
   char identifier[8]{ 'M', 'A', 'G', 'E', 'S', 'A', 'V', 'E' };
   uint32_t engineVersion{ ENGINE_VERSION };
   uint32_t scenarioDataCRC32{ 0 };
   uint32_t saveDataLength{ sizeof(MageSaveGame) };
   char name[MAGE_ENTITY_NAME_LENGTH]{ "Bub" };
   //this stores the byte offsets for the hex memory buttons:
   std::array<uint8_t, MAGE_NUM_MEM_BUTTONS> memOffsets{
      (uint8_t)MageEntityFieldOffset::x,
         (uint8_t)MageEntityFieldOffset::y,
         (uint8_t)MageEntityFieldOffset::primaryId, // entityType
         (uint8_t)MageEntityFieldOffset::direction,
   };
   uint16_t currentMapId{ DEFAULT_MAP };
   uint16_t warpState{ MAGE_NO_WARP_STATE };
   uint8_t paddingA{ 0 };
   uint8_t paddingB{ 0 };
   uint8_t paddingC{ 0 };
   uint8_t saveFlags[MAGE_SAVE_FLAG_BYTE_COUNT]{ 0 };
   uint16_t scriptVariables[MAGE_SCRIPT_VARIABLE_COUNT]{ 0 };
};




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

template<typename Tag>
struct TaggedType
{};

using MageStringValue = TaggedType<struct stringTag>;
using MageVariableValue = TaggedType<struct variableTag>;
using MagePixels = uint8_t;

typedef EngineROM<MageSaveGame,
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
   