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
class MageScriptControl;
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
   MageDialogScreen() noexcept = default;
   MageDialogScreen(uint32_t& address)
   {
      ROM()->Read(nameStringIndex, address);
      ROM()->Read(borderTilesetIndex, address);
      ROM()->Read(alignment, address);
      ROM()->Read(fontIndex, address);
      ROM()->Read(messageCount, address);
      ROM()->Read(responseType, address);
      ROM()->Read(responseCount, address);
      ROM()->Read(entityIndex, address);
      ROM()->Read(portraitIndex, address);
      ROM()->Read(emoteIndex, address);
      
      messages = ROM()->GetReadPointerToAddress<uint16_t>(address, messageCount);
      responses = ROM()->GetReadPointerToAddress<MageDialogResponse>(address, responseCount);
   }
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
   const uint16_t* messages{};
   const MageDialogResponse* responses{};
};


struct MageDialog
{
   MageDialog(uint32_t& address)
   {
      ROM()->Read(name, address, 32);
      ROM()->Read(ScreenCount, address);
      auto screenData = new MageDialogScreen[ScreenCount];
      for (auto i = 0; i < ScreenCount; i++)
      {
         screenData[i] = MageDialogScreen{ address };
      }
      screens = std::unique_ptr<MageDialogScreen[]>{ screenData };
   }
   char name[32];
   uint32_t ScreenCount;
   std::unique_ptr<MageDialogScreen[]> screens;
};


class MageDialogControl
{
public:
   MageDialogControl(
      std::shared_ptr<FrameBuffer> frameBuffer, 
      std::shared_ptr<EngineInput> inputHandler,
      std::shared_ptr<TileManager> tileManager, 
      std::shared_ptr<StringLoader> stringLoader, 
      std::shared_ptr<MageScriptControl> scriptControl, 
      std::shared_ptr<MapControl> mapControl) noexcept
   :  frameBuffer(frameBuffer), 
      inputHandler(inputHandler),
      tileManager(tileManager), 
      stringLoader(stringLoader), 
      scriptControl(scriptControl),  
      mapControl(mapControl)
   {}

   void load(uint16_t dialogId, int16_t currentEntityId);
   void loadNextScreen();
   void StartModalDialog(std::string messageString);

   constexpr void MageDialogControl::close() { open = false; }
   constexpr bool isOpen() const { return open; }

   void update();
   void draw();

   void loadCurrentScreenPortrait();
   uint32_t getDialogAddress(uint16_t dialogId) const;

private:
   std::shared_ptr<FrameBuffer> frameBuffer;
   std::shared_ptr<TileManager> tileManager;
   std::shared_ptr<StringLoader> stringLoader;
   std::shared_ptr<MageScriptControl> scriptControl;
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<EngineInput> inputHandler;
   bool open{ false };

   uint8_t getTileIdFromXY(uint8_t x, uint8_t y, const Rect& box) const;
   void drawDialogBox(const std::string& string, const Rect& box, bool drawArrow = false, bool drawPortrait = false) const;
   
   inline MageDialogScreen& currentScreen() const
   {
      return currentDialog->screens[currentScreenIndex];
   }

   bool shouldShowResponses() const
   {
      // last page of messages on this screen and we have responses
      return currentMessageIndex == (currentScreen().messageCount - 1)
         && (currentScreen().responseType == MageDialogResponseType::SELECT_FROM_SHORT_LIST
            || currentScreen().responseType == MageDialogResponseType::SELECT_FROM_LONG_LIST);
   }

   std::string triggeringEntityName{};
   int32_t currentScreenIndex{0};
   int32_t currentMessageIndex{0};
   uint16_t currentFrameTilesetIndex{ 0 };
   uint32_t cursorPhase{0};
   uint8_t currentResponseIndex{0};
   uint8_t currentPortraitId{ DIALOG_SCREEN_NO_PORTRAIT };
   RenderableData currentPortraitRenderableData{};

   std::unique_ptr<MageDialog> currentDialog;
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
