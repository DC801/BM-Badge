
//Deprecated code below - clean up once everything is working: -Tim

/*typedef struct {
    uint32_t *mapCount;
    uint32_t *mapOffsets;
    uint32_t *mapLengths;
    uint32_t *tilesetCount;
    uint32_t *tilesetOffsets;
    uint32_t *tilesetLengths;
    uint32_t *animationCount;
    uint32_t *animationOffsets;
    uint32_t *animationLengths;
    uint32_t *entityTypeCount;
    uint32_t *entityTypeOffsets;
    uint32_t *entityTypeLengths;
    uint32_t *entityCount;
    uint32_t *entityOffsets;
    uint32_t *entityLengths;
    uint32_t *imageCount;
    uint32_t *imageOffsets;
    uint32_t *imageLengths;
} MageDataMemoryAddresses;*/

/*typedef struct {
    char *name;
    uint16_t *tileWidth;
    uint16_t *tileHeight;
    uint16_t *width;
    uint16_t *height;
    uint8_t *layerCount;
    uint8_t *padding;
    uint16_t *entityCount;
    uint16_t *entityGlobalIds;
    uint32_t startOfLayers;
} MageMap;*/

/*typedef struct {
    uint16_t tileId;
    uint8_t tilesetId;
    uint8_t flags;
} MageTile;*/

/*typedef struct {
    char *name;
    uint16_t *imageIndex;
    uint16_t *imageWidth;
    uint16_t *imageHeight;
    uint16_t *tileWidth;
    uint16_t *tileHeight;
    uint16_t *cols;
    uint16_t *rows;
    uint32_t startOfTiles;
} MageTileset;*/

/*typedef struct {
    uint16_t tileIndex;
    uint16_t duration;
} MageAnimationFrame;*/

/*typedef struct {
    uint16_t tilesetIndex;
    uint16_t frameCount;
    //MageAnimationFrame animationFrames;
} MageAnimation;*/

/*typedef struct {
    uint16_t typeIndex;
    uint8_t type;
    uint8_t renderFlags;
} MageEntityTypeAnimationDirection;*/

/*typedef struct {
    char name[16];
    uint8_t padding_a;
    uint8_t padding_b;
    uint8_t padding_c;
    uint8_t animationCount;
    MageEntityTypeAnimationDirection entityTypeAnimationDirection;
} MageEntityType;*/

/*typedef struct {
    char name[16];
    uint16_t primaryTypeIndex;
    uint16_t secondaryTypeIndex;
    uint16_t scriptIndex;
    uint16_t x;
    uint16_t y;
    uint8_t primaryType;
    uint8_t currentAnimation;
    uint8_t currentFrame;
    uint8_t direction;
    uint8_t hackableState;
    uint8_t padding;
} MageEntity;*/

/*typedef struct {
    char name[16];
    uint16_t width;
    uint16_t height;
} MageImage;*/

/*typedef struct {
    MageTileset *tileset;
    MageEntityType *entityType;
    MageAnimation *animation;
    MageAnimationFrame *animationFrame;
    uint16_t *tileIndex;
    uint8_t *renderFlags;
} MageEntityRenderableData;*/

//extern MageDataMemoryAddresses dataMemoryAddresses;
//extern MageEntity *playerEntity;
//extern MageEntityRenderableData renderableEntityData;

/*void get_renderable_data_from_entity(
	MageEntity *entity,
	MageEntityRenderableData *renderableData
);*/

//Deprecated Code Below - Delete once everything is working -Tim

/* void draw_map (uint8_t layer)
{
	uint32_t tileCount = *currentMap.width * *currentMap.height;
	uint8_t flags = 0;
	uint16_t tileId = 0;
	uint16_t cols = 0;
	int32_t x = 0;
	int32_t y = 0;
	uint8_t *tiles = data + currentMap.startOfLayers;
	MageTileset tileset;
	MageTile *tile;

	for (uint32_t mapTileIndex = 0; mapTileIndex < tileCount; ++mapTileIndex)
	{
		x = ((int32_t) *currentMap.tileWidth * (mapTileIndex % *currentMap.width)) - cameraPosition.x;
		y = ((int32_t) *currentMap.tileHeight * (mapTileIndex / *currentMap.width)) - cameraPosition.y;

		if
		(
			x > -*currentMap.tileWidth
			&& x < WIDTH
			&& y > -*currentMap.tileHeight
			&& y < HEIGHT
		)
		{
			tile = (MageTile *) &tiles[
				(layer * tileCount * 4)
				+ (mapTileIndex * 4)
			];

			tileId = convert_endian_u2_value((*tile).tileId);

			if (tileId != 0)
			{
				tileId -= 1;
				flags = (*tile).flags;
				tileset = *get_tileset_by_id((*tile).tilesetId);
				cols = *tileset.cols;

				mage_canvas->drawImageChunkWithFlags(
					x,
					y,
					*currentMap.tileWidth,
					*currentMap.tileHeight,
					get_image_by_index(*tileset.imageIndex),
					(tileId % cols) * *tileset.tileWidth,
					(tileId / cols) * *tileset.tileHeight,
					*tileset.imageWidth,
					TRANSPARENCY_COLOR,
					flags
				);
			}
		}
	}
}*/

/*
void get_renderable_data_from_entity (
	MageEntity *entity,
	MageEntityRenderableData *renderableData
) {
	renderableData->animationFrame = nullptr;
	renderableData->animation = nullptr;
	renderableData->renderFlags = &entity->direction;
	renderableData->entityType = nullptr;
	renderableData->tileset = nullptr;

	if(entity->primaryType == ENTITY_PRIMARY_TILESET)
	{
		renderableData->tileset = get_tileset_by_id(entity->primaryTypeIndex);
		renderableData->tileIndex = &entity->secondaryTypeIndex;
	}

	else if(entity->primaryType == ENTITY_PRIMARY_ANIMATION)
	{
		uint32_t animationOffset = *(
			dataMemoryAddresses.animationOffsets
			+ entity->primaryTypeIndex
		);

		renderableData->animation = (MageAnimation *) (data + animationOffset);
	}
	else if(entity->primaryType == ENTITY_PRIMARY_ENTITY_TYPE)
	{
		renderableData->entityType = get_entity_type_by_index(entity->primaryTypeIndex);

		MageEntityTypeAnimationDirection *entityTypeAnimationDirection = (
			&renderableData->entityType->entityTypeAnimationDirection
			+ (
				entity->currentAnimation
				* 4
			)
			+ entity->direction
		);

		renderableData->renderFlags = &entityTypeAnimationDirection->renderFlags;

		if(entityTypeAnimationDirection->type == 0)
		{
			uint32_t animationOffset = *(
				dataMemoryAddresses.animationOffsets
				+ entityTypeAnimationDirection->typeIndex
			);

			renderableData->animation = (MageAnimation *) (data + animationOffset);
		}
		else
		{
			renderableData->tileset = get_tileset_by_id(entityTypeAnimationDirection->type);
			renderableData->tileIndex = &entityTypeAnimationDirection->typeIndex;
		}
	}

	if(renderableData->animation)
	{
		renderableData->tileset = get_tileset_by_id(renderableData->animation->tilesetIndex);

		renderableData->animationFrame = (
			&renderableData->animation->animationFrames
			+ entity->currentFrame
		);

		renderableData->tileIndex = &renderableData->animationFrame->tileIndex;
	}
}*/

/*
void swap_entity_pointers (MageEntity** xp, MageEntity** yp)
{
	MageEntity* temp = *xp;
	*xp = *yp;
	*yp = temp;
}*/

/*
void sort_current_map_entities_by_render_order ()
{
	uint16_t i, j, min_idx;
	uint16_t n = *currentMap.entityCount;
	MageEntity **array = currentMapEntitiesSortedByRenderOrder;

	for(i = 0; i < n; i++)
	{
		array[i] = currentMapEntities + i;
	}

	// One by one move boundary of unsorted subarray
	for (i = 0; i < n - 1; i++)
	{

		// Find the minimum element in unsorted array
		min_idx = i;
		for (j = i + 1; j < n; j++)
		{
			if (array[j]->y < array[min_idx]->y)
			{
				min_idx = j;
			}
		}

		// Swap the found minimum element
		// with the first element
		swap_entity_pointers(&array[min_idx], &array[i]);
	}
}*/

// MageEntityRenderableData renderableEntityData = {};
// uint8_t animation_frame_limiter = 0;
// uint8_t animation_frame = 0;

/*
void draw_entities()
{
	uint16_t entityCount = *currentMap.entityCount;
	MageEntity *entity;
	MageTileset *tileset;
	uint16_t tileIndex;
	uint16_t tilesetX;
	uint16_t tilesetY;
	uint8_t renderFlags;

	sort_current_map_entities_by_render_order();

	for(uint16_t i = 0; i < entityCount; i++)
	{
		entity = *(currentMapEntitiesSortedByRenderOrder + i);

		get_renderable_data_from_entity(
			entity,
			&renderableEntityData
		);

		tileset     = renderableEntityData.tileset;
		tileIndex   = *renderableEntityData.tileIndex;
		renderFlags = *renderableEntityData.renderFlags;
		tilesetX = *tileset->tileWidth * (tileIndex % *tileset->cols);
		tilesetY = *tileset->tileHeight * (tileIndex / *tileset->cols);

		// printf("tileset->name: %s\n", tileset->name);
		// printf("tileset->tileWidth: %" PRIu16 "\n", *tileset->tileWidth);
		// printf("tileset->tileHeight: %" PRIu16 "\n", *tileset->tileHeight);

		mage_canvas->drawImageWithFlags(
			entity->x - cameraPosition.x,
			entity->y - cameraPosition.y - *tileset->tileHeight,
			*tileset->tileWidth,
			*tileset->tileHeight,
			get_image_by_index(*tileset->imageIndex),
			tilesetX,
			tilesetY,
			*tileset->imageWidth,
			TRANSPARENCY_COLOR,
			renderFlags
		);
	}
}*/

// MageEntity *playerEntity;

/*
void update_entity_frame (
	MageEntity *entity,
	uint16_t *currentFrameTimer
)
{
	*currentFrameTimer += delta_time * 50;
	get_renderable_data_from_entity(entity, &renderableEntityData);
	if(renderableEntityData.animationFrame) {
		if(*currentFrameTimer >= renderableEntityData.animationFrame->duration) {
			*currentFrameTimer = 0;
			entity->currentFrame++;
			entity->currentFrame = (
				entity->currentFrame
				% renderableEntityData.animation->frameCount
			);
		}
}*/

/*
void update_entities ()
{
	MageEntity *entity;
	uint16_t *currentFrameTimer;
	uint16_t entityCount = *currentMap.entityCount;
	for(uint16_t i = 0; i < entityCount; i++) {
		entity = currentMapEntities + i;
		currentFrameTimer = currentMapEntityFrameTicks + i;
		update_entity_frame(
			entity,
			currentFrameTimer
		);
	}
}*/

// extern MageDataMemoryAddresses dataMemoryAddresses;
// extern MageTileset *allTilesets;
// extern uint32_t mapIndex;
// extern uint32_t currentMapIndex;
// extern MageMap currentMap;
// extern MageTileset *currentMapTilesets;
// extern MageEntity *currentMapEntities;
// extern uint16_t *currentMapEntityFrameTicks;
// extern MageAnimationFrame *currentMapEntityFrames;
// extern MageEntity **currentMapEntitiesSortedByRenderOrder;
// extern uint8_t *data;

// uint32_t load_data_headers();

/*void load_tilesets_headers(
	MageTileset *tilesetPointer,
	uint32_t tilesetIndex
);*/

// void load_all_tilesets();
// void load_map_headers(uint32_t incomingMapIndex);
// void correct_entity_type_endians();
// void correct_animation_endians();
// void correct_entity_endians();

// MageEntityType* get_entity_type_by_index(uint8_t index);
// uint16_t* get_image_by_index(uint8_t index);
// MageTileset* get_tileset_by_id(uint8_t index);

/*
typedef struct {
    char name[16];
    uint16_t spriteIndex;
    Point position;
} Entity;
*/

//Deprecated Code Lives Below Here - Delete once everything is working again: -Tim

//MageDataMemoryAddresses dataMemoryAddresses = {};

// MageTileset *allTilesets;
//uint32_t mapIndex = 0;
//uint32_t currentMapIndex = 0;
// MageMap currentMap = {};
// MageTileset *currentMapTilesets;
//MageEntity *currentMapEntities;
//uint16_t *currentMapEntityFrameTicks;
//MageAnimationFrame *currentMapEntityFrames;
//MageEntity **currentMapEntitiesSortedByRenderOrder;
//uint8_t *data;

//#define IDENTIFIER_LENGTH 8
//#define HEADER_START 8

/*
uint32_t count_with_offsets (
	uint8_t *data,
	uint32_t **count,
	uint32_t **offsets,
	uint32_t **lengths
)
{
	uint32_t offset = 0;
	*count = (uint32_t *) data + offset;
	offset += 1;
	convert_endian_u4(*count);

	*offsets = (uint32_t *) data + offset;
	offset += **count;
	convert_endian_u4_buffer(*offsets, **count);

	*lengths = (uint32_t *) data + offset;
	offset += **count;
	convert_endian_u4_buffer(*lengths, **count);

	return offset * sizeof(uint32_t); // but return the offset in # of bytes
}

void correct_image_data_endinness (
	uint8_t *data,
	uint32_t length
)
{
	convert_endian_u2_buffer(
		(uint16_t *) data,
		length / sizeof(uint16_t)
	);
}

uint32_t load_data_headers ()
{
	// seek past identifier
	//uint32_t offset = HEADER_START;

	// TODO: Load entire header with size

	// mapHeader = MageHeader(offset);
	// offset += mapHeader.size();

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.mapCount,
		&dataMemoryAddresses.mapOffsets,
		&dataMemoryAddresses.mapLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.tilesetCount,
		&dataMemoryAddresses.tilesetOffsets,
		&dataMemoryAddresses.tilesetLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.animationCount,
		&dataMemoryAddresses.animationOffsets,
		&dataMemoryAddresses.animationLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.entityTypeCount,
		&dataMemoryAddresses.entityTypeOffsets,
		&dataMemoryAddresses.entityTypeLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.entityCount,
		&dataMemoryAddresses.entityOffsets,
		&dataMemoryAddresses.entityLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.imageCount,
		&dataMemoryAddresses.imageOffsets,
		&dataMemoryAddresses.imageLengths
	);

	if (needs_endian_correction)
	{
		for (uint32_t i = 0; i < *dataMemoryAddresses.imageCount; i++)
		{
			correct_image_data_endinness(
				data + dataMemoryAddresses.imageOffsets[i],
				dataMemoryAddresses.imageLengths[i]
			);
		}
	}

	// printf("dataMemoryAddresses.mapCount: %" PRIu32 "\n", *dataMemoryAddresses.mapCount);
	// printf("dataMemoryAddresses.tilesetCount: %" PRIu32 "\n", *dataMemoryAddresses.tilesetCount);
	// printf("dataMemoryAddresses.animationCount: %" PRIu32 "\n", *dataMemoryAddresses.animationCount);
	// printf("dataMemoryAddresses.entityTypeCount: %" PRIu32 "\n", *dataMemoryAddresses.entityTypeCount);
	// printf("dataMemoryAddresses.entityCount: %" PRIu32 "\n", *dataMemoryAddresses.entityCount);
	// printf("dataMemoryAddresses.imageCount: %" PRIu32 "\n", *dataMemoryAddresses.imageCount);

	// printf("end of headers: %" PRIu32 "\n", offset);

	return offset;
}

void load_tilesets_headers (
	MageTileset *tilesetPointer,
	uint32_t tilesetIndex
)
{
	MageTileset tileset = {};
	uint8_t *tilesetData = data + dataMemoryAddresses.tilesetOffsets[tilesetIndex];
	// printf("tileset[%" PRIu32 "]: offset %" PRIu32 "\n", tilesetIndex, dataMemoryAddresses.tilesetOffsets[tilesetIndex]);
	// printf("tileset[%" PRIu32 "]: %p\n", tilesetIndex, tilesetData);

	tilesetData[15] = 0x00; // null terminate it so things don't go bad
	tileset.name = (char *) tilesetData;
	// printf("tileset.name: %s\n", tileset.name);

	uint32_t offset = 16;

	tileset.imageIndex = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageIndex);
	// printf("tileset.imageIndex: %p\n", tileset.imageIndex);
	// printf("tileset.imageIndex: %" PRIu16 "\n", *tileset.imageIndex);

	tileset.imageWidth = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageWidth);
	// printf("tileset.imageWidth: %p\n", tileset.imageWidth);
	// printf("tileset.imageWidth: %" PRIu16 "\n", *tileset.imageWidth);

	tileset.imageHeight = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageHeight);
	// printf("tileset.imageHeight: %p\n", tileset.imageHeight);
	// printf("tileset.imageHeight: %" PRIu16 "\n", *tileset.imageHeight);

	tileset.tileWidth = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.tileWidth);
	// printf("tileset.tileWidth: %p\n", tileset.tileWidth);
	// printf("tileset.tileWidth: %" PRIu16 "\n", *tileset.tileWidth);

	tileset.tileHeight = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.tileHeight);
	// printf("tileset.tileHeight: %p\n", tileset.tileHeight);
	// printf("tileset.tileHeight: %" PRIu16 "\n", *tileset.tileHeight);

	tileset.cols = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.cols);
	// printf("tileset.cols: %p\n", tileset.cols);
	// printf("tileset.cols: %" PRIu16 "\n", *tileset.cols);

	tileset.rows = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.rows);
	// printf("tileset.rows: %p\n", tileset.rows);
	// printf("tileset.rows: %" PRIu16 "\n", *tileset.rows);

	offset += 2; // pad to to uint32_t alignment

	tileset.startOfTiles = dataMemoryAddresses.tilesetOffsets[tilesetIndex] + offset;
	*tilesetPointer = tileset;
}

void load_all_tilesets ()
{
	// printf("load_all_tilesets:\n");

	uint32_t tilesetCount = *dataMemoryAddresses.tilesetCount;
	allTilesets = (MageTileset *) malloc(tilesetCount * sizeof(MageTileset));

	for (uint32_t i = 0; i < tilesetCount; i++)
	{
		load_tilesets_headers(allTilesets + i, i);
	}
}

void allocate_current_map_entities(
	uint16_t *entityIndices,
	uint16_t entityCount
)
{
	currentMapEntities = (MageEntity *) calloc(entityCount, sizeof(MageEntity));
	currentMapEntityFrameTicks = (uint16_t *) calloc(entityCount, sizeof(uint16_t));
	currentMapEntitiesSortedByRenderOrder = (MageEntity **) calloc(entityCount, sizeof(void*));

	MageEntity *entityInROM;
	MageEntity *entityInRAM;
	uint16_t entityIndex;
	uint32_t offset;

	for (uint32_t i = 0; i < entityCount; i++)
	{
		entityIndex = *(entityIndices + i);
		offset = *(dataMemoryAddresses.entityOffsets + entityIndex);
		entityInRAM = currentMapEntities + i;
		entityInROM = (MageEntity *) (data + offset);
		// printf("name: %s\n", entityInROM->name);
		// printf("  entityIndex: %" PRIu16 "\n", entityIndex);
		// printf("  offset: %" PRIu32 "\n", offset);
		// printf("  entityInRAM pointer: %p\n", entityInRAM);
		// printf("  entityInROM pointer: %p\n", entityInROM);

		memcpy(
			entityInRAM,
			entityInROM,
			sizeof(MageEntity)
		);

		uint32_t entityTypeOffset;
		MageEntityType *entityType;
		char mageType[16] = "goose";
		if (entityInRAM->primaryType == ENTITY_PRIMARY_ENTITY_TYPE)
		{
			entityType = get_entity_type_by_index(entityInRAM->primaryTypeIndex);
			int32_t entityTypeNameComparison = strncmp(mageType, entityType->name, 16);
			// printf("Is this entity the player? A: %s; B %s\n", mageType, entityType->name);
			if (entityTypeNameComparison == 0)
			{
				playerEntity = entityInRAM;
			}
		}

		// printf("  primaryTypeIndex: %" PRIu16 "\n", entityInRAM->primaryTypeIndex);
		// printf("  secondaryTypeIndex: %" PRIu16 "\n", entityInRAM->secondaryTypeIndex);
		// printf("  scriptIndex: %" PRIu16 "\n", entityInRAM->scriptIndex);
		// printf("  x: %" PRIu16 "\n", entityInRAM->x);
		// printf("  y: %" PRIu16 "\n", entityInRAM->y);
	}
}

void load_map_headers (uint32_t incomingMapIndex)
{
	uint8_t *mapData = data + dataMemoryAddresses.mapOffsets[incomingMapIndex];
	// printf("mapData: %p\n", mapData);

	mapData[15] = 0x00; // null terminate it so things don't go bad
	currentMap.name = (char *) mapData;
	// printf("currentMap.name: %s\n", currentMap.name);

	uint32_t offset = 16;

	currentMap.tileWidth = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.tileWidth);
	// printf("currentMap.tileWidth: %p\n", currentMap.tileWidth);
	// printf("currentMap.tileWidth: %" PRIu16 "\n", *currentMap.tileWidth);

	currentMap.tileHeight = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.tileHeight);
	// printf("currentMap.tileHeight: %p\n", currentMap.tileHeight);
	// printf("currentMap.tileHeight: %" PRIu16 "\n", *currentMap.tileHeight);

	currentMap.width = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.width);
	// printf("currentMap.width: %p\n", currentMap.width);
	// printf("currentMap.width: %" PRIu16 "\n", *currentMap.width);

	currentMap.height = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.height);
	// printf("currentMap.height: %p\n", currentMap.height);
	// printf("currentMap.height: %" PRIu16 "\n", *currentMap.height);

	currentMap.layerCount = (mapData + offset);
	offset += 1;
	// printf("currentMap.layerCount: %p\n", currentMap.layerCount);
	// printf("currentMap.layerCount: %" PRIu8 "\n", *currentMap.layerCount);

	currentMap.padding = (mapData + offset);
	offset += 1;

	currentMap.entityCount = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.entityCount);
	// printf("currentMap.entityCount: %p\n", currentMap.entityCount);
	// printf("currentMap.entityCount: %" PRIu8 "\n", *currentMap.entityCount);

	currentMap.entityGlobalIds = (uint16_t *) (mapData + offset);
	offset += *currentMap.entityCount * 2;

	if (*currentMap.entityCount % 2 != 0)
	{
		offset += 2;
	}

	convert_endian_u2_buffer(currentMap.entityGlobalIds, *currentMap.entityCount);

	// printf("currentMap.entityGlobalIds: %p\n", currentMap.entityGlobalIds);
	// for (uint8_t i = 0; i < *currentMap.entityCount; i++) {
	// 	printf("currentMap.entityGlobalIds[%" PRIu8 "]: %" PRIu16 "\n", i, currentMap.entityGlobalIds[i]);
	// }

	allocate_current_map_entities(
		currentMap.entityGlobalIds,
		*currentMap.entityCount
	);

	currentMap.startOfLayers = (
		dataMemoryAddresses.mapOffsets[incomingMapIndex]
		+ offset
	);

	// printf("currentMap.startOfLayers %p\n", currentMap.startOfLayers);
	currentMapIndex = incomingMapIndex;
}

void correct_entity_type_endians ()
{
	uint32_t offset;
	MageEntityType *entityType;
	MageEntityTypeAnimationDirection *entityTypeAnimationDirection;
	// printf("correct_entity_type_endians:\n");

	for (uint32_t i = 0; i < *dataMemoryAddresses.entityTypeCount; i++)
	{
		offset = *(dataMemoryAddresses.entityTypeOffsets + i);
		entityType = (MageEntityType *) (data + offset);
		// printf("  name: %s\n", entityType->name);
		// printf("  animationCount: %" PRIu8 "\n", entityType->animationCount);

		for (uint32_t j = 0; j < (entityType->animationCount * 4); j++)
		{
			entityTypeAnimationDirection = &entityType->entityTypeAnimationDirection + j;
			convert_endian_u2(&entityTypeAnimationDirection->typeIndex);
			// printf("    typeIndex: %" PRIu16 "\n", entityTypeAnimationDirection->typeIndex);
		}
	}
}

void correct_animation_endians ()
{
	uint32_t offset;
	MageAnimation *animation;
	MageAnimationFrame *animationFrame;

	for (uint32_t i = 0; i < *dataMemoryAddresses.animationCount; i++)
	{
		offset = *(dataMemoryAddresses.animationOffsets + i);
		animation = (MageAnimation *) (data + offset);
		convert_endian_u2(&animation->tilesetIndex);
		convert_endian_u2(&animation->frameCount);

		// printf("tilesetIndex: %" PRIu16 "\n", animation->tilesetIndex);
		// printf("frameCount: %" PRIu16 "\n", animation->frameCount);

		for (uint32_t j = 0; j < animation->frameCount; j++)
		{
			animationFrame = &animation->animationFrames + j;
			convert_endian_u2(&animationFrame->tileIndex);
			convert_endian_u2(&animationFrame->duration);
			// printf("  tileIndex: %" PRIu16 "\n", animationFrame->tileIndex);
			// printf("  duration: %" PRIu16 "\n", animationFrame->duration);
			// printf("  j: %" PRIu32 "\n", j);
		}
	}
}

void correct_entity_endians ()
{
	uint32_t offset;
	MageEntity *entity;
	// printf("correct_entity_endians\n");

	for (uint32_t i = 0; i < *dataMemoryAddresses.entityCount; i++)
	{
		offset = *(dataMemoryAddresses.entityOffsets + i);
		entity = (MageEntity *) (data + offset);
		convert_endian_u2(&entity->primaryTypeIndex);
		convert_endian_u2(&entity->secondaryTypeIndex);
		convert_endian_u2(&entity->scriptIndex);
		convert_endian_u2(&entity->x);
		convert_endian_u2(&entity->y);

		// printf("name: %s\n", entity->name);
		// printf("  primaryTypeIndex: %" PRIu16 "\n", entity->primaryTypeIndex);
		// printf("  secondaryTypeIndex: %" PRIu16 "\n", entity->secondaryTypeIndex);
		// printf("  scriptIndex: %" PRIu16 "\n", entity->scriptIndex);
		// printf("  x: %" PRIu16 "\n", entity->x);
		// printf("  y: %" PRIu16 "\n", entity->y);
	}
}

MageEntityType* get_entity_type_by_index(uint8_t index)
{
	return index < *dataMemoryAddresses.entityTypeCount
		? (MageEntityType *) (data + ((uint32_t) *(dataMemoryAddresses.entityTypeOffsets + index)))
		: nullptr;
}

uint16_t* get_image_by_index(uint8_t index)
{
	return index < *dataMemoryAddresses.imageCount
		? (uint16_t *) (data + ((uint32_t) *(dataMemoryAddresses.imageOffsets + index)))
		: nullptr;
}

MageTileset* get_tileset_by_id(uint8_t index)
{
	return index < *dataMemoryAddresses.tilesetCount
		? (MageTileset *) (allTilesets + index)
		: nullptr;

	return nullptr;
}
*/
