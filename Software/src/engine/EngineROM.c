#include "common.h"
#include "EngineROM.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifdef DC801_EMBEDDED
void EngineROM_Init(void)
{

}

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data)
{

}

uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data)
{

}

uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
{

}
#endif

#ifdef DC801_DESKTOP

FILE *romfile = NULL;

void EngineROM_Init(void)
{
	romfile = fopen("MAGE/game.dat", "a+b");

	if (romfile == NULL)
	{
		printf("Failed to load game.dat\n");
		exit(1);
	}
}

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data)
{
	if (romfile == NULL)
	{
		printf("game.dat is not open: aborting\n");
		exit(1);
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		printf("Failed to seek into game.dat\n");
		exit(1);
	}

	return fread(data, sizeof(uint8_t), length, romfile);
}

uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (romfile == NULL)
	{
		printf("game.dat is not open: aborting\n");
		exit(1);
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		printf("Failed to seek into game.dat\n");
		exit(1);
	}

	return fwrite(data, sizeof(uint8_t), length, romfile);
}

uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (romfile == NULL)
	{
		printf("game.dat is not open: aborting\n");
		exit(1);
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		printf("Failed to seek into game.dat\n");
		exit(1);
	}

	for (uint32_t i = 0; i < length; i++)
	{
		uint8_t read = 0;
		uint8_t *ptr = &read;

		fread(ptr, sizeof(uint8_t), 1, romfile);

		if (read != *data++)
		{
			return 1;
		}
	}

	return 0;
}
#endif

#ifdef __cplusplus
}
#endif
