#ifndef SOFTWARE_MAGE_H
#define SOFTWARE_MAGE_H

#include "common.h"

int main();

struct GameDataMemoryAddresses {
    uint32_t *mapCount;
    uint32_t *mapOffsets;
    uint32_t *mapLengths;
    uint32_t *tilesetCount;
    uint32_t *tilesetOffsets;
    uint32_t *tilesetLengths;
    uint32_t *imageCount;
    uint32_t *imageOffsets;
    uint32_t *imageLengths;
} typedef GameDataMemoryAddresses;

struct GameMap {
    char *name;
    uint16_t *tileWidth;
    uint16_t *tileHeight;
    uint16_t *width;
    uint16_t *height;
    uint8_t *layerCount;
    uint8_t *tilesetCount;
    uint16_t *tilesetGlobalIds;
    uint32_t *startOfLayers;
} typedef GameMap;

struct GameTileset {
    char name[16];
    uint32_t imageOffset;
    uint16_t tileWidth;
    uint16_t tileHeight;
    uint16_t width;
    uint16_t height;
};

struct GameTile {
    char type[8];
    uint8_t collision;
} typedef GameTile;

struct GameImage {
    char name[16];
    uint16_t width;
    uint16_t height;
} typedef GameImage;

struct GameEntity {
    char type[16];
    char name[16];
    uint32_t imageOffset;
    uint16_t width;
    uint16_t height;
} typedef GameEntity;

int MAGE(void);

#endif //SOFTWARE_MAGE_H