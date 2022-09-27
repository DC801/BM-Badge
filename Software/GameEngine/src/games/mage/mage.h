#ifndef _MAGE_H
#define _MAGE_H

#include "mage_defines.h"
#include "mage_color_palette.h"
#include "mage_defines.h"
#include "mage_header.h"
#include "mage_map.h"
#include "mage_tileset.h"
#include "mage_animation.h"
#include "mage_entity_type.h"
#include "mage_geometry.h"
#include "mage_color_palette.h"
#include "mage_hex.h"
#include "mage_script_actions.h"
#include "mage_script_control.h"
#include "mage_command_control.h"
#include "mage_dialog_control.h"
#include <vector>

#include "EngineInput.h"
#include "EngineAudio.h"
#include "utility.h"

#ifndef DC801_EMBEDDED
#include "shim_timer.h"
#endif

class MageGameEngine
{
   friend class FrameBuffer;
   friend class MageColorPalette;


   friend class MageGameControl;
   friend class MageCommandControl;
   friend class MageHexEditor;
   friend class MageDialogControl;
   friend class MageScriptControl;
   friend class MageScriptActions;
   friend class EngineWindowFrame;
   friend class MageMap;


public:
   //updates the state of all the things before rendering:
   void GameUpdate(uint32_t deltaTime);

   //This renders the game to the screen based on the loop's updated state.
   void GameRender();

   void EngineMainGameLoop();
   void onSerialStart();
   void onSerialCommand(char* commandString);

   //this runs the actual game, performing initial setup and then
   //running the game loop indefinitely until the game is exited.
   void Run();

private:
   //this will handle any blocking delays at the end of the loop
   void handleBlockingDelay();

   //used to verify whether a save is compatible with game data
   uint32_t engineVersion;
   uint32_t scenarioDataCRC32;
   uint32_t scenarioDataLength;

   bool engineIsInitialized{ false };

   uint32_t lastTime{ millis() };
   uint32_t now{ 0 };
   uint32_t deltaTime{ 0 };
   uint32_t lastLoopTime{ millis() };
   std::unique_ptr<AudioPlayer> audioPlayer = std::make_unique<AudioPlayer>();

   std::shared_ptr<EngineROM> ROM = std::make_shared<EngineROM>();
   std::shared_ptr<EngineInput> inputHandler = std::make_shared<EngineInput>();
   std::unique_ptr<EngineWindowFrame> windowFrame = std::make_unique<EngineWindowFrame>(inputHandler);
   std::shared_ptr<FrameBuffer> frameBuffer = std::make_shared<FrameBuffer>(this);
   std::shared_ptr<MageGameControl> gameControl = std::make_shared<MageGameControl>(this);
   std::shared_ptr<MageHexEditor> hexEditor = std::make_shared<MageHexEditor>(this);
   std::shared_ptr<MageScriptControl> scriptControl = std::make_shared<MageScriptControl>(this);
   std::shared_ptr<MageScriptActions> scriptActions = std::make_shared<MageScriptActions>(this);;
   std::shared_ptr<MageCommandControl> commandControl = std::make_shared<MageCommandControl>(this);
};

// struct MageHeader {
//    uint32_t Counts; 
//    uint32_t Offsets[counts]; 
//    uint32_t Lengths[counts];
// };

struct MageRom 
{
   char MagicString[ENGINE_ROM_IDENTIFIER_STRING_LENGTH];
   uint32_t EngineVersion;
   uint32_t ScenarioDataCRC32;
   uint32_t ScenarioDataLength;
   struct headerTypes
   {
      MageHeader Map;
      MageHeader Tileset;
      MageHeader Animation;
      MageHeader EntityType;
      MageHeader Entity;
      MageHeader Geometry;
      MageHeader Script;
      MageHeader Portrait;
      MageHeader Dialog;
      MageHeader SerialDialog;
      MageHeader ColorPalette;
      MageHeader String;
      MageHeader SaveFlag;
      MageHeader Variable;
      MageHeader Image;
   } Headers;

   //[tileset]
   //animation
};

#endif //_MAGE_H