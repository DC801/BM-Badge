#include "mage_game_control.h"

#include "EngineROM.h"
#include "FrameBuffer.h"
#include "mage_hex.h"
#include "mage_script_control.h"
#include "mage_dialog_control.h"

extern MageHexEditor *MageHex;
extern MageDialogControl *MageDialog;
extern MageScriptControl *MageScript;

extern FrameBuffer *mage_canvas;


// Initializer list, default construct values
//   Don't waste any resources constructing unique_ptr's
//   Each header is constructed with offsets from the previous
MageGameControl::MageGameControl()
{
	uint32_t offset = ENGINE_ROM_MAGIC_HASH_LENGTH; //skip 'MAGEGAME' + crc32 string at front of .dat file

	currentSaveIndex = 0;
	MageSaveGame newSave = {};
	currentSave = newSave;

	mapHeader = MageHeader(offset);
	offset += mapHeader.size();

	tilesetHeader = MageHeader(offset);
	offset += tilesetHeader.size();

	animationHeader = MageHeader(offset);
	offset += animationHeader.size();

	entityTypeHeader = MageHeader(offset);
	offset += entityTypeHeader.size();

	entityHeader = MageHeader(offset);
	offset += entityHeader.size();

	geometryHeader = MageHeader(offset);
	offset += geometryHeader.size();

	scriptHeader = MageHeader(offset);
	offset += scriptHeader.size();

	portraitHeader = MageHeader(offset);
	offset += portraitHeader.size();

	dialogHeader = MageHeader(offset);
	offset += dialogHeader.size();

	colorPaletteHeader = MageHeader(offset);
	offset += colorPaletteHeader.size();

	stringHeader = MageHeader(offset);
	offset += stringHeader.size();

	saveFlagHeader = MageHeader(offset);
	offset += saveFlagHeader.size();

	variableHeader = MageHeader(offset);
	offset += variableHeader.size();

	imageHeader = MageHeader(offset);
	offset += imageHeader.size();

	tilesets = std::make_unique<MageTileset[]>(tilesetHeader.count());

	for (uint32_t i = 0; i < tilesetHeader.count(); i++)
	{
		tilesets[i] = MageTileset(i, tilesetHeader.offset(i));
	}

	animations = std::make_unique<MageAnimation[]>(animationHeader.count());

	for (uint32_t i = 0; i < animationHeader.count(); i++)
	{
		animations[i] = MageAnimation(animationHeader.offset(i));
	}

	entityTypes = std::make_unique<MageEntityType[]>(entityTypeHeader.count());

	for (uint32_t i = 0; i < entityTypeHeader.count(); i++)
	{
		entityTypes[i] = MageEntityType(entityTypeHeader.offset(i));
	}

	entities = std::make_unique<MageEntity[]>(MAX_ENTITIES_PER_MAP);

	playerEntityIndex = NO_PLAYER;

	entityRenderableData = std::make_unique<MageEntityRenderableData[]>(MAX_ENTITIES_PER_MAP);

	colorPalettes = std::make_unique<MageColorPalette[]>(colorPaletteHeader.count());

	for (uint32_t i = 0; i < colorPaletteHeader.count(); i++)
	{
		colorPalettes[i] = MageColorPalette(colorPaletteHeader.offset(i));
	}
	#ifdef DC801_DESKTOP
	verifyAllColorPalettes("Right after it was read from ROM");
	#endif //DC801_DESKTOP

	mageSpeed = 0;
	isMoving = false;
	isCollisionDebugOn = false;
	playerHasControl = true;
	playerHasHexEditorControl = true;

	//load the map
	PopulateMapData(currentSave.currentMapId);

	saveGameSlotLoad(currentSaveIndex);
}

uint32_t MageGameControl::Size() const
{
	uint32_t size = (
		mapHeader.size() +
		tilesetHeader.size() +
		animationHeader.size() +
		entityTypeHeader.size() +
		entityHeader.size() +
		geometryHeader.size() +
		scriptHeader.size() +
		portraitHeader.size() +
		dialogHeader.size() +
		colorPaletteHeader.size() +
		stringHeader.size() +
		saveFlagHeader.size() +
		variableHeader.size() +
		imageHeader.size() +
		map.Size() +
		sizeof(mageSpeed) +
		sizeof(isMoving) +
		sizeof(playerEntityIndex) +
		sizeof(currentSaveIndex) +
		sizeof(currentSave) +
		sizeof(playerHasControl) +
		sizeof(playerHasHexEditorControl) +
		sizeof(isCollisionDebugOn) +
		sizeof(cameraShakeAmplitude) +
		sizeof(cameraFollowEntityId) +
		sizeof(cameraShakePhase) +
		sizeof(cameraPosition) +
		sizeof(playerVelocity) +
		sizeof(cameraShaking) +
		sizeof(adjustedCameraPosition) +
		sizeof(MageEntity)*MAX_ENTITIES_PER_MAP+ //entities array
		sizeof(MageEntityRenderableData)*MAX_ENTITIES_PER_MAP //entityRenderableData array
	);

	for (uint32_t i = 0; i < tilesetHeader.count(); i++)
	{
		size += tilesets[i].Size();
	}

	for (uint32_t i = 0; i < animationHeader.count(); i++)
	{
		size += animations[i].Size();
	}

	for (uint32_t i = 0; i < entityTypeHeader.count(); i++)
	{
		size += entityTypes[i].Size();
	}

	for (uint32_t i = 0; i < colorPaletteHeader.count(); i++)
	{
		size += colorPalettes[i].size();
	}

	return size;
}

void MageGameControl::readSaveFromRomIntoRam() {
	EngineROM_ReadSaveSlot(
		currentSaveIndex,
		sizeof(MageSaveGame),
		(uint8_t *)&currentSave
	);
	// copy save ram name into current player name
	copyNameToAndFromPlayerAndSave(false);
}

void MageGameControl::saveGameSlotSave() {
	// do rom writes
	copyNameToAndFromPlayerAndSave(true);
	EngineROM_WriteSaveSlot(
		currentSaveIndex,
		sizeof(MageSaveGame),
		(uint8_t *)&currentSave
	);
	readSaveFromRomIntoRam();
}

void MageGameControl::saveGameSlotErase(uint8_t slotIndex) {
	currentSaveIndex = slotIndex;
	MageSaveGame blankSave = {};
	currentSave = blankSave;
	saveGameSlotSave();
}

void MageGameControl::saveGameSlotLoad(uint8_t slotIndex) {
	currentSaveIndex = slotIndex;
	readSaveFromRomIntoRam();
	//LoadMap(currentSave.currentMapId);
}

const MageTileset& MageGameControl::Tileset(uint32_t index) const
{
	static MageTileset tileset;
	if (!tilesets) return tileset;

	if (tilesetHeader.count() > index)
	{
		return tilesets[index];
	}

	return tileset;
}

MageMap& MageGameControl::Map()
{
	return map;
}

MageEntity MageGameControl::LoadEntity(uint32_t address)
{
	uint32_t size = 0;
	MageEntity entity;

	//Read Name
	EngineROM_Read(
		address,
		MAGE_ENTITY_NAME_LENGTH,
		(uint8_t *)entity.name,
		"Failed to read Entity property 'name'"
	);

	//increment address
	address += MAGE_ENTITY_NAME_LENGTH;

	// Read entity.x
	EngineROM_Read(
		address,
		sizeof(entity.x),
		(uint8_t *)&entity.x,
		"Failed to read Entity property 'x'"
	);

	// Endianness conversion
	entity.x = ROM_ENDIAN_U2_VALUE(entity.x);

	//increment address
	address += sizeof(entity.x);

	// Read entity.y
	EngineROM_Read(
		address,
		sizeof(entity.y),
		(uint8_t *)&entity.y,
		"Failed to read Entity property 'y'"
	);

	// Endianness conversion
	entity.y = ROM_ENDIAN_U2_VALUE(entity.y);

	//increment address
	address += sizeof(entity.y);

	// Read entity.onInteractScriptId
	EngineROM_Read(
		address,
		sizeof(entity.onInteractScriptId),
		(uint8_t *)&entity.onInteractScriptId,
		"Failed to read Entity property 'onInteractScriptId'"
	);

	// Endianness conversion
	entity.onInteractScriptId = ROM_ENDIAN_U2_VALUE(entity.onInteractScriptId);

	//increment address
	address += sizeof(entity.onInteractScriptId);

	// Read entity.onTickScript
	EngineROM_Read(
		address,
		sizeof(entity.onTickScriptId),
		(uint8_t *)&entity.onTickScriptId,
		"Failed to read Entity property 'onTickScriptId'"
	);

	// Endianness conversion
	entity.onTickScriptId = ROM_ENDIAN_U2_VALUE(entity.onTickScriptId);

	//increment address
	address += sizeof(entity.onTickScriptId);

	// Read entity.primaryId
	EngineROM_Read(
		address,
		sizeof(entity.primaryId),
		(uint8_t *)&entity.primaryId,
		"Failed to read Entity property 'primaryId'"
	);

	// Endianness conversion
	entity.primaryId = ROM_ENDIAN_U2_VALUE(entity.primaryId);

	//increment address
	address += sizeof(entity.primaryId);

	// Read entity.secondaryId
	EngineROM_Read(
		address,
		sizeof(entity.secondaryId),
		(uint8_t *)&entity.secondaryId,
		"Failed to read Entity property 'secondaryId'"
	);

	// Endianness conversion
	entity.secondaryId = ROM_ENDIAN_U2_VALUE(entity.secondaryId);

	//increment address
	address += sizeof(entity.secondaryId);

	// Read entity.primaryIdType
	EngineROM_Read(
		address,
		sizeof(entity.primaryIdType),
		(uint8_t *)&entity.primaryIdType,
		"Failed to read Entity property 'primaryIdType'"
	);

	//increment address
	address += sizeof(entity.primaryIdType);

	// Read entity.currentAnimation
	EngineROM_Read(
		address,
		sizeof(entity.currentAnimation),
		(uint8_t *)&entity.currentAnimation,
		"Failed to read Entity property 'currentAnimation'"
	);

	//increment address
	address += sizeof(entity.currentAnimation);

	// Read entity.currentFrame
	EngineROM_Read(
		address,
		sizeof(entity.currentFrame),
		(uint8_t *)&entity.currentFrame,
		"Failed to read Entity property 'currentFrame'"
	);

	//increment address
	address += sizeof(entity.currentFrame);

	// Read entity.direction
	EngineROM_Read(
		address,
		sizeof(entity.direction),
		(uint8_t *)&entity.direction,
		"Failed to read Entity property 'direction'"
	);

	//increment address
	address += sizeof(entity.direction);

	// Read entity.hackableStateA
	EngineROM_Read(
		address,
		sizeof(entity.hackableStateA),
		(uint8_t *)&entity.hackableStateA,
		"Failed to read Entity property 'hackableStateA'"
	);
	//increment address
	address += sizeof(entity.hackableStateA);

	// Read entity.hackableStateB
	EngineROM_Read(
		address,
		sizeof(entity.hackableStateB),
		(uint8_t *)&entity.hackableStateB,
		"Failed to read Entity property 'hackableStateB'"
	);
	//increment address
	address += sizeof(entity.hackableStateB);

	// Read entity.hackableStateC
	EngineROM_Read(
		address,
		sizeof(entity.hackableStateC),
		(uint8_t *)&entity.hackableStateC,
		"Failed to read Entity property 'hackableStateC'"
	);
	//increment address
	address += sizeof(entity.hackableStateC);

	// Read entity.hackableStateD
	EngineROM_Read(
		address,
		sizeof(entity.hackableStateD),
		(uint8_t *)&entity.hackableStateD,
		"Failed to read Entity property 'hackableStateD'"
	);
	//increment address
	address += sizeof(entity.hackableStateD);

	return entity;
}

void MageGameControl::PopulateMapData(uint16_t index)
{
	currentSave.currentMapId = getValidMapId(index);

	//load new map:
	map = MageMap(mapHeader.offset(currentSave.currentMapId));

	#ifdef DC801_DESKTOP
		if(map.EntityCount() > MAX_ENTITIES_PER_MAP)
		{
			fprintf(stderr, "Error: Game is attempting to load more than %d entities on one map.", MAX_ENTITIES_PER_MAP);
		}
	#endif

	for (uint32_t i = 0; i < MAX_ENTITIES_PER_MAP; i++)
	{
		//only populate the entities that are on the current map.
		if(i < entityHeader.count())
		{
			//fill in entity data from ROM:
			entities[i] = LoadEntity(entityHeader.offset(map.getGlobalEntityId(i)));
		}
	}

	playerEntityIndex = map.getMapLocalPlayerEntityIndex();
	cameraFollowEntityId = playerEntityIndex;

	for (uint32_t i = 0; i < MAX_ENTITIES_PER_MAP; i++)
	{
		//all entities start with 0 frame ticks
		entityRenderableData[i].currentFrameTicks = 0;
		//other values are filled in when getEntityRenderableData is called:
		updateEntityRenderableData(i, true);
	}
}

void MageGameControl::initializeScriptsOnMapLoad()
{
	//initialize the script ResumeStateStructs:
	MageScript->initScriptState(MageScript->getMapLoadResumeState(), map.getMapLocalMapOnLoadScriptId() , false);
	MageScript->initScriptState(MageScript->getMapTickResumeState(), map.getMapLocalMapOnTickScriptId() , false);
	for (uint32_t i = 0; i < MAX_ENTITIES_PER_MAP; i++)
	{
		//Initialize the script ResumeStateStructs to default values for this map.
		MageScript->initScriptState(MageScript->getEntityTickResumeState(i), entities[i].onTickScriptId, false);
		MageScript->initScriptState(MageScript->getEntityInteractResumeState(i), entities[i].onInteractScriptId, false);
	}

	//call the map's load script:
	//note all other calls to this function should set the isFirstRun argument to false.
	MageScript->handleMapOnLoadScript(true);
}

void MageGameControl::LoadMap(uint16_t index)
{

	//close any open dialogs and return player control as well:
	MageDialog->closeDialog();
	playerHasControl = true;

	copyNameToAndFromPlayerAndSave(true);

	//get the data for the map:
	PopulateMapData(index);

	copyNameToAndFromPlayerAndSave(false);

	initializeScriptsOnMapLoad();

	//close hex editor if open:
	if(MageHex->getHexEditorState()) {
		MageHex->toggleHexEditor();
	}
	if(playerEntityIndex != NO_PLAYER) {
		MageHex->openToEntityByIndex(playerEntityIndex);
		MageHex->toggleHexEditor();
	}
}

void MageGameControl::copyNameToAndFromPlayerAndSave(bool intoSaveRam) const {
	if(playerEntityIndex == NO_PLAYER) {
		return;
	}
	uint8_t *destination = (uint8_t *)&entities[playerEntityIndex].name;
	uint8_t *source = (uint8_t *)&currentSave.name;
	if(intoSaveRam) {
		uint8_t *temp = destination;
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
	if(EngineInput_Buttons.op_xor && EngineInput_Activated.mem3) {
		MageScript->mapLoadId = currentSave.currentMapId;
	}
	//check to see if player input is allowed:
	if(
		MageDialog->isOpen
		|| !playerHasControl
	) {
		return;
	}
	if(!playerHasHexEditorControl) {
		return;
	}
	//make sure any button handling in this function can be processed in ANY game mode.
	//that includes the game mode, hex editor mode, any menus, maps, etc.
	ledSet(LED_PAGE, EngineInput_Buttons.op_page ? 0xFF : 0x00);
	if (EngineInput_Activated.op_xor) { MageHex->setHexOp(HEX_OPS_XOR); }
	if (EngineInput_Activated.op_add) { MageHex->setHexOp(HEX_OPS_ADD); }
	if (EngineInput_Activated.op_sub) { MageHex->setHexOp(HEX_OPS_SUB); }
	if (EngineInput_Activated.bit_128) { MageHex->runHex(0b10000000); }
	if (EngineInput_Activated.bit_64 ) { MageHex->runHex(0b01000000); }
	if (EngineInput_Activated.bit_32 ) { MageHex->runHex(0b00100000); }
	if (EngineInput_Activated.bit_16 ) { MageHex->runHex(0b00010000); }
	if (EngineInput_Activated.bit_8  ) { MageHex->runHex(0b00001000); }
	if (EngineInput_Activated.bit_4  ) { MageHex->runHex(0b00000100); }
	if (EngineInput_Activated.bit_2  ) { MageHex->runHex(0b00000010); }
	if (EngineInput_Activated.bit_1  ) { MageHex->runHex(0b00000001); }
	if (
		(EngineInput_Activated.op_xor && EngineInput_Buttons.mem0) ||
		(EngineInput_Activated.mem0 && EngineInput_Buttons.op_xor)
	) { isCollisionDebugOn = !isCollisionDebugOn; }
}

void MageGameControl::applyGameModeInputs(uint32_t deltaTime)
{
	//set mage speed based on if the right pad down is being pressed:
	float moveType = EngineInput_Buttons.rjoy_down ? MAGE_RUNNING_SPEED : MAGE_WALKING_SPEED;
	float howManyMsPerSecond = 1000.0;
	float whatFractionOfSpeed = moveType / howManyMsPerSecond;
	mageSpeed = whatFractionOfSpeed * MAGE_MIN_MILLIS_BETWEEN_FRAMES;
	if(MageDialog->isOpen) {
		// If interacting with the dialog this tick has closed the dialog,
		// return early before the same "advance button press triggers an on_interact below
		MageDialog->update();
		return;
	}
	// if there is a player on the map
	if(playerEntityIndex != NO_PLAYER) {
		//get useful variables for below:
		updateEntityRenderableData(playerEntityIndex);
		MageEntity *playerEntity = &entities[playerEntityIndex];
		MageEntityRenderableData *renderableData = &entityRenderableData[playerEntityIndex];

		//update renderable info before proceeding:
		bool hasEntityType = getValidPrimaryIdType(playerEntity->primaryIdType) == ENTITY_TYPE;
		MageEntityType *entityType = hasEntityType ? &entityTypes[getValidEntityTypeId(playerEntity->primaryId)] : nullptr;
		uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
		uint16_t tilesetWidth = tilesets[renderableData->tilesetId].TileWidth();
		uint16_t tilesetHeight = tilesets[renderableData->tilesetId].TileHeight();
		bool playerIsActioning = playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX;
		bool acceptPlayerInput = !(MageDialog->isOpen || !playerHasControl);

		isMoving = false;

		//check to see if the mage is pressing the action button, or currently in the middle of an action animation.
		if(
			acceptPlayerInput
			&& (
				playerIsActioning
				|| EngineInput_Buttons.rjoy_left
			)
		) {
			playerIsActioning = true;
		}
		//if not actioning or resetting, handle all remaining inputs:
		else if(acceptPlayerInput)
		{
			playerVelocity = {
				.x= 0,
				.y= 0
			};
			MageEntityAnimationDirection direction = playerEntity->direction;
			if(EngineInput_Buttons.ljoy_left ) { playerVelocity.x -= mageSpeed; direction = WEST; isMoving = true; }
			if(EngineInput_Buttons.ljoy_right) { playerVelocity.x += mageSpeed; direction = EAST; isMoving = true; }
			if(EngineInput_Buttons.ljoy_up   ) { playerVelocity.y -= mageSpeed; direction = NORTH; isMoving = true; }
			if(EngineInput_Buttons.ljoy_down ) { playerVelocity.y += mageSpeed; direction = SOUTH; isMoving = true; }
			if(isMoving) {
				playerEntity->direction = updateDirectionAndPreserveFlags(
					direction,
					playerEntity->direction
				);
				Point pushback = getPushBackFromTilesThatCollideWithPlayer();
				Point velocityAfterPushback = {
					.x = playerVelocity.x + pushback.x,
					.y = playerVelocity.y + pushback.y,
				};
				float dotProductOfVelocityAndPushback = MageGeometry::getDotProduct(
					playerVelocity,
					velocityAfterPushback
				);
				// false would mean that the pushback is greater than the input velocity,
				// which would glitch the player into geometry really bad, so... don't.
				if (dotProductOfVelocityAndPushback > 0) {
					playerEntity->x += velocityAfterPushback.x;
					playerEntity->y += velocityAfterPushback.y;
				}
			}
			if(EngineInput_Activated.rjoy_right ) {
				handleEntityInteract();
			}
			if(EngineInput_Buttons.rjoy_up ){
				handleEntityInteract(true);
			}
			if(EngineInput_Buttons.ljoy_center );
				//no task assigned to ljoy_center in game mode
			if(EngineInput_Buttons.rjoy_center );
				//no task assigned to rjoy_center in game mode
			if(EngineInput_Buttons.op_page);
				//no task assigned to op_page in game mode
		}


		//handle animation assignment for the player:
		//Scenario 1 - preform action:
		if(
			playerIsActioning &&
			hasEntityType &&
			entityType->AnimationCount() >= MAGE_ACTION_ANIMATION_INDEX
		)
		{
			playerEntity->currentAnimation = MAGE_ACTION_ANIMATION_INDEX;
		}
		//Scenario 2 - show walk animation:
		else if (
			isMoving &&
			hasEntityType &&
			entityType->AnimationCount() >= MAGE_WALK_ANIMATION_INDEX
		)
		{
			playerEntity->currentAnimation = MAGE_WALK_ANIMATION_INDEX;
		}
		//Scenario 3 - show idle animation:
		else if (acceptPlayerInput)
		{
			playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
		}

		//this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
		bool isPlayingActionButShouldReturnControlToPlayer = (
			hasEntityType &&
			(playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX) &&
			(playerEntity->currentFrame == (renderableData->frameCount - 1)) &&
			(renderableData->currentFrameTicks + deltaTime >= (renderableData->duration))
		);

		//if the above bool is true, set the player back to their idle animation:
		if (isPlayingActionButShouldReturnControlToPlayer) {
			playerEntity->currentFrame = 0;
			playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
		}

		//if the animation changed since the start of this function, reset to the first frame and restart the timer:
		if (previousPlayerAnimation != playerEntity->currentAnimation)
		{
			playerEntity->currentFrame = 0;
			renderableData->currentFrameTicks = 0;
		}

		//What scenarios call for an extra renderableData update?
		if(
			isMoving
			|| (renderableData->lastTilesetId != renderableData->tilesetId)
		) {
			updateEntityRenderableData(playerEntityIndex);
		}
		if(
			!acceptPlayerInput
			|| !playerHasHexEditorControl
		) {
			return;
		}

		//opening the hex editor is the only button press that will lag actual gameplay by one frame
		//this is to allow entity scripts to check the hex editor state before it opens to run scripts
		if (EngineInput_Activated.hax) { MageHex->toggleHexEditor(); }

		//check for memory button presses and set the hex cursor to the memory location
		if(EngineInput_Activated.mem0)
		{
			MageHex->setHexCursorLocation(MageHex->getMemoryAddress(0));
		}
		if(EngineInput_Activated.mem1)
		{
			MageHex->setHexCursorLocation(MageHex->getMemoryAddress(1));
		}
		if(EngineInput_Activated.mem2)
		{
			MageHex->setHexCursorLocation(MageHex->getMemoryAddress(2));
		}
		if(EngineInput_Activated.mem3)
		{
			MageHex->setHexCursorLocation(MageHex->getMemoryAddress(3));
		}
	}
	else //no player on map
	{
		if (!playerHasControl) {
			return;
		}
		if(EngineInput_Buttons.ljoy_left ) { cameraPosition.x -= mageSpeed; }
		if(EngineInput_Buttons.ljoy_right) { cameraPosition.x += mageSpeed; }
		if(EngineInput_Buttons.ljoy_up   ) { cameraPosition.y -= mageSpeed; }
		if(EngineInput_Buttons.ljoy_down ) { cameraPosition.y += mageSpeed; }
	}
}

void MageGameControl::applyCameraEffects(uint32_t deltaTime) {
	if(cameraFollowEntityId != NO_PLAYER) {
		MageEntityRenderableData *renderableData = &entityRenderableData[cameraFollowEntityId];
		cameraPosition.x = renderableData->center.x - HALF_WIDTH;
		cameraPosition.y = renderableData->center.y - HALF_HEIGHT;
	}
	adjustedCameraPosition.x = cameraPosition.x;
	adjustedCameraPosition.y = cameraPosition.y;
	if(cameraShaking) {
		adjustedCameraPosition.x += cos(PI * 2 * cameraShakePhase) * (float)cameraShakeAmplitude;
		adjustedCameraPosition.y += sin(PI * 2 * (cameraShakePhase * 2)) * (float)cameraShakeAmplitude;
	}
}

void MageGameControl::handleEntityInteract(
	bool hack
)
{
	//interacting is impossible if there is no player entity, so return.
	if(playerEntityIndex == NO_PLAYER)
	{
		return;
	}
	MageEntityRenderableData *playerRenderableData = &entityRenderableData[playerEntityIndex];
	MageEntityRenderableData *targetRenderableData;
	MageEntity *playerEntity = &entities[playerEntityIndex];
	MageEntity *targetEntity;
	playerRenderableData->interactBox.x = playerRenderableData->hitBox.x;
	playerRenderableData->interactBox.y = playerRenderableData->hitBox.y;
	playerRenderableData->interactBox.w = playerRenderableData->hitBox.w;
	playerRenderableData->interactBox.h = playerRenderableData->hitBox.h;
	uint8_t interactLength = 32;
	MageEntityAnimationDirection direction = getValidEntityTypeDirection(
		playerEntity->direction
	);
	if(direction == NORTH) {
		playerRenderableData->interactBox.y -= interactLength;
		playerRenderableData->interactBox.h = interactLength;
	}
	if(direction == EAST) {
		playerRenderableData->interactBox.x += playerRenderableData->interactBox.w;
		playerRenderableData->interactBox.w = interactLength;
	}
	if(direction == SOUTH) {
		playerRenderableData->interactBox.y += playerRenderableData->interactBox.h;
		playerRenderableData->interactBox.h = interactLength;
	}
	if(direction == WEST) {
		playerRenderableData->interactBox.x -= interactLength;
		playerRenderableData->interactBox.w = interactLength;
	}
	for(uint8_t i = 0; i < map.EntityCount(); i++) {
		// reset all interact states first
		targetRenderableData = &entityRenderableData[i];
		targetRenderableData->isInteracting = false;
	}
	for(uint8_t i = 0; i < map.EntityCount(); i++) {
		if(i != playerEntityIndex) {
			targetRenderableData = &entityRenderableData[i];
			targetEntity = &entities[i];
			bool colliding = MageGeometry::doRectsOverlap(
				targetRenderableData->hitBox,
				playerRenderableData->interactBox
			);
			if (colliding) {
				playerRenderableData->isInteracting = true;
				targetRenderableData->isInteracting = true;
				isMoving = false;
				if (hack && playerHasHexEditorControl) {
					MageHex->openToEntityByIndex(i);
				} else if (!hack && targetEntity->onInteractScriptId) {
					MageScript->initScriptState(
						MageScript->getEntityInteractResumeState(i),
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
	uint32_t tilesPerLayer = map.Cols() * map.Rows();
	uint32_t layerAddress = map.LayerOffset(layer);
	if(layerAddress == 0)
	{
		return;
	}
	uint32_t address = layerAddress;
	int32_t tile_x = 0;
	int32_t tile_y = 0;
	int32_t x = 0;
	int32_t y = 0;
	uint16_t geometryId = 0;
	MageGeometry geometry;

	struct MageMapTile {
		uint16_t tileId = 0;
		uint8_t tilesetId = 0;
		uint8_t flags = 0;
	} currentTile;

	Point playerPoint = getValidEntityRenderableData(playerEntityIndex)->center;
	for (uint32_t i = 0; i < tilesPerLayer; i++)
	{
		tile_x = (int32_t)(map.TileWidth() * (i % map.Cols()));
		tile_y = (int32_t)(map.TileHeight() * (i / map.Cols()));
		x = tile_x - camera_x;
		y = tile_y - camera_y;

		if ((x < (-map.TileWidth()) ||
			(x > WIDTH) ||
			(y < (-map.TileHeight())) ||
			(y > HEIGHT)))
		{
			continue;
		}
		address = layerAddress + (i * sizeof(currentTile));

		EngineROM_Read(
			address,
			sizeof(currentTile),
			(uint8_t *)&currentTile,
			"DrawMap Failed to read property 'currentTile'"
		);


		currentTile.tileId = ROM_ENDIAN_U2_VALUE(currentTile.tileId);

		if (currentTile.tileId == 0)
		{
			continue;
		}

		currentTile.tileId -= 1;

		const MageTileset &tileset = Tileset(currentTile.tilesetId);

		MageColorPalette *colorPalette = getValidColorPalette(tileset.ImageId());
		address = imageHeader.offset(tileset.ImageId());
		canvas.drawChunkWithFlags(
			address,
			colorPalette,
			x,
			y,
			tileset.TileWidth(),
			tileset.TileHeight(),
			(currentTile.tileId % tileset.Cols()) * tileset.TileWidth(),
			(currentTile.tileId / tileset.Cols()) * tileset.TileHeight(),
			tileset.ImageWidth(),
			TRANSPARENCY_COLOR,
			currentTile.flags
		);

		if (isCollisionDebugOn) {
			geometryId = tileset.getLocalGeometryIdByTileIndex(currentTile.tileId);
			if (geometryId) {
				geometryId -= 1;
				geometry = getGeometryFromGlobalId(geometryId);
				geometry.flipSelfByFlags(
					currentTile.flags,
					tileset.TileWidth(),
					tileset.TileHeight()
				);
				bool isMageInGeometry = false;
				if (
					playerEntityIndex != NO_PLAYER
					&& playerPoint.x >= tile_x
					&& playerPoint.x <= tile_x + tileset.TileWidth()
					&& playerPoint.y >= tile_y
					&& playerPoint.y <= tile_y + tileset.TileHeight()
				) {
					Point offsetPoint = {
						.x= playerPoint.x - tile_x,
						.y= playerPoint.y - tile_y,
					};
					isMageInGeometry = geometry.isPointInGeometry(
						offsetPoint
					);
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
	MageGeometry mageCollisionSpokes = MageGeometry(POLYGON, MAGE_COLLISION_SPOKE_COUNT);
	float maxSpokePushbackLengths[MAGE_COLLISION_SPOKE_COUNT];
	Point maxSpokePushbackVectors[MAGE_COLLISION_SPOKE_COUNT];
	MageEntityRenderableData *playerRenderableData = getValidEntityRenderableData(
		playerEntityIndex
	);
	uint32_t tilesPerLayer = map.Cols() * map.Rows();
	uint32_t layerAddress = 0;
	uint32_t address = 0;
	Rect playerRect = {
		.x= playerRenderableData->hitBox.x,
		.y= playerRenderableData->hitBox.y,
		.w= playerRenderableData->hitBox.w,
		.h= playerRenderableData->hitBox.h,
	};
	int16_t abs_x = abs(playerVelocity.x);
	int16_t abs_y = abs(playerVelocity.y);
	if (abs_x) {
		playerRect.w += abs_x;
		if(playerVelocity.x < 0) {
			playerRect.x += playerVelocity.x;
		}
	}
	if (abs_y) {
		playerRect.h += abs_y;
		if(playerVelocity.y < 0) {
			playerRect.y += playerVelocity.y;
		}
	}
	Point tileTopLeftPoint = {
		.x= 0,
		.y= 0,
	};
	int32_t x = 0;
	int32_t y = 0;
	uint16_t geometryId = 0;
	MageGeometry geometry;
	Point pushback = {
		.x= 0,
		.y= 0,
	};
	struct MageMapTile {
		uint16_t tileId = 0;
		uint8_t tilesetId = 0;
		uint8_t flags = 0;
	} currentTile;
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
	for(uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++) {
		maxSpokePushbackLengths[i] = -INFINITY;
		maxSpokePushbackVectors[i].x = 0;
		maxSpokePushbackVectors[i].y = 0;
		Point *spokePoint = &mageCollisionSpokes.points[i];
		float angle = (
			(((float) i)* (PI / MAGE_COLLISION_SPOKE_COUNT))
			+ angleOffset
		);
		spokePoint->x = (
			(
				cos(angle)
				* playerSpokeRadius
			)
			+ playerVelocity.x
			+ playerPoint.x
		);
		spokePoint->y = (
			(
				sin(angle)
				* playerSpokeRadius
			)
			+ playerVelocity.y
			+ playerPoint.y
		);
	}
	if(isCollisionDebugOn) {
		mage_canvas->drawRect(
			playerRect.x - cameraPosition.x,
			playerRect.y - cameraPosition.y,
			playerRect.w,
			playerRect.h,
			COLOR_BLUE
		);
		mageCollisionSpokes.drawSpokes(
			playerPoint,
			adjustedCameraPosition.x,
			adjustedCameraPosition.y,
			COLOR_PURPLE
		);
	}
	uint8_t layerCount = map.LayerCount();
	for (int layerIndex = 0; layerIndex < layerCount; layerIndex++) {
		layerAddress = map.LayerOffset(layerIndex);
		for (uint32_t i = 0; i < tilesPerLayer; i++) {
			tileTopLeftPoint.x = (int32_t)(map.TileWidth() * (i % map.Cols()));
			tileTopLeftPoint.y = (int32_t)(map.TileHeight() * (i / map.Cols()));
			x = tileTopLeftPoint.x - x0;
			y = tileTopLeftPoint.y - y0;
			if (
				(x < -map.TileWidth() ||
				(x > playerRect.w) ||
				(y < -map.TileHeight()) ||
				(y > playerRect.h))
			) {
				continue;
			}
			address = layerAddress + (i * sizeof(currentTile));

			EngineROM_Read(
				address,
				sizeof(currentTile),
				(uint8_t *)&currentTile,
				"getPushBackFromTilesThatCollideWithPlayer Failed to read property 'currentTile'"
			);

			currentTile.tileId = ROM_ENDIAN_U2_VALUE(currentTile.tileId);

			if (currentTile.tileId == 0)
			{
				continue;
			}

			currentTile.tileId -= 1;

			const MageTileset &tileset = Tileset(currentTile.tilesetId);

			if (!tileset.Valid())
			{
				continue;
			}
			geometryId = tileset.getLocalGeometryIdByTileIndex(currentTile.tileId);
			if (geometryId) {
				for(uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++) {
					float angle = (
						(((float) i)* (PI / MAGE_COLLISION_SPOKE_COUNT))
						+ angleOffset
					);
					Point *spokePoint = &mageCollisionSpokes.points[i];
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
				geometryId -= 1;
				geometry = getGeometryFromGlobalId(geometryId);
				geometry.flipSelfByFlags(
					currentTile.flags,
					tileset.TileWidth(),
					tileset.TileHeight()
				);

				Point offsetPoint = {
					.x= playerPoint.x - tileTopLeftPoint.x,
					.y= playerPoint.y - tileTopLeftPoint.y,
				};

				bool isMageInGeometry = MageGeometry::pushADiagonalsVsBEdges(
					&offsetPoint,
					&mageCollisionSpokes,
					maxSpokePushbackLengths,
					maxSpokePushbackVectors,
					&geometry
				);
				if (isCollisionDebugOn) {
					geometry.draw(
						adjustedCameraPosition.x,
						adjustedCameraPosition.y,
						isMageInGeometry
							? COLOR_RED
							: COLOR_YELLOW,
						tileTopLeftPoint.x,
						tileTopLeftPoint.y
					);
				}
			}
		}
	}
	uint8_t collisionCount = 0;
	for(uint8_t i = 0; i < MAGE_COLLISION_SPOKE_COUNT; i++) {
		if (maxSpokePushbackLengths[i] != -INFINITY) {
			collisionCount++;
			pushback.x += maxSpokePushbackVectors[i].x;
			pushback.y += maxSpokePushbackVectors[i].y;
		};
	}
	if(collisionCount > 0) {
		pushback.x /= collisionCount;
		pushback.y /= collisionCount;
		mage_canvas->drawLine(
			playerPoint.x - adjustedCameraPosition.x,
			playerPoint.y - adjustedCameraPosition.y,
			playerPoint.x + pushback.x - adjustedCameraPosition.x,
			playerPoint.y + pushback.y - adjustedCameraPosition.y,
			COLOR_RED
		);
	}
	return pushback;
}

uint16_t MageGameControl::getValidEntityId(uint16_t entityId)
{
	//always return a valid entityId:
	return entityId % (Map().EntityCount());
}

uint16_t MageGameControl::getValidMapId(uint16_t mapId)
{
	return mapId % (mapHeader.count());
}

uint8_t MageGameControl::getValidPrimaryIdType(uint8_t primaryIdType)
{
	//always return a valid primaryId:
	return primaryIdType % MageEntityPrimaryIdType::NUM_PRIMARY_ID_TYPES;
}

uint16_t MageGameControl::getValidAnimationId(uint16_t animationId)
{
	//always return a valid animation ID.
	return animationId % (animationHeader.count());
}

uint16_t MageGameControl::getValidAnimationFrame(uint16_t animationFrame, uint16_t animationId)
{
	//use failover animation if an invalid animationId is submitted to the function.
	//There's a good chance if that happens, it will break things.
	animationId = getValidAnimationId(animationId);

	//always return a valid animation frame for the animationId submitted.
	return animationFrame % animations[animationId].FrameCount();
}

uint16_t MageGameControl::getValidTilesetId(uint16_t tilesetId)
{
	//always return a valid tileset ID.
	return tilesetId % tilesetHeader.count();
}

uint16_t MageGameControl::getValidTileId(uint16_t tileId, uint16_t tilesetId)
{
	//use failover animation if an invalid animationId is submitted to the function.
	//There's a good chance if that happens, it will break things.
	tilesetId = getValidTilesetId(tilesetId);

	//always return a valid animation frame for the animationId submitted.
	return tileId % tilesets[tilesetId].Tiles();
}

uint16_t MageGameControl::getValidEntityTypeId(uint16_t entityTypeId)
{
	//always return a valid entity type for the entityTypeId submitted.
	return entityTypeId % entityTypeHeader.count();
}

MageEntityType* MageGameControl::getValidEntityType(uint16_t entityTypeId)
{
	//always return a valid entity type for the entityTypeId submitted.
	return &entityTypes[getValidEntityTypeId(entityTypeId)];
}

uint16_t MageGameControl::getValidMapLocalScriptId(uint16_t scriptId)
{
	return scriptId %  map.ScriptCount();
}

uint16_t MageGameControl::getValidGlobalScriptId(uint16_t scriptId)
{
	return scriptId % scriptHeader.count();
}

uint8_t MageGameControl::getValidEntityTypeAnimationId(uint8_t entityTypeAnimationId, uint16_t entityTypeId)
{
	//use failover animation if an invalid animationId is submitted to the function.
	//There's a good chance if that happens, it will break things.
	entityTypeId = entityTypeId % entityTypeHeader.count();

	//always return a valid entity type animation ID for the entityTypeAnimationId submitted.
	return entityTypeAnimationId % entityTypes[entityTypeId].AnimationCount();
}

MageEntityAnimationDirection MageGameControl::getValidEntityTypeDirection(
	MageEntityAnimationDirection direction
) {
	return (MageEntityAnimationDirection) (
		(direction & IS_GLITCHED_MASK)
		% NUM_DIRECTIONS
	);
}

MageEntityAnimationDirection MageGameControl::updateDirectionAndPreserveFlags(
	MageEntityAnimationDirection desired,
	MageEntityAnimationDirection previous
) {
	return (MageEntityAnimationDirection) (
		getValidEntityTypeDirection(desired)
		| (previous & IS_GLITCHED)
	);
}

uint32_t MageGameControl::getScriptAddress(uint32_t scriptId)
{
	//first validate the mapLocalScriptId:
	scriptId = getValidGlobalScriptId(scriptId);

	//then return the address offset for thast script from the scriptHeader:
	return scriptHeader.offset(scriptId);
}

void MageGameControl::updateEntityRenderableData(
	uint8_t index,
	bool skipTilesetCheck
)
{
	//fill in default values if the map doesn't have an entity this high.
	//should only be used when initializing the MageGameControl object.
	MageEntityRenderableData *data = &entityRenderableData[index];
	if(index >= map.EntityCount())
	{
		data->tilesetId = MAGE_TILESET_FAILOVER_ID;
		data->lastTilesetId = MAGE_TILE_FAILOVER_ID;
		data->tileId = MAGE_TILE_FAILOVER_ID;
		data->duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
		data->frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
		data->renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
		return;
	}
	else {
		//make a local copy of the entity so the hacked values remain unchanged:
		MageEntity entity = entities[index];
		//but make a pointer to the real deal in case it needs to be moved by hacking changes
		MageEntity *entityPointer = &entities[index];

		//ensure the primaryIdType is valid
		entity.primaryIdType = (MageEntityPrimaryIdType) getValidPrimaryIdType(entity.primaryIdType);


		//then get valid tileset data based on primaryId type:
		//Scenario 1: Entity primaryId is of type TILESET:
		if (entity.primaryIdType == MageEntityPrimaryIdType::TILESET) {
			//ensure the tilesetId (in this scenario, the entity's primaryId) is valid.
			data->tilesetId = getValidTilesetId(entity.primaryId);
			data->tileId = getValidTileId(entity.secondaryId, data->tilesetId);
			data->duration = 0; //unused
			data->frameCount = 0; //unused
			data->renderFlags = entity.direction; //no need to check, it shouldn't cause a crash.
		}


		//Scenario 2: Entity primaryId is of type ANIMATION:
		else if(entity.primaryIdType == MageEntityPrimaryIdType::ANIMATION)
		{
			//ensure the animationId (in this scenario, the entity's primaryId) is valid.
			uint16_t animationId = getValidAnimationId(entity.primaryId);
			MageAnimation *animation = &animations[animationId];
			uint16_t currentFrameIndex = getValidAnimationFrame(entity.currentFrame, animationId);
			MageAnimationFrame currentFrame = animation->AnimationFrame(currentFrameIndex);
			data->tilesetId = getValidTilesetId(animation->TilesetId());
			data->tileId = getValidTileId(
				currentFrame.tileId,
				data->tilesetId
			);
			data->duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
			data->frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
			data->renderFlags = entity.direction; //no need to check, it shouldn't cause a crash.
		}


		//Scenario 3: Entity primaryId is of type ENTITY_TYPE:
		else if(entity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
		{
			//ensure the entityType (in this scenario, the entity's primaryId) is valid.
			uint16_t entityTypeId = getValidEntityTypeId(entity.primaryId);

			//If the entity has no animations defined, return default:
			if ((entityTypes[entityTypeId].AnimationCount()) == 0)
			{
				//the entity has no animations, so return default values and give up.
				#ifdef DC801_DESKTOP
				fprintf(stderr, "An entityType with no animations exists. Using fallback values.");
				#endif
				data->tilesetId = MAGE_TILESET_FAILOVER_ID;
				data->tileId = MAGE_TILE_FAILOVER_ID;
				data->duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
				data->frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
				data->renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
			}

			//get a valid entity type animation ID:
			//note that entityType was already validated above.
			uint8_t entityTypeAnimationId = getValidEntityTypeAnimationId(entity.currentAnimation, entityTypeId);

			//make a local copy of the current entity type animation:
			MageEntityTypeAnimation currentAnimation = entityTypes[entityTypeId].EntityTypeAnimation(
				entityTypeAnimationId
			);

			//get a valid direction for the animation:
			uint8_t direction = getValidEntityTypeDirection(entity.direction);

			//create a directedAnimation entity based on entity.direction:
			MageEntityTypeAnimationDirection directedAnimation;
			if (direction == MageEntityAnimationDirection::NORTH) {
				directedAnimation = currentAnimation.North();
			} else if (direction == MageEntityAnimationDirection::EAST) {
				directedAnimation = currentAnimation.East();
			} else if (direction == MageEntityAnimationDirection::SOUTH) {
				directedAnimation = currentAnimation.South();
			} else if (direction == MageEntityAnimationDirection::WEST) {
				directedAnimation = currentAnimation.West();
			}
			getRenderableStateFromAnimationDirection(
				data,
				&entity,
				&directedAnimation
			);

		}
		MageTileset *tileset = &tilesets[getValidTilesetId(data->tilesetId)];
		Point oldCenter = {
			.x = data->center.x,
			.y = data->center.y,
		};
		updateEntityRenderableBoxes(data, &entity, tileset);
		// accounting for possible change in tile size due to hacking;
		// adjust entity position so that the center will not change
		// from the previous tileset to the new tileset.
		if (
			!skipTilesetCheck
			&& data->lastTilesetId != data->tilesetId
		) {
			//get the difference between entity centers:
			entityPointer->x += oldCenter.x - data->center.x;
			entityPointer->y += oldCenter.y - data->center.y;
			entity.x = entityPointer->x;
			entity.y = entityPointer->y;
			// printf(
			// 	"ENTITY TILESET CHANGED!\n"
			// );
			updateEntityRenderableBoxes(data, &entity, tileset);
		}
		data->lastTilesetId = data->tilesetId;
	}
}

void MageGameControl::getRenderableStateFromAnimationDirection(
	MageEntityRenderableData *data,
	const MageEntity *entity,
	const MageEntityTypeAnimationDirection *animationDirection
) {
	//based on animationDirection.Type(), you can get two different outcomes:
	//Scenario A: Type is 0, TypeID is an animation ID:
	if (animationDirection->Type() == 0) {
		uint16_t animationId = getValidAnimationId(animationDirection->TypeId());
		uint16_t currentFrameIndex = getValidAnimationFrame(entity->currentFrame, animationId);
		MageAnimation *animation = &animations[animationId];
		MageAnimationFrame currentFrame = animation->AnimationFrame(currentFrameIndex);
		data->tilesetId = animation->TilesetId();
		data->tileId = getValidTileId(
			currentFrame.tileId,
			data->tilesetId
		);
		data->duration = currentFrame.duration; //no need to check, it shouldn't cause a crash.
		data->frameCount = animation->FrameCount(); //no need to check, it shouldn't cause a crash.
		data->renderFlags = animationDirection->RenderFlags(); //no need to check, it shouldn't cause a crash.
		data->renderFlags += entity->direction & 0x80;
	}
	//Test whether or not the 0-index stuff is working:
	//Scenario B: Type is not 0, so Type is a tileset(you will need to subtract 1 to get it 0-indexed), and TypeId is the tileId.
	else
	{
		data->tilesetId = animationDirection->Type() - 1;
		data->tileId = animationDirection->TypeId();
		data->duration = 0; //does not animate;
		data->frameCount = 0; //does not animate
		data->renderFlags = entity->direction; //no need to check, it shouldn't cause a crash.
	}
}

void MageGameControl::updateEntityRenderableBoxes(
	MageEntityRenderableData *data,
	const MageEntity *entity,
	const MageTileset *tileset
) const {
	uint16_t width = tileset->TileWidth();
	uint16_t height = tileset->TileHeight();
	uint16_t halfWidth = width / 2;
	uint16_t halfHeight = height / 2;
	data->hitBox.x = entity->x + (halfWidth / 2);
	data->hitBox.y = entity->y + (halfHeight) - height;
	data->hitBox.w = halfWidth;
	data->hitBox.h = halfHeight;
	data->center.x = data->hitBox.x + (data->hitBox.w / 2);
	data->center.y = data->hitBox.y + (data->hitBox.h / 2);
}

void MageGameControl::UpdateEntities(uint32_t deltaTime)
{
	//if no time has passed, there is no need to update.
	if(!deltaTime)
	{
		return;
	}
	//cycle through all map entities:
	for(uint8_t i = 0; i < map.EntityCount(); i++)
	{
		//tileset entities are not animated, return if entity is type tileset.
		if(entities[i].primaryIdType == MageEntityPrimaryIdType::TILESET)
		{
			//Update Entity in case it's been hacked.
			updateEntityRenderableData(i);
			continue;
		}
		//increment the frame ticks based on the delta_time since the last check:
		entityRenderableData[i].currentFrameTicks += deltaTime;

		//update entity info:
		updateEntityRenderableData(i);

		//check for frame change and adjust if needed:
		if(entityRenderableData[i].currentFrameTicks >= entityRenderableData[i].duration)
		{
			//increment frame and reset tick counter:
			entities[i].currentFrame++;
			entityRenderableData[i].currentFrameTicks = 0;

			//reset animation to first frame after max frame is reached:
			if(entities[i].currentFrame >= entityRenderableData[i].frameCount)
			{
				entities[i].currentFrame = 0;
			}
			//update the entity info again with the corrected frame index:
			updateEntityRenderableData(i);
		}
	}
}

void MageGameControl::DrawEntities()
{
	int32_t cameraX = adjustedCameraPosition.x;
	int32_t cameraY = adjustedCameraPosition.y;
	//first sort entities by their y values:
	uint16_t entitySortOrder[map.EntityCount()];
	//init index array:
	for(uint16_t i=0; i<map.EntityCount(); i++)
	{
		entitySortOrder[i] = i;
	}

	// One by one move boundary of unsorted subarray
	for (uint16_t i = 0; i < map.EntityCount() - 1; i++)
	{

		// Find the minimum element in unsorted array
		uint16_t min_idx = i;
		for (uint16_t j = i + 1; j < map.EntityCount(); j++)
		{
			if (entities[entitySortOrder[j]].y < entities[entitySortOrder[min_idx]].y)
			{
				min_idx = j;
			}
		}

		// Swap the found minimum element
		// with the first element
		uint16_t temp = entitySortOrder[min_idx];
		entitySortOrder[min_idx] = entitySortOrder[i];
		entitySortOrder[i] = temp;
	}

	//now that we've got a sorted array with the lowest y values first,
	//iterate through it and draw the entities one by one:
	for(uint16_t i=0; i<map.EntityCount(); i++)
	{
		uint16_t entityIndex = entitySortOrder[i];
		MageEntity *entity = &entities[entityIndex];
		MageEntityRenderableData *renderableData = &entityRenderableData[entityIndex];
		MageTileset *tileset = &tilesets[renderableData->tilesetId];
		uint16_t imageId = tileset->ImageId();
		uint16_t tileWidth = tileset->TileWidth();
		uint16_t tileHeight = tileset->TileHeight();
		uint16_t cols = tileset->Cols();
		uint16_t tileId = entityRenderableData[entityIndex].tileId;
		uint32_t address = imageHeader.offset(imageId);
		uint16_t source_x = (tileId % cols) * tileWidth;
		uint16_t source_y = (tileId / cols) * tileHeight;
		int32_t x = entity->x - cameraX;
		int32_t y = entity->y - cameraY - tileHeight;
		canvas.drawChunkWithFlags(
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
		if (isCollisionDebugOn) {
			canvas.drawRect(
				x,
				y,
				tileWidth,
				tileHeight,
				COLOR_LIGHTGREY
			);
			canvas.drawRect(
				renderableData->hitBox.x - cameraX,
				renderableData->hitBox.y - cameraY,
				renderableData->hitBox.w,
				renderableData->hitBox.h,
				renderableData->isInteracting
					? COLOR_RED
					: COLOR_GREEN
			);
			mage_canvas->drawPoint(
				renderableData->center.x - cameraX,
				renderableData->center.y - cameraY,
				5,
				COLOR_BLUE
			);
			if(entityIndex == playerEntityIndex) {
				canvas.drawRect(
					renderableData->interactBox.x - cameraX,
					renderableData->interactBox.y - cameraY,
					renderableData->interactBox.w,
					renderableData->interactBox.h,
					renderableData->isInteracting
						? COLOR_BLUE
						: COLOR_YELLOW
				);
			}
		}
	}
}

void MageGameControl::DrawGeometry()
{
	int32_t  cameraX = adjustedCameraPosition.x;
	int32_t cameraY = adjustedCameraPosition.y;
	Point *playerPosition;
	bool isColliding = false;
	bool isPlayerPresent = playerEntityIndex != NO_PLAYER;
	if(isPlayerPresent) {
		MageEntityRenderableData *renderable = &entityRenderableData[playerEntityIndex];
		playerPosition = &renderable->center;
	} else {
		playerPosition = {0};
	}
	for (uint16_t i = 0; i < map.GeometryCount(); i++) {
		MageGeometry geometry = getGeometryFromMapLocalId(i);
		if (isPlayerPresent) {
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

MageGeometry MageGameControl::getGeometryFromMapLocalId(uint16_t mapLocalGeometryId) {
	return MageGeometry(
		geometryHeader.offset(
			map.getGlobalGeometryId(mapLocalGeometryId) % geometryHeader.count()
		)
	);
}

MageGeometry MageGameControl::getGeometryFromGlobalId(uint16_t globalGeometryId) {
	return MageGeometry(
		geometryHeader.offset(
			globalGeometryId % geometryHeader.count()
		)
	);
}

MageColorPalette* MageGameControl::getValidColorPalette(uint16_t colorPaletteId) {
	return &colorPalettes[colorPaletteId % colorPaletteHeader.count()];
}

MageEntityRenderableData* MageGameControl::getValidEntityRenderableData(uint8_t mapLocalEntityId) {
	return &entityRenderableData[mapLocalEntityId % map.EntityCount()];
}

MageEntity* MageGameControl::getValidEntity(int8_t entityId) {
	return &entities[entityId % entityHeader.count()];
}

MageTileset* MageGameControl::getValidTileset(uint16_t tilesetId) {
	return &tilesets[tilesetId % tilesetHeader.count()];
}

std::string MageGameControl::getString(
	uint16_t stringId,
	int16_t currentEntityId
) {
	uint16_t sanitizedIndex = stringId % stringHeader.count();
	uint32_t start = stringHeader.offset(sanitizedIndex);
	uint32_t length = stringHeader.length(sanitizedIndex);
	std::string romString(length, '\0');
	uint8_t *romStringPointer = (uint8_t *)&romString[0];
	EngineROM_Read(
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
	while ((variableStartPosition = romString.find("%%", variableStartPosition)) != std::string::npos) {
		outputString.append(romString.substr(
			cursor,
			(variableStartPosition - cursor)
		));
		variableEndPosition = romString.find("%%", variableStartPosition + 1) + 1;
		std::string variableHolder = romString.substr(
			variableStartPosition + 2,
			variableStartPosition - (variableEndPosition - 2)
		);
		int parsedEntityIndex = std::stoi(variableHolder);
		int16_t entityIndex = MageScript->getUsefulEntityIndexFromActionEntityId(
			parsedEntityIndex,
			currentEntityId
		);
		if(entityIndex != NO_PLAYER) {
			std::string entityName = getEntityNameStringById(entityIndex);
			outputString.append(entityName.c_str());
		} else {
			char missingError[MAGE_ENTITY_NAME_LENGTH + 1];
			sprintf(
				missingError,
				"MISSING: %d",
				parsedEntityIndex
			);
			outputString.append(missingError);
		}
		variableStartPosition = variableEndPosition + 1;
		cursor = variableStartPosition;
		replaceCount++;
	}
	if (replaceCount) {
		outputString.append(romString.substr(cursor, romString.length() - 1));
	}
	cursor = 0;
	variableStartPosition = 0;
	variableEndPosition = 0;
	while ((variableStartPosition = romString.find("$$", variableStartPosition)) != std::string::npos) {
		outputString.append(romString.substr(
			cursor,
			(variableStartPosition - cursor)
		));
		variableEndPosition = romString.find("$$", variableStartPosition + 1) + 1;
		std::string variableHolder = romString.substr(
			variableStartPosition + 2,
			variableStartPosition - (variableEndPosition - 2)
		);
		int parsedVariableIndex = std::stoi(variableHolder);
		uint16_t variableValue = currentSave.scriptVariables[parsedVariableIndex];
		std::string valueString = std::to_string(variableValue);
		outputString.append(valueString.c_str());
		variableStartPosition = variableEndPosition + 1;
		cursor = variableStartPosition;
		replaceCount++;
	}
	if (replaceCount) {
		outputString.append(romString.substr(cursor, romString.length() - 1));
	}
	return replaceCount ? outputString : romString;
}

uint32_t MageGameControl::getImageAddress(uint16_t imageId) {
	return imageHeader.offset(imageId % imageHeader.count());
}

uint32_t MageGameControl::getPortraitAddress(uint16_t portraitId) {
	return portraitHeader.offset(portraitId % portraitHeader.count());
}

uint32_t MageGameControl::getDialogAddress(uint16_t dialogId) {
	return dialogHeader.offset(dialogId % dialogHeader.count());
}

std::string MageGameControl::getEntityNameStringById(int16_t entityId) {
	MageEntity *entity = getValidEntity(entityId);
	std::string entityName(MAGE_ENTITY_NAME_LENGTH + 1, '\0');
	entityName.assign(entity->name, MAGE_ENTITY_NAME_LENGTH);
	return entityName;
}
#ifdef DC801_DESKTOP
void MageGameControl::verifyAllColorPalettes(const char* errorTriggerDescription) {
	for (uint32_t i = 0; i < colorPaletteHeader.count(); i++) {
		colorPalettes[i].verifyColors(errorTriggerDescription);
	}
}
#endif //DC801_DESKTOP

uint16_t MageGameControl::entityTypeCount() {
	return entityTypeHeader.count();
}

uint16_t MageGameControl::animationCount() {
	return animationHeader.count();
}

uint16_t MageGameControl::tilesetCount() {
	return tilesetHeader.count();
}
