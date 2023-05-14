/**
 *
 * QSPI driver for the DC801 badge
 *
 * @author @hamster
 * @date 12/24/2020
 *
 */
#ifndef QSPI_H
#define QSPI_H


#include "EngineROM.h"
#include "EngineInput.h"
#include "EnginePanic.h"
#include "FrameBuffer.h"
#include <memory>
#include <filesystem>
#include <stdint.h>

#ifdef DC801_EMBEDDED
#include "config/custom_board.h"
#include <nrf_gpio.h>
#include <nrfx_qspi.h>
#include <nrf_drv_qspi.h>
#include <nrf_error.h>

typedef enum
{
	// BLOCK_SIZE_4K, // disabled because this does nothing at all on our hardware
	// BLOCK_SIZE_64K, // disabled because this is a DAMN LIE on our hardware
	BLOCK_SIZE_256K,
	BLOCK_SIZE_ALL
} tBlockSize;

class QSPI
{
public:
	QSPI();

	bool init();
	void uninit();

	bool isBusy();
	bool erase(tBlockSize blockSize, uint32_t startAddress = 0);
	bool chipErase();
	bool write(void const* data, size_t len, uint32_t startAddress);
	bool read(void* data, size_t len, uint32_t startAddress);


private:

	bool initialized;

	inline static volatile bool ready = false;
	static void qspi_handler(nrfx_qspi_evt_t event, void* p_context);
};

#else


#ifdef NRFX_QSPI_DEFAULT_CONFIG
#undef NRFX_QSPI_DEFAULT_CONFIG
#endif // NRFX_QSPI_DEFAULT_CONFIG

#define NRFX_QSPI_DEFAULT_CONFIG                                        \
{                                                                       \
    .xip_offset  = NRFX_QSPI_CONFIG_XIP_OFFSET,                         \
    .pins = {                                                           \
       .sck_pin     = NRFX_QSPI_PIN_SCK,                                \
       .csn_pin     = NRFX_QSPI_PIN_CSN,                                \
       .io0_pin     = NRFX_QSPI_PIN_IO0,                                \
       .io1_pin     = NRFX_QSPI_PIN_IO1,                                \
       .io2_pin     = NRFX_QSPI_PIN_IO2,                                \
       .io3_pin     = NRFX_QSPI_PIN_IO3,                                \
    },                                                                  \
    .prot_if = {                                                        \
        .readoc     = (nrf_qspi_readoc_t)NRFX_QSPI_CONFIG_READOC,       \
        .writeoc    = (nrf_qspi_writeoc_t)NRFX_QSPI_CONFIG_WRITEOC,     \
        .addrmode   = (nrf_qspi_addrmode_t)NRFX_QSPI_CONFIG_ADDRMODE,   \
        .dpmconfig  = false,                                            \
    },                                                                  \
    .phy_if = {                                                         \
        .sck_delay  = (uint8_t)NRFX_QSPI_CONFIG_SCK_DELAY,              \
        .dpmen      = false,                                            \
        .spi_mode   = (nrf_qspi_spi_mode_t)NRFX_QSPI_CONFIG_MODE,       \
        .sck_freq   = (nrf_qspi_frequency_t)NRFX_QSPI_CONFIG_FREQUENCY, \
    },                                                                  \
    .irq_priority   = (uint8_t)NRFX_QSPI_CONFIG_IRQ_PRIORITY            \
}

#endif // DC801_EMBEDDED

typedef enum
{
    // BLOCK_SIZE_4K, // disabled because this does nothing at all on our hardware
    // BLOCK_SIZE_64K, // disabled because this is a DAMN LIE on our hardware
    BLOCK_SIZE_256K,
    BLOCK_SIZE_ALL
} tBlockSize;

class QSPI
{
public:
    QSPI();
    ~QSPI();

    // inline bool isBusy() const { return !dataReady; };

    /**
     * Erase a number of 256Kb blocks
     * @param startAddress Address to start erasing
     * @return True if successful
     */
    inline bool erase(tBlockSize blockSize, uint32_t startAddress = 0) const
    {
        return NRFX_SUCCESS == nrfx_qspi_erase(NRF_QSPI_ERASE_LEN_64KB, startAddress);
    }

    /**
     * Erase the whole chip
     * @return True on success
     */
    inline bool chipErase() const
    {
        return NRFX_SUCCESS == nrfx_qspi_chip_erase();
    }

    /**
     * Write some data out to the qspi device
     * @param data A pointer to an array of data to write out
     * @param len Number of bytes to send, 
     * @param startAddress offset into the QSPI ROM to write data
     */
    inline bool write(void const* data, size_t len, uint32_t startAddress) const
    {
        return NRFX_SUCCESS == nrfx_qspi_write(data, len, startAddress);
    }


    /**
     * Read from the qspi device
     * @param data A pointer to some memory to write the data into
     * @param len Number of bytes to read
     */
    bool read(void* data, size_t len, uint32_t& startAddress) const;
    
#ifdef DC801_EMBEDDED
    void EraseSaveSlot(uint8_t slotIndex) const;
    void WriteSaveSlot(uint8_t slotIndex, const MageSaveGame* saveData) const;
#endif // DC801_EMBEDDED

private:
    inline static volatile bool dataReady = false;
    static void qspi_handler(nrfx_qspi_evt_t event, void* p_context);

    constexpr uint32_t getSaveSlotAddressByIndex(uint8_t slotIndex) const
    {
        return ENGINE_ROM_SAVE_OFFSET + (slotIndex * ENGINE_ROM_ERASE_PAGE_SIZE);
    }
};

#endif //QSPI_H