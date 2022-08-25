#include "convert_endian.h"

#ifdef IS_BIG_ENDIAN
const char endian_label[] = "Big Endian";
#else
const char endian_label[] = "Little Endian";
#endif

uint16_t convert_endian_u2_value (uint16_t value)
{
	return bswap16(value);
}

void convert_endian_u2_buffer (uint16_t *buf, size_t bufferSize)
{
	for (size_t i = 0; i < bufferSize; i++)
	{
		buf[i] = bswap16(buf[i]);
	}
}

uint32_t convert_endian_u4_value (uint32_t value)
{
	return bswap32(value);
}

void convert_endian_u4_buffer (uint32_t *buf, size_t bufferSize)
{
	for (size_t i = 0; i < bufferSize; i++)
	{
		buf[i] = bswap32(buf[i]);
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
	return reverseFloat(value);
}

void convert_endian_f4_buffer (float *buf, size_t bufferSize)
{
	for (size_t i = 0; i < bufferSize; i++)
	{
		buf[i] = reverseFloat(buf[i]);
	}
}
