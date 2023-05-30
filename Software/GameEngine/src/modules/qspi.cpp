/**
 *
 * QSPI driver for the DC801 badge
 *
 * @author @hamster
 * @date 12/24/2020
 *
 */
#include "qspi.h"

#ifdef DC801_EMBEDDED

QSPI::QSPI() noexcept
{
    nrfx_qspi_config_t config = NRFX_QSPI_DEFAULT_CONFIG;

    nrfx_err_t errCode = nrfx_qspi_init(&config, NULL, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        nrfx_qspi_uninit();
        error_print("Failure at nrfx_qspi_init() call: 0x%d", errCode);
        return;
    }
    else
    {
        debug_print("Initialized QSPI")
    }

    nrf_qspi_cinstr_conf_t cinstr_cfg = {
        .opcode = 0xF0, // reset
        .length = NRF_QSPI_CINSTR_LEN_1B,
        .io2_level = true,
        .io3_level = true,
        .wipwait = true,
        .wren = true
    };

    errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, NULL, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at QSPI chip reset command: 0x%d", errCode);
        return;
    }
    else
    {
        debug_print("Soft Reset QSPI")
    }
    
    cinstr_cfg.opcode = 0x30, // clear status register
    errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, NULL, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at QSPI chip CLSR command: 0x%d", errCode);
        return;
    }
    else
    {
        debug_print("Cleared QSPI status register")
    }

    // Set chip to qspi mode
    uint8_t conf_buf[2] = { 0x00, 0x02 };
    cinstr_cfg.opcode = 0x01;
    cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_3B;
    errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, conf_buf, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at QSPI qspi mode set command: 0x%d", errCode);
        return;
    }
    else
    {
        debug_print("Set mode to QSPI")
    }

    // Enable extended addressing
    cinstr_cfg.opcode = 0x17;
    cinstr_cfg.wren = false;
    uint8_t extendedAddressing = 0x80;
    cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_2B;
    errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &extendedAddressing, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at QSPI extended addressing set command: 0x%d", errCode);
        return;
    }
    else
    {
        debug_print("Enabled extended addressing")
    }
    
    initialized = true;
    debug_print("QSPI Configuration Complete");
}

QSPI::~QSPI() noexcept
{
    nrfx_qspi_uninit();
}

bool QSPI::erase(uint32_t startAddress) const noexcept
{
    auto errResult = nrfx_qspi_erase(NRF_QSPI_ERASE_LEN_64KB, startAddress);
    if (NRFX_SUCCESS != errResult) { debug_print("Erase error result: 0x%d", errResult); }
    //while (NRFX_ERROR_BUSY == nrfx_qspi_mem_busy_check()) {}
    return NRFX_SUCCESS == errResult;
}

bool QSPI::chipErase() const noexcept
{
    auto errResult = nrfx_qspi_chip_erase();
    if (NRFX_SUCCESS != errResult) { debug_print("Erase all error result: 0x%d", errResult); }
    //while (NRFX_ERROR_BUSY == nrfx_qspi_mem_busy_check()) {}
    return NRFX_SUCCESS == errResult;
}

bool QSPI::read(char* data, size_t len, uint32_t& startAddress) const noexcept
{
#ifdef DC801_EMBEDDED
    if (NRFX_SUCCESS == nrfx_qspi_read(data, len, startAddress))
    {
        startAddress += len;

        return true;
    }

#endif
    return false;
}

bool QSPI::write(const char* data, size_t len, uint32_t startAddress) const noexcept
{
    static_assert(alignof(data) % 4 == 0, "Write pointers must be aligned to 4-bytes");
    // The QSPI peripheral automatically takes care of splitting DMA transfers into page writes.
    auto errResult = nrfx_qspi_write(data, len, startAddress);
    if (NRFX_SUCCESS != errResult) { debug_print("Write error result: 0x%d", errResult); }
    //while (NRFX_ERROR_BUSY == nrfx_qspi_mem_busy_check()) {}
    return NRFX_SUCCESS == errResult;
}

void QSPI::EraseSaveSlot(uint8_t slotIndex) const noexcept
{
#ifdef DC801_EMBEDDED
    const auto slotAddress = getSaveSlotAddressByIndex(slotIndex);
    if (!erase(slotAddress))
    {
        ENGINE_PANIC("Failed to send erase command for save slot.");
    }
#else

#endif
}

void QSPI::WriteSaveSlot(uint8_t slotIndex, const MageSaveGame* saveData) const noexcept
{

#ifdef DC801_EMBEDDED

    EraseSaveSlot(slotIndex);
    auto slotAddress = getSaveSlotAddressByIndex(slotIndex);
    if (!write((const char*)saveData, sizeof(MageSaveGame), slotAddress))
    {
        ENGINE_PANIC("WriteSaveSlot Failed");
    }

#else

    std::filesystem::directory_entry getOrCreateSaveFilePath() const
    {
        auto saveDir = std::filesystem::directory_entry{ std::filesystem::absolute(DESKTOP_SAVE_FILE_PATH) };
        if (!saveDir.exists())
        {
            if (!std::filesystem::create_directories(saveDir))
            {
                throw "Couldn't create save directory";
            }
        }
        return saveDir;
    }
    auto saveFilePath = getOrCreateSaveFilePath();

    auto file = std::ofstream{ saveFilePath / saveFileSlotNames[slotIndex], std::ios::binary };

    // copy the save data into the file and close it
    if (!file.write((const char*)saveData, sizeof(MageSaveGame)))
    {
        ENGINE_PANIC("Desktop build: SAVE file cannot be written");
    }
    file.close();

#ifdef EMSCRIPTEN
    // triggers a call to the FS.syncfs, asking IDBFS
    // "pls actually do your job and save for reals"
    // It's async, so good luck if you interrupt it
    // ¯\_(ツ)_/¯
    emscripten_run_script("Module.persistSaveFiles();");
#endif // EMSCRIPTEN

#endif // DC801_DESKTOP

}

#endif //DC801_EMBEDDED
