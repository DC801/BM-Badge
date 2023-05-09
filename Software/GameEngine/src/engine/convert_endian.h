#ifndef CONVERT_ENDIAN_H
#define CONVERT_ENDIAN_H

#include <cstddef>
#include <stdint.h>

extern const char endian_label[];

#define ROM_ENDIAN_U2_VALUE(value)				(value)
#define ROM_ENDIAN_U2_BUFFER(buffer, count)		((void *)buffer)

#define ROM_ENDIAN_U4_VALUE(value)				(value)
#define ROM_ENDIAN_U4_BUFFER(buffer, count)		((void *)buffer)

#define ROM_ENDIAN_F4_VALUE(value)				((value))
#define ROM_ENDIAN_F4_BUFFER(buffer, count)		((void *)buffer)

#define SCREEN_ENDIAN_U2_VALUE(value)				(convert_endian_u2_value(value))
#define SCREEN_ENDIAN_U2_BUFFER(buffer, count)		(convert_endian_u2_buffer(buffer, count))


#if defined(_MSC_VER)
//#pragma intrinsic(_byteswap_ushort)
#define bswap16(value) _byteswap_ushort(value)

//#pragma intrinsic(_byteswap_ulong)
#define bswap32(value) _byteswap_ulong(value)
#else
#define bswap16(value) __builtin_bswap16(value)
#define bswap32(value) __builtin_bswap32(value)
#endif

inline uint16_t convert_endian_u2_value(uint16_t value)
{
	return bswap16(value);
}

inline void convert_endian_u2_buffer(uint16_t* buf, size_t bufferSize)
{
	for (size_t i = 0; i < bufferSize; i++)
	{
		buf[i] = bswap16(buf[i]);
	}
}

uint32_t convert_endian_u4_value (uint32_t value);
void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize);

float convert_endian_f4_value (float value);
void convert_endian_f4_buffer (float *buf, size_t bufferSize);

#endif
