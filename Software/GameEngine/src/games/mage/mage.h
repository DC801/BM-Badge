#ifndef _MAGE_H
#define _MAGE_H

#include <memory>
#include <vector>

#include "EngineAudio.h"
#include "EngineInput.h"
#include "EngineSerial.h"
#include "EngineWindowFrame.h"
#include "mage_app_timers.h"
#include "mage_camera.h"
#include "mage_color_palette.h"
#include "mage_command_control.h"
#include "mage_dialog_control.h"
#include "mage_script_control.h"
#include "mage_map.h"
#include "mage_hex.h"
#include "utility.h"
#include "mage_rom.h"

#ifndef DC801_EMBEDDED
#include "shim_timer.h"
#endif

class MageGameEngine
{
public:

    // This constructor acts like the composition root for the game
    // It depends on the EngineInput and FrameBuffer, which isolates the game logic from where I/O and display is handled
   MageGameEngine(std::shared_ptr<EngineInput> inputHandler, std::shared_ptr<FrameBuffer> frameBuffer)
      : inputHandler(inputHandler), frameBuffer(frameBuffer)
   {
      audioPlayer = std::make_unique<AudioPlayer>();
      screenManager = std::make_shared<ScreenManager>(frameBuffer, &camera);

      mapControl = std::make_shared<MapControl>(screenManager, ROM()->GetCurrentSave().currentMapId);
      hexEditor = std::make_shared<MageHexEditor>(screenManager, inputHandler, mapControl, ROM()->GetCurrentSave().memOffsets);
      stringLoader = std::make_shared<StringLoader>(mapControl, ROM()->GetCurrentSave().scriptVariables);
      dialogControl = std::make_unique<MageDialogControl>(screenManager, stringLoader, mapControl);

      auto scriptActions = std::make_unique<MageScriptActions>(frameBuffer, inputHandler, camera, mapControl, dialogControl, commandControl, hexEditor, stringLoader);
      scriptControl = std::make_shared<MageScriptControl>(mapControl, std::move(scriptActions));
      commandControl = std::make_shared<MageCommandControl>(mapControl, screenManager, scriptControl, stringLoader);
   }
   //this will load a map to be the current map.
   void LoadMap();

   //this runs the actual game, performing initial setup and then
   //running the game loop indefinitely until the game is exited.
   void Run();

private:
   
   //this takes input information and moves the playerEntity around
   //If there is no playerEntity, it just moves the camera freely.
   void applyGameModeInputs(const InputState& delta);

   //this handles inputs that apply in ALL game states. That includes when
   //the hex editor is open, when it is closed, when in any menus, etc.
   void applyUniversalInputs(const InputState& delta);

   void updateHexLights() const;

   void gameLoopIteration(const InputState& input);

   uint8_t currentSaveIndex{ 0 };

   //this lets us make it so that inputs stop working for the player
   bool playerHasControl{ false };
   
   std::unique_ptr<AudioPlayer> audioPlayer;
   std::shared_ptr<EngineInput> inputHandler;
   std::shared_ptr<FrameBuffer> frameBuffer;
   std::shared_ptr<MageHexEditor> hexEditor;
   std::shared_ptr<MageScriptControl> scriptControl;
   std::shared_ptr<MageCommandControl> commandControl;
   std::shared_ptr<ScreenManager> screenManager;
   std::shared_ptr<MageDialogControl> dialogControl;
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<StringLoader> stringLoader;

   MageCamera camera{};
};

#endif //_MAGE_H