#ifndef CONVERT_ENDIAN_H
#define CONVERT_ENDIAN_H

#include "common.h"

extern const bool needs_endian_correction;
extern const char endian_label[];

#ifdef DC801_DESKTOP

#define ENDIAN_U2_VALUE(value)				(convert_endian_u2_value(value))
#define ENDIAN_U2_BUFFER(bufer, count)		(convert_endian_u2_buffer(buffer, count))

#define ENDIAN_U4_VALUE(value)				(convert_endian_u4_value(value))
#define ENDIAN_U4_BUFFER(buffer, count)		(convert_endian_u4_buffer(buffer, count))

#endif

#ifdef DC801_EMBEDDED

#define ENDIAN_U2_VALUE(value)				(value)
#define ENDIAN_U2_BUFFER(bufer, count)		((void *)buffer)

#define ENDIAN_U4_VALUE(value)				(value)
#define ENDIAN_U4_BUFFER(buffer, count)		((void *)buffer)

#endif

uint16_t convert_endian_u2_value (uint16_t value);
void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize);

uint32_t convert_endian_u4_value (uint32_t value);
void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize);

float convert_endian_f4_value (float value);
void convert_endian_f4_buffer (float *buf, size_t bufferSize);

#endif
