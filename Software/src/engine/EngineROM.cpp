#include "common.h"
#include "EngineROM.h"
#include "EnginePanic.h"

extern FIL raw_file;

#ifdef DC801_EMBEDDED
#include "qspi.h"
//extern QSPI qspiControl;

bool EngineROM_Init(void)
{
	//the QSPI object was alreayd initialized in main.cpp
	//this just needs to check the SD card and see if the ROM
	//should be updated:
	return true;
}

void EngineROM_Deinit(void) { }

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Read: Null pointer");
	}

	/* Old Dovid code deprecated until we get the ROM chip working: -Tim
	if (NRFX_SUCCESS != nrfx_qspi_read(data, length, address))
	{
		ENGINE_PANIC("Failed to QSPI read");
	}
	*/

	FRESULT result;
	UINT count;

	//seek to address:
	result = f_lseek(&raw_file, address);
	if (result != FR_OK) {
		return 0;
	}

	//read from the file into the *data buffer:
	result = f_read(&raw_file, data, length, &count);

	return length;

}

uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Write: Null pointer");
	}

	//this needs to be updated to use the new qspi driver -Tim
	if (0)
	{
		ENGINE_PANIC("Failed to QSPI write");
	}

	return length;
}

bool EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Verify: Null pointer");
	}

	for (uint32_t i = 0; i < length; i++)
	{
		uint8_t read = 0;
		uint8_t *ptr = &read;

		EngineROM_Read(address + i, sizeof(uint8_t), ptr);

		if (read != *data++)
		{
			return false;
		}
	}

	return true;
}
#endif

#ifdef DC801_DESKTOP

FILE *romfile = NULL;
#include <errno.h>
#include <string.h>

bool EngineROM_Init(void)
{
	romfile = fopen("MAGE/game.dat", "r+b");

	if (romfile == NULL)
	{
		int error = errno;
		fprintf(stderr, "Error: %s\n", strerror(error));
		ENGINE_PANIC("Failed to load Game Data");
	}
	return true;
}

void EngineROM_Deinit(void)
{
	if (romfile == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fclose(romfile) != 0)
	{
		ENGINE_PANIC("Failed to close Game Data file");
	}

	romfile = NULL;
}

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data)
{
	if (romfile == NULL || data == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		ENGINE_PANIC("Failed to seek into Game Data");
	}

	return fread(data, sizeof(uint8_t), length, romfile);
}

uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (romfile == NULL || data == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		ENGINE_PANIC("Failed to seek into Game Data");
	}

	return fwrite(data, sizeof(uint8_t), length, romfile);
}

bool EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (romfile == NULL || data == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		ENGINE_PANIC("Failed to seek into Game Data");
	}

	for (uint32_t i = 0; i < length; i++)
	{
		uint8_t read = 0;
		uint8_t *ptr = &read;

		size_t size = fread(ptr, sizeof(uint8_t), 1, romfile);

		if (read != *data++)
		{
			return false;
		}
	}

	return true;
}
#endif

bool EngineROM_Magic(const uint8_t *magic, uint8_t length)
{
	uint8_t buffer[length];
	uint8_t *ptr = buffer;

	uint32_t read = EngineROM_Read(0, length, buffer);

	if (read != length)
	{
		ENGINE_PANIC("Failed to match Game Data magic");
	}

	for (int i = 0; i < length; i++)
	{
		if (*magic++ != *ptr++)
		{
			return false;
		}
	}

	return true;
}
