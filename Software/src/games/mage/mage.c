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

void mage_game_loop (uint8_t *data) {
    now = millis();
    delta_time = now - lastTime;

    mage_canvas->clearScreen(RGB(0,0,255));
    mage_canvas->drawHorizontalLine(10, 20, 100, RGB(0,255,0));

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

    mage_canvas = p_canvas();
    lastTime = millis();
    while (running)
    {
        handle_input();
        mage_game_loop(data);
    }
    exit(0);
}
