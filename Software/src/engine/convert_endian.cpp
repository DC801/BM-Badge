#include "common.h"
#include "convert_endian.h"

const bool needs_endian_correction = *(uint16_t*)"\0\xff" > 255;
#if __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
const char endian_label[] = "Big Endian";
#endif
#if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
const char endian_label[] = "Little Endian";
#endif

uint16_t convert_endian_u2_value (uint16_t value)
{
	if (needs_endian_correction == true)
	{
		return __builtin_bswap16(value);
	}
	else
	{
		return value;
	}
}

void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize)
{
	if (needs_endian_correction)
	{
		for (size_t i = 0; i < bufferSize; i++)
		{
			buf[i] = __builtin_bswap16(buf[i]);
		}
	}
}

uint32_t convert_endian_u4_value (uint32_t value)
{
	if (needs_endian_correction)
	{
		return __builtin_bswap32(value);
	}
	else
	{
		return value;
	}
}

float reverseFloat(const float in)
{
	float retVal;
	uint8_t *floatToConvert = (uint8_t *) &in;
	uint8_t *returnFloat = (uint8_t *) &retVal;

	// swap the bytes into a temporary buffer
	returnFloat[0] = floatToConvert[3];
	returnFloat[1] = floatToConvert[2];
	returnFloat[2] = floatToConvert[1];
	returnFloat[3] = floatToConvert[0];

	return retVal;
}

float convert_endian_f4_value (float value)
{
	if (needs_endian_correction)
	{
		return reverseFloat(value);
	}
	else
	{
		return value;
	}
}

void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize)
{
	if (needs_endian_correction)
	{
		for (size_t i = 0; i < bufferSize; i++)
		{
			buf[i] = __builtin_bswap32(buf[i]);
		}
	}
}

void convert_endian_f4_buffer (float *buf, size_t bufferSize)
{
	if (needs_endian_correction)
	{
		for (size_t i = 0; i < bufferSize; i++)
		{
			buf[i] = reverseFloat(buf[i]);
		}
	}
}
