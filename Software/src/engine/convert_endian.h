#ifndef CONVERT_ENDIAN_H
#define CONVERT_ENDIAN_H

#include "common.h"

#if __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
#define IS_BIG_ENDIAN
#endif
#if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
#define IS_LITTLE_ENDIAN
#endif
extern const char endian_label[];

//our data file is little endian, so we only convert if the CPU is big-endian
#ifdef IS_BIG_ENDIAN

#define ENDIAN_U2_VALUE(value)				(convert_endian_u2_value(value))
#define ENDIAN_U2_BUFFER(buffer, count)		(convert_endian_u2_buffer(buffer, count))

#define ENDIAN_U4_VALUE(value)				(convert_endian_u4_value(value))
#define ENDIAN_U4_BUFFER(buffer, count)		(convert_endian_u4_buffer(buffer, count))

#define ENDIAN_F4_VALUE(value)				(convert_endian_f4_value(value))
#define ENDIAN_F4_BUFFER(buffer, count)		(convert_endian_f4_buffer(buffer, count))

#endif

#ifdef IS_LITTLE_ENDIAN

#define ENDIAN_U2_VALUE(value)				(value)
#define ENDIAN_U2_BUFFER(buffer, count)		((void *)buffer)

#define ENDIAN_U4_VALUE(value)				(value)
#define ENDIAN_U4_BUFFER(buffer, count)		((void *)buffer)

#define ENDIAN_F4_VALUE(value)				((value))
#define ENDIAN_F4_BUFFER(buffer, count)		((void *)buffer)

#endif

//comment this out if you need to avoid converting colors to little-endian values:
#define LE_COLOR_CONVERSION_IS_REQUIRED

//this will convert the color codes to little endian if
//LE_COLOR_CONVERSION_IS_REQUIRED is defined
//currently used to speed up writing to the LCD screen
#ifdef LE_COLOR_CONVERSION_IS_REQUIRED
	#define LE_COLOR_CONVERT(i) ((i >> 8) & 0xff) | ((i & 0xff) << 8)
#else
	#define LE_COLOR_CONVERT(i) i
#endif

uint16_t convert_endian_u2_value (uint16_t value);
void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize);

uint32_t convert_endian_u4_value (uint32_t value);
void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize);

float convert_endian_f4_value (float value);
void convert_endian_f4_buffer (float *buf, size_t bufferSize);

#endif
