/**
 *
 * QSPI driver for the DC801 badge
 *
 * @author @hamster
 * @date 12/24/2020
 *
 */
#include "qspi.h"
#include "utility.h"

 /**
  * Handler for the qspi interrupt
  */
void QSPI::qspi_handler(nrf_drv_qspi_evt_t event, void* p_context)
{
	ready = true;
}

/**
 * Constructor for the QSPI driver class
 */
QSPI::QSPI()
{
	ready = false;
	this->initialized = false;
}


/**
 * Initialize the qspi interface
 *
 * Datasheet for the S25FL256S is located at
 * https://www.cypress.com/file/448601/download
 *
 * @return true on success, false if not successful
 */
bool QSPI::init()
{
	auto errCode = nrfx_err_t{ 0 };
	auto config = nrfx_qspi_config_t{
		NRFX_QSPI_CONFIG_XIP_OFFSET,
		nrf_qspi_pins_t{
		   NRFX_QSPI_PIN_SCK,
		   NRFX_QSPI_PIN_CSN,
		   NRFX_QSPI_PIN_IO0,
		   NRFX_QSPI_PIN_IO1,
		   NRFX_QSPI_PIN_IO2,
		   NRFX_QSPI_PIN_IO3
		},
		nrf_qspi_prot_conf_t{
			(nrf_qspi_readoc_t)NRFX_QSPI_CONFIG_READOC,
			(nrf_qspi_writeoc_t)NRFX_QSPI_CONFIG_WRITEOC,
			(nrf_qspi_addrmode_t)NRFX_QSPI_CONFIG_ADDRMODE,
			false,
		},
		nrf_qspi_phy_conf_t{
			(uint8_t)NRFX_QSPI_CONFIG_SCK_DELAY,
			false,
			(nrf_qspi_spi_mode_t)NRFX_QSPI_CONFIG_MODE,
			(nrf_qspi_frequency_t)NRFX_QSPI_CONFIG_FREQUENCY
		},
		(uint8_t)NRFX_QSPI_CONFIG_IRQ_PRIORITY
	};

	errCode = nrfx_qspi_init(&config, NULL, NULL);
	if (errCode != NRFX_SUCCESS)
	{
		debug_print("Failure at nrfx_qspi_init() call.");
		return false;
	}

	//Add High Drive mode to QSPI pin config:
	nrf_gpio_cfg(
		BSP_QSPI_SCK_PIN,
		NRF_GPIO_PIN_DIR_OUTPUT,
		NRF_GPIO_PIN_INPUT_DISCONNECT,
		NRF_GPIO_PIN_NOPULL,
		NRF_GPIO_PIN_H0H1,
		NRF_GPIO_PIN_NOSENSE
	);
	nrf_gpio_cfg(
		BSP_QSPI_CSN_PIN,
		NRF_GPIO_PIN_DIR_OUTPUT,
		NRF_GPIO_PIN_INPUT_DISCONNECT,
		NRF_GPIO_PIN_NOPULL,
		NRF_GPIO_PIN_H0H1,
		NRF_GPIO_PIN_NOSENSE
	);
	nrf_gpio_cfg(
		BSP_QSPI_IO0_PIN,
		NRF_GPIO_PIN_DIR_INPUT,
		NRF_GPIO_PIN_INPUT_DISCONNECT,
		NRF_GPIO_PIN_PULLUP,
		NRF_GPIO_PIN_H0H1,
		NRF_GPIO_PIN_NOSENSE
	);
	nrf_gpio_cfg(
		BSP_QSPI_IO1_PIN,
		NRF_GPIO_PIN_DIR_INPUT,
		NRF_GPIO_PIN_INPUT_DISCONNECT,
		NRF_GPIO_PIN_PULLUP,
		NRF_GPIO_PIN_H0H1,
		NRF_GPIO_PIN_NOSENSE
	);
	nrf_gpio_cfg(
		BSP_QSPI_IO2_PIN,
		NRF_GPIO_PIN_DIR_INPUT,
		NRF_GPIO_PIN_INPUT_DISCONNECT,
		NRF_GPIO_PIN_PULLUP,
		NRF_GPIO_PIN_H0H1,
		NRF_GPIO_PIN_NOSENSE
	);
	nrf_gpio_cfg(
		BSP_QSPI_IO3_PIN,
		NRF_GPIO_PIN_DIR_INPUT,
		NRF_GPIO_PIN_INPUT_DISCONNECT,
		NRF_GPIO_PIN_PULLUP,
		NRF_GPIO_PIN_H0H1,
		NRF_GPIO_PIN_NOSENSE
	);

	nrf_qspi_cinstr_conf_t cinstr_cfg = {
		.opcode = 0xF0,
		.length = NRF_QSPI_CINSTR_LEN_1B,
		.io2_level = true,
		.io3_level = true,
		.wipwait = true,
		.wren = true
	};

	// Send reset to chip
	errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, NULL, NULL);
	if (errCode != NRFX_SUCCESS)
	{
		debug_print("Failure at QSPI chip reset command.");
		return false;
	}

	// Set chip to qspi mode
	uint8_t conf_buf[2] = { 0, 2 };
	cinstr_cfg.opcode = 0x01;
	cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_3B;
	errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &conf_buf, NULL);
	if (errCode != NRFX_SUCCESS)
	{
		debug_print("Failure at QSPI qspi mode set command.");
		return false;
	}

	// Enable extended addressing
	cinstr_cfg.opcode = 0x17;
	cinstr_cfg.wren = false;
	cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_2B;
	uint8_t extadd = 0x80;
	errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &extadd, NULL);
	if (errCode != NRFX_SUCCESS)
	{
		debug_print("Failure at QSPI extended addressing set command.");
		return false;
	}

	// Looking good
	this->initialized = true;
	return true;
}

/**
 * De-initialize the qspi interface
 */
void QSPI::uninit()
{
	nrfx_qspi_uninit();
}

/**
 * @return true if the qspi device is idle
 */
bool QSPI::isBusy()
{
	return ready;
}

/**
 * Erase a number of blocks
 * @param blocksize From the enum, in 4k, 64k or all blocks
 * @param blocks Number of blocks to erase.  Erasing all doesn't need a block size.
 * @return True if successful
 */
bool QSPI::erase(tBlockSize blockSize, uint32_t startAddress)
{

	nrfx_err_t errCode;

	if (!this->initialized)
	{
		return false;
	}

	switch (blockSize)
	{
		// disabled because it does nothing on our hardware
		// case BLOCK_SIZE_4K:
		// 	errCode = nrfx_qspi_erase(NRF_QSPI_ERASE_LEN_4KB, startAddress);
		// 	break;
	case BLOCK_SIZE_256K:
		errCode = nrfx_qspi_erase(
			// NOPE, THIS "NRF_QSPI_ERASE_LEN_64KB" NAME IS WRONG!
			// on our chip, this value ACTUALLY erases 262144 bytes (256KB)
			NRF_QSPI_ERASE_LEN_64KB, // THIS IS A DAMN LIE
			startAddress
		);
		break;
	case BLOCK_SIZE_ALL:
		errCode = nrfx_qspi_chip_erase();
		break;
	default:
		return false;
	}

	if (errCode == NRFX_SUCCESS)	
{
		return true;
	}

	return false;

}

/**
 * Erase the whole chip
 * @return True on success
 */
bool QSPI::chipErase()
{

	if (!this->initialized)
	{
		return false;
	}

	if (nrfx_qspi_chip_erase() == NRFX_SUCCESS)
	{
		return true;
	}

	return false;

}

/**
 * Write some data out to the qspi device
 * @param data A pointer to an array of data to write out
 * @param len Number of bytes to send, must be uint32_t aligned
 */
bool QSPI::write(void const* data, size_t len, uint32_t startAddress)
{

	if (!this->initialized)
	{
		return false;
	}

	if (nrfx_qspi_write(data, len, startAddress) == NRFX_SUCCESS)
	{
		return true;
	}

	return false;
}

/**
 * Read from the qspi device
 * @param data A pointer to some memory to write the data into
 * @param len Number of bytes to read
 */
bool QSPI::read(void* data, size_t len, uint32_t startAddress)
{

	if (!this->initialized)
	{
		return false;
	}

	if (nrfx_qspi_read(data, len, startAddress) == NRFX_SUCCESS)
	{
		return true;
	}

	return false;
}