#ifndef _MAGE_H
#define _MAGE_H

#include <memory>
#include <vector>

#include "EngineAudio.h"
#include "EngineInput.h"
#include "EngineSerial.h"
#include "DesktopWindowOutput.h"
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
      : inputHandler(inputHandler), frameBuffer(frameBuffer), mapControl(new MapControl(frameBuffer, DEFAULT_MAP))
   {
      audioPlayer = std::make_unique<AudioPlayer>();

      hexEditor = std::make_shared<MageHexEditor>(inputHandler, frameBuffer, mapControl, ROM()->GetCurrentSave().memOffsets);
      stringLoader = std::make_shared<StringLoader>(mapControl, ROM()->GetCurrentSave().scriptVariables);
      scriptControl = std::make_shared<MageScriptControl>(mapControl);
      dialogControl = std::make_unique<MageDialogControl>(inputHandler, frameBuffer, stringLoader, mapControl, scriptControl);

      commandControl = std::make_shared<MageCommandControl>(mapControl, frameBuffer, scriptControl->jumpScriptId, stringLoader);

      auto scriptActions = std::make_unique<MageScriptActions>(inputHandler, frameBuffer, mapControl, dialogControl, commandControl, hexEditor, stringLoader);
      scriptControl->SetActions(std::move(scriptActions));
   }
   //this will load a map to be the current map.
   void LoadMap();

   //this runs the actual game, performing initial setup and then
   //running the game loop indefinitely until the game is exited.
   void Run();

private:
   
   //this takes input information and moves the playerEntity around
   //If there is no playerEntity, it just moves the camera freely.
   void applyGameModeInputs();

   void updateHexLights() const;

   void gameLoopIteration();

   uint8_t currentSaveIndex{ 0 };

   //this lets us make it so that inputs stop working for the player
   bool playerHasControl{ false };
   
   std::unique_ptr<AudioPlayer> audioPlayer;
   std::shared_ptr<EngineInput> inputHandler;
   std::shared_ptr<FrameBuffer> frameBuffer;
   std::shared_ptr<MageHexEditor> hexEditor;
   std::shared_ptr<MageScriptControl> scriptControl;
   std::shared_ptr<MageCommandControl> commandControl;
   std::shared_ptr<MageDialogControl> dialogControl;
   std::shared_ptr<MapControl> mapControl;
   std::shared_ptr<StringLoader> stringLoader;
};

#endif //_MAGE_H