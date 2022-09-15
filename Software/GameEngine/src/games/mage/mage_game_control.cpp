#include "mage_game_control.h"
#include "convert_endian.h"
#include "mage_animation.h"
#include "mage_defines.h"
#include "utility.h"

#include <array>
#include <algorithm>

// Initializer list, default construct values
//   Don't waste any resources constructing unique_ptr's
//   Each header is constructed with offsets from the previous
MageGameControl::MageGameControl(MageGameEngine* gameEngine) noexcept
   : gameEngine(gameEngine)
{
   uint32_t offset = ENGINE_ROM_IDENTIFIER_STRING_LENGTH; //skip 'MAGEGAME' + crc32 string at front of .dat file

   gameEngine->ROM->Read(
      offset,
      sizeof(uint32_t),
      (uint8_t*)&gameEngine->engineVersion,
      "Unable to read engineVersion"
   );
   ROM_ENDIAN_U4_BUFFER(&gameEngine->engineVersion, 1);
   offset += sizeof(uint32_t);

   if (gameEngine->engineVersion != ENGINE_VERSION)
   {
      ENGINE_PANIC(
         "game.dat is incompatible with Engine\n\n"
         "Engine version: %d\n"
         "game.dat version: %d",
         ENGINE_VERSION,
         gameEngine->engineVersion
      );
   }

   gameEngine->ROM->Read(
      offset,
      sizeof(uint32_t),
      (uint8_t*)&gameEngine->scenarioDataCRC32,
      "Unable to read scenarioDataCRC32"
   );
   ROM_ENDIAN_U4_BUFFER(&gameEngine->scenarioDataCRC32, 1);
   offset += sizeof(uint32_t);

   gameEngine->ROM->Read(
      offset,
      sizeof(uint32_t),
      (uint8_t*)&gameEngine->scenarioDataLength,
      "Unable to read scenarioDataLength"
   );
   ROM_ENDIAN_U4_BUFFER(&gameEngine->scenarioDataLength, 1);
   offset += sizeof(uint32_t);

   currentSaveIndex = 0;
   setCurrentSaveToFreshState();

   mapHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   tilesetHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   animationHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   entityTypeHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   entityHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   geometryHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   scriptHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   portraitHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   dialogHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   serialDialogHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   colorPaletteHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   stringHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   saveFlagHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   variableHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);
   imageHeader = std::make_unique<MageHeader>(gameEngine->ROM, offset);

   tilesets = std::vector<MageTileset>{ tilesetHeader->count() };
   for (uint8_t i = 0; i < tilesetHeader->count(); i++)
   {
      tilesets[i] = MageTileset{ gameEngine->ROM, i, tilesetHeader->offset(i) };
   }

   animations = std::vector<MageAnimation>{ animationHeader->count() };
   for (uint32_t i = 0; i < animationHeader->count(); i++)
   {
      animations[i] = MageAnimation{ gameEngine->ROM, animationHeader->offset(i) };
   }

   entityTypes = std::vector<MageEntityType>(entityTypeHeader->count());
   for (uint32_t i = 0; i < entityTypeHeader->count(); i++)
   {
      entityTypes[i] = MageEntityType{ gameEngine->ROM, entityTypeHeader->offset(i) };
   }

   colorPalettes = std::vector<MageColorPalette>{ colorPaletteHeader->count() };
   for (uint32_t i = 0; i < colorPaletteHeader->count(); i++)
   {
      colorPalettes[i] = MageColorPalette{ gameEngine->ROM, colorPaletteHeader->offset(i) };
   }
#ifndef DC801_EMBEDDED
   verifyAllColorPalettes("Right after it was read from gameEngine->ROM");
#endif

   mageSpeed = 0;
   isMoving = false;
   isCollisionDebugOn = false;
   isEntityDebugOn = false;
   playerHasControl = true;
   playerHasHexEditorControl = true;
   playerHasHexEditorControlClipboard = true;

   //load the map
   PopulateMapData(currentSave->currentMapId);

   readSaveFromRomIntoRam(true);
}

void MageGameControl::setCurrentSaveToFreshState()
{
   auto newSave = std::make_unique<MageSaveGame>();
   newSave->scenarioDataCRC32 = gameEngine->scenarioDataCRC32;
   currentSave = std::move(newSave);
}

void MageGameControl::readSaveFromRomIntoRam(bool silenceErrors)
{
   gameEngine->ROM->ReadSaveSlot(
      currentSaveIndex,
      sizeof(MageSaveGame),
      (uint8_t*)currentSave.get()
   );

   bool engineIncompatible = currentSave->engineVersion != gameEngine->engineVersion;
   bool saveLengthIncompatible = currentSave->saveDataLength != sizeof(MageSaveGame);
   bool scenarioIncompatible = currentSave->scenarioDataCRC32 != gameEngine->scenarioDataCRC32;
   if (engineIncompatible
      || saveLengthIncompatible
      || scenarioIncompatible)
   {
      std::string errorString = std::string("");
      if (scenarioIncompatible)
      {
         errorString.assign(
            "Save data is incompatible with current\n"
            "scenario data. Starting with fresh save."
         );
      }
      if (engineIncompatible || saveLengthIncompatible)
      {
         errorString.assign(
            "Save data is incompatible with current\n"
            "engine version. Starting with fresh save."
         );
      }
      debug_print("%s", errorString.c_str());
      if (!silenceErrors)
      {
         gameEngine->dialogControl->showSaveMessageDialog(errorString);
      }
      setCurrentSaveToFreshState();
   }
   copyNameToAndFromPlayerAndSave(false);
}

void MageGameControl::saveGameSlotSave()
{
   // do rom writes
   copyNameToAndFromPlayerAndSave(true);
   gameEngine->ROM->WriteSaveSlot(
      currentSaveIndex,
      sizeof(MageSaveGame),
      (uint8_t*)currentSave.get()
   );
   readSaveFromRomIntoRam();
}

void MageGameControl::saveGameSlotErase(uint8_t slotIndex)
{
   currentSaveIndex = slotIndex;
   setCurrentSaveToFreshState();
   saveGameSlotSave();
}

void MageGameControl::saveGameSlotLoad(uint8_t slotIndex)
{
   currentSaveIndex = slotIndex;
   readSaveFromRomIntoRam();
   //LoadMap(currentSave->currentMapId);
}


void MageGameControl::PopulateMapData(uint16_t index)
{
   currentSave->currentMapId = getValidMapId(index);

   //load new map:
   map = std::make_unique<MageMap>(gameEngine->ROM, mapHeader->offset(currentSave->currentMapId));

   if (map->EntityCount() > MAX_ENTITIES_PER_MAP)
   {
      char errorString[256];
      sprintf(
         errorString,
         "Error: Game is attempting to load more than %d entities on one map->",
         MAX_ENTITIES_PER_MAP
      );
      ENGINE_PANIC(errorString);
   }

   //debug_print(
   //	"Populate entities:"
   //);

   for (uint8_t i = 0; i < map->EntityCount(); i++)
   {
      auto offset = entityHeader->offset(map->getGlobalEntityId(i));
      //fill in entity data from gameEngine->ROM:
      auto entity = MageEntity{ gameEngine->ROM, offset };
      //debug_print(
      //	"originalId: %d, filteredId: %d, name: %s",
      //	i,
      //	filteredEntityCountOnThisMap,
      //	entity.name
      //);
      if (isEntityDebugOn)
      { // show all entities, we're in debug mode
         map->filteredMapLocalEntityIds[i] = i;
         map->mapLocalEntityIds[i] = i;
         entities[i] = std::move(entity);
         filteredEntityCountOnThisMap++;
      }
      else
      { // show only filtered entities
         bool isEntityMeantForDebugModeOnly = entity.direction & RENDER_FLAGS_IS_DEBUG;
         if (!isEntityMeantForDebugModeOnly)
         {
            map->filteredMapLocalEntityIds[i] = filteredEntityCountOnThisMap;
            map->mapLocalEntityIds[filteredEntityCountOnThisMap] = i;
            entities[filteredEntityCountOnThisMap] = std::move(entity);
            filteredEntityCountOnThisMap++;
         }
      }
   }

   playerEntityIndex = map->getPlayerEntityIndex();
   cameraFollowEntityId = playerEntityIndex;

   for (uint32_t i = 0; i < filteredEntityCountOnThisMap; i++)
   {
      //other values are filled in when getEntityRenderableData is called:
      //entities[i].updateRenderableData(this);
      //updateEntityRenderableData(map->getMapLocalEntityId(i), true);
   }
}

void MageGameControl::LoadMap(uint16_t index)
{

   //reset the fade fraction, in case player reset the map
   //while the fraction was anything other than 0
   gameEngine->frameBuffer->fadeFraction = 0;

   //close any open dialogs and return player control as well:
   gameEngine->dialogControl->closeDialog();
   playerHasControl = true;

   copyNameToAndFromPlayerAndSave(true);

   //get the data for the map:
   PopulateMapData(index);

   copyNameToAndFromPlayerAndSave(false);

   //logAllEntityScriptValues("InitScripts-Before");
   gameEngine->scriptControl->initializeScriptsOnMapLoad();
   //logAllEntityScriptValues("InitScripts-After");

   //close hex editor if open:
   if (gameEngine->hexEditor->getHexEditorState())
   {
      gameEngine->hexEditor->toggleHexEditor();
   }
   if (playerEntityIndex != NO_PLAYER)
   {
      gameEngine->hexEditor->openToEntityByIndex(playerEntityIndex);
      gameEngine->hexEditor->toggleHexEditor();
   }
}

void MageGameControl::copyNameToAndFromPlayerAndSave(bool intoSaveRam) const
{
   if (playerEntityIndex == NO_PLAYER)
   {
      return;
   }
   auto playerEntity = getEntityByMapLocalId(playerEntityIndex);
   uint8_t* destination = (uint8_t*)&playerEntity->name;
   uint8_t* source = (uint8_t*)&currentSave->name;
   if (intoSaveRam)
   {
      uint8_t* temp = destination;
      destination = source;
      source = temp;
   }
   memcpy(
      destination,
      source,
      MAGE_ENTITY_NAME_LENGTH
   );
}

void MageGameControl::applyUniversalInputs()
{
   //make map reload global regardless of player control state:
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor) && gameEngine->inputHandler->GetButtonState(KeyPress::Mem3))
   {
      gameEngine->scriptControl->mapLoadId = currentSave->currentMapId;
   }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor) && gameEngine->inputHandler->GetButtonState(KeyPress::Mem1)
      || gameEngine->inputHandler->GetButtonState(KeyPress::Mem1) && gameEngine->inputHandler->GetButtonState(KeyPress::Xor))
   {
      isEntityDebugOn = !isEntityDebugOn;
      LoadMap(currentSave->currentMapId);
      return;
   }
   //check to see if player input is allowed:
   if (gameEngine->dialogControl->isOpen || !playerHasControl && !playerHasHexEditorControl)
   {
      return;
   }
   //make sure any button handling in this function can be processed in ANY game mode.
   //that includes the game mode, hex editor mode, any menus, maps, etc.
   ledSet(LED_PAGE, gameEngine->inputHandler->GetButtonState(KeyPress::Page) ? 0xFF : 0x00);
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor)) { gameEngine->hexEditor->setHexOp(HEX_OPS_XOR); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Add)) { gameEngine->hexEditor->setHexOp(HEX_OPS_ADD); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Sub)) { gameEngine->hexEditor->setHexOp(HEX_OPS_SUB); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit128)) { gameEngine->hexEditor->runHex(0b10000000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit64)) { gameEngine->hexEditor->runHex(0b01000000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit32)) { gameEngine->hexEditor->runHex(0b00100000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit16)) { gameEngine->hexEditor->runHex(0b00010000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit8)) { gameEngine->hexEditor->runHex(0b00001000); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit4)) { gameEngine->hexEditor->runHex(0b00000100); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit2)) { gameEngine->hexEditor->runHex(0b00000010); }
   if (gameEngine->inputHandler->GetButtonState(KeyPress::Bit1)) { gameEngine->hexEditor->runHex(0b00000001); }

   if (gameEngine->inputHandler->GetButtonState(KeyPress::Xor) && gameEngine->inputHandler->GetButtonState(KeyPress::Mem0)
      || gameEngine->inputHandler->GetButtonState(KeyPress::Mem0) && gameEngine->inputHandler->GetButtonState(KeyPress::Xor))
   {
      isCollisionDebugOn = !isCollisionDebugOn;
   }
}

void MageGameControl::applyGameModeInputs(uint32_t deltaTime)
{
   //set mage speed based on if the right pad down is being pressed:
   float moveType = gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_down) ? MAGE_RUNNING_SPEED : MAGE_WALKING_SPEED;
   float howManyMsPerSecond = 1000.0;
   float whatFractionOfSpeed = moveType / howManyMsPerSecond;
   mageSpeed = whatFractionOfSpeed * MAGE_MIN_MILLIS_BETWEEN_FRAMES;
   if (gameEngine->dialogControl->isOpen)
   {
      // If interacting with the dialog this tick has closed the dialog,
      // return early before the same "advance button press triggers an on_interact below
      gameEngine->dialogControl->update();
      return;
   }
   // if there is a player on the map
   if (playerEntityIndex != NO_PLAYER)
   {
      //get useful variables for below:
      //updateEntityRenderableData(playerEntityIndex);
      auto playerEntity = getEntityByMapLocalId(playerEntityIndex);
      playerEntity->updateRenderableData(this);

      //update renderable info before proceeding:
      uint16_t playerEntityTypeId = getValidPrimaryIdType(playerEntity->primaryIdType);
      bool hasEntityType = playerEntityTypeId == ENTITY_TYPE;
      MageEntityType* entityType = hasEntityType ? &entityTypes[playerEntityTypeId] : nullptr;
      uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
      uint16_t tilesetWidth = tilesets[playerEntity->getRenderableData()->tilesetId].TileWidth();
      uint16_t tilesetHeight = tilesets[playerEntity->getRenderableData()->tilesetId].TileHeight();
      bool playerIsActioning = playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX;
      bool acceptPlayerInput = !(gameEngine->dialogControl->isOpen || !playerHasControl);

      isMoving = false;

      //check to see if the mage is pressing the action button, or currently in the middle of an action animation.
      if (acceptPlayerInput
         && (playerIsActioning || gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_left))
         )
      {
         playerIsActioning = true;
      }
      //if not actioning or resetting, handle all remaining inputs:
      else if (acceptPlayerInput)
      {
         playerVelocity = { 0,0 };
         MageEntityAnimationDirection direction = playerEntity->direction;
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left)) { playerVelocity.x -= mageSpeed; direction = WEST; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right)) { playerVelocity.x += mageSpeed; direction = EAST; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)) { playerVelocity.y -= mageSpeed; direction = NORTH; isMoving = true; }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)) { playerVelocity.y += mageSpeed; direction = SOUTH; isMoving = true; }
         if (isMoving)
         {
            playerEntity->direction = updateDirectionAndPreserveFlags(direction, playerEntity->direction);
            Point pushback = getPushBackFromTilesThatCollideWithPlayer();
            Point velocityAfterPushback = {
               playerVelocity.x + pushback.x,
               playerVelocity.y + pushback.y,
            };
            float dotProductOfVelocityAndPushback = playerVelocity.DotProduct(velocityAfterPushback);
            // false would mean that the pushback is greater than the input velocity,
            // which would glitch the player into geometry really bad, so... don't.
            if (dotProductOfVelocityAndPushback > 0)
            {
               playerEntity->x += velocityAfterPushback.x;
               playerEntity->y += velocityAfterPushback.y;
            }
         }
         if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Rjoy_right))
         {
            handleEntityInteract();
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_up))
         {
            handleEntityInteract(true);
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_center))
         {
            //no task assigned to ljoy_center in game mode
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Rjoy_center))
         {
            //no task assigned to rjoy_center in game mode
         }
         if (gameEngine->inputHandler->GetButtonState(KeyPress::Page))
         {
            //no task assigned to op_page in game mode
         }
      }


      //handle animation assignment for the player:
      //Scenario 1 - preform action:
      if (playerIsActioning
         && hasEntityType
         && entityType->AnimationCount() >= MAGE_ACTION_ANIMATION_INDEX)
      {
         playerEntity->currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
      }
      //Scenario 2 - show walk animation:
      else if (isMoving
         && hasEntityType
         && entityType->AnimationCount() >= MAGE_WALK_ANIMATION_INDEX)
      {
         playerEntity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
      }
      //Scenario 3 - show idle animation:
      else if (acceptPlayerInput)
      {
         playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
      }

      //this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
      bool isPlayingActionButShouldReturnControlToPlayer =
         hasEntityType
         && (playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX)
         && (playerEntity->currentFrameIndex == (playerEntity->getRenderableData()->frameCount - 1))
         && (playerEntity->getRenderableData()->currentFrameTicks + deltaTime >= (playerEntity->getRenderableData()->duration));

      //if the above bool is true, set the player back to their idle animation:
      if (isPlayingActionButShouldReturnControlToPlayer)
      {
         playerEntity->currentFrameIndex = 0;
         playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
      }

      //if the animation changed since the start of this function, reset to the first frame and restart the timer:
      if (previousPlayerAnimation != playerEntity->currentAnimation)
      {
         playerEntity->currentFrameIndex = 0;
         playerEntity->getRenderableData()->currentFrameTicks = 0;
      }

      //What scenarios call for an extra renderableData update?
      if (isMoving || (playerEntity->getRenderableData()->lastTilesetId != playerEntity->getRenderableData()->tilesetId))
      {
         //updateEntityRenderableData(playerEntityIndex);
         playerEntity->updateRenderableData(this);
      }
      if (!acceptPlayerInput || !playerHasHexEditorControl)
      {
         return;
      }

      //opening the hex editor is the only button press that will lag actual gameplay by one frame
      //this is to allow entity scripts to check the hex editor state before it opens to run scripts
      if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Hax))
      {
         gameEngine->hexEditor->toggleHexEditor();
      }
      gameEngine->hexEditor->applyMemRecallInputs();
   }
   else //no player on map
   {
      if (!playerHasControl)
      {
         return;
      }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_left)) { cameraPosition.x -= mageSpeed; }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_right)) { cameraPosition.x += mageSpeed; }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_up)) { cameraPosition.y -= mageSpeed; }
      if (gameEngine->inputHandler->GetButtonState(KeyPress::Ljoy_down)) { cameraPosition.y += mageSpeed; }

      if (!playerHasHexEditorControl)
      {
         return;
      }
      if (gameEngine->inputHandler->GetButtonActivatedState(KeyPress::Hax)) { gameEngine->hexEditor->toggleHexEditor(); }
      gameEngine->hexEditor->applyMemRecallInputs();
   }
}

void MageGameControl::applyCameraEffects(uint32_t deltaTime)
{
   if (cameraFollowEntityId != NO_PLAYER)
   {
      auto renderableData = getEntityRenderableDataByMapLocalId(cameraFollowEntityId);
      cameraPosition.x = renderableData->center.x - HALF_WIDTH;
      cameraPosition.y = renderableData->center.y - HALF_HEIGHT;
   }
   adjustedCameraPosition.x = cameraPosition.x;
   adjustedCameraPosition.y = cameraPosition.y;
   if (cameraShaking)
   {
      adjustedCameraPosition.x += cos(PI * 2 * cameraShakePhase) * (float)cameraShakeAmplitude;
      adjustedCameraPosition.y += sin(PI * 2 * (cameraShakePhase * 2)) * (float)cameraShakeAmplitude;
   }
}

void MageGameControl::handleEntityInteract(
   bool hack
)
{
   //interacting is impossible if there is no player entity, so return.
   if (playerEntityIndex == NO_PLAYER)
   {
      return;
   }
   auto playerRenderableData = getEntityRenderableDataByMapLocalId(playerEntityIndex);
   MageEntity::RenderableData* targetRenderableData;
   MageEntity* playerEntity = getEntityByMapLocalId(playerEntityIndex);
   MageEntity* targetEntity;
   playerRenderableData->interactBox.x = playerRenderableData->hitBox.x;
   playerRenderableData->interactBox.y = playerRenderableData->hitBox.y;
   playerRenderableData->interactBox.w = playerRenderableData->hitBox.w;
   playerRenderableData->interactBox.h = playerRenderableData->hitBox.h;
   uint8_t interactLength = 32;
   MageEntityAnimationDirection direction = getValidEntityTypeDirection(playerEntity->direction);
   if (direction == NORTH)
   {
      playerRenderableData->interactBox.y -= interactLength;
      playerRenderableData->interactBox.h = interactLength;
   }
   if (direction == EAST)
   {
      playerRenderableData->interactBox.x += playerRenderableData->interactBox.w;
      playerRenderableData->interactBox.w = interactLength;
   }
   if (direction == SOUTH)
   {
      playerRenderableData->interactBox.y += playerRenderableData->interactBox.h;
      playerRenderableData->interactBox.h = interactLength;
   }
   if (direction == WEST)
   {
      playerRenderableData->interactBox.x -= interactLength;
      playerRenderableData->interactBox.w = interactLength;
   }
   for (uint8_t i = 0; i < filteredEntityCountOnThisMap; i++)
   {
      // reset all interact states first
      targetRenderableData = &entityRenderableData[i];
      targetRenderableData->isInteracting = false;
      if (i != playerEntityIndex)
      {
         targetEntity = &entities[i];
         bool colliding = targetRenderableData->hitBox
            .Overlaps(playerRenderableData->interactBox);
          
         if (colliding)
         {
            playerRenderableData->isInteracting = true;
            targetRenderableData->isInteracting = true;
            isMoving = false;
            if (hack && playerHasHexEditorControl)
            {
               gameEngine->hexEditor->disableMovementUntilRJoyUpRelease = true;
               gameEngine->hexEditor->openToEntityByIndex(i);
            }
            else if (!hack && targetEntity->onInteractScriptId)
            {
               gameEngine->scriptControl->initScriptState(
                  gameEngine->scriptControl->getEntityInteractResumeState(i),
                  targetEntity->onInteractScriptId,
                  true
               );
            }
            break;
         }
      }
   }
}

void MageGameControl::DrawMap(uint8_t layer)
{
   int32_t camera_x = adjustedCameraPosition.x;
   int32_t camera_y = adjustedCameraPosition.y;
   uint32_t tilesPerLayer = map->Cols() * map->Rows();
   uint32_t layerAddress = map->LayerOffset(layer);
   if (layerAddress == 0)
   {
      return;
   }
   Point playerPoint = getEntityRenderableDataByMapLocalId(playerEntityIndex)->center;
   for (uint32_t i = 0; i < tilesPerLayer; i++)
   {
      auto tile_x = (int32_t)(map->TileWidth() * (i % map->Cols()));
      auto tile_y = (int32_t)(map->TileHeight() * (i / map->Cols()));
      auto x = tile_x - camera_x;
      auto y = tile_y - camera_y;

      if ((x < (-map->TileWidth()) ||
         (x > WIDTH) ||
         (y < (-map->TileHeight())) ||
         (y > HEIGHT)))
      {
         continue;
      }
      auto address = layerAddress + (i * sizeof(MageMapTile));

      auto currentTile = MageMapTile{};

      gameEngine->ROM->Read(
         address,
         sizeof(MageMapTile),
         (uint8_t*)&currentTile,
         "DrawMap Failed to read property 'currentTile'"
      );
      currentTile.tileId = ROM_ENDIAN_U2_VALUE(currentTile.tileId);
      if (currentTile.tileId == 0)
      {
         continue;
      }

      currentTile.tileId -= 1;

      const auto& tileset = GetTileset(currentTile.tilesetId);

      MageColorPalette* colorPalette = getValidColorPalette(tileset->ImageId());
      address = imageHeader->offset(tileset->ImageId());
      gameEngine->frameBuffer->drawChunkWithFlags(
         address,
         colorPalette,
         x,
         y,
         tileset->TileWidth(),
         tileset->TileHeight(),
         (currentTile.tileId % tileset->Cols()) * tileset->TileWidth(),
         (currentTile.tileId / tileset->Cols()) * tileset->TileHeight(),
         tileset->ImageWidth(),
         TRANSPARENCY_COLOR,
         currentTile.flags
      );

      if (isCollisionDebugOn)
      {
         auto geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile.tileId);
         if (geometryId)
         {
            geometryId -= 1;
            auto geometry = getGeometryFromGlobalId(geometryId);
            geometry.flipSelfByFlags(
               currentTile.flags,
               tileset->TileWidth(),
               tileset->TileHeight()
            );
            bool isMageInGeometry = false;
            if (
               playerEntityIndex != NO_PLAYER
               && playerPoint.x >= tile_x
               && playerPoint.x <= tile_x + tileset->TileWidth()
               && playerPoint.y >= tile_y
               && playerPoint.y <= tile_y + tileset->TileHeight()
               )
            {
               Point offsetPoint = {
                  playerPoint.x - tile_x,
                  playerPoint.y - tile_y,
               };
               isMageInGeometry = geometry.isPointInGeometry(
                  offsetPoint
               );
            }

            if (geometry.typeId == MageGeometryType::Point)
            {
               gameEngine->frameBuffer->drawPoint(
                  geometry.points[0].x + tile_x - camera_x,
                  geometry.points[0].y + tile_y - camera_y,
                  4,
                  isMageInGeometry ? COLOR_RED : COLOR_GREEN
               );
            }
            else
            {
               // POLYLINE segmentCount is pointCount - 1
               // POLYGON segmentCount is same as pointCount
               for (int i = 0; i < geometry.segmentCount; i++)
               {
                  auto pointA = geometry.points[i];
                  auto pointB = geometry.points[(i + 1) % geometry.pointCount];
                  gameEngine->frameBuffer->drawLine(
                     pointA.x + tile_x - camera_x,
                     pointA.y + tile_y - camera_y,
                     pointB.x + tile_x - camera_x,
                     pointB.y + tile_y - camera_y,
                     isMageInGeometry ? COLOR_RED : COLOR_GREEN

                  );
               }
            }
            geometry.draw(
               camera_x,
               camera_y,
               isMageInGeometry
               ? COLOR_RED
               : COLOR_GREEN,
               tile_x,
               tile_y
            );
         }
      }
   }
}

Point MageGameControl::getPushBackFromTilesThatCollideWithPlayer()
{
   MageGeometry mageCollisionSpokes = MageGeometry(MageGeometryType::Polygon, MAGE_COLLISION_SPOKE_COUNT);
   float maxSpokePushbackLengths[MAGE_COLLISION_SPOKE_COUNT];
   Point maxSpokePushbackVectors[MAGE_COLLISION_SPOKE_COUNT];
   auto playerRenderableData = getEntityRenderableDataByMapLocalId(playerEntityIndex);
   uint32_t tilesPerLayer = map->Cols() * map->Rows();
   uint32_t layerAddress = 0;
   uint32_t address = 0;
   Rect playerRect = {
      playerRenderableData->hitBox.x,
      playerRenderableData->hitBox.y,
      playerRenderableData->hitBox.w,
      playerRenderableData->hitBox.h,
   };
   int16_t abs_x = abs(playerVelocity.x);
   int16_t abs_y = abs(playerVelocity.y);
   if (abs_x)
   {
      playerRect.w += abs_x;
      if (playerVelocity.x < 0)
      {
         playerRect.x += playerVelocity.x;
      }
   }
   if (abs_y)
   {
      playerRect.h += abs_y;
      if (playerVelocity.y < 0)
      {
         playerRect.y += playerVelocity.y;
      }
   }
   Point tileTopLeftPoint = {
      0,
      0,
   };
   int32_t x = 0;
   int32_t y = 0;
   uint16_t geometryId = 0;
   auto pushback = Point{};
   auto currentTile = MageMapTile{};
   Point playerPoint = playerRenderableData->center;
   // get the geometry for where the player is
   int32_t x0 = playerRect.x;
   int32_t x1 = x0 + playerRect.w;
   int32_t y0 = playerRect.y;
   int32_t y1 = y0 + playerRect.h;
   float playerSpokeRadius = playerRenderableData->hitBox.w / 1.5;
   float angleOffset = (
      atan2(playerVelocity.y, playerVelocity.x)
      - (PI / 2)
      + ((PI / MAGE_COLLISION_SPOKE_COUNT) / 2)
      );
   for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
   {
      maxSpokePushbackLengths[i] = -INFINITY;
      maxSpokePushbackVectors[i].x = 0;
      maxSpokePushbackVectors[i].y = 0;
      Point* spokePoint = &mageCollisionSpokes.points[i];
      float angle = (
         (((float)i) * (PI / MAGE_COLLISION_SPOKE_COUNT))
         + angleOffset
         );
      spokePoint->x = (
         (cos(angle) * playerSpokeRadius)
         + playerVelocity.x
         + playerPoint.x
         );
      spokePoint->y = (
         (sin(angle) * playerSpokeRadius)
         + playerVelocity.y
         + playerPoint.y
         );
   }
   if (isCollisionDebugOn)
   {
      gameEngine->frameBuffer->drawRect(
         playerRect.x - cameraPosition.x,
         playerRect.y - cameraPosition.y,
         playerRect.w,
         playerRect.h,
         COLOR_BLUE
      );
      for (int i = 0; i < mageCollisionSpokes.segmentCount; i++)
      {
         auto point = mageCollisionSpokes.points[i];
         gameEngine->frameBuffer->drawLine(
            point.x - adjustedCameraPosition.x,
            point.y - adjustedCameraPosition.y,
            playerPoint.x - adjustedCameraPosition.x,
            playerPoint.y - adjustedCameraPosition.y,
            COLOR_PURPLE
         );
      }
   }
   uint8_t layerCount = map->LayerCount();
   for (int layerIndex = 0; layerIndex < layerCount; layerIndex++)
   {
      layerAddress = map->LayerOffset(layerIndex);
      for (uint32_t i = 0; i < tilesPerLayer; i++)
      {
         tileTopLeftPoint.x = (int32_t)(map->TileWidth() * (i % map->Cols()));
         tileTopLeftPoint.y = (int32_t)(map->TileHeight() * (i / map->Cols()));
         x = tileTopLeftPoint.x - x0;
         y = tileTopLeftPoint.y - y0;
         if (
            (x < -map->TileWidth() ||
               (x > playerRect.w) ||
               (y < -map->TileHeight()) ||
               (y > playerRect.h))
            )
         {
            continue;
         }
         address = layerAddress + (i * sizeof(MageMapTile));

         gameEngine->ROM->Read(
            address,
            sizeof(MageMapTile),
            (uint8_t*)&currentTile,
            "getPushBackFromTilesThatCollideWithPlayer Failed to read property 'currentTile'"
         );

         currentTile.tileId = ROM_ENDIAN_U2_VALUE(currentTile.tileId);

         if (currentTile.tileId == 0)
         {
            continue;
         }

         currentTile.tileId -= 1;

         auto tileset = GetTileset(currentTile.tilesetId);

         if (!tileset->Valid())
         {
            continue;
         }
         geometryId = tileset->getLocalGeometryIdByTileIndex(currentTile.tileId);
         if (geometryId)
         {
            for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
            {
               float angle = (
                  (((float)i) * (PI / MAGE_COLLISION_SPOKE_COUNT))
                  + angleOffset
                  );
               Point* spokePoint = &mageCollisionSpokes.points[i];
               spokePoint->x = (
                  (
                     cos(angle)
                     * playerSpokeRadius
                     )
                  + playerVelocity.x
                  + playerPoint.x
                  - tileTopLeftPoint.x
                  );
               spokePoint->y = (
                  (
                     sin(angle)
                     * playerSpokeRadius
                     )
                  + playerVelocity.y
                  + playerPoint.y
                  - tileTopLeftPoint.y
                  );
            }
            geometryId--;

            auto geometry = getGeometryFromGlobalId(geometryId);
            geometry.flipSelfByFlags(
               currentTile.flags,
               tileset->TileWidth(),
               tileset->TileHeight()
            );

            Point offsetPoint = {
               playerPoint.x - tileTopLeftPoint.x,
               playerPoint.y - tileTopLeftPoint.y,
            };

            bool isMageInGeometry = MageGeometry::pushADiagonalsVsBEdges(
               &offsetPoint,
               &mageCollisionSpokes,
               maxSpokePushbackLengths,
               maxSpokePushbackVectors,
               &geometry,
               gameEngine->frameBuffer.get()
            );
            if (isCollisionDebugOn)
            {
               geometry.draw(
                  adjustedCameraPosition.x,
                  adjustedCameraPosition.y,
                  isMageInGeometry ? COLOR_RED : COLOR_YELLOW,
                  tileTopLeftPoint.x,
                  tileTopLeftPoint.y
               );
            }
         }
      }
   }
   uint8_t collisionCount = 0;
   for (uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++)
   {
      if (maxSpokePushbackLengths[i] != -INFINITY)
      {
         collisionCount++;
         pushback.x += maxSpokePushbackVectors[i].x;
         pushback.y += maxSpokePushbackVectors[i].y;
      };
   }
   if (collisionCount > 0)
   {
      pushback.x /= collisionCount;
      pushback.y /= collisionCount;
      gameEngine->frameBuffer->drawLine(
         playerPoint.x - adjustedCameraPosition.x,
         playerPoint.y - adjustedCameraPosition.y,
         playerPoint.x + pushback.x - adjustedCameraPosition.x,
         playerPoint.y + pushback.y - adjustedCameraPosition.y,
         COLOR_RED
      );
   }
   return pushback;
}

uint16_t MageGameControl::getValidMapId(uint16_t mapId)
{
   return mapId % (mapHeader->count());
}

uint8_t MageGameControl::getValidPrimaryIdType(uint8_t primaryIdType)
{
   //always return a valid primaryId:
   return primaryIdType % MageEntityPrimaryIdType::NUM_PRIMARY_ID_TYPES;
}

uint16_t MageGameControl::getValidAnimationId(uint16_t animationId)
{
   //always return a valid animation ID.
   return animationId % (animationHeader->count());
}

uint16_t MageGameControl::getValidAnimationFrame(uint16_t animationFrame, uint16_t animationId)
{
   //use failover animation if an invalid animationId is submitted to the function.
   //There's a good chance if that happens, it will break things.
   animationId = getValidAnimationId(animationId);

   //always return a valid animation frame for the animationId submitted.
   return animationFrame % animations[animationId].FrameCount();
}

uint16_t MageGameControl::getValidEntityTypeId(uint16_t entityTypeId)
{
   //always return a valid entity type for the entityTypeId submitted.
   return entityTypeId % entityTypeHeader->count();
}

MageEntityType* MageGameControl::getValidEntityType(uint16_t entityTypeId)
{
   //always return a valid entity type for the entityTypeId submitted.
   return &entityTypes[getValidEntityTypeId(entityTypeId)];
}

uint16_t MageGameControl::getValidMapLocalScriptId(uint16_t scriptId)
{
   return scriptId % map->ScriptCount();
}

uint16_t MageGameControl::getValidGlobalScriptId(uint16_t scriptId)
{
   return scriptId % scriptHeader->count();
}

uint8_t MageGameControl::getValidEntityTypeAnimationId(uint8_t entityTypeAnimationId, uint16_t entityTypeId)
{
   //use failover animation if an invalid animationId is submitted to the function.
   //There's a good chance if that happens, it will break things.
   entityTypeId = entityTypeId % entityTypeHeader->count();

   //always return a valid entity type animation ID for the entityTypeAnimationId submitted.
   return entityTypeAnimationId % entityTypes[entityTypeId].AnimationCount();
}

MageEntityAnimationDirection MageGameControl::getValidEntityTypeDirection(MageEntityAnimationDirection direction)
{
   return (MageEntityAnimationDirection)((direction & RENDER_FLAGS_DIRECTION_MASK) % NUM_DIRECTIONS);
}

MageEntityAnimationDirection MageGameControl::updateDirectionAndPreserveFlags(MageEntityAnimationDirection desired, MageEntityAnimationDirection previous)
{
   return (MageEntityAnimationDirection)(
      getValidEntityTypeDirection(desired)
      | (previous & RENDER_FLAGS_IS_DEBUG)
      | (previous & RENDER_FLAGS_IS_GLITCHED)
      );
}

uint32_t MageGameControl::getScriptAddressFromGlobalScriptId(uint32_t scriptId)
{
   //first validate the scriptId:
   scriptId = getValidGlobalScriptId(scriptId);

   //then return the address offset for that script from the scriptHeader:
   return scriptHeader->offset(scriptId);
}

void MageGameControl::updateEntityRenderableData(uint8_t mapLocalEntityId, bool skipTilesetCheck)
{
   if (mapLocalEntityId >= MAX_ENTITIES_PER_MAP)
   {
      char errorString[256];
      sprintf(
         errorString,
         "We somehow have an entity mapLocalEntityId\n"
         "greater than MAX_ENTITIES_PER_MAP:\n"
         "Index:%d\n"
         "MAX_ENTITIES_PER_MAP:%d\n",
         mapLocalEntityId,
         MAX_ENTITIES_PER_MAP
      );
      ENGINE_PANIC(
         errorString
      );
   }

   //but make a pointer to the real deal in case it needs to be moved by hacking changes
   MageEntity* entity = getEntityByMapLocalId(mapLocalEntityId);
   entity->updateRenderableData(this);
}

void MageGameControl::UpdateEntities(uint32_t deltaTime)
{
   //cycle through all map entities:
   for (uint8_t i = 0; i < filteredEntityCountOnThisMap; i++)
   {
      uint8_t mapLocalEntityId = map->getMapLocalEntityId(i);
      //tileset entities are not animated, return if entity is type tileset.
      if (entities[i].primaryIdType == MageEntityPrimaryIdType::TILESET)
      {
         //Update Entity in case it's been hacked.
         updateEntityRenderableData(mapLocalEntityId);
         continue;
      }
      //increment the frame ticks based on the delta_time since the last check:
      entityRenderableData[i].currentFrameTicks += deltaTime;

      //update entity info:
      updateEntityRenderableData(mapLocalEntityId);

      //check for frame change and adjust if needed:
      if (entityRenderableData[i].currentFrameTicks >= entityRenderableData[i].duration)
      {
         //increment frame and reset tick counter:
         entities[i].currentFrameIndex++;
         entityRenderableData[i].currentFrameTicks = 0;

         //reset animation to first frame after max frame is reached:
         if (entities[i].currentFrameIndex >= entityRenderableData[i].frameCount)
         {
            entities[i].currentFrameIndex = 0;
         }
         //update the entity info again with the corrected frame index:
         updateEntityRenderableData(mapLocalEntityId);
      }
   }
}

void MageGameControl::DrawEntities()
{
   int32_t cameraX = adjustedCameraPosition.x;
   int32_t cameraY = adjustedCameraPosition.y;
   //first sort entities by their y values:
   std::sort(entities.begin(), entities.end(), [](const MageEntity& entity1, const MageEntity& entity2) { return entity1.y < entity2.y; });

   uint8_t filteredPlayerEntityIndex = map->getFilteredEntityId(playerEntityIndex);

   //now that we've got a sorted array with the lowest y values first,
   //iterate through it and draw the entities one by one:
   for (uint8_t i = 0; i < filteredEntityCountOnThisMap; i++)
   {
      //uint8_t entityIndex = entitySortOrder[i];
      MageEntity* entity = &entities[i];
      auto renderableData = entity->getRenderableData();
      MageTileset* tileset = &tilesets[renderableData->tilesetId];
      uint16_t imageId = tileset->ImageId();
      uint16_t tileWidth = tileset->TileWidth();
      uint16_t tileHeight = tileset->TileHeight();
      uint16_t cols = tileset->Cols();
      uint16_t tileId = renderableData->tileId;
      uint32_t address = imageHeader->offset(imageId);
      uint16_t source_x = (tileId % cols) * tileWidth;
      uint16_t source_y = (tileId / cols) * tileHeight;
      int32_t x = entity->x - cameraX;
      int32_t y = entity->y - cameraY - tileHeight;
      gameEngine->frameBuffer->drawChunkWithFlags(
         address,
         getValidColorPalette(imageId),
         x,
         y,
         tileWidth,
         tileHeight,
         source_x,
         source_y,
         tileset->ImageWidth(),
         TRANSPARENCY_COLOR,
         renderableData->renderFlags
      );

      if (isCollisionDebugOn)
      {
         gameEngine->frameBuffer->drawRect(
            x,
            y,
            tileWidth,
            tileHeight,
            COLOR_LIGHTGREY
         );
         gameEngine->frameBuffer->drawRect(
            renderableData->hitBox.x - cameraX,
            renderableData->hitBox.y - cameraY,
            renderableData->hitBox.w,
            renderableData->hitBox.h,
            renderableData->isInteracting
            ? COLOR_RED
            : COLOR_GREEN
         );
         gameEngine->frameBuffer->drawPoint(
            renderableData->center.x - cameraX,
            renderableData->center.y - cameraY,
            5,
            COLOR_BLUE
         );
         if (map->getPlayerEntityIndex() == filteredPlayerEntityIndex)
         {
            gameEngine->frameBuffer->drawRect(
               renderableData->interactBox.x - cameraX,
               renderableData->interactBox.y - cameraY,
               renderableData->interactBox.w,
               renderableData->interactBox.h,
               renderableData->isInteracting ? COLOR_BLUE : COLOR_YELLOW
            );
         }
      }
   }
}

void MageGameControl::DrawGeometry()
{
   int32_t cameraX = adjustedCameraPosition.x;
   int32_t cameraY = adjustedCameraPosition.y;
   Point* playerPosition{ nullptr };
   bool isColliding = false;
   bool isPlayerPresent = playerEntityIndex != NO_PLAYER;
   if (isPlayerPresent)
   {
      auto renderable = getEntityRenderableDataByMapLocalId(playerEntityIndex);
      playerPosition = &renderable->center;
   }

   for (uint16_t i = 0; i < map->GeometryCount(); i++)
   {
      MageGeometry geometry = getGeometryFromMapLocalId(i);
      if (isPlayerPresent)
      {
         isColliding = geometry.isPointInGeometry(*playerPosition);
      }
      geometry.draw(
         cameraX,
         cameraY,
         isColliding
         ? COLOR_RED
         : COLOR_GREEN
      );
   }
}

MageGeometry MageGameControl::getGeometryFromMapLocalId(uint16_t mapLocalGeometryId)
{
   return MageGeometry{ gameEngine->ROM,
      geometryHeader->offset(
         map->getGlobalGeometryId(mapLocalGeometryId) % geometryHeader->count()
      )
   };
}

MageGeometry MageGameControl::getGeometryFromGlobalId(uint16_t globalGeometryId)
{
   return MageGeometry{ gameEngine->ROM,
      geometryHeader->offset(
         globalGeometryId % geometryHeader->count()
      )
   };
}

MageColorPalette* MageGameControl::getValidColorPalette(uint16_t colorPaletteId)
{
   return &colorPalettes[colorPaletteId % colorPaletteHeader->count()];
}

MageEntity::RenderableData* MageGameControl::getEntityRenderableDataByMapLocalId(uint8_t mapLocalEntityId)
{
   return &entityRenderableData[map->getFilteredEntityId(mapLocalEntityId)];
}

const MageEntity* MageGameControl::getEntityByMapLocalId(uint8_t mapLocalEntityId) const
{
   auto returnVal = &entities[map->getFilteredEntityId(mapLocalEntityId)];
   return returnVal;
}

MageEntity* MageGameControl::getEntityByMapLocalId(uint8_t mapLocalEntityId)
{
   auto returnVal = &entities[map->getFilteredEntityId(mapLocalEntityId)];
   return returnVal;
}

MageTileset* MageGameControl::getValidTileset(uint16_t tilesetId)
{
   return &tilesets[tilesetId % tilesetHeader->count()];
}

std::string MageGameControl::getString(
   uint16_t stringId,
   int16_t mapLocalEntityId
)
{
   uint16_t sanitizedIndex = stringId % stringHeader->count();
   uint32_t start = stringHeader->offset(sanitizedIndex);
   uint32_t length = stringHeader->length(sanitizedIndex);
   std::string romString(length, '\0');
   uint8_t* romStringPointer = (uint8_t*)&romString[0];
   gameEngine->ROM->Read(
      start,
      length,
      romStringPointer,
      "Failed to load string data."
   );
   std::string outputString(0, '\0');
   volatile size_t cursor = 0;
   volatile size_t variableStartPosition = 0;
   volatile size_t variableEndPosition = 0;
   volatile size_t replaceCount = 0;
   while ((variableStartPosition = romString.find("%%", variableStartPosition)) != std::string::npos)
   {
      outputString += romString.substr(
         cursor,
         (variableStartPosition - cursor)
      );
      variableEndPosition = romString.find("%%", variableStartPosition + 1) + 1;
      std::string variableHolder = romString.substr(
         variableStartPosition + 2,
         variableStartPosition - (variableEndPosition - 2)
      );
      int parsedEntityIndex = std::stoi(variableHolder);
      int16_t entityIndex = gameEngine->scriptActions->getUsefulEntityIndexFromActionEntityId(
         parsedEntityIndex,
         mapLocalEntityId
      );
      if (entityIndex != NO_PLAYER)
      {
         std::string entityName = getEntityNameStringById(entityIndex);
         outputString += entityName.c_str();
      }
      else
      {
         char missingError[MAGE_ENTITY_NAME_LENGTH + 1];
         sprintf(
            missingError,
            "MISSING: %d",
            parsedEntityIndex
         );
         outputString += missingError;
      }
      variableStartPosition = variableEndPosition + 1;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += romString.substr(cursor, romString.length() - 1);
      romString = outputString;
      outputString = "";
   }
   cursor = 0;
   variableStartPosition = 0;
   variableEndPosition = 0;
   replaceCount = 0;
   while ((variableStartPosition = romString.find("$$", variableStartPosition)) != std::string::npos)
   {
      outputString += romString.substr(
         cursor,
         (variableStartPosition - cursor)
      );
      variableEndPosition = romString.find("$$", variableStartPosition + 1) + 1;
      std::string variableHolder = romString.substr(
         variableStartPosition + 2,
         variableStartPosition - (variableEndPosition - 2)
      );
      int parsedVariableIndex = std::stoi(variableHolder);
      uint16_t variableValue = currentSave->scriptVariables[parsedVariableIndex];
      std::string valueString = std::to_string(variableValue);
      outputString += valueString.c_str();
      variableStartPosition = variableEndPosition + 1;
      cursor = variableStartPosition;
      replaceCount++;
   }
   if (replaceCount)
   {
      outputString += romString.substr(cursor, romString.length() - 1);
      romString = outputString;
      outputString = "";
   }
   // why wrap it in another string at the end?
   // Because somehow, extra null bytes were being explicitly stored in the return value's length,
   // and this should crop them out from the return value
   return std::string(romString.c_str());
}

uint32_t MageGameControl::getImageAddress(uint16_t imageId)
{
   return imageHeader->offset(imageId % imageHeader->count());
}

uint32_t MageGameControl::getPortraitAddress(uint16_t portraitId)
{
   return portraitHeader->offset(portraitId % portraitHeader->count());
}

uint32_t MageGameControl::getSerialDialogAddress(uint16_t serialDialogId)
{
   return serialDialogHeader->offset(serialDialogId % serialDialogHeader->count());
}

std::string MageGameControl::getEntityNameStringById(int8_t mapLocalEntityId)
{
   MageEntity* entity = getEntityByMapLocalId(mapLocalEntityId);
   std::string entityName(MAGE_ENTITY_NAME_LENGTH + 1, '\0');
   entityName.assign(entity->name, MAGE_ENTITY_NAME_LENGTH);
   return entityName;
}

#ifndef DC801_EMBEDDED
void MageGameControl::verifyAllColorPalettes(const char* errorTriggerDescription)
{
   // for (uint32_t i = 0; i < colorPaletteHeader->count(); i++) {
   // 	colorPalettes[i].verifyColors(errorTriggerDescription);
   // }
}
#endif

void MageGameControl::logAllEntityScriptValues(const char* string)
{
   debug_print("%s", string);
   for (uint8_t i = 0; i < filteredEntityCountOnThisMap; i++)
   {
      //Initialize the script ResumeStateStructs to default values for this map->
      MageEntity* entity = &entities[i];
      debug_print(
         "Index: %02d; EntityName: %12s; tick: %05d/0x%04X; interact: %05d/0x%04X;",
         i,
         entity->name,
         entity->onTickScriptId,
         entity->onTickScriptId,
         entity->onInteractScriptId,
         entity->onInteractScriptId
      );
   }
}
