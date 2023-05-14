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
#include "fonts/Monaco9.h"
#include <exception>
#include <nrf_delay.h>
#include "sd.h"

/**
 * Constructor for the QSPI driver class
 */
QSPI::QSPI()
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

    // errCode = nrfx_qspi_init(&config, &QSPI::qspi_handler, NULL);
    // removing handler to use synchronous transfer mode
    errCode = nrfx_qspi_init(&config, NULL, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at nrfx_qspi_init() call.");
        throw std::runtime_error{"qspi init"};
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
        error_print("Failure at QSPI chip reset command.");
        throw std::runtime_error{"qspi init"};
    }

    // Set chip to qspi mode
    auto conf_buf = uint8_t{ 0x40 };
    cinstr_cfg.opcode = 0x01;
    cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_3B;
    errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &conf_buf, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at QSPI qspi mode set command.");
        throw std::runtime_error{"qspi init"};
    }

    // Enable extended addressing
    cinstr_cfg.opcode = 0x17;
    cinstr_cfg.wren = false;
    cinstr_cfg.length = NRF_QSPI_CINSTR_LEN_2B;
    uint8_t extadd = 0x80;
    errCode = nrfx_qspi_cinstr_xfer(&cinstr_cfg, &extadd, NULL);
    if (errCode != NRFX_SUCCESS)
    {
        error_print("Failure at QSPI extended addressing set command.");
        throw std::runtime_error{"qspi init"};
    }
    debug_print("QSPI Initialized");
}

/**
 * De-initialize the qspi interface
 */
QSPI::~QSPI()
{
    nrfx_qspi_uninit();
}

bool QSPI::read(void* data, size_t len, uint32_t& startAddress) const
{
    dataReady = false;
    auto result = nrfx_qspi_read(data, len, startAddress);
    if (NRFX_SUCCESS == result)
    {
        startAddress += len;
        
        return true;
    }
    return false;
}


#ifdef DC801_EMBEDDED

void QSPI::EraseSaveSlot(uint8_t slotIndex) const
{
#ifdef DC801_EMBEDDED
    const auto slotAddress = getSaveSlotAddressByIndex(slotIndex);
    if (!erase(tBlockSize::BLOCK_SIZE_256K, slotAddress))
    {
        ENGINE_PANIC("Failed to send erase command for save slot.");
    }
#else

#endif
}

void QSPI::WriteSaveSlot(uint8_t slotIndex, const MageSaveGame* saveData) const
{

#ifdef DC801_EMBEDDED

    EraseSaveSlot(slotIndex);
    auto slotAddress = getSaveSlotAddressByIndex(slotIndex);
    if (!write(saveData, sizeof(MageSaveGame), slotAddress))
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
