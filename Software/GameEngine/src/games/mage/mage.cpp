#include "mage.h"

#include <chrono>

#include "mage_defines.h"
#include "mage_script_control.h"
#include "shim_timer.h"
#include "utility.h"

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
        const auto loopStart = GameClock::now();
        const auto deltaTime = std::chrono::duration_cast<std::chrono::milliseconds>(loopStart - lastTime);
        const auto delayMs = MAGE_MIN_MILLIS_BETWEEN_FRAMES - deltaTime.count();
        debug_print("Now: %dms\tLast time: %dms\tDelta: %dms", loopStart, lastTime, deltaTime);

        //handles hardware inputs and makes their state available		
        inputHandler->Update();

        if (!engineIsInitialized || inputHandler->ShouldReloadGameDat())
        {
            scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
            LoadMap(ROM()->GetCurrentSave().currentMapId);
            engineIsInitialized = true;
        }

        const auto deltaState = DeltaState{ deltaTime, inputHandler->GetButtonState(), inputHandler->GetButtonActivatedState() };

        //updates the state of all the things before rendering:
        gameUpdate(deltaState);

        // If a map is set to (re)load, do so before rendering
        if (mapControl->mapLoadId != MAGE_NO_MAP)
        {
            //load the new map data into gameControl
            LoadMap(mapControl->mapLoadId);

            //clear the mapLoadId to prevent infinite reloads
            scriptControl->jumpScriptId = MAGE_NO_SCRIPT;
            mapControl->mapLoadId = MAGE_NO_MAP;
        }


        //frame limiter code to keep game running at a specific FPS:
        if (delayMs > 0)
        {
#ifdef DC801_EMBEDDED
            continue;
#else
            SDL_Delay(delayMs);
#endif
        }
        //This renders the game to the screen based on the loop's updated state.
        gameRender();

        lastTime = loopStart;

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

void MageGameEngine::handleEntityInteract(const ButtonState& activatedButton)
{
    auto hack = activatedButton.IsPressed(KeyPress::Rjoy_up);

    // only interact on Rjoy_up (hacking) or Rjoy_right (interacting)
    if (!hack && !activatedButton.IsPressed(KeyPress::Rjoy_right)) { return; }

    //interacting is impossible if there is no player entity
    if (mapControl->getPlayerEntityIndex() == NO_PLAYER_INDEX) { return; }

    auto playerEntity = mapControl->getPlayerEntity();
    if (playerEntity.has_value())
    {
        auto player = playerEntity.value();
        auto interactBox = player->renderableData.hitBox;

        const uint8_t interactLength = 32;
        auto direction = playerEntity.value()->data.direction & RENDER_FLAGS_DIRECTION_MASK;
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

        for (uint8_t i = 0; i < mapControl->GetEntities().size(); i++)
        {
            // reset all interact states first
            auto targetEntity = mapControl->tryGetEntity(i);
            if (targetEntity.has_value())
            {
                auto target = targetEntity.value();
                target->renderableData.isInteracting = false;

                if (i != mapControl->getPlayerEntityIndex())
                {
                    bool colliding = target->renderableData.hitBox
                        .Overlaps(interactBox);

                    if (colliding)
                    {
                        player->renderableData.isInteracting = true;
                        target->renderableData.isInteracting = true;
                        if (hack && playerHasHexEditorControl)
                        {
                            hexEditor->disableMovementUntilRJoyUpRelease();
                            hexEditor->openToEntityByIndex(i);
                        }
                        else if (!hack && target->data.onInteractScriptId)
                        {
                            target->OnInteract(scriptControl.get());
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
    hexEditor->setHexEditorOn(false);

    commandControl->reset();

    // Load the map and trigger its OnLoad script. This is the only place that should happen
    mapControl->Load(index);

    mapControl->OnLoad(scriptControl.get());

    playerHasControl = true;

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
            mapControl->isEntityDebugOn = false;
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
    const auto amountMovedThisFrame = float{ 1000.0f / delta.TimeMs.count() };
    mapControl->playerSpeed = float{ moveSpeedPerSecond / amountMovedThisFrame };

    auto playerEntity = mapControl->getPlayerEntity();
    // if there is a player on the map
    if (playerEntity != NO_PLAYER)
    {
        //update renderable info before proceeding:
        auto player = playerEntity.value();
        player->UpdateRenderableData();
        auto playerEntityTypeId = player->data.primaryIdType % NUM_PRIMARY_ID_TYPES;
        auto hasEntityType = playerEntityTypeId == ENTITY_TYPE;
        auto entityType = hasEntityType ? ROM()->GetReadPointerByIndex<MageEntityType>(playerEntityTypeId) : nullptr;
        auto previousPlayerAnimation = player->data.currentAnimation;
        auto playerIsActioning = player->data.currentAnimation == MAGE_ACTION_ANIMATION_INDEX;

        //check to see if the mage is pressing the action delta.Buttons, or currently in the middle of an action animation.
        if (playerHasControl)
        {
            if (delta.Buttons.IsPressed(KeyPress::Rjoy_left))
            {
                playerIsActioning = true;
            }
            //if not actioning or resetting, handle all remaining inputs:
            else
            {
                mapControl->TryMovePlayer(delta.Buttons);
                handleEntityInteract(delta.ActivatedButtons);
            }
        }

        //handle animation assignment for the player:
        //Scenario 1 - perform action:
        if (playerIsActioning && hasEntityType
            && entityType->animationCount >= MAGE_ACTION_ANIMATION_INDEX)
        {
            player->data.currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
        }
        //Scenario 2 - show walk animation:
        else if (mapControl->playerIsMoving && hasEntityType
            && entityType->animationCount >= MAGE_WALK_ANIMATION_INDEX)
        {
            player->data.currentAnimation = MAGE_WALK_ANIMATION_INDEX;
        }
        //Scenario 3 - show idle animation:
        else if (playerHasControl)
        {
            player->data.currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
        }

        //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
        bool isPlayingActionButShouldReturnControlToPlayer = hasEntityType
            && (player->data.currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
            && (player->data.currentFrameIndex == (player->renderableData.frameCount - 1))
            && (player->renderableData.currentFrameTicks + delta.TimeMs.count() >= (player->renderableData.duration));

        //if the above bool is true, set the player back to their idle animation:
        if (isPlayingActionButShouldReturnControlToPlayer)
        {
            player->data.currentFrameIndex = 0;
            player->data.currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
        }

        //if the animation changed since the start of this function, reset to the first frame and restart the timer:
        if (previousPlayerAnimation != player->data.currentAnimation)
        {
            player->data.currentFrameIndex = 0;
            player->renderableData.currentFrameTicks = 0;
        }

        //What scenarios call for an extra renderableData update?
        if (mapControl->playerIsMoving || (player->renderableData.lastTilesetId != player->renderableData.tilesetId))
        {
            player->UpdateRenderableData();
        }

        if (!playerHasControl || !playerHasHexEditorControl)
        {
            return;
        }

        //opening the hex editor is the only delta.Buttons press that will lag actual gameplay by one frame
        //this is to allow entity scripts to check the hex editor state before it opens to run scripts
        if (delta.ActivatedButtons.IsPressed(KeyPress::Hax))
        {
            hexEditor->setHexEditorOn(true);
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
            hexEditor->setHexEditorOn(true);
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
    hexEditor->updateHexStateVariables();

    auto hax = bool{
        hexEditor->isHexEditorOn()
        && !(dialogControl->isOpen()
            || !playerHasControl
            || !playerHasHexEditorControl
            || hexEditor->IsMovementDisabled())
    };

    // turn on hax inputs if player input is allowed or be boring and normal
    if (hax)
    {
        //apply inputs to the hex editor:
        hexEditor->applyHexModeInputs(mapControl->GetEntityDataPointer());
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
        //check for loadMap:
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

        //update the entities based on the current state of their (hackable) data array.
        mapControl->UpdateEntities(delta);
    }

    // don't run entity scripts when hex editor is on
    if (!hexEditor->isHexEditorOn())
    {
        scriptControl->tickScripts();

        mapControl->OnTick(scriptControl.get());
        if (mapControl->mapLoadId != MAGE_NO_MAP) { return; }

        for (auto& entity : mapControl->GetEntities())
        {
            entity.OnTick(scriptControl.get());
            if (mapControl->mapLoadId != MAGE_NO_MAP) { break; }
        }
    }
    commandControl->sendBufferedOutput();

    camera.applyEffects(delta.TimeMs.count());
}

void MageGameEngine::gameRender()
{
    //make hax do
    if (hexEditor->isHexEditorOn())
    {
        //run hex editor if appropriate
        hexEditor->Render();
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
    //drawButtonStates(delta.Buttons);
        // drawButtonStates(inputHandler->GetButtonState());
        // drawLEDStates();
    hexEditor->updateHexLights();
    frameBuffer->blt();
} 