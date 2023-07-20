#ifndef MAGE_DIALOG_CONTROL_H
#define MAGE_DIALOG_CONTROL_H

#include "mage_defines.h"
#include "mage_entity_type.h"
#include "fonts/Monaco9.h"
#include "engine/EngineInput.h"
#include "engine/EnginePanic.h"
#include <optional>
#include <array>

class MapControl;
class StringLoader;
class TileManager;

#define DIALOG_SCREEN_NO_PORTRAIT 255

#define DIALOG_TILES_TOP_LEFT 0
#define DIALOG_TILES_TOP_REPEAT 1
#define DIALOG_TILES_TOP_RIGHT 2
#define DIALOG_TILES_LEFT_REPEAT 4
#define DIALOG_TILES_CENTER_REPEAT 5
#define DIALOG_TILES_RIGHT_REPEAT 6
#define DIALOG_TILES_BOTTOM_LEFT 8
#define DIALOG_TILES_BOTTOM_REPEAT 9
#define DIALOG_TILES_BOTTOM_RIGHT 10

#define DIALOG_TILES_SCROLL_END 3
#define DIALOG_TILES_SCROLL_REPEAT 7
#define DIALOG_TILES_SCROLL_POSITION 11

#define DIALOG_TILES_CHECKBOX 12
#define DIALOG_TILES_CHECK 13
#define DIALOG_TILES_HIGHLIGHT 14
#define DIALOG_TILES_ARROW 15

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
   Rect text;
   Rect label;
   Rect portrait;
};

struct MageDialogScreen
{
   // TODO: portraits, after we have some graphics for them
   uint16_t nameStringIndex{ 0 };
   uint16_t borderTilesetIndex{0};
   MageDialogScreenAlignment alignment{0};
   uint8_t fontIndex{0};
   uint8_t messageCount{0};
   MageDialogResponseType responseType{0};
   uint8_t responseCount{0};
   uint8_t entityIndex{0};
   uint8_t portraitIndex{0};
   uint8_t emoteIndex{0};

   uint16_t GetMessage(uint8_t messageId) const
   {
      auto messages = (const uint16_t*)(&emoteIndex + sizeof(uint8_t));
      return messages[messageId % messageCount];
   }

   const MageDialogResponse& GetResponse(uint8_t responseId) const
   {
      auto responses = (const MageDialogResponse*)(&emoteIndex + sizeof(uint8_t) + messageCount * sizeof(uint16_t));
      return responses[responseId % responseCount];
   }
};


struct MageDialog
{
   char Name[32];
   uint32_t ScreenCount;

   const MageDialogScreen& GetScreen(uint32_t screenId) const
   {
      auto screens = (uint8_t*)&ScreenCount + sizeof(uint32_t);
      for (auto i = 0; i < screenId; i++)
      {
         auto screenPtr = ((const MageDialogScreen*)screens);
         screens += sizeof(MageDialogScreen);
         screens += screenPtr->messageCount * sizeof(uint16_t);
         screens += screenPtr->responseCount * sizeof(MageDialogResponse);
         if (screenPtr->messageCount % 2)
         {
            screens += 2;
         }
      }
      auto screenPtr = ((const MageDialogScreen*)screens);
      return *screenPtr;
   }
};


class MageDialogControl
{
public:
   MageDialogControl(
      std::shared_ptr<FrameBuffer> frameBuffer, 
      std::shared_ptr<EngineInput> inputHandler,
      std::shared_ptr<TileManager> tileManager, 
      std::shared_ptr<StringLoader> stringLoader, 
      std::shared_ptr<MapControl> mapControl) noexcept
   :  frameBuffer(frameBuffer), 
      inputHandler(inputHandler),
      tileManager(tileManager), 
      stringLoader(stringLoader), 
      mapControl(mapControl)
   {}

   std::optional<uint16_t> StartModalDialog(std::string messageString);

   void load(uint16_t dialogId, int16_t currentEntityId);
   void loadCurrentScreenPortrait();
   void loadNextScreen();

   constexpr void close() { open = false; }
   constexpr bool isOpen() const { return open; }

   std::optional<uint16_t> update(const DeltaState& delta);
   void draw();

private:
   std::shared_ptr<FrameBuffer> frameBuffer;
   std::shared_ptr<TileManager> tileManager;
   std::shared_ptr<StringLoader> stringLoader;
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<EngineInput> inputHandler;
   bool open{ false };

   void drawDialogBox(const std::string& string, const Rect& box, bool drawArrow = false, bool drawPortrait = false) const;

   bool shouldShowResponses() const
   {
      auto& currentScreen = currentDialog->GetScreen(currentScreenIndex);
      // last page of messages on this screen and we have responses
      return currentMessageIndex == (currentScreen.messageCount - 1)
         && (currentScreen.responseType == MageDialogResponseType::SELECT_FROM_SHORT_LIST
            || currentScreen.responseType == MageDialogResponseType::SELECT_FROM_LONG_LIST);
   }

   std::string triggeringEntityName{};
   uint32_t currentScreenIndex{0};
   uint32_t currentMessageIndex{0};
   uint16_t currentFrameTilesetIndex{ 0 };
   uint32_t cursorPhase{0};
   uint8_t currentResponseIndex{0};
   uint8_t currentPortraitId{ DIALOG_SCREEN_NO_PORTRAIT };
   RenderableData currentPortraitRenderableData{};

   uint8_t currentDialogId{ 0 };
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

struct MageSerialDialog
{
   //MageSerialDialog() noexcept = default;
   MageSerialDialog(uint32_t& address)
   {
      ROM()->Read(name, address, 32);
      ROM()->Read(stringId, address);
      ROM()->Read(serialResponseType, address);
      ROM()->Read(responseCount, address);
      Responses = std::unique_ptr<MageDialogResponse[]>{ new MageDialogResponse[responseCount] };

      ROM()->Read(*Responses.get(), address, responseCount);
   }
   char name[32];
   uint16_t stringId;
   MageSerialDialogResponseTypes serialResponseType;
   uint8_t responseCount;
   std::unique_ptr<MageDialogResponse[]> Responses;
};


#endif //MAGE_DIALOG_CONTROL_H
