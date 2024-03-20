#ifndef MAGE_DIALOG_CONTROL_H
#define MAGE_DIALOG_CONTROL_H


#include <array>
#include <optional>
#include <string_view>

#include "engine/EnginePanic.h"
#include "fonts/Monaco9.h"
#include "shim_timer.h"
#include "mage_defines.h"
#include "mage_entity.h"
#include "mage_rom.h"
#include "StringLoader.h"

class MapControl;
class StringLoader;
class ScreenManager;

static inline const auto DIALOG_SCREEN_NO_PORTRAIT = 255;

static inline const auto DIALOG_TILES_TOP_LEFT = 0;
static inline const auto DIALOG_TILES_TOP_REPEAT = 1;
static inline const auto DIALOG_TILES_TOP_RIGHT = 2;
static inline const auto DIALOG_TILES_LEFT_REPEAT = 4;
static inline const auto DIALOG_TILES_CENTER_REPEAT = 5;
static inline const auto DIALOG_TILES_RIGHT_REPEAT = 6;
static inline const auto DIALOG_TILES_BOTTOM_LEFT = 8;
static inline const auto DIALOG_TILES_BOTTOM_REPEAT = 9;
static inline const auto DIALOG_TILES_BOTTOM_RIGHT = 10;

static inline const auto DIALOG_TILES_SCROLL_END = 3;
static inline const auto DIALOG_TILES_SCROLL_REPEAT = 7;
static inline const auto DIALOG_TILES_SCROLL_POSITION = 11;

static inline const auto DIALOG_TILES_CHECKBOX = 12;
static inline const auto DIALOG_TILES_CHECK = 13;
static inline const auto DIALOG_TILES_HIGHLIGHT = 14;
static inline const auto DIALOG_TILES_ARROW = 15;

enum class MageDialogScreenAlignment : uint8_t
{
   BOTTOM_LEFT = 0,
   BOTTOM_RIGHT = 1,
   TOP_LEFT = 2,
   TOP_RIGHT = 3
};
const inline uint8_t ALIGNMENT_COUNT = 4;

enum class MageDialogResponseType : uint8_t
{
   NO_RESPONSE = 0,
   SELECT_FROM_SHORT_LIST = 1,
   SELECT_FROM_LONG_LIST = 2,
   ENTER_NUMBER = 3,
   ENTER_ALPHANUMERIC = 4,
};

struct MageDialogResponse
{
   uint16_t stringIndex;
   uint16_t scriptIndex;
};

struct MageDialogAlignmentCoords
{
   EntityRect text;
   EntityRect label;
   EntityRect portrait;
};

struct MageDialogScreen
{
   // TODO: portraits, after we have some graphics for them
   const uint16_t nameStringIndex{ 0 };
   const uint16_t borderTilesetIndex{ 0 };
   const MageDialogScreenAlignment alignment{ 0 };
   const uint8_t fontIndex{ 0 };
   const uint8_t messageCount{ 0 };
   const MageDialogResponseType responseType{ 0 };
   const uint8_t responseCount{ 0 };
   const uint8_t entityIndex{ 0 };
   const uint8_t portraitIndex{ 0 };
   const uint8_t emoteIndex{ 0 };

   const std::string GetMessage(const std::shared_ptr<StringLoader>& stringLoader, uint8_t messageId, const std::string& triggeringEntityName) const
   {
      if (messageCount == 0) { return ""; }

      auto messages = (const uint16_t*)(&emoteIndex + sizeof(emoteIndex));
      return stringLoader->getString(messages[messageId % messageCount], triggeringEntityName);;
   }

   const MageDialogResponse& GetResponse(uint8_t responseId) const
   {
      auto responses = (const MageDialogResponse*)(&emoteIndex + sizeof(emoteIndex) + messageCount * sizeof(uint16_t));
      return responses[responseId % responseCount];
   }
};


struct MageDialog
{
   const char Name[32];
   const uint32_t ScreenCount;
   const MageDialogScreen& GetScreen(uint32_t screenId) const
   {
      const auto screenOffset = (const MageDialogScreen*)((uint8_t*)&ScreenCount + sizeof(ScreenCount));
      auto screenSpan = std::span<const MageDialogScreen>(screenOffset, ScreenCount);
      return screenSpan[screenId % ScreenCount];
   }
};


class MageDialogControl
{
public:
   MageDialogControl(
      std::shared_ptr<EngineInput> inputHandler,
      std::shared_ptr<ScreenManager> screenManager,
      std::shared_ptr<StringLoader> stringLoader,
      std::shared_ptr<MapControl> mapControl) noexcept
      : inputHandler(inputHandler),
      screenManager(screenManager),
      stringLoader(stringLoader),
      mapControl(mapControl)
   {}

   void StartModalDialog(std::string messageString);

   void load(uint16_t dialogId, std::string name);
   void loadCurrentScreenPortrait();
   void loadNextScreen();

   constexpr void close() { open = false; }
   constexpr bool isOpen() const { return open; }

   std::optional<uint16_t> Update();
   void Draw() const;

private:
   std::shared_ptr<EngineInput> inputHandler;
   std::shared_ptr<ScreenManager> screenManager;
   std::shared_ptr<StringLoader> stringLoader;
   std::shared_ptr<MapControl> mapControl;
   bool open{ false };

   void drawBackground(const EntityRect& box) const;

   inline bool shouldShowResponses(const MageDialogScreen& currentScreen) const
   {
      // last page of messages on this screen and we have responses
      return currentMessageIndex == (currentScreen.messageCount - 1)
         && (currentScreen.responseType == MageDialogResponseType::SELECT_FROM_SHORT_LIST
            || currentScreen.responseType == MageDialogResponseType::SELECT_FROM_LONG_LIST);
   }

   std::string triggeringEntityName{};
   uint32_t currentScreenIndex{ 0 };
   uint32_t currentMessageIndex{ 0 };
   uint16_t currentFrameTilesetIndex{ 0 };
   uint32_t cursorPhase{ 0 };
   uint8_t currentResponseIndex{ 0 };
   uint8_t currentPortraitId{ DIALOG_SCREEN_NO_PORTRAIT };
   RenderableData currentPortraitRenderableData{};

   const MageDialog* currentDialog{ nullptr };
   std::string currentEntityName{};
   std::string currentMessage{};
   std::vector<MageDialogResponse> responses{};
};

enum MageSerialDialogResponseTypes : uint8_t
{
   RESPONSE_NONE = 0,
   RESPONSE_ENTER_NUMBER = 1,
   RESPONSE_ENTER_STRING = 2,
   NUM_RESPONSE_TYPES
};

class MageSerialDialog
{
public:
   ~MageSerialDialog() noexcept = default;
   MageSerialDialog(uint32_t& offset)
   {
      ROM()->Read(name, offset, 32);
      ROM()->Read(stringId, offset);
      ROM()->Read(serialResponseType, offset);

      auto responseCount = uint8_t{ 0 };
      ROM()->Read(responseCount, offset);
      Responses = ROM()->GetViewOf<MageDialogResponse>(offset, responseCount);
   }
   char name[32]{ 0 };
   uint16_t stringId{ 0 };
   MageSerialDialogResponseTypes serialResponseType{ 0 };
   std::span<const MageDialogResponse> Responses;
};


#endif //MAGE_DIALOG_CONTROL_H
