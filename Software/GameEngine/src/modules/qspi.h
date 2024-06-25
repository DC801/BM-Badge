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
#include "utility.h"
#include <memory>
#include <filesystem>
#include <stdint.h>

#ifdef DC801_EMBEDDED
#include "config/custom_board.h"
#include <nrf_gpio.h>
#include <nrfx_qspi.h>
#include <nrf_drv_qspi.h>
#include <nrf_error.h>
#include <nrf_delay.h>
#endif // DC801_EMBEDDED

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


class QSPI
{
public:

    /**
     * Constructor for the QSPI driver class
     */
    QSPI() noexcept;

    /**
     * De-initialize the qspi interface
     */
    ~QSPI() noexcept;

    inline operator bool() const noexcept { return initialized; };

    /**
     * Erase a number of 256Kb blocks
     * @param startAddress Address to start erasing
     * @return True if successful
     */
    bool erase(uint32_t startAddress = 0) const noexcept;

    /**
     * Erase the whole chip
     * @return True on success
     */
    bool chipErase() const noexcept;
    
    /**
     * Read from the qspi device
     * @param data A pointer to some memory to write the data into
     * @param len Number of bytes to read
     */
    bool read(char* data, size_t len, uint32_t& startAddress) const noexcept;

    /**
     * Write some data out to the qspi device
     * @param data A pointer to an array of data to write out
     * @param len Number of bytes to send,
     * @param startAddress offset into the QSPI ROM to write data
     */
    bool write(const char* data, size_t len, uint32_t startAddress) const noexcept;


#ifdef DC801_EMBEDDED
    void EraseSaveSlot(uint8_t slotIndex) const noexcept;
    void WriteSaveSlot(uint8_t slotIndex, const MageSaveGame* saveData) const noexcept;
#endif // DC801_EMBEDDED

private:
    volatile bool initialized{false};

    constexpr uint32_t getSaveSlotAddressByIndex(uint8_t slotIndex) const
    {
        return ENGINE_ROM_SAVE_OFFSET + (slotIndex * ENGINE_ROM_ERASE_PAGE_SIZE);
    }
};

#endif //QSPI_H