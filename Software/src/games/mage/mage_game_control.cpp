#include "mage_game_control.h"

#include "EngineROM.h"
#include "EnginePanic.h"
#include "FrameBuffer.h"
#include "mage_hex.h"
#include "mage_script_control.h"
#include "mage_dialog_control.h"

extern Point cameraPosition;
extern MageHexEditor *MageHex;
extern MageDialogControl *MageDialog;
extern MageScriptControl *MageScript;

extern FrameBuffer *mage_canvas;

// Initializer list, default construct values
//   Don't waste any resources constructing unique_ptr's
//   Each header is constructed with offsets from the previous
MageGameControl::MageGameControl()
{
	uint32_t offset = 8; //skip 'MAGEGAME' string at front of .dat file
	offset += 24; //skip timestamp string at front of .dat file

	currentMapId = DEFAULT_MAP;

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

	dialogHeader = MageHeader(offset);
	offset += dialogHeader.size();

	stringHeader = MageHeader(offset);
	offset += stringHeader.size();

	imageHeader = MageHeader(offset);
	offset += imageHeader.size();

	tilesets = std::make_unique<MageTileset[]>(tilesetHeader.count());

	for (uint32_t i = 0; i < tilesetHeader.count(); i++)
	{
		tilesets[i] = MageTileset(tilesetHeader.offset(i));
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

	geometries = std::make_unique<MageGeometry[]>(geometryHeader.count());

	for (uint32_t i = 0; i < geometryHeader.count(); i++)
	{
		geometries[i] = MageGeometry(geometryHeader.offset(i));
	}

	previousPlayerTilesetId = MAGE_TILESET_FAILOVER_ID;

	mageSpeed = MAGE_WALKING_SPEED;
	isMoving = false;
	isCollisionDebugOn = false;
	playerHasControl = true;

	//load the map
	PopulateMapData(currentMapId);
}

uint32_t MageGameControl::Size() const
{
	uint32_t size = sizeof(currentMapId) +
		mapHeader.size() +
		tilesetHeader.size() +
		animationHeader.size() +
		entityTypeHeader.size() +
		entityHeader.size() +
		geometryHeader.size() +
		scriptHeader.size() +
		stringHeader.size() +
		imageHeader.size() +
		map.Size() +
		sizeof(playerEntityIndex) +
		sizeof(previousPlayerTilesetId) +
		sizeof(mageSpeed) +
		sizeof(isMoving) +
		sizeof(isCollisionDebugOn) +
		sizeof(playerHasControl) +
		sizeof(MageEntity)*MAX_ENTITIES_PER_MAP+ //entities array
		sizeof(MageEntityRenderableData)*MAX_ENTITIES_PER_MAP; //entityRenderableData array

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

	for (uint32_t i = 0; i < geometryHeader.count(); i++)
	{
		size += geometries[i].size();
	}

	return size;
}

const MageTileset& MageGameControl::Tile(uint32_t index) const
{
	static MageTileset tile;
	if (!tilesets) return tile;

	if (tilesetHeader.count() > index)
	{
		return tilesets[index];
	}

	return tile;
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
	if (EngineROM_Read(address, MAGE_ENTITY_NAME_LENGTH, (uint8_t *)entity.name) != MAGE_ENTITY_NAME_LENGTH)
	{
		goto MageEntity_Error;
	}

	//increment address
	address += MAGE_ENTITY_NAME_LENGTH;
	
	// Read entity.x
	if (EngineROM_Read(address, sizeof(entity.x), (uint8_t *)&entity.x) != sizeof(entity.x))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.x = convert_endian_u2_value(entity.x);

	//increment address
	address += sizeof(entity.x);

	// Read entity.y
	if (EngineROM_Read(address, sizeof(entity.y), (uint8_t *)&entity.y) != sizeof(entity.y))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.y = convert_endian_u2_value(entity.y);

	//increment address
	address += sizeof(entity.y);

	// Read entity.onInteractScriptId
	if (EngineROM_Read(address, sizeof(entity.onInteractScriptId), (uint8_t *)&entity.onInteractScriptId) != sizeof(entity.onInteractScriptId))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.onInteractScriptId = convert_endian_u2_value(entity.onInteractScriptId);

	//increment address
	address += sizeof(entity.onInteractScriptId);

	// Read entity.onTickScript
	if (EngineROM_Read(address, sizeof(entity.onTickScriptId), (uint8_t *)&entity.onTickScriptId) != sizeof(entity.onTickScriptId))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.onTickScriptId = convert_endian_u2_value(entity.onTickScriptId);

	//increment address
	address += sizeof(entity.onTickScriptId);

	// Read entity.primaryId
	if (EngineROM_Read(address, sizeof(entity.primaryId), (uint8_t *)&entity.primaryId) != sizeof(entity.primaryId))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.primaryId = convert_endian_u2_value(entity.primaryId);

	//increment address
	address += sizeof(entity.primaryId);

	// Read entity.secondaryId
	if (EngineROM_Read(address, sizeof(entity.secondaryId), (uint8_t *)&entity.secondaryId) != sizeof(entity.secondaryId))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.secondaryId = convert_endian_u2_value(entity.secondaryId);

	//increment address
	address += sizeof(entity.secondaryId);

	// Read entity.primaryIdType
	if (EngineROM_Read(address, sizeof(entity.primaryIdType), (uint8_t *)&entity.primaryIdType) != sizeof(entity.primaryIdType))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.primaryIdType);

	// Read entity.currentAnimation
	if (EngineROM_Read(address, sizeof(entity.currentAnimation), (uint8_t *)&entity.currentAnimation) != sizeof(entity.currentAnimation))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.currentAnimation);

	// Read entity.currentFrame
	if (EngineROM_Read(address, sizeof(entity.currentFrame), (uint8_t *)&entity.currentFrame) != sizeof(entity.currentFrame))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.currentFrame);

	// Read entity.direction
	if (EngineROM_Read(address, sizeof(entity.direction), (uint8_t *)&entity.direction) != sizeof(entity.direction))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.direction);

	// Read entity.hackableStateA
	if (EngineROM_Read(address, sizeof(entity.hackableStateA), (uint8_t *)&entity.hackableStateA) != sizeof(entity.hackableStateA))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.hackableStateA);

	// Read entity.hackableStateA
	if (EngineROM_Read(address, sizeof(entity.hackableStateB), (uint8_t *)&entity.hackableStateB) != sizeof(entity.hackableStateB))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.hackableStateB);

	// Read entity.hackableStateA
	if (EngineROM_Read(address, sizeof(entity.hackableStateC), (uint8_t *)&entity.hackableStateC) != sizeof(entity.hackableStateC))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.hackableStateC);

	// Read entity.hackableStateA
	if (EngineROM_Read(address, sizeof(entity.hackableStateD), (uint8_t *)&entity.hackableStateD) != sizeof(entity.hackableStateD))
	{
		goto MageEntity_Error;
	}

	//increment address
	address += sizeof(entity.hackableStateD);

	return entity;

MageEntity_Error:
	ENGINE_PANIC("Failed to read entity type direction data");
}

void MageGameControl::PopulateMapData(uint16_t index)
{
	currentMapId = index;

	//load new map:
	map = MageMap(mapHeader.offset(currentMapId));

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

	//update playerEntity pointer whenever a new map is loaded:
	updatePointerToPlayerEntity(std::string(PLAYER_CHARACTER_NAME_STRING));

	for (uint32_t i = 0; i < MAX_ENTITIES_PER_MAP; i++)
	{
		//all entities start with 0 frame ticks
		entityRenderableData[i].currentFrameTicks = 0;
		//other values are filled in when getEntityRenderableData is called:
		updateEntityRenderableData(i);
	}

	//make sure the tileset Id is updated when the map loads to prevent player yeeting
	previousPlayerTilesetId = entityRenderableData[playerEntityIndex].tilesetId;
}

void MageGameControl::LoadMap(uint16_t index)
{
	//get the data for the map:
	PopulateMapData(index);

	//call the map's load script:
	//note all other calls to this function should set the isFirstRun argument to false.
	MageScript->handleMapOnLoadScript(true);
}

void MageGameControl::updatePointerToPlayerEntity(std::string name)
{
	std::string currentEntityName;
	playerEntityIndex = NO_PLAYER;
	for(uint16_t i=0; i<map.EntityCount(); i++)
	{
		currentEntityName = std::string(entities[i].name);
		if(currentEntityName == name)
		{
			playerEntityIndex = i;
			//printf(
			//	"Is this entity the player? A: %s; B %s; playerEntityIndex: %d\n",
			//	currentEntityName.c_str(),
			//	name.c_str(),
			//	playerEntityIndex
			//);
		}
	}
}

void MageGameControl::applyUniversalInputs()
{
	//check to see if player input is allowed:
	if(!playerHasControl)
	{
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

void MageGameControl::applyGameModeInputs()
{
	if(MageDialog->isOpen) {
		if(
			EngineInput_Activated.rjoy_down
			||EngineInput_Activated.rjoy_left
			||EngineInput_Activated.rjoy_right
		) {
			MageDialog->advanceMessage();
		}
	}
	//check to see if player input is allowed:
	if(!playerHasControl)
	{
		return;
	}
	if(playerEntityIndex != NO_PLAYER)
	{
		//opening the hex editor is the only button press that will lag actual gameplay by one frame
		//this is to allow entity scripts to check the hex editor state before it opens to run scripts
		if (EngineInput_Activated.hax) { MageHex->toggleHexEditor(); }

		//update renderable info before proceeding:
		updateEntityRenderableData(playerEntityIndex);
		
		MageEntity *playerEntity = &entities[playerEntityIndex];
		bool hasEntityType = getValidPrimaryIdType(playerEntity->primaryIdType) == ENTITY_TYPE;
		MageEntityType *entityType = hasEntityType ? &entityTypes[getValidEntityTypeId(playerEntity->primaryId)] : nullptr;
		uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
		MageEntityRenderableData *renderableData = &entityRenderableData[playerEntityIndex];
		uint16_t tilesetWidth = tilesets[renderableData->tilesetId].TileWidth();
		uint16_t tilesetHeight = tilesets[renderableData->tilesetId].TileHeight();
		bool isActioning = playerEntity->currentAnimation == MAGE_ACTION_ANIMATION_INDEX;

		isMoving = false;

		//set mage speed based on if the right pad down is being pressed:
		mageSpeed = EngineInput_Buttons.rjoy_down ? MAGE_RUNNING_SPEED : MAGE_WALKING_SPEED;

		//check to see if the mage is pressing the action button, or currently in the middle of an action animation.
		if(isActioning || EngineInput_Buttons.rjoy_left)
		{
			isActioning = true;
		}
		//check to see if both pads are being pressed at once, triggering map reload:
		else if(EngineInput_Buttons.ljoy_center && EngineInput_Buttons.rjoy_center)
		{
			//reset the map:
			LoadMap(currentMapId);
		}
		//if not actioning or resetting, handle all remaining inputs:
		else
		{
			if(EngineInput_Buttons.ljoy_left )
				{ playerEntity->x -= mageSpeed; playerEntity->direction = MageEntityAnimationDirection::WEST; isMoving = true; }
			if(EngineInput_Buttons.ljoy_right)
				{ playerEntity->x += mageSpeed; playerEntity->direction = MageEntityAnimationDirection::EAST; isMoving = true; }
			if(EngineInput_Buttons.ljoy_up )
				{ playerEntity->y -= mageSpeed; playerEntity->direction = MageEntityAnimationDirection::NORTH; isMoving = true; }
			if(EngineInput_Buttons.ljoy_down )
				{ playerEntity->y += mageSpeed; playerEntity->direction = MageEntityAnimationDirection::SOUTH; isMoving = true; }
			if(EngineInput_Activated.rjoy_right ) {
				handleEntityInteract();
			}
			if(EngineInput_Buttons.rjoy_up );
				//no task assigned to rjoy_up in game mode
			if(EngineInput_Buttons.ljoy_center );
				//no task assigned to ljoy_center in game mode
			if(EngineInput_Buttons.rjoy_center );
				//no task assigned to rjoy_center in game mode
			if(EngineInput_Buttons.op_page);
				//no task assigned to op_page in game mode
		}
		
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

		//handle animation assignment for the player:
		//Scenario 1 - preform action:
		if(
			isActioning &&
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
		else
		{
			playerEntity->currentAnimation = MAGE_IDLE_ANIMATION_INDEX;
		}

		//this checks to see if the player is currently animating, and if the animation is the last frame of the animation:
		bool isPlayingActionButShouldReturnControlToPlayer = (
			hasEntityType &&
			(playerEntity->currentAnimation == 2) &&
			(playerEntity->currentFrame == (renderableData->frameCount - 1))
		);

		//if the above bool is true, set the player back to their idle animation:
		if (isPlayingActionButShouldReturnControlToPlayer) {
			playerEntity->currentFrame = 0;
			playerEntity->currentAnimation = 0;
		}

		//if the animation changed since the start of this function, reset to the first frame and restart the timer:
		if (previousPlayerAnimation != playerEntity->currentAnimation)
		{
			playerEntity->currentFrame = 0;
			renderableData->currentFrameTicks = 0;
		}

		//set camera position to mage position, accounting for possible change in tile size due to hacking:
		if(previousPlayerTilesetId != renderableData->tilesetId)
		{
			//get the relative sizes of the tile widths:
			uint16_t oldTileWidth = tilesets[previousPlayerTilesetId].TileWidth();
			uint16_t oldTileHeight = tilesets[previousPlayerTilesetId].TileHeight();
			uint16_t newTileWidth = tilesets[renderableData->tilesetId].TileWidth();
			uint16_t newTileHeight = tilesets[renderableData->tilesetId].TileHeight();
			//the offset to maintain camera centered on the player is equal to half the difference in size 
			int32_t xOffset = (oldTileHeight - newTileWidth)/2;
			int32_t yOffset = (oldTileHeight - newTileHeight)/2;
			//adjust player position so that the camera centring will not change from the previous tileset to the new tileset.
			playerEntity->x = playerEntity->x + xOffset;
			playerEntity->y = playerEntity->y - yOffset; //negative because player tile width is offset towards negative y
			//reset previous to prevent continuous updating
			previousPlayerTilesetId = renderableData->tilesetId;
		}

		if(isMoving)
		{
			updateEntityRenderableData(playerEntityIndex);
		}
		//set camera to center of player tile.
		cameraPosition.x = playerEntity->x - HALF_WIDTH + ((tilesetWidth) / 2);
		cameraPosition.y = playerEntity->y - HALF_HEIGHT - ((tilesetHeight) / 2);
		
	}
	else //no player on map
	{
		uint8_t panSpeed = EngineInput_Buttons.rjoy_down ? 5 : 1;
		if(EngineInput_Buttons.ljoy_left ) { cameraPosition.x -= panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_right) { cameraPosition.x += panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_up   ) { cameraPosition.y -= panSpeed; isMoving = true; }
		if(EngineInput_Buttons.ljoy_down ) { cameraPosition.y += panSpeed; isMoving = true; }
	}
}

void MageGameControl::handleEntityInteract()
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
	if(playerEntity->direction == NORTH) {
		playerRenderableData->interactBox.y -= interactLength;
		playerRenderableData->interactBox.h = interactLength;
	}
	if(playerEntity->direction == EAST) {
		playerRenderableData->interactBox.x += playerRenderableData->interactBox.w;
		playerRenderableData->interactBox.w = interactLength;
	}
	if(playerEntity->direction == SOUTH) {
		playerRenderableData->interactBox.y += playerRenderableData->interactBox.h;
		playerRenderableData->interactBox.h = interactLength;
	}
	if(playerEntity->direction == WEST) {
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
				if (targetEntity->onInteractScriptId) {
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

void MageGameControl::DrawMap(uint8_t layer, int32_t camera_x, int32_t camera_y) const
{
	uint32_t tilesPerLayer = map.Cols() * map.Rows();

	for (uint32_t i = 0; i < tilesPerLayer; i++)
	{
		int32_t x = (int32_t)((map.TileWidth() * (i % map.Cols())) - camera_x);
		int32_t y = (int32_t)((map.TileHeight() * (i / map.Cols())) - camera_y);

		if ((x < (-map.TileWidth()) ||
			(x > WIDTH) ||
			(y < (-map.TileHeight())) ||
			(y > HEIGHT)))
		{
			continue;
		}

		uint32_t address = map.LayerOffset(layer);

		if (address == 0)
		{
			continue;
		}


		uint16_t tileId = 0;
		uint8_t tilesetId = 0;
		uint8_t flags = 0;

		address += i * (sizeof(tileId) + sizeof(tilesetId) + sizeof(flags));

		if (EngineROM_Read(address, sizeof(tileId), (uint8_t *)&tileId) != sizeof(tileId))
		{
			ENGINE_PANIC("Failed to fetch map layer tile info");
		}

		tileId = convert_endian_u2_value(tileId);
		address += sizeof(tileId);

		if (tileId == 0)
		{
			continue;
		}

		tileId -= 1;

		if (EngineROM_Read(address, sizeof(tilesetId), &tilesetId) != sizeof(tilesetId))
		{
			ENGINE_PANIC("Failed to fetch map layer tile info");
		}

		address += sizeof(tilesetId);

		if (EngineROM_Read(address, sizeof(flags), &flags) != sizeof(flags))
		{
			ENGINE_PANIC("Failed to fetch map layer tile info");
		}

		const MageTileset &tileset = Tile(tilesetId);

		if (tileset.Valid() != true)
		{
			continue;
		}

		address = imageHeader.offset(tileset.ImageId());

		canvas.drawChunkWithFlags(
			address,
			x,
			y,
			tileset.TileWidth(),
			tileset.TileHeight(),
			(tileId % tileset.Cols()) * tileset.TileWidth(),
			(tileId / tileset.Cols()) * tileset.TileHeight(),
			tileset.ImageWidth(),
			TRANSPARENCY_COLOR,
			flags
		);
	}
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

uint16_t MageGameControl::getValidPrimaryIdType(uint16_t primaryIdType)
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
	return tileId % tilesets[tilesetId].Count();
}
	
uint16_t MageGameControl::getValidEntityTypeId(uint16_t entityTypeId)
{
	//always return a valid entity type for the entityTypeId submitted. 
	return entityTypeId % entityTypeHeader.count();
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

uint8_t MageGameControl::getValidEntityTypeDirection(uint8_t direction)
{
	//always return a valid direction. 
	//Subtract 1 because they are 0-indexed.
	return direction % MageEntityAnimationDirection::NUM_DIRECTIONS;
}

uint32_t MageGameControl::getScriptAddress(uint32_t scriptId)
{
	//first validate the mapLocalScriptId:
	scriptId = getValidGlobalScriptId(scriptId);

	//then return the address offset for thast script from the scriptHeader:
	return scriptHeader.offset(scriptId);
}

void MageGameControl::updateEntityRenderableData(uint8_t index)
{
	//fill in default values if the map doesn't have an entity this high.
	//should only be used when initializing the MageGameControl object.
	MageEntityRenderableData *data = &entityRenderableData[index];
	if(index >= map.EntityCount())
	{
		data->tilesetId = MAGE_TILESET_FAILOVER_ID;
		data->tileId = MAGE_TILE_FAILOVER_ID;
		data->duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
		data->frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
		data->renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
		return;
	}
	else {
		//make a local copy of the entity so the hacked values remain unchanged:
		MageEntity entity = entities[index];

		//ensure the primaryIdType is valid
		entity.primaryIdType = getValidPrimaryIdType(entity.primaryIdType);


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
			uint16_t currentFrame = getValidAnimationFrame(entity.currentFrame, animationId);
			data->tilesetId = getValidTilesetId(animations[animationId].TilesetId());
			data->tileId = getValidTileId(
				animations[animationId].AnimationFrame(currentFrame).TileId(),
				data->tilesetId
			);
			data->duration = animations[animationId].AnimationFrame(
				currentFrame
			).Duration(); //no need to check, it shouldn't cause a crash.
			data->frameCount = animations[animationId].FrameCount(); //no need to check, it shouldn't cause a crash.
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
				fprintf(stderr, "An entityType entity with no animations exists. Using fallback values.");
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
			if (entity.direction == MageEntityAnimationDirection::NORTH) {
				directedAnimation = currentAnimation.North();
			} else if (entity.direction == MageEntityAnimationDirection::EAST) {
				directedAnimation = currentAnimation.East();
			} else if (entity.direction == MageEntityAnimationDirection::SOUTH) {
				directedAnimation = currentAnimation.South();
			} else if (entity.direction == MageEntityAnimationDirection::WEST) {
				directedAnimation = currentAnimation.West();
			}

			//based on directedAnimation.Type(), you can get two different outcomes:
			//Scenario A: Type is 0, TypeID is an animation ID:
			if (directedAnimation.Type() == 0) {
				uint16_t animationId = getValidAnimationId(directedAnimation.TypeId());
				uint16_t currentFrame = getValidAnimationFrame(entity.currentFrame, animationId);
				data->tilesetId = animations[animationId].TilesetId();
				data->tileId = getValidTileId(animations[animationId].AnimationFrame(currentFrame).TileId(),
											  data->tilesetId);
				data->duration = animations[animationId].AnimationFrame(
					currentFrame).Duration(); //no need to check, it shouldn't cause a crash.
				data->frameCount = animations[animationId].FrameCount(); //no need to check, it shouldn't cause a crash.
				data->renderFlags = directedAnimation.RenderFlags(); //no need to check, it shouldn't cause a crash.
			}
			//Test whether or not the 0-index stuff is working:
			//Scenario B: Type is not 0, so TypeId is a tileset, and Type is the tileId (you will need to subtract 1 to get it 0-indexed).
			else
			{
				data->tilesetId = directedAnimation.TypeId();
				data->tileId = directedAnimation.TypeId() - 1;
				data->duration = 0; //does not animate;
				data->frameCount = 0; //does not animate
				data->renderFlags = entity.direction; //no need to check, it shouldn't cause a crash.
			}
		}
		MageTileset *tileset = &tilesets[getValidTilesetId(data->tilesetId)];
		uint16_t width = tileset->TileWidth();
		uint16_t height = tileset->TileHeight();
		uint16_t halfWidth = width / 2;
		uint16_t halfHeight = height / 2;
		data->hitBox.x = entity.x + (halfWidth / 2);
		data->hitBox.y = entity.y + (halfHeight) - height;
		data->hitBox.w = halfWidth;
		data->hitBox.h = halfHeight;
		data->center.x = data->hitBox.x + (data->hitBox.w / 2);
		data->center.y = data->hitBox.y + (data->hitBox.h / 2);
	}
}

void MageGameControl::UpdateEntities(uint32_t deltaTime)
{
	//if no time has passed, there is no need to update.
	if(!deltaTime)
	{
		return;
	}
	//store the current player tileset info for comparison when moving cameras while hacking:
	previousPlayerTilesetId = entityRenderableData[playerEntityIndex].tilesetId;
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

		#ifdef DC801_DESKTOP
		//add fudge factor for desktop version to make animations 
		//look better on slow-running emulation machine
		entityRenderableData[i].currentFrameTicks += DESKTOP_TIME_FUDGE_FACTOR;
		#endif
		
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

void MageGameControl::DrawEntities(int32_t cameraX, int32_t cameraY)
{
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

void MageGameControl::DrawGeometry(int32_t cameraX, int32_t cameraY)
{
	Point *playerPosition;
	bool isColliding = false;
	bool isPlayerPresent = playerEntityIndex != NO_PLAYER;
	if(isPlayerPresent) {
		MageEntityRenderableData *renderable = &entityRenderableData[playerEntityIndex];
		playerPosition = &renderable->center;
	} else {
		playerPosition = {0};
	}
	for (uint16_t i = 0; i < map.GeometryCount() - 1; i++) {
		MageGeometry *geometry = getValidGeometry(i);
		if (isPlayerPresent) {
			isColliding = geometry->isPointInGeometry(*playerPosition);
		}
		geometry->draw(
			cameraX,
			cameraY,
			isColliding
				? COLOR_RED
				: COLOR_GREEN
		);
	}
}

MageGeometry* MageGameControl::getValidGeometry(uint16_t mapLocalGeometryId) {
	return &geometries[map.getGlobalGeometryId(mapLocalGeometryId % geometryHeader.count())];
}

MageEntityRenderableData* MageGameControl::getValidEntityRenderableData(uint8_t entityId) {
	return &entityRenderableData[entityId % entityHeader.count()];
}

MageEntity* MageGameControl::getValidEntity(int8_t entityId) {
	return &entities[entityId % entityHeader.count()];
}

MageTileset* MageGameControl::getValidTileset(uint16_t tilesetId) {
	return &tilesets[tilesetId % tilesetHeader.count()];
}

std::string MageGameControl::getString(uint16_t stringId) {
	uint16_t sanitizedIndex = stringId % stringHeader.count();
	uint32_t start = stringHeader.offset(sanitizedIndex);
	uint32_t length = stringHeader.length(sanitizedIndex);
	std::string romString(length, '\0');
	uint8_t *romStringPointer = (uint8_t *)&romString[0];
	if (EngineROM_Read(start, length, romStringPointer) != length)
	{
		ENGINE_PANIC("Failed to load string data.");
	}
	return romString;
}

uint32_t MageGameControl::getImageAddress(uint16_t imageId) {
	return imageHeader.offset(imageId % imageHeader.count());
}

uint32_t MageGameControl::getDialogAddress(uint16_t dialogId) {
	return dialogHeader.offset(dialogId % dialogHeader.count());
}
