#include "common.h"
#include "entity.h"
#include <inttypes.h>

bool running = true;
FrameBuffer *mage_canvas;
uint32_t lastTime;
uint32_t now;
uint32_t delta_time;

uint16_t _uint16Native = 0xFF00;
uint8_t *_uint16TopBit = (uint8_t *)&_uint16Native;
bool _needsSwap = *_uint16TopBit == 0x00;

void convert_endian_u2 (uint16_t *value) {
    if (_needsSwap) {
        *value = __builtin_bswap16(*value);
    }
}
uint16_t convert_endian_u2_value (uint16_t value) {
    return _needsSwap
         ? __builtin_bswap16(value)
         : value;
}
void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize) {
    if (_needsSwap) {
        for (size_t i = 0; i < bufferSize; i++) {
            buf[i] = __builtin_bswap16(buf[i]);
        }
    }
}
void convert_endian_u4 (uint32_t *value) {
    if (_needsSwap) {
        *value = __builtin_bswap32(*value);
    }
}
void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize) {
    if (_needsSwap) {
        for (size_t i = 0; i < bufferSize; i++) {
            buf[i] = __builtin_bswap32(buf[i]);
        }
    }
}

ButtonStates buttons;

void handle_input () {
    buttons = {
        .up    = false,
        .down  = false,
        .left  = false,
        .right = false,
    };
    #ifdef DC801_DESKTOP
    SDL_Event e;
    if (application_quit != 0)
    {
        running = false;
    }

    while (SDL_PollEvent(&e))
    {
        if (e.type == SDL_QUIT)
        {
            running = false;
            break;
        }

        if (e.type == SDL_KEYDOWN)
        {
            if (
                e.key.keysym.sym == SDLK_ESCAPE
                || e.key.keysym.scancode == SDL_SCANCODE_Q
            )
            {
                running = false;
                break;
            }
        }
    }

    nrf_delay_ms(5);
    #endif

    #ifdef DC01_EMBEDDED
    app_usbd_event_queue_process();
    #endif

    if (isButtonDown(USER_BUTTON_UP)) {
        buttons.up = true;
    }
    if (isButtonDown(USER_BUTTON_DOWN)) {
        buttons.down = true;
    }
    if (isButtonDown(USER_BUTTON_LEFT)) {
        buttons.left = true;
    }
    if (isButtonDown(USER_BUTTON_RIGHT)) {
        buttons.right = true;
    }
}

GameDataMemoryAddresses dataMemoryAddresses = {};

GameTileset *allTilesets;
uint32_t mapIndex = 0;
uint32_t currentMapIndex = 0;
GameMap currentMap = {};
GameTileset *currentMapTilesets;
GameEntity *currentMapEntities;
uint16_t *currentMapEntityFrameTicks;
GameAnimationFrame *currentMapEntityFrames;
GameEntity **currentMapEntitiesSortedByRenderOrder;
Point cameraPosition = {
    .x = 0,
    .y = 0,
};

void draw_map (uint8_t *data, uint8_t layer) {
    uint32_t tileCount = *currentMap.width * *currentMap.height;
    uint8_t flags = 0;
    uint16_t tileId = 0;
    uint16_t cols = 0;
    int32_t x = 0;
    int32_t y = 0;
    uint8_t *tiles = data + currentMap.startOfLayers;
    GameTileset tileset;
    GameTile *tile;
    for (uint32_t mapTileIndex = 0; mapTileIndex < tileCount; ++mapTileIndex) {
        x = ((int32_t) *currentMap.tileWidth * (mapTileIndex % *currentMap.width)) - cameraPosition.x;
        y = ((int32_t) *currentMap.tileHeight * (mapTileIndex / *currentMap.width)) - cameraPosition.y;
        if (
            x > -*currentMap.tileWidth
            && x < WIDTH
            && y > -*currentMap.tileHeight
            && y < HEIGHT
        ) {
            tile = (GameTile *) &tiles[
                (layer * tileCount * 4)
                + (mapTileIndex * 4)
            ];
            tileId = convert_endian_u2_value((*tile).tileId);
            if (tileId != 0) {
                tileId -= 1;
                flags = (*tile).flags;
                tileset = allTilesets[(*tile).tilesetId];
                cols = *tileset.cols;
                mage_canvas->drawImageWithFlags(
                    x,
                    y,
                    *currentMap.tileWidth,
                    *currentMap.tileHeight,
                    (uint16_t *) (data + dataMemoryAddresses.imageOffsets[*tileset.imageIndex]),
                    (tileId % cols) * *tileset.tileWidth,
                    (tileId / cols) * *tileset.tileHeight,
                    *tileset.imageWidth,
                    0x0020,
                    flags
                );
            }
        }
    }
}

void get_renderable_data_from_entity (
    uint8_t *data,
    GameEntity *entity,
    GameEntityRenderableData *renderableData
) {
    renderableData->animationFrame = nullptr;
    renderableData->animation = nullptr;
    renderableData->renderFlags = &entity->direction;
    renderableData->tileset = nullptr;
    if(entity->primaryType == ENTITY_PRIMARY_TILESET) {
        renderableData->tileset = allTilesets + entity->primaryTypeIndex;
        renderableData->tileIndex = &entity->secondaryTypeIndex;
    } else if(entity->primaryType == ENTITY_PRIMARY_ANIMATION) {
        uint32_t animationOffset = *(
            dataMemoryAddresses.animationOffsets
            + entity->primaryTypeIndex
        );
        renderableData->animation = (GameAnimation *) (data + animationOffset);
    } else if(entity->primaryType == ENTITY_PRIMARY_ENTITY_TYPE) {
        uint32_t entityTypeOffset = *(
            dataMemoryAddresses.entityTypeOffsets
            + entity->primaryTypeIndex
        );
        auto *entityType = (GameEntityType *) (data + entityTypeOffset);
        GameEntityTypeAnimationDirection *entityTypeAnimationDirection = (
            &entityType->entityTypeAnimationDirection
            + (
                entity->currentAnimation
                * 4
            )
            + entity->direction
        );
        renderableData->renderFlags = &entityTypeAnimationDirection->renderFlags;
        if(entityTypeAnimationDirection->type == 0) {
            uint32_t animationOffset = *(
                dataMemoryAddresses.animationOffsets
                + entityTypeAnimationDirection->typeIndex
            );
            renderableData->animation = (GameAnimation *) (data + animationOffset);
        } else {
            renderableData->tileset = allTilesets + entityTypeAnimationDirection->type;
            renderableData->tileIndex = &entityTypeAnimationDirection->typeIndex;
        }
    }
    if(renderableData->animation) {
        renderableData->tileset = allTilesets + renderableData->animation->tilesetIndex;
        renderableData->animationFrame = (
            &renderableData->animation->animationFrames
            + entity->currentFrame
        );
        renderableData->tileIndex = &renderableData->animationFrame->tileIndex;
    }
}

void swap_entity_pointers (GameEntity** xp, GameEntity** yp) {
    GameEntity* temp = *xp;
    *xp = *yp;
    *yp = temp;
}
void sort_current_map_entities_by_render_order () {
    uint16_t i, j, min_idx;
    uint16_t n = *currentMap.entityCount;
    GameEntity **array = currentMapEntitiesSortedByRenderOrder;
    for(i = 0; i < n; i++) {
        array[i] = currentMapEntities + i;
    }
    // One by one move boundary of unsorted subarray
    for (i = 0; i < n - 1; i++) {

        // Find the minimum element in unsorted array
        min_idx = i;
        for (j = i + 1; j < n; j++){
            if (array[j]->y < array[min_idx]->y) {
                min_idx = j;
            }
        }

        // Swap the found minimum element
        // with the first element
        swap_entity_pointers(&array[min_idx], &array[i]);
    }
}

GameEntityRenderableData renderableEntityData = {};
uint8_t animation_frame_limiter = 0;
uint8_t animation_frame = 0;
void draw_entities(
    uint8_t *data
) {
    uint16_t entityCount = *currentMap.entityCount;
    GameEntity *entity;
    GameTileset *tileset;
    uint32_t imageOffset;
    uint16_t tileIndex;
    uint16_t tilesetX;
    uint16_t tilesetY;
    uint8_t renderFlags;
    sort_current_map_entities_by_render_order();
    for(uint16_t i = 0; i < entityCount; i++) {
        entity = *(currentMapEntitiesSortedByRenderOrder + i);
        get_renderable_data_from_entity(
            data,
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
        imageOffset = dataMemoryAddresses.imageOffsets[*tileset->imageIndex];
        mage_canvas->drawImageWithFlags(
            entity->x - cameraPosition.x,
            entity->y - cameraPosition.y - *tileset->tileHeight,
            *tileset->tileWidth,
            *tileset->tileHeight,
            (uint16_t *) (data + imageOffset),
            tilesetX,
            tilesetY,
            *tileset->imageWidth,
            0x0020,
            renderFlags
        );
    }
}

GameEntity *playerEntity;
uint8_t mageSpeed = 1;
bool isMoving = false;
void apply_input_to_player (uint8_t *data) {
    uint8_t previousPlayerAnimation = playerEntity->currentAnimation;
    isMoving = false;
    if(buttons.left ) { playerEntity->x -= mageSpeed; playerEntity->direction = 3; isMoving = true; }
    if(buttons.right) { playerEntity->x += mageSpeed; playerEntity->direction = 1; isMoving = true; }
    if(buttons.up   ) { playerEntity->y -= mageSpeed; playerEntity->direction = 0; isMoving = true; }
    if(buttons.down ) { playerEntity->y += mageSpeed; playerEntity->direction = 2; isMoving = true; }
    playerEntity->currentAnimation = isMoving ? 1 : 0;
    if(previousPlayerAnimation != playerEntity->currentAnimation) {
        playerEntity->currentFrame = 0;
    }
    get_renderable_data_from_entity(
        data,
        playerEntity,
        &renderableEntityData
    );
    cameraPosition.x = playerEntity->x - HALF_WIDTH + ((*renderableEntityData.tileset->tileWidth) / 2);
    cameraPosition.y = playerEntity->y - HALF_HEIGHT - ((*renderableEntityData.tileset->tileHeight) / 2);
}

void update_entity_frame (
    uint8_t *data,
    GameEntity *entity,
    uint16_t *currentFrameTimer
) {
    *currentFrameTimer += delta_time * 50;
    get_renderable_data_from_entity(data, entity, &renderableEntityData);
    if(renderableEntityData.animationFrame) {
        if(*currentFrameTimer >= renderableEntityData.animationFrame->duration) {
            *currentFrameTimer = 0;
            entity->currentFrame++;
            entity->currentFrame = (
                entity->currentFrame
                % renderableEntityData.animation->frameCount
            );
        }
    }
}

void update_entities (uint8_t *data) {
    GameEntity *entity;
    uint16_t *currentFrameTimer;
    uint16_t entityCount = *currentMap.entityCount;
    for(uint16_t i = 0; i < entityCount; i++) {
        entity = currentMapEntities + i;
        currentFrameTimer = currentMapEntityFrameTicks + i;
        update_entity_frame(
            data,
            entity,
            currentFrameTimer
        );
    }
    
}

void mage_game_loop (uint8_t *data) {
    now = millis();
    delta_time = now - lastTime;

    mage_canvas->clearScreen(RGB(0,0,255));

    apply_input_to_player(data);

    if (*currentMap.layerCount > 1) {
        for (uint8_t layerIndex = 0; layerIndex < *currentMap.layerCount -1; layerIndex++) {
            draw_map(data, layerIndex);
        }
    } else {
        draw_map(data, 0);
    }

    update_entities(
        data
    );

    draw_entities(
        data
    );

    if (*currentMap.layerCount > 1) {
        draw_map(data, *currentMap.layerCount - 1);
    }
    mage_canvas->blt();

    lastTime = now;
}

uint32_t count_with_offsets (
    uint8_t *data,
    uint32_t **count,
    uint32_t **offsets,
    uint32_t **lengths
) {
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

void correct_image_data_endinness (uint8_t *data, uint32_t length) {
    convert_endian_u2_buffer(
        (uint16_t *) data,
        length / 2
    );
}

void load_tilesets_headers (
    GameTileset *tilesetPointer,
    uint8_t *data,
    uint32_t tilesetIndex
) {
    GameTileset tileset = {};
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

void load_all_tilesets (uint8_t *data) {
    printf("load_all_tilesets:\n");
    uint32_t tilesetCount = *dataMemoryAddresses.tilesetCount;
    allTilesets = (GameTileset *) malloc(tilesetCount * sizeof(GameTileset));
    for (uint32_t i = 0; i < tilesetCount; i++) {
        load_tilesets_headers(
            allTilesets + i,
            data,
            i
        );
    }
}

void allocate_current_map_entities(
    uint8_t *data,
    uint16_t *entityIndices,
    uint16_t entityCount
) {
    currentMapEntities = (GameEntity *) calloc(entityCount, sizeof(GameEntity));
    currentMapEntityFrameTicks = (uint16_t *) calloc(entityCount, sizeof(uint16_t));
    currentMapEntitiesSortedByRenderOrder = (GameEntity **) calloc(entityCount, sizeof(void*));
    GameEntity *entityInROM;
    GameEntity *entityInRAM;
    uint16_t entityIndex;
    uint32_t offset;
    for(uint32_t i = 0; i < entityCount; i++) {
        entityIndex = *(entityIndices + i);
        offset = *(dataMemoryAddresses.entityOffsets + entityIndex);
        entityInRAM = currentMapEntities + i;
        entityInROM = (GameEntity *) (data + offset);
        // printf("name: %s\n", entityInROM->name);
        // printf("  entityIndex: %" PRIu16 "\n", entityIndex);
        // printf("  offset: %" PRIu32 "\n", offset);
        // printf("  entityInRAM pointer: %p\n", entityInRAM);
        // printf("  entityInROM pointer: %p\n", entityInROM);
        memcpy(
            entityInRAM,
            entityInROM,
            sizeof(GameEntity)
        );

        uint32_t entityTypeOffset;
        GameEntityType *entityType;
        char mageType[16] = "goose";
        if(entityInRAM->primaryType == ENTITY_PRIMARY_ENTITY_TYPE) {
            entityTypeOffset = *(
                dataMemoryAddresses.entityTypeOffsets
                + entityInRAM->primaryTypeIndex
            );
            entityType = (GameEntityType *) (data + entityTypeOffset);
            int32_t entityTypeNameComparison = strncmp(mageType, entityType->name, 16);
            // printf("Is this entity the player? A: %s; B %s\n", mageType, entityType->name);
            if(entityTypeNameComparison == 0) {
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

void load_map_headers (uint8_t *data, uint32_t incomingMapIndex) {
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
    if (*currentMap.entityCount % 2 != 0) {
        offset += 2;
    }
    convert_endian_u2_buffer(currentMap.entityGlobalIds, *currentMap.entityCount);
    printf("currentMap.entityGlobalIds: %p\n", currentMap.entityGlobalIds);
    for (uint8_t i = 0; i < *currentMap.entityCount; i++) {
        printf("currentMap.entityGlobalIds[%" PRIu8 "]: %" PRIu16 "\n", i, currentMap.entityGlobalIds[i]);
    }
    allocate_current_map_entities(
        data,
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

void correct_entity_type_endians (uint8_t *data) {
    uint32_t offset;
    GameEntityType *entityType;
    GameEntityTypeAnimationDirection *entityTypeAnimationDirection;
    // printf("correct_entity_type_endians:\n");
    for (uint32_t i = 0; i < *dataMemoryAddresses.entityTypeCount; i++) {
        offset = *(dataMemoryAddresses.entityTypeOffsets + i);
        entityType = (GameEntityType *) (data + offset);
        // printf("  name: %s\n", entityType->name);
        // printf("  animationCount: %" PRIu8 "\n", entityType->animationCount);
        for (uint32_t j = 0; j < (entityType->animationCount * 4); j++) {
            entityTypeAnimationDirection = &entityType->entityTypeAnimationDirection + j;
            convert_endian_u2(&entityTypeAnimationDirection->typeIndex);
            // printf("    typeIndex: %" PRIu16 "\n", entityTypeAnimationDirection->typeIndex);
        }
    }
}

void correct_animation_endians (uint8_t *data) {
    uint32_t offset;
    GameAnimation *animation;
    GameAnimationFrame *animationFrame;
    for (uint32_t i = 0; i < *dataMemoryAddresses.animationCount; i++) {
        offset = *(dataMemoryAddresses.animationOffsets + i);
        animation = (GameAnimation *) (data + offset);
        convert_endian_u2(&animation->tilesetIndex);
        convert_endian_u2(&animation->frameCount);
        // printf("tilesetIndex: %" PRIu16 "\n", animation->tilesetIndex);
        // printf("frameCount: %" PRIu16 "\n", animation->frameCount);
        for (uint32_t j = 0; j < animation->frameCount; j++) {
            animationFrame = &animation->animationFrames + j;
            convert_endian_u2(&animationFrame->tileIndex);
            convert_endian_u2(&animationFrame->duration);
            // printf("  tileIndex: %" PRIu16 "\n", animationFrame->tileIndex);
            // printf("  duration: %" PRIu16 "\n", animationFrame->duration);
            // printf("  j: %" PRIu32 "\n", j);
        }
    }
}

void correct_entity_endians (uint8_t *data) {
    uint32_t offset;
    GameEntity *entity;
    printf("correct_entity_endians\n");
    for (uint32_t i = 0; i < *dataMemoryAddresses.entityCount; i++) {
        offset = *(dataMemoryAddresses.entityOffsets + i);
        entity = (GameEntity *) (data + offset);
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

uint32_t load_data_headers (uint8_t *data) {
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

    if (_needsSwap) {
        for (uint32_t i = 0; i < *dataMemoryAddresses.imageCount; i++) {
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

int MAGE() {
    char dataFilePath[] = "MAGE/game.dat";
    uint32_t dataFileSize = util_sd_file_size(dataFilePath);
    uint8_t data[dataFileSize];
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
    if (indentifierCompare == 0) {
        printf("It's the right type!\n");
    } else {
        printf("It's the WRONG type!\n");
        exit(1);
    }

    load_data_headers(data);
    load_all_tilesets(data);
    correct_animation_endians(data);
    correct_entity_type_endians(data);
    correct_entity_endians(data);

    load_map_headers(
        data,
        0
    );

    mage_canvas = p_canvas();
    lastTime = millis();
    while (running)
    {
        handle_input();
        mage_game_loop(data);
    }
    exit(0);
}
