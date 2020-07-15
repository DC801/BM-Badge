#ifndef SOFTWARE_MAGE_H
#define SOFTWARE_MAGE_H

#include "common.h"

char name[16];
char *nameButItsAPointer;

int main() {
    nameButItsAPointer = malloc(16 * sizeOf(char));
}

struct GameDataMemoryAddresses {
    uint16_t mapCount;
    uint32_t *mapOffsets;
    uint16_t tilesetCount;
    uint32_t *tilesetOffsets;
    uint16_t imageCount;
    uint32_t *imageOffsets;
} typedef GameDataMemoryAddresses;

struct GameMap {
    char name[16];
    uint16_t entityCount;
    uint32_t *entityOffsets;
    uint8_t layerCount;
    uint32_t *layerOffsets;
    uint16_t tilesetCount;
    uint32_t *tilesetOffsets;
    uint16_t tileWidth;
    uint16_t tileHeight;
    uint16_t width;
    uint16_t height;
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