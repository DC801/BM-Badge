#ifndef SOFTWARE_MAGE_H
#define SOFTWARE_MAGE_H

#include "common.h"

int main();

typedef struct {
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
} GameDataMemoryAddresses;

typedef struct {
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
} GameMap;

typedef struct {
    uint16_t tileId;
    uint8_t tilesetId;
    uint8_t flags;
} GameTile;

typedef struct {
    char *name;
    uint16_t *imageIndex;
    uint16_t *imageWidth;
    uint16_t *imageHeight;
    uint16_t *tileWidth;
    uint16_t *tileHeight;
    uint16_t *cols;
    uint16_t *rows;
    uint32_t startOfTiles;
} GameTileset;

typedef struct {
    uint16_t tileIndex;
    uint16_t duration;
} GameAnimationFrame;

typedef struct {
    uint16_t tilesetIndex;
    uint16_t frameCount;
    GameAnimationFrame animationFrames;
} GameAnimation;

typedef struct {
    uint16_t typeIndex;
    uint8_t type;
    uint8_t renderFlags;
} GameEntityTypeAnimationDirection;

typedef struct {
    char name[16];
    uint8_t padding_a;
    uint8_t padding_b;
    uint8_t padding_c;
    uint8_t animationCount;
    GameEntityTypeAnimationDirection entityTypeAnimationDirection;
} GameEntityType;

typedef enum {
    ENTITY_PRIMARY_TILESET = 0,
    ENTITY_PRIMARY_ANIMATION = 1,
    ENTITY_PRIMARY_ENTITY_TYPE = 2
} GameEntityPrimaryIdType;

typedef struct {
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
} GameEntity;

typedef struct {
    char name[16];
    uint16_t width;
    uint16_t height;
} GameImage;

typedef struct {
    GameTileset *tileset;
    GameAnimation *animation;
    GameAnimationFrame *animationFrame;
    uint16_t *tileIndex;
    uint8_t *renderFlags;
} GameEntityRenderableData;

typedef struct {
    bool up;
    bool down;
    bool left;
    bool right;
} ButtonStates;

int MAGE(void);

#endif //SOFTWARE_MAGE_H