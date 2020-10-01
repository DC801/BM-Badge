#include "common.h"
#include "EngineROM.h"

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
		return;
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
		return;
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
		return;
	}
}

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data)
{
	if (data == NULL)
	{
		return 0;
	}

	if (NRFX_SUCCESS != nrfx_qspi_write(data, length, address))
	{
		return 0;
	}

	return length;
}

uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (data == NULL)
	{
		return 0;
	}

	if (NRFX_SUCCESS != nrfx_qspi_read(data, length, address))
	{
		return 0;
	}

	return length;
}

uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data)
{
	if (data == NULL)
	{
		return 0;
	}

	for (uint32_t i = 0; i < length; i++)
	{
		uint8_t read = 0;
		uint8_t *ptr = &read;

		if (NRFX_SUCCESS != nrfx_qspi_read(ptr, sizeof(uint8_t), address + i))
		{
			return 0;
		}

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
	if (romfile == NULL || data == NULL)
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
	if (romfile == NULL || data == NULL)
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
	if (romfile == NULL || data == NULL)
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
			return 0;
		}
	}

	return 1;
}
#endif

#ifdef __cplusplus
}
#endif
