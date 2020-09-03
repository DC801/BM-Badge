#ifndef CONVERT_ENDIAN_H
#define CONVERT_ENDIAND_H

#include "common.h"

const bool needs_endian_correction = (*(uint16_t *)"\0\xff" > 255);

void convert_endian_u2 (uint16_t *value);
uint16_t convert_endian_u2_value (uint16_t value);
void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize);
void convert_endian_u4 (uint32_t *value);
void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize);

#endif