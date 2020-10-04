#ifndef SOFTWARE_MAGE_H
#define SOFTWARE_MAGE_H

#include "common.h"
#include "entity.h"

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
} MageDataMemoryAddresses;

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

typedef struct {
    uint16_t tileId;
    uint8_t tilesetId;
    uint8_t flags;
} MageTile;

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

typedef struct {
    uint16_t tileIndex;
    uint16_t duration;
} MageAnimationFrame;

typedef struct {
    uint16_t tilesetIndex;
    uint16_t frameCount;
    MageAnimationFrame animationFrames;
} MageAnimation;

typedef struct {
    uint16_t typeIndex;
    uint8_t type;
    uint8_t renderFlags;
} MageEntityTypeAnimationDirection;

typedef struct {
    char name[16];
    uint8_t padding_a;
    uint8_t padding_b;
    uint8_t padding_c;
    uint8_t animationCount;
    MageEntityTypeAnimationDirection entityTypeAnimationDirection;
} MageEntityType;

typedef enum {
    ENTITY_PRIMARY_TILESET = 0,
    ENTITY_PRIMARY_ANIMATION = 1,
    ENTITY_PRIMARY_ENTITY_TYPE = 2
} MageEntityPrimaryIdType;

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
} MageEntity;

typedef struct {
    char name[16];
    uint16_t width;
    uint16_t height;
} MageImage;

typedef struct {
    // MageTileset *tileset;
    MageEntityType *entityType;
    MageAnimation *animation;
    MageAnimationFrame *animationFrame;
    uint16_t *tileIndex;
    uint8_t *renderFlags;
} MageEntityRenderableData;

extern MageDataMemoryAddresses dataMemoryAddresses;
extern MageEntity *playerEntity;
extern MageEntityRenderableData renderableEntityData;
extern Point cameraPosition;

void MAGE(void);

void get_renderable_data_from_entity(
	MageEntity *entity,
	MageEntityRenderableData *renderableData
);

#endif //SOFTWARE_MAGE_H
