/**
 * 
 * QSPI driver for the DC801 badge
 * 
 * @author @hamster
 * @date 12/24/2020
 *
 */


#ifdef DC801_EMBEDDED

#include "common.h"
#include "qspi.h"

/**
 * Handler for the qspi interrupt
 */
void QSPI::qspi_handler(nrf_drv_qspi_evt_t event, void * p_context){
	ready = true;
}

/**
 * Constructor for the QSPI driver class
 */
QSPI::QSPI(){
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
bool QSPI::init(){

	nrfx_err_t errCode;
	nrfx_qspi_config_t config = NRFX_QSPI_DEFAULT_CONFIG;

	errCode = nrfx_qspi_init(&config, QSPI::qspi_handler, NULL);
	if(errCode != NRFX_SUCCESS){
		return false;
	}

	nrf_qspi_cinstr_conf_t cinstr_cfg = {
		.opcode    = 0xF0,
		.length    = NRF_QSPI_CINSTR_LEN_1B,
		.io2_level = true,
		.io3_level = true,
		.wipwait   = true,
		.wren      = true
	};

	// Send reset to chip
	errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, NULL, NULL);
	if(errCode != NRFX_SUCCESS){
		return false;
	}

	// Set chip to qspi mode
	uint8_t conf_buf[2] = {0, 2};
	cinstr_cfg.opcode = 0x01;
	cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_3B;
	errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &conf_buf, NULL);
	if(errCode != NRFX_SUCCESS){
		return false;
	}

	// Enable extended addressing
	cinstr_cfg.opcode = 0x17;
	cinstr_cfg.wren = false;
	cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_2B;
	uint8_t extadd = 0x80;
	errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &extadd, NULL);
	if(errCode != NRFX_SUCCESS){
		return false;
	}

	// Looking good
	this->initialized = true;
	return true;
}

/**
 * De-initialize the qspi interface
 */
void QSPI::uninit(){
	nrfx_qspi_uninit();
}

/**
 * @return true if the qspi device is idle
 */
bool QSPI::isBusy(){
	return ready;
}

/**
 * Erase a number of blocks
 * @param blocksize From the enum, in 4k, 64k or all blocks
 * @param blocks Number of blocks to erase.  Erasing all doesn't need a block size.
 * @return True if successful
 */
bool QSPI::erase(tBlockSize blockSize, uint32_t startAddress){

	nrfx_err_t errCode;

	if(!this->initialized){
		return false;
	}

	switch(blockSize){
		case BLOCK_SIZE_4K:
			errCode = nrfx_qspi_erase(NRF_QSPI_ERASE_LEN_4KB, startAddress);
			break;
		case BLOCK_SIZE_64K:
			errCode = nrfx_qspi_erase(NRF_QSPI_ERASE_LEN_64KB, startAddress);
			break;
		case BLOCK_SIZE_ALL:
			errCode = nrfx_qspi_chip_erase();
			break;
		default:
			return false;
	}

	if(errCode == NRFX_SUCCESS){
		return true;
	}

	return false;

}

/**
 * Erase the whole chip
 * @return True on success
 */
bool QSPI::chipErase(){

	if(!this->initialized){
		return false;
	}

	if(nrfx_qspi_chip_erase() == NRFX_SUCCESS){
		ready = false;
		return true;
	}

	return false;

}

/**
 * Write some data out to the qspi device
 * @param data A pointer to an array of data to write out
 * @param len Number of bytes to send
 */
bool QSPI::write(void const *data, size_t len, uint32_t startAddress){

	if(!this->initialized){
		return false;
	}

	while(!ready){
		// Wait for any current actions to complete
	}
	if(nrfx_qspi_write(data, len, startAddress) == NRFX_SUCCESS){
		ready = false;
		return true;
	}

	return false;
}

/**
 * Read from the qspi device
 * @param data A pointer to some memory to write the data into
 * @param len Number of bytes to read
 */
bool QSPI::read(void *data, size_t len, uint32_t startAddress){

	if(!this->initialized){
		return false;
	}

	while(!ready){
		// Wait for any current actions to complete
	}
	if(nrfx_qspi_read(data, len, startAddress) == NRFX_SUCCESS){
		ready = false;
		return true;
	}

	return false;
}


#endif