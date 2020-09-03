#ifndef SOFTWARE_MAGE_ENTITY_H
#define SOFTWARE_MAGE_ENTITY_H

#include <stdint.h>

typedef struct {
    int32_t x;
    int32_t y;
} Point;

typedef struct {
    char name[16];
    uint16_t spriteIndex;
    Point position;
} Entity;

#endif
