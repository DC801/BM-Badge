#include "mage_game_control.h"

#include "EngineROM.h"
#include "EnginePanic.h"
#include "FrameBuffer.h"
#include "mage_hex.h"


extern uint8_t mageSpeed;
extern bool isMoving;
extern Point cameraPosition;
extern MageHexEditor MageHex;

// Initializer list, default construct values
//   Don't waste any resources constructing unique_ptr's
//   Each header is constructed with offsets from the previous
MageGameControl::MageGameControl()
{
	uint32_t offset = 8;

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

	//load the map
	LoadMap(currentMapId);
}

uint32_t MageGameControl::Size() const
{
	uint32_t size = sizeof(currentMapId) +
		mapHeader.size() +
		tilesetHeader.size() +
		animationHeader.size() +
		entityTypeHeader.size() +
		entityHeader.size() +
		imageHeader.size() +
		map.Size() +
		sizeof(playerEntityIndex) +
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

	for (uint32_t i = 0; i < entityHeader.count(); i++)
	{
		size += entityTypes[i].Size();
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

const MageMap& MageGameControl::Map() const
{
	return map;
}

MageEntity MageGameControl::LoadEntity(uint32_t address)
{
	uint32_t size = 0;
	MageEntity entity;

	//Read Name
	if (EngineROM_Read(address, 16, (uint8_t *)entity.name) != 16)
	{
		goto MageEntity_Error;
	}

	//increment address
	address += 16;

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

	// Read entity.scriptId
	if (EngineROM_Read(address, sizeof(entity.scriptId), (uint8_t *)&entity.scriptId) != sizeof(entity.scriptId))
	{
		goto MageEntity_Error;
	}

	// Endianness conversion
	entity.scriptId = convert_endian_u2_value(entity.scriptId);

	//increment address
	address += sizeof(entity.scriptId);

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

	// Read entity.hackableState
	if (EngineROM_Read(address, sizeof(entity.hackableState), (uint8_t *)&entity.hackableState) != sizeof(entity.hackableState))
	{
		goto MageEntity_Error;
	}

	//set padding to 0
	entity.padding = 0;

	return entity;

MageEntity_Error:
	ENGINE_PANIC("Failed to read entity type direction data");
}

void MageGameControl::LoadMap(uint16_t index)
{
	currentMapId = index;

	//load new map:
	map = MageMap(mapHeader.offset(currentMapId));

	#ifdef DC801_DESKTOP
		if(map.EntityCount() > MAX_ENTITIES_PER_MAP)
		{
			fprintf(stderr, "Error: Game is attempting to load more than 32 entities on one map.");
		}
	#endif
	
	for (uint32_t i = 0; i < MAX_ENTITIES_PER_MAP; i++)
	{
		//only populate the entities that are on the current map.
		if(i < entityHeader.count())
		{
			entities[i] = LoadEntity(entityHeader.offset(map.EntityId(i)));
		}
	}

	for (uint32_t i = 0; i < MAX_ENTITIES_PER_MAP; i++)
	{
		//all entities start with 0 frame ticks
		entityRenderableData[i].currentFrameTicks = 0;
		//other values are filled in when getEntityRenderableData is called:
		getEntityRenderableData(i);
	}

	//update playerEntity pointer whenever a new map is loaded:
	GetPointerToPlayerEntity(std::string(PLAYER_CHARACTER_NAME_STRING));
}

void MageGameControl::GetPointerToPlayerEntity(std::string name)
{

	for(uint16_t i=0; i<map.EntityCount(); i++)
	{
		if(entities[i].primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
		{
			if(std::string(entities[i].name) == name)
			{
				// printf("Is this entity the player? A: %s; B %s\n", std::string(entities[i].name).c_str(), name.c_str());
				playerEntityIndex = i;
			}
		}
		else if(i == (map.EntityCount()-1))
		{
			//if no valid match for the player is in the map, return NO_PLAYER
			playerEntityIndex = NO_PLAYER;
		}
	}
}

void MageGameControl::applyInputToPlayer()
{
	if (!MageHex.getHexEditorState())
	{
		return;
	}
	if(playerEntityIndex != NO_PLAYER)
	{
		//update renderable info before proceeding:
		getEntityRenderableData(playerEntityIndex);
		
		MageEntity *playerEntity = &entities[playerEntityIndex];
		bool hasEntityType = playerEntity->primaryIdType == ENTITY_TYPE;
		MageEntityType *entityType = hasEntityType ? &entityTypes[playerEntity->primaryId] : nullptr;
		uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
		MageEntityRenderableData *renderableData = &entityRenderableData[playerEntityIndex];
		uint16_t tilesetWidth = tilesets[renderableData->tilesetId].TileWidth();
		uint16_t tilesetHeight = tilesets[renderableData->tilesetId].TileHeight();

		isMoving = false;
		bool isActioning = playerEntity->currentAnimation == 2;

		mageSpeed = EngineInput_Buttons.rjoy_down ? 5 : 1;
		if(isActioning || EngineInput_Buttons.rjoy_left)
		{
			isActioning = true;
		}
		else
		{
			if(EngineInput_Buttons.ljoy_left ) { playerEntity->x -= mageSpeed; playerEntity->direction = 3; isMoving = true; }
			if(EngineInput_Buttons.ljoy_right) { playerEntity->x += mageSpeed; playerEntity->direction = 1; isMoving = true; }
			if(EngineInput_Buttons.ljoy_up   ) { playerEntity->y -= mageSpeed; playerEntity->direction = 0; isMoving = true; }
			if(EngineInput_Buttons.ljoy_down ) { playerEntity->y += mageSpeed; playerEntity->direction = 2; isMoving = true; }
		}

		if(
			isActioning &&
			hasEntityType &&
			entityType->AnimationCount() > 2
		)
		{
			playerEntity->currentAnimation = 2;
		}
		else if (
			isMoving &&
			hasEntityType &&
			entityType->AnimationCount() > 1
		)
		{
			playerEntity->currentAnimation = 1;
		}
		else
		{
			playerEntity->currentAnimation = 0;
		}

		bool isPlayingActionButShouldReturnControlToPlayer = (
			hasEntityType &&
			(playerEntity->currentAnimation == 2) &&
			(playerEntity->currentFrame == (renderableData->frameCount - 1))
		);

		if (isPlayingActionButShouldReturnControlToPlayer) {
			playerEntity->currentFrame = 0;
			playerEntity->currentAnimation = 0;
		}

		if (previousPlayerAnimation != playerEntity->currentAnimation)
		{
			playerEntity->currentFrame = 0;
			renderableData->currentFrameTicks = 0;
		}

		//set camera position to mage position
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

void MageGameControl::DrawMap(uint8_t layer, int32_t camera_x, int32_t camera_y) const
{
	uint32_t tilesPerLayer = map.Width() * map.Height();

	for (uint32_t i = 0; i < tilesPerLayer; i++)
	{
		int32_t x = (int32_t)((map.TileWidth() * (i % map.Width())) - camera_x);
		int32_t y = (int32_t)((map.TileHeight() * (i / map.Width())) - camera_y);

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

		// if (led_states[LED_MEM0])
		// {
		// 	canvas.blt();
		// }
	}
}

uint16_t MageGameControl::getValidPrimaryIdType(uint16_t primaryIdType)
{
	//always return a valid primaryId:
	return primaryIdType % MAGE_NUM_PRIMARY_ID_TYPES;
}

uint16_t MageGameControl::getValidAnimationId(uint16_t animationId)
{
	//always return a valid animation ID. 
	return animationId % (animationHeader.count()-1);
}

uint16_t MageGameControl::getValidAnimationFrame(uint16_t animationFrame, uint16_t animationId)
{
	if(animationId >= animationHeader.count())
	{
		//use failover animation if an invalid animationId is submitted to the function.
		//There's a good chance if that happens, it will break things.
		return animationId % animationHeader.count();
	}
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
	if(tilesetId >= tilesetHeader.count())
	{
		//use failover animation if an invalid animationId is submitted to the function.
		//There's a good chance if that happens, it will break things.
		return tilesetId % tilesetHeader.count();
	}
	//always return a valid animation frame for the animationId submitted. 
	return tileId % tilesets[tilesetId].Count();
}
	
uint16_t MageGameControl::getValidEntityTypeId(uint16_t entityTypeId)
{
	//avoid division by 0 error:

	//always return a valid entity type for the entityTypeId submitted. 
	return entityTypeId % entityTypeHeader.count();
}

uint8_t MageGameControl::getValidEntityTypeAnimationId(uint8_t entityTypeAnimationId, uint16_t entityTypeId)
{
	if(entityTypeId >= entityTypeHeader.count())
	{
		//use failover animation if an invalid animationId is submitted to the function.
		//There's a good chance if that happens, it will break things.
		entityTypeId % entityTypeHeader.count();
	}
	//always return a valid entity type animation ID for the entityTypeAnimationId submitted. 
	return entityTypeAnimationId % entityTypes[entityTypeId].AnimationCount();
}

uint8_t MageGameControl::getValidEntityTypeDirection(uint8_t direction)
{
	//always return a valid direction. 
	//Subtract 1 because they are 0-indexed.
	return direction % MAGE_NUM_DIRECTIONS;
}

void MageGameControl::getEntityRenderableData(uint32_t index)
{
	//fill in default values if the map doesn't have an entity this high.
	//should only be used when initializing the MageGameControl object.
	if(index >= map.EntityCount())
	{
		entityRenderableData[index].tilesetId = MAGE_TILESET_FAILOVER_ID;
		entityRenderableData[index].tileId = MAGE_TILE_FAILOVER_ID;
		entityRenderableData[index].duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
		entityRenderableData[index].frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
		entityRenderableData[index].renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
		return;
	}
	else
	{
		//make a local copy of the entity so the hacked values remain unchanged:
		MageEntity entity = entities[index];
		
		//ensure the primaryIdType is valid
		entity.primaryIdType = getValidPrimaryIdType(entity.primaryIdType);


		//then get valid tileset data based on primaryId type:
		//Scenario 1: Entity primaryId is of type TILESET:
		if(entity.primaryIdType == MageEntityPrimaryIdType::TILESET)
		{
			//ensure the tilesetId (in this scenario, the entity's primaryId) is valid.
			entityRenderableData[index].tilesetId = getValidTilesetId(entity.primaryId);
			entityRenderableData[index].tileId = getValidTileId(entity.secondaryId, entityRenderableData[index].tilesetId);
			entityRenderableData[index].duration = 0; //unused
			entityRenderableData[index].frameCount = 0; //unused
			entityRenderableData[index].renderFlags = entity.direction; //no need to check, it shouldn't cause a crash.
		}


		//Scenario 2: Entity primaryId is of type ANIMATION:
		else if(entity.primaryIdType == MageEntityPrimaryIdType::ANIMATION)
		{
			//ensure the animationId (in this scenario, the entity's primaryId) is valid.
			uint16_t animationId = getValidAnimationId(entity.primaryId);
			uint16_t currentFrame = getValidAnimationFrame(entity.currentFrame, animationId);
			entityRenderableData[index].tilesetId = getValidTilesetId(animations[animationId].TilesetId());
			entityRenderableData[index].tileId = getValidTileId(animations[animationId].AnimationFrame(currentFrame).TileId(), entityRenderableData[index].tilesetId);
			entityRenderableData[index].duration = animations[animationId].AnimationFrame(currentFrame).Duration(); //no need to check, it shouldn't cause a crash.
			entityRenderableData[index].frameCount = animations[animationId].FrameCount(); //no need to check, it shouldn't cause a crash.
			entityRenderableData[index].renderFlags = entity.direction; //no need to check, it shouldn't cause a crash.
		}


		//Scenario 3: Entity primaryId is of type ENTITY_TYPE:
		else if(entity.primaryIdType == MageEntityPrimaryIdType::ENTITY_TYPE)
		{
			//ensure the entityType (in this scenario, the entity's primaryId) is valid.
			uint16_t entityType = getValidEntityTypeId(entity.primaryId);

			//If the entity has no animations defined, return default:
			if(( entityTypes[entityType].AnimationCount() ) == 0)
			{
				//the entity has no animations, so return default values and give up.
				#ifdef DC801_DESKTOP
					fprintf(stderr, "An entityType entity with no animations exists. Using fallback values.");
				#endif
				entityRenderableData[index].tilesetId = MAGE_TILESET_FAILOVER_ID;
				entityRenderableData[index].tileId = MAGE_TILE_FAILOVER_ID;
				entityRenderableData[index].duration = MAGE_ANIMATION_DURATION_FAILOVER_VALUE;
				entityRenderableData[index].frameCount = MAGE_FRAME_COUNT_FAILOVER_VALUE;
				entityRenderableData[index].renderFlags = MAGE_RENDER_FLAGS_FAILOVER_VALUE;
			}

			//get a valid entity type animation ID:
			//note that entityType was already validated above.
			uint8_t entityTypeAnimationId = getValidEntityTypeAnimationId(entity.currentAnimation, entityType);

			//make a local copy of the current entity type animation:
			MageEntityTypeAnimation currentAnimation = entityTypes[entityType].EntityTypeAnimation(entityTypeAnimationId);

			//get a valid direction for the animation:
			uint8_t direction = getValidEntityTypeDirection(entity.direction);

			//create a directedAnimation entity based on entity.direction:
			MageEntityTypeAnimationDirection directedAnimation; 
			if(entity.direction == MageEntityAnimationDirection::NORTH)
			{
				directedAnimation = currentAnimation.North();
			}
			else if(entity.direction == MageEntityAnimationDirection::EAST)
			{
				directedAnimation = currentAnimation.East();
			}
			else if(entity.direction == MageEntityAnimationDirection::SOUTH)
			{
				directedAnimation = currentAnimation.South();
			}
			else if(entity.direction == MageEntityAnimationDirection::WEST)
			{
				directedAnimation = currentAnimation.West();
			}

			//based on directedAnimation.Type(), you can get two different outcomes:
			//Scenario A: Type is 0, TypeID is an animation ID:
			if(directedAnimation.Type() == 0)
			{
				uint16_t animationId = getValidAnimationId(directedAnimation.TypeId());
				uint16_t currentFrame = getValidAnimationFrame(entity.currentFrame, animationId);
				entityRenderableData[index].tilesetId = animations[animationId].TilesetId();
				entityRenderableData[index].tileId = getValidTileId(animations[animationId].AnimationFrame(currentFrame).TileId(), entityRenderableData[index].tilesetId);
				entityRenderableData[index].duration = animations[animationId].AnimationFrame(currentFrame).Duration(); //no need to check, it shouldn't cause a crash.
				entityRenderableData[index].frameCount = animations[animationId].FrameCount(); //no need to check, it shouldn't cause a crash.
				entityRenderableData[index].renderFlags = directedAnimation.RenderFlags(); //no need to check, it shouldn't cause a crash.
			}
			//Test whether or not the 0-index stuff is working:
			//Scenario B: Type is not 0, so TypeId is a tileset, and Type is the tileId (you will need to subtract 1 to get it 0-indexed).
			else
			{
				entityRenderableData[index].tilesetId = directedAnimation.TypeId();
				entityRenderableData[index].tileId = directedAnimation.TypeId()-1;
				entityRenderableData[index].duration = 0; //does not animate;
				entityRenderableData[index].frameCount = 0; //does not animate
				entityRenderableData[index].renderFlags = entity.direction; //no need to check, it shouldn't cause a crash.
			}
		}
	}

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
			getEntityRenderableData(i);
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
		getEntityRenderableData(i);

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
			getEntityRenderableData(i);
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
		uint32_t imageId = tilesets[entityRenderableData[entityIndex].tilesetId].ImageId();
		uint32_t tileWidth = tilesets[entityRenderableData[entityIndex].tilesetId].TileWidth();
		uint32_t tileHeight = tilesets[entityRenderableData[entityIndex].tilesetId].TileHeight();
		uint32_t cols = tilesets[entityRenderableData[entityIndex].tilesetId].Cols();
		uint32_t tileId = entityRenderableData[entityIndex].tileId;
		uint32_t address = imageHeader.offset(imageId);

		int32_t source_x = (tileId % cols) * tileWidth;
		int32_t source_y = (tileId / cols) * tileHeight;

		int32_t x = entities[entityIndex].x - cameraX;
		int32_t y = entities[entityIndex].y - cameraY - tileHeight;
		canvas.drawChunkWithFlags(
			address,
			x,
			y,
			tilesets[entityRenderableData[entityIndex].tilesetId].TileWidth(),
			tilesets[entityRenderableData[entityIndex].tilesetId].TileHeight(),
			source_x,
			source_y,
			tilesets[entityRenderableData[entityIndex].tilesetId].ImageWidth(),
			TRANSPARENCY_COLOR,
			entityRenderableData[entityIndex].renderFlags
		);
	}
}
