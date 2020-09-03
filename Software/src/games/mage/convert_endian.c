#include "common.h"
#include "convert_endian.h"

const bool needs_endian_correction = (*(uint16_t *)"\0\xff" > 255);

void convert_endian_u2 (uint16_t *value) {
    if (needs_endian_correction) {
        *value = __builtin_bswap16(*value);
    }
}
uint16_t convert_endian_u2_value (uint16_t value) {
    return needs_endian_correction
         ? __builtin_bswap16(value)
         : value;
}
void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize) {
    if (needs_endian_correction) {
        for (size_t i = 0; i < bufferSize; i++) {
            buf[i] = __builtin_bswap16(buf[i]);
        }
    }
}
void convert_endian_u4 (uint32_t *value) {
    if (needs_endian_correction) {
        *value = __builtin_bswap32(*value);
    }
}
void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize) {
    if (needs_endian_correction) {
        for (size_t i = 0; i < bufferSize; i++) {
            buf[i] = __builtin_bswap32(buf[i]);
        }
    }
}