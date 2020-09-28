#include "mage_rom.h"

MageDataMemoryAddresses dataMemoryAddresses = {};

MageTileset *allTilesets;
uint32_t mapIndex = 0;
uint32_t currentMapIndex = 0;
MageMap currentMap = {};
MageTileset *currentMapTilesets;
MageEntity *currentMapEntities;
uint16_t *currentMapEntityFrameTicks;
MageAnimationFrame *currentMapEntityFrames;
MageEntity **currentMapEntitiesSortedByRenderOrder;
uint8_t *data;

void init_rom ()
{
	char dataFilePath[] = "MAGE/game.dat";
	uint32_t dataFileSize = util_sd_file_size(dataFilePath);
	data = (uint8_t *) calloc(dataFileSize, sizeof(uint8_t));
	util_sd_load_file(
		dataFilePath,
		data,
		dataFileSize
	);
	char identifier[9];
	identifier[8] = 0; // null terminate it manually
	memcpy(identifier, data, 8);
	uint8_t indentifierCompare = strcmp(
		"MAGEGAME",
		identifier
	);
	if (indentifierCompare == 0)
	{
		printf("It's the right type!\n");
	}
	else
	{
		printf("It's the WRONG type!\n");
		exit(1);
	}
}

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
	return offset * 4; // but return the offset in # of bytes
}

void correct_image_data_endinness (
	uint8_t *data,
	uint32_t length
)
{
	convert_endian_u2_buffer(
		(uint16_t *) data,
		length / 2
	);
}

uint32_t load_data_headers ()
{
	uint32_t offset = 8; // seek past identifier
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

	printf("dataMemoryAddresses.mapCount: %" PRIu32 "\n", *dataMemoryAddresses.mapCount);
	printf("dataMemoryAddresses.tilesetCount: %" PRIu32 "\n", *dataMemoryAddresses.tilesetCount);
	printf("dataMemoryAddresses.animationCount: %" PRIu32 "\n", *dataMemoryAddresses.animationCount);
	printf("dataMemoryAddresses.entityTypeCount: %" PRIu32 "\n", *dataMemoryAddresses.entityTypeCount);
	printf("dataMemoryAddresses.entityCount: %" PRIu32 "\n", *dataMemoryAddresses.entityCount);
	printf("dataMemoryAddresses.imageCount: %" PRIu32 "\n", *dataMemoryAddresses.imageCount);

	printf("end of headers: %" PRIu32 "\n", offset);
	return offset;
}

void load_tilesets_headers (
	MageTileset *tilesetPointer,
	uint32_t tilesetIndex
)
{
	MageTileset tileset = {};
	uint8_t *tilesetData = data + dataMemoryAddresses.tilesetOffsets[tilesetIndex];
	printf("tileset[%" PRIu32 "]: offset %" PRIu32 "\n", tilesetIndex, dataMemoryAddresses.tilesetOffsets[tilesetIndex]);
	printf("tileset[%" PRIu32 "]: %p\n", tilesetIndex, tilesetData);

	tilesetData[15] = 0x00; // null terminate it so things don't go bad
	tileset.name = (char *) tilesetData;
	printf("tileset.name: %s\n", tileset.name);
	uint32_t offset = 16;

	tileset.imageIndex = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageIndex);
	printf("tileset.imageIndex: %p\n", tileset.imageIndex);
	printf("tileset.imageIndex: %" PRIu16 "\n", *tileset.imageIndex);

	tileset.imageWidth = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageWidth);
	printf("tileset.imageWidth: %p\n", tileset.imageWidth);
	printf("tileset.imageWidth: %" PRIu16 "\n", *tileset.imageWidth);

	tileset.imageHeight = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageHeight);
	printf("tileset.imageHeight: %p\n", tileset.imageHeight);
	printf("tileset.imageHeight: %" PRIu16 "\n", *tileset.imageHeight);

	tileset.tileWidth = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.tileWidth);
	printf("tileset.tileWidth: %p\n", tileset.tileWidth);
	printf("tileset.tileWidth: %" PRIu16 "\n", *tileset.tileWidth);

	tileset.tileHeight = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.tileHeight);
	printf("tileset.tileHeight: %p\n", tileset.tileHeight);
	printf("tileset.tileHeight: %" PRIu16 "\n", *tileset.tileHeight);

	tileset.cols = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.cols);
	printf("tileset.cols: %p\n", tileset.cols);
	printf("tileset.cols: %" PRIu16 "\n", *tileset.cols);

	tileset.rows = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.rows);
	printf("tileset.rows: %p\n", tileset.rows);
	printf("tileset.rows: %" PRIu16 "\n", *tileset.rows);

	offset += 2; // pad to to uint32_t alignment

	tileset.startOfTiles = dataMemoryAddresses.tilesetOffsets[tilesetIndex] + offset;
	*tilesetPointer = tileset;
}

void load_all_tilesets ()
{
	printf("load_all_tilesets:\n");
	uint32_t tilesetCount = *dataMemoryAddresses.tilesetCount;
	allTilesets = (MageTileset *) malloc(tilesetCount * sizeof(MageTileset));
	for (uint32_t i = 0; i < tilesetCount; i++)
	{
		load_tilesets_headers(
			allTilesets + i,
			i
		);
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
	printf("mapData: %p\n", mapData);

	mapData[15] = 0x00; // null terminate it so things don't go bad
	currentMap.name = (char *) mapData;
	printf("currentMap.name: %s\n", currentMap.name);
	uint32_t offset = 16;

	currentMap.tileWidth = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.tileWidth);
	printf("currentMap.tileWidth: %p\n", currentMap.tileWidth);
	printf("currentMap.tileWidth: %" PRIu16 "\n", *currentMap.tileWidth);

	currentMap.tileHeight = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.tileHeight);
	printf("currentMap.tileHeight: %p\n", currentMap.tileHeight);
	printf("currentMap.tileHeight: %" PRIu16 "\n", *currentMap.tileHeight);

	currentMap.width = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.width);
	printf("currentMap.width: %p\n", currentMap.width);
	printf("currentMap.width: %" PRIu16 "\n", *currentMap.width);

	currentMap.height = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.height);
	printf("currentMap.height: %p\n", currentMap.height);
	printf("currentMap.height: %" PRIu16 "\n", *currentMap.height);

	currentMap.layerCount = (mapData + offset);
	offset += 1;
	printf("currentMap.layerCount: %p\n", currentMap.layerCount);
	printf("currentMap.layerCount: %" PRIu8 "\n", *currentMap.layerCount);

	currentMap.padding = (mapData + offset);
	offset += 1;

	currentMap.entityCount = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.entityCount);
	printf("currentMap.entityCount: %p\n", currentMap.entityCount);
	printf("currentMap.entityCount: %" PRIu8 "\n", *currentMap.entityCount);

	currentMap.entityGlobalIds = (uint16_t *) (mapData + offset);
	offset += *currentMap.entityCount * 2;
	if (*currentMap.entityCount % 2 != 0)
	{
		offset += 2;
	}
	convert_endian_u2_buffer(currentMap.entityGlobalIds, *currentMap.entityCount);
	printf("currentMap.entityGlobalIds: %p\n", currentMap.entityGlobalIds);
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
	printf("currentMap.startOfLayers %p\n", currentMap.startOfLayers);
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
	printf("correct_entity_endians\n");
	for (uint32_t i = 0; i < *dataMemoryAddresses.entityCount; i++)
	{
		offset = *(dataMemoryAddresses.entityOffsets + i);
		entity = (MageEntity *) (data + offset);
		convert_endian_u2(&entity->primaryTypeIndex);
		convert_endian_u2(&entity->secondaryTypeIndex);
		convert_endian_u2(&entity->scriptIndex);
		convert_endian_u2(&entity->x);
		convert_endian_u2(&entity->y);
		printf("name: %s\n", entity->name);
		printf("  primaryTypeIndex: %" PRIu16 "\n", entity->primaryTypeIndex);
		printf("  secondaryTypeIndex: %" PRIu16 "\n", entity->secondaryTypeIndex);
		printf("  scriptIndex: %" PRIu16 "\n", entity->scriptIndex);
		printf("  x: %" PRIu16 "\n", entity->x);
		printf("  y: %" PRIu16 "\n", entity->y);
	}
}

MageEntityType* get_entity_type_by_index(uint8_t index)
{
	uint32_t offset = *(dataMemoryAddresses.entityTypeOffsets + index);
	return index < *dataMemoryAddresses.entityTypeCount
		? (MageEntityType *) (data + offset)
		: nullptr;
}
