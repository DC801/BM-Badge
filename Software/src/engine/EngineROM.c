#include "common.h"
#include "EngineROM.h"
#include "EnginePanic.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifdef DC801_EMBEDDED

#include "nrfx_qspi.h"

#define QSPI_SCK NRF_GPIO_PIN_MAP(0, 12)
#define QSPI_CSN NRF_GPIO_PIN_MAP(0, 2)
#define QSPI_IO0 NRF_GPIO_PIN_MAP(0, 13)
#define QSPI_IO1 NRF_GPIO_PIN_MAP(1, 12)
#define QSPI_IO2 NRF_GPIO_PIN_MAP(0, 14)
#define QSPI_IO3 NRF_GPIO_PIN_MAP(0, 1)

void EngineROM_Init(void)
{
	nrfx_qspi_config_t qspi_config =
	{
		.xip_offset = 0,
		.pins =
		{
			.sck_pin = QSPI_SCK,
			.csn_pin = QSPI_CSN,
			.io0_pin = QSPI_IO0,
			.io1_pin = QSPI_IO1,
			.io2_pin = QSPI_IO2,
			.io3_pin = QSPI_IO3,
		},
		.prot_if =
		{
			.readoc = NRF_QSPI_READOC_READ4IO,
			.writeoc = NRF_QSPI_WRITEOC_PP4IO,
			.addrmode = NRF_QSPI_ADDRMODE_32BIT,
			.dpmconfig = false,
		},
		.phy_if =
		{
			.sck_freq = NRF_QSPI_FREQ_32MDIV1,
			.sck_delay = 1,
			.spi_mode = NRF_QSPI_MODE_0,
			.dpmen = false,
		},
		.irq_priority = QSPI_CONFIG_IRQ_PRIORITY,
	};

	if (NRFX_SUCCESS != nrfx_qspi_init(&qspi_config, NULL, NULL))
	{
		ENGINE_PANIC("Failed to initialize QSPI");
	}

	nrf_qspi_cinstr_conf_t cinstr_conf =
	{
		.opcode = 0xF0,				// Software reset
		.length = NRF_QSPI_CINSTR_LEN_1B,
		.io2_level = true,
		.io3_level = true,
		.wipwait = false,
		.wren = false
	};

	// Software reset memory chip
	if (NRFX_SUCCESS != nrfx_qspi_cinstr_xfer(&cinstr_conf, NULL, NULL))
	{
		ENGINE_PANIC("Failed to Software Reset via QSPI");
	}

	// Switch to QSPI mode
	cinstr_conf.opcode = 0x01;	// Write configuration registers
	cinstr_conf.length = NRF_QSPI_CINSTR_LEN_3B;
	cinstr_conf.wren = true;
	uint8_t buffer[] =
	{
		0x02,		// Enable quad mode
		0x00,
	};

	if (NRFX_SUCCESS != nrfx_qspi_cinstr_xfer(&cinstr_conf, buffer, NULL))
	{
		ENGINE_PANIC("Failed to enable QSPI quad mode");
	}
}

void EngineROM_Deinit(void) { }

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Read: Null pointer");
	}

	if (NRFX_SUCCESS != nrfx_qspi_read(data, length, address))
	{
		ENGINE_PANIC("Failed to QSPI read");
	}

	return length;
}

uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Write: Null pointer");
	}

	if (NRFX_SUCCESS != nrfx_qspi_write(data, length, address))
	{
		ENGINE_PANIC("Failed to QSPI write");
	}

	return length;
}

uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
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
			return 0;
		}
	}

	return 1;
}
#endif

#ifdef DC801_DESKTOP

FILE *romfile = NULL;
#include <errno.h>
#include <string.h>

void EngineROM_Init(void)
{
	romfile = fopen("MAGE/game.dat", "r+b");

	if (romfile == NULL)
	{
		int error = errno;
		fprintf(stderr, "Error: %s\n", strerror(error));
		ENGINE_PANIC("Failed to load Game Data");
	}
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

uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
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
			return 0;
		}
	}

	return 1;
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

#ifdef __cplusplus
}
#endif
