#include <cstdint>

struct Point {
    int32_t x;
    int32_t y;
};
struct Entity {
    char name[16];
    uint16_t spriteIndex;
    Point position;
};