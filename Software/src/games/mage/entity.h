#include <cstdint>

struct Point {
    uint16_t x;
    uint16_t y;
};
struct Entity {
    char name[16];
    uint16_t spriteIndex;
    Point position;
};