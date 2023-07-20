#include "mage.h"

#include "utility.h"

#include "mage_defines.h"
#include "mage_script_control.h"
#include "shim_timer.h"

#ifndef DC801_EMBEDDED
#include <SDL.h>
#endif

#ifdef EMSCRIPTEN
#include "emscripten.h"
#endif

void MageGameEngine::Run()
{
    //main game loop:
#ifdef EMSCRIPTEN
    emscripten_set_main_loop(gameLoop, 24, 1);
#else

   //update timing information at the start of every game loop
    auto lastTime = GameClock::now();

    while (inputHandler->IsRunning())
    {
        auto loopStart = GameClock::now();
        auto deltaTime = loopStart - lastTime;
        debug_print("Now: %dms\tLast time: %dms\tDelta: %dms", loopStart, lastTime, deltaTime);
        lastTime = loopStart;

        if (!engineIsInitialized || inputHandler->ShouldReloadGameDat())
        {
            scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
            LoadMap(ROM()->GetCurrentSave().currentMapId);
            engineIsInitialized = true;
        }

        // If a map is set to (re)load, do so before rendering
        if (mapControl->mapLoadId != MAGE_NO_MAP)
        {
            //load the new map data into gameControl
            LoadMap(mapControl->mapLoadId);

            //clear the mapLoadId to prevent infinite reloads
            scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
            mapControl->mapLoadId = MAGE_NO_MAP;
        }

        const auto buttons = inputHandler->GetButtonState();
        const auto activatedButtons = inputHandler->GetButtonActivatedState();

        //handles hardware inputs and makes their state available		
        inputHandler->Update();

        const auto deltaState = DeltaState{ deltaTime, inputHandler->GetButtonState(), inputHandler->GetButtonActivatedState() };

        //updates the state of all the things before rendering:
        gameUpdate(deltaState);

        //frame limiter code to keep game running at a specific FPS:
        //only do this on the real hardware:
#ifdef DC801_EMBEDDED
      //if (deltaTime < MAGE_MIN_MILLIS_BETWEEN_FRAMES) { continue; }
#else
      //if (updateAndRenderTime < MAGE_MIN_MILLIS_BETWEEN_FRAMES)
      //{
      //   SDL_Delay(MAGE_MIN_MILLIS_BETWEEN_FRAMES - updateAndRenderTime);
      //}
#endif
      //This renders the game to the screen based on the loop's updated state.
        gameRender();

        // drawButtonStates(inputHandler->GetButtonState());
        // drawLEDStates();

        // if a blocking delay was added by any actions, pause before returning to the game loop:
        if (inputHandler->blockingDelayTime)
        {
            debug_print("About to block for %x", inputHandler->blockingDelayTime);
            //delay for the right amount of time
            nrf_delay_ms(inputHandler->blockingDelayTime);
            //reset delay time when done so we don't do this every loop.
            inputHandler->blockingDelayTime = 0;
        }
    }
#endif

    // Close rom and any open files
    EngineSerialRegisterEventHandlers(nullptr, nullptr);

}

void MageGameEngine::handleEntityInteract(bool hack)
{
    //interacting is impossible if there is no player entity
    if (mapControl->getPlayerEntityIndex() == NO_PLAYER_INDEX) { return; }

    auto playerEntity = mapControl->getPlayerEntity();
    if (playerEntity.has_value())
    {
        auto playerRenderableData = mapControl->getPlayerEntityRenderableData();
        auto interactBox = playerRenderableData->hitBox;

        const uint8_t interactLength = 32;
        auto direction = playerEntity.value()->direction & RENDER_FLAGS_DIRECTION_MASK;
        if (direction == NORTH)
        {
            interactBox.origin.y -= interactLength;
            interactBox.h = interactLength;
        }
        if (direction == EAST)
        {
            interactBox.origin.x += interactBox.w;
            interactBox.w = interactLength;
        }
        if (direction == SOUTH)
        {
            interactBox.origin.y += interactBox.h;
            interactBox.h = interactLength;
        }
        if (direction == WEST)
        {
            interactBox.origin.x -= interactLength;
            interactBox.w = interactLength;
        }

        for (uint8_t i = 0; i < mapControl->FilteredEntityCount(); i++)
        {
            // reset all interact states first
            auto targetEntity = mapControl->getEntity(i);
            if (targetEntity.has_value())
            {
                auto target = targetEntity.value();
                auto& targetRenderableData = mapControl->getEntityRenderableData(i);
                targetRenderableData.isInteracting = false;

                if (i != mapControl->getPlayerEntityIndex())
                {
                    bool colliding = targetRenderableData.hitBox
                        .Overlaps(interactBox);

                    if (colliding)
                    {
                        playerRenderableData->isInteracting = true;
                        mapControl->getEntityRenderableData(i).isInteracting = true;
                        if (hack && playerHasHexEditorControl)
                        {
                            hexEditor->disableMovementUntilRJoyUpRelease();
                            hexEditor->openToEntityByIndex(i);
                        }
                        else if (!hack && target->onInteractScriptId)
                        {
                            scriptControl->SetEntityInteractResumeState(i, MageScriptState{ target->onInteractScriptId, true });
                        }
                        break;
                    }
                }
            }
        }
    }
}

void MageGameEngine::LoadMap(uint16_t index)
{
    //reset the fade fraction, in case player reset the map
    //while the fraction was anything other than 0
    frameBuffer->ResetFade();

    //close any open dialogs and return player control as well:
    dialogControl->close();
    playerHasControl = true;

    //get the data for the map:
    mapControl->Load(index);

    mapControl->getPlayerEntity().value()->SetName(ROM()->GetCurrentSave().name);

    scriptControl->initializeScriptsOnMapLoad();

    commandControl->reset();
    scriptControl->handleMapOnLoadScript(true);

    //close hex editor if open:
    if (hexEditor->isHexEditorOn())
    {
        hexEditor->toggleHexEditor();
    }
    if (mapControl->getPlayerEntityIndex() != NO_PLAYER_INDEX)
    {
        hexEditor->openToEntityByIndex(mapControl->getPlayerEntityIndex());
        hexEditor->toggleHexEditor();
    }
}

void MageGameEngine::applyUniversalInputs(const DeltaState& delta)
{
    if (delta.Buttons.IsPressed(KeyPress::Xor))
    {
        if (delta.Buttons.IsPressed(KeyPress::Mem3))
        {
            //make map reload global regardless of player control state:
            mapControl->mapLoadId = ROM()->GetCurrentSave().currentMapId;
            return;
        }
        else if (delta.Buttons.IsPressed(KeyPress::Mem1))
        {
            mapControl->isEntityDebugOn = !mapControl->isEntityDebugOn;
            scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
            LoadMap(ROM()->GetCurrentSave().currentMapId);
            return;
        }
    }

    //check to see if player input is allowed:
    if (dialogControl->isOpen()
        || !(playerHasControl || playerHasHexEditorControl))
    {
        return;
    }
    //make sure any delta.Buttons handling in this function can be processed in ANY game mode.
    //that includes the game mode, hex editor mode, any menus, maps, etc.
    ledSet(LED_PAGE, delta.Buttons.IsPressed(KeyPress::Page) ? 0xFF : 0x00);
    if (delta.Buttons.IsPressed(KeyPress::Xor)) { hexEditor->setHexOp(HEX_OPS_XOR); }
    if (delta.Buttons.IsPressed(KeyPress::Add)) { hexEditor->setHexOp(HEX_OPS_ADD); }
    if (delta.Buttons.IsPressed(KeyPress::Sub)) { hexEditor->setHexOp(HEX_OPS_SUB); }
    if (delta.Buttons.IsPressed(KeyPress::Bit128)) { hexEditor->runHex(0b10000000); }
    if (delta.Buttons.IsPressed(KeyPress::Bit64)) { hexEditor->runHex(0b01000000); }
    if (delta.Buttons.IsPressed(KeyPress::Bit32)) { hexEditor->runHex(0b00100000); }
    if (delta.Buttons.IsPressed(KeyPress::Bit16)) { hexEditor->runHex(0b00010000); }
    if (delta.Buttons.IsPressed(KeyPress::Bit8)) { hexEditor->runHex(0b00001000); }
    if (delta.Buttons.IsPressed(KeyPress::Bit4)) { hexEditor->runHex(0b00000100); }
    if (delta.Buttons.IsPressed(KeyPress::Bit2)) { hexEditor->runHex(0b00000010); }
    if (delta.Buttons.IsPressed(KeyPress::Bit1)) { hexEditor->runHex(0b00000001); }

    // only trigger on the first release of XOR MEM0, regardless of order it is pressed
    if (delta.Buttons.IsPressed(KeyPress::Xor) && delta.ActivatedButtons.IsPressed(KeyPress::Mem0)
        || delta.ActivatedButtons.IsPressed(KeyPress::Xor) && delta.Buttons.IsPressed(KeyPress::Mem0))
    {
        tileManager->ToggleDrawGeometry();
    }
}

void MageGameEngine::applyGameModeInputs(const DeltaState& delta)
{
    //set mage speed based on if the right pad down is being pressed:
    const auto moveSpeedPerSecond = delta.Buttons.IsPressed(KeyPress::Rjoy_down) ? MAGE_RUNNING_SPEED : MAGE_WALKING_SPEED;
    const auto amountMovedThisFrame = float{ 1000.0f / delta.Time.count() };
    mapControl->playerSpeed = float{ moveSpeedPerSecond / amountMovedThisFrame };

    auto playerEntity = mapControl->getPlayerEntity();
    auto playerRenderableData = mapControl->getPlayerEntityRenderableData();
    // if there is a player on the map
    if (playerEntity != NO_PLAYER && playerRenderableData != NO_PLAYER)
    {
        auto player = *playerEntity;
        player->updateRenderableData(*playerRenderableData, 0);

        //update renderable info before proceeding:
        uint16_t playerEntityTypeId = player->primaryIdType % NUM_PRIMARY_ID_TYPES;
        bool hasEntityType = playerEntityTypeId == ENTITY_TYPE;
        auto entityType = hasEntityType ? ROM()->GetReadPointerByIndex<MageEntityType>(playerEntityTypeId) : nullptr;
        uint8_t previousPlayerAnimation = player->currentAnimation;
        bool playerIsActioning = player->currentAnimation == MAGE_ACTION_ANIMATION_INDEX;

        //check to see if the mage is pressing the action delta.Buttons, or currently in the middle of an action animation.
        if (playerHasControl)
        {
            if (playerIsActioning || delta.Buttons.IsPressed(KeyPress::Rjoy_left))
            {
                playerIsActioning = true;
            }
            //if not actioning or resetting, handle all remaining inputs:
            else
            {
                mapControl->TryMovePlayer(delta.Buttons);

                if (delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_right))
                {
                    const auto hack = false;
                    handleEntityInteract(hack);
                }
                if (delta.ActivatedButtons.IsPressed(KeyPress::Rjoy_up))
                {
                    const auto hack = true;
                    handleEntityInteract(hack);
                }
                if (delta.Buttons.IsPressed(KeyPress::Ljoy_center))
                {
                    //no task assigned to ljoy_center in game mode
                }
                if (delta.Buttons.IsPressed(KeyPress::Rjoy_center))
                {
                    //no task assigned to rjoy_center in game mode
                }
                if (delta.Buttons.IsPressed(KeyPress::Page))
                {
                    //no task assigned to op_page in game mode
                }
            }
        }

        //handle animation assignment for the player:
        //Scenario 1 - perform action:
        if (playerIsActioning && hasEntityType
            && entityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
        {
            player->currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
        }
        //Scenario 2 - show walk animation:
        else if (mapControl->playerIsMoving && hasEntityType
            && entityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
        {
            player->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
        }
        //Scenario 3 - show idle animation:
        else if (playerHasControl)
        {
            player->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
        }

        //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
        bool isPlayingActionButShouldReturnControlToPlayer = hasEntityType
            && (player->currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
            && (player->currentFrameIndex == (playerRenderableData->frameCount - 1))
            && (playerRenderableData->currentFrameTicks + delta.Time.count() >= (playerRenderableData->duration));

        //if the above bool is true, set the player back to their idle animation:
        if (isPlayingActionButShouldReturnControlToPlayer)
        {
            player->currentFrameIndex = 0;
            player->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
        }

        //if the animation changed since the start of this function, reset to the first frame and restart the timer:
        if (previousPlayerAnimation != player->currentAnimation)
        {
            player->currentFrameIndex = 0;
            playerRenderableData->currentFrameTicks = 0;
        }

        //What scenarios call for an extra renderableData update?
        if (mapControl->playerIsMoving || (playerRenderableData->lastTilesetId != playerRenderableData->tilesetId))
        {
            player->updateRenderableData(*playerRenderableData, 0);
        }

        if (!playerHasControl || !playerHasHexEditorControl)
        {
            return;
        }

        //opening the hex editor is the only delta.Buttons press that will lag actual gameplay by one frame
        //this is to allow entity scripts to check the hex editor state before it opens to run scripts
        if (delta.ActivatedButtons.IsPressed(KeyPress::Hax))
        {
            hexEditor->toggleHexEditor();
        }
        hexEditor->applyMemRecallInputs();
    }
    else //no player on map
    {
        if (!playerHasControl)
        {
            return;
        }
        if (delta.Buttons.IsPressed(KeyPress::Ljoy_left))
        {
            camera.position.x -= mapControl->playerSpeed;
        }
        if (delta.Buttons.IsPressed(KeyPress::Ljoy_right))
        {
            camera.position.x += mapControl->playerSpeed;
        }
        if (delta.Buttons.IsPressed(KeyPress::Ljoy_up))
        {
            camera.position.y -= mapControl->playerSpeed;
        }
        if (delta.Buttons.IsPressed(KeyPress::Ljoy_down))
        {
            camera.position.y += mapControl->playerSpeed;
        }

        if (!playerHasHexEditorControl)
        {
            return;
        }

        if (delta.ActivatedButtons.IsPressed(KeyPress::Hax))
        {
            hexEditor->toggleHexEditor();
        }
        hexEditor->applyMemRecallInputs();
    }
}


void MageGameEngine::gameUpdate(const DeltaState& delta)
{
    //apply inputs that work all the time
    applyUniversalInputs(delta);

    //check for loadMap:
    if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

    //update universally used hex editor state variables:
    hexEditor->updateHexStateVariables(mapControl->FilteredEntityCount());

    // turn on hax inputs if player input is allowed or be boring and normal
    if (hexEditor->isHexEditorOn()
        && !(dialogControl->isOpen()
            || !playerHasControl
            || !playerHasHexEditorControl
            || hexEditor->IsMovementDisabled()))
    {
        //apply inputs to the hex editor:
        hexEditor->applyHexModeInputs(mapControl->GetEntityDataPointer());

        //then handle any still-running scripts:
        scriptControl->tickScripts();
        commandControl->sendBufferedOutput();
    }
    else
    {
        if (dialogControl->isOpen())
        {
            auto jumpScriptId = dialogControl->update(delta);
            if (jumpScriptId != MAGE_NO_SCRIPT)
            {
                scriptControl->jumpScriptId = jumpScriptId;
            }
        }
        else
        {
            //this handles buttons and state updates based on delta.Buttons presses in game mode:
            applyGameModeInputs(delta);
        }

        //update the entities based on the current state of their (hackable) data array.
        mapControl->UpdateEntities(delta);

        //handle scripts:
        scriptControl->tickScripts();
        commandControl->sendBufferedOutput();

        //check for loadMap:
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

        camera.applyEffects(delta.Time.count());
    }
}

void MageGameEngine::gameRender()
{
    //make hax do
    if (hexEditor->isHexEditorOn())
    {
        //run hex editor if appropriate
        hexEditor->renderHexEditor(mapControl->GetEntityDataPointer());
    }
    //otherwise be boring and normal/run mage game:
    else
    {
        //then draw the map and entities:
        mapControl->Draw(camera.position);

        if (dialogControl->isOpen())
        {
            dialogControl->draw();
        }
    }
    //update the state of the LEDs
    hexEditor->updateHexLights(mapControl->GetEntityDataPointer());
    frameBuffer->blt();
}