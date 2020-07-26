#include "common.h"
#include <inttypes.h>

bool running = true;
FrameBuffer *mage_canvas;
uint32_t lastTime;
uint32_t now;
uint32_t delta_time;

uint16_t _uint16Native = 0xFF00;
uint8_t *_uint16TopBit = (uint8_t *)&_uint16Native;
bool _needsSwap = *_uint16TopBit == 0x00;

void ceU2 (uint16_t *value) {
    if (_needsSwap) {
        *value = __builtin_bswap16(*value);
    }
}
void ceU2Buf (uint16_t *buf, size_t bufferSize) {
    if (_needsSwap) {
        for (size_t i = 0; i < bufferSize; i++) {
            buf[i] = __builtin_bswap16(buf[i]);
        }
    }
}
void ceU4 (uint32_t *value) {
    if (_needsSwap) {
        *value = __builtin_bswap32(*value);
    }
}
void ceU4Buf (uint32_t *buf, size_t bufferSize) {
    if (_needsSwap) {
        for (size_t i = 0; i < bufferSize; i++) {
            buf[i] = __builtin_bswap32(buf[i]);
        }
    }
}

void handle_input () {
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
}

GameDataMemoryAddresses dataMemoryAddresses = {};

uint32_t mapIndex = 0;
uint32_t currentMapIndex = 0;

void mage_game_loop (uint8_t *data) {
    now = millis();
    delta_time = now - lastTime;

    mage_canvas->clearScreen(RGB(0,0,255));
    mage_canvas->drawHorizontalLine(0, 96, 127, RGB(0,255,0));

    mage_canvas->drawImage(
        0,
        0,
        128,
        128,
        (uint16_t *) (data + dataMemoryAddresses.imageOffsets[3]),
        256,
        128,
        512,
        0x0020
    );
    mage_canvas->drawImage(
        50,
        32,
        32,
        32,
        (uint16_t *) (data + dataMemoryAddresses.imageOffsets[1]),
        0,
        0,
        128,
        0x0020
    );
    mage_canvas->drawImage(
        8,
        64,
        32,
        32,
        (uint16_t *) (data + dataMemoryAddresses.imageOffsets[2]),
        0,
        0,
        32,
        0x0020
    );
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
    ceU4(*count);

    *offsets = (uint32_t *) data + offset;
    offset += **count;
    ceU4Buf(*offsets, **count);

    *lengths = (uint32_t *) data + offset;
    offset += **count;
    ceU4Buf(*lengths, **count);
    return offset * 4; // but return the offset in # of bytes
}

void correct_image_data_endinness (uint8_t *data, uint32_t length) {
    ceU2Buf(
        (uint16_t *) data,
        length / 2
    );
}


GameMap currentMap = {};
GameTileset *currentMapTilesets;

void load_tilesets_headers (
    GameTileset tileset,
    uint8_t *data,
    uint32_t tilesetIndex
) {
    uint8_t *tilesetData = data + dataMemoryAddresses.tilesetOffsets[tilesetIndex];
    printf("tileset[%" PRIu32 "]: offset %" PRIu32 "\n", tilesetIndex, dataMemoryAddresses.tilesetOffsets[tilesetIndex]);
    printf("tileset[%" PRIu32 "]: %p\n", tilesetIndex, tilesetData);

    tilesetData[15] = 0x00; // null terminate it so things don't go bad
    tileset.name = (char *) tilesetData;
    printf("tileset.name: %s\n", tileset.name);
    uint32_t offset = 16;

    tileset.imageIndex = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.imageIndex);
    printf("tileset.imageIndex: %p\n", tileset.imageIndex);
    printf("tileset.imageIndex: %" PRIu16 "\n", *tileset.imageIndex);

    tileset.imageWidth = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.imageWidth);
    printf("tileset.imageWidth: %p\n", tileset.imageWidth);
    printf("tileset.imageWidth: %" PRIu16 "\n", *tileset.imageWidth);

    tileset.imageHeight = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.imageHeight);
    printf("tileset.imageHeight: %p\n", tileset.imageHeight);
    printf("tileset.imageHeight: %" PRIu16 "\n", *tileset.imageHeight);

    tileset.tileWidth = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.tileWidth);
    printf("tileset.tileWidth: %p\n", tileset.tileWidth);
    printf("tileset.tileWidth: %" PRIu16 "\n", *tileset.tileWidth);

    tileset.tileHeight = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.tileHeight);
    printf("tileset.tileHeight: %p\n", tileset.tileHeight);
    printf("tileset.tileHeight: %" PRIu16 "\n", *tileset.tileHeight);

    tileset.cols = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.cols);
    printf("tileset.cols: %p\n", tileset.cols);
    printf("tileset.cols: %" PRIu16 "\n", *tileset.cols);

    tileset.rows = (uint16_t *) (tilesetData + offset);
    offset += 2;
    ceU2(tileset.rows);
    printf("tileset.rows: %p\n", tileset.rows);
    printf("tileset.rows: %" PRIu16 "\n", *tileset.rows);

    offset += 2; // pad to to uint32_t alignment

    tileset.startOfTiles = dataMemoryAddresses.tilesetOffsets[tilesetIndex] + offset;
}

void load_map_tilesets (uint8_t *data) {
    free(currentMapTilesets);
    currentMapTilesets = (GameTileset *) calloc(
        *currentMap.tilesetCount,
        sizeof(GameTileset)
    );
    for (uint8_t i = 0; i < *currentMap.tilesetCount; i++) {
        load_tilesets_headers(
            currentMapTilesets[i],
            data,
            currentMap.tilesetGlobalIds[i]
        );
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
    ceU2(currentMap.tileWidth);
    printf("currentMap.tileWidth: %p\n", currentMap.tileWidth);
    printf("currentMap.tileWidth: %" PRIu16 "\n", *currentMap.tileWidth);

    currentMap.tileHeight = (uint16_t *) (mapData + offset);
    offset += 2;
    ceU2(currentMap.tileHeight);
    printf("currentMap.tileHeight: %p\n", currentMap.tileHeight);
    printf("currentMap.tileHeight: %" PRIu16 "\n", *currentMap.tileHeight);

    currentMap.width = (uint16_t *) (mapData + offset);
    offset += 2;
    ceU2(currentMap.width);
    printf("currentMap.width: %p\n", currentMap.width);
    printf("currentMap.width: %" PRIu16 "\n", *currentMap.width);

    currentMap.height = (uint16_t *) (mapData + offset);
    offset += 2;
    ceU2(currentMap.height);
    printf("currentMap.height: %p\n", currentMap.height);
    printf("currentMap.height: %" PRIu16 "\n", *currentMap.height);

    currentMap.layerCount = (mapData + offset);
    offset += 1;
    printf("currentMap.layerCount: %p\n", currentMap.layerCount);
    printf("currentMap.layerCount: %" PRIu8 "\n", *currentMap.layerCount);

    currentMap.tilesetCount = (mapData + offset);
    offset += 1;
    printf("currentMap.tilesetCount: %p\n", currentMap.tilesetCount);
    printf("currentMap.tilesetCount: %" PRIu8 "\n", *currentMap.tilesetCount);

    currentMap.tilesetGlobalIds = (uint16_t *) (mapData + offset);
    offset += *currentMap.tilesetCount * 2;
    ceU2Buf(currentMap.tilesetGlobalIds, *currentMap.tilesetCount);
    printf("currentMap.tilesetGlobalIds: %p\n", currentMap.tilesetGlobalIds);
    for (uint8_t i = 0; i < *currentMap.tilesetCount; i++) {
        printf("currentMap.tilesetGlobalId[%" PRIu8 "]: %" PRIu16 "\n", i, currentMap.tilesetGlobalIds[i]);
    }

    currentMap.startOfLayers = (dataMemoryAddresses.mapOffsets[incomingMapIndex] + (offset + 4 - (offset % 4)));
    printf("currentMap.startOfLayers %p\n", currentMap.startOfLayers);
    currentMapIndex = incomingMapIndex;
    load_map_tilesets(data);
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

    printf("dataMemoryAddresses.mapCount: %" PRIu32 "\n", *dataMemoryAddresses.mapCount);
    printf("dataMemoryAddresses.tilesetCount: %" PRIu32 "\n", *dataMemoryAddresses.tilesetCount);
    printf("dataMemoryAddresses.imageCount: %" PRIu32 "\n", *dataMemoryAddresses.imageCount);

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
