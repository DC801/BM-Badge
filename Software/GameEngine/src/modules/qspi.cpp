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
  * Handler for the qspi interrupt
  */
void QSPI::qspi_handler(nrf_drv_qspi_evt_t event, void* p_context)
{
    dataReady = true;
}

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

    errCode = nrfx_qspi_init(&config, &QSPI::qspi_handler, NULL);
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
    uint8_t conf_buf[2] = { 0, 2 };
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

/**
 * Erase a number of blocks
 * @param blocksize From the enum, in 4k, 64k or all blocks
 * @param blocks Number of blocks to erase.  Erasing all doesn't need a block size.
 * @return True if successful
 */
bool QSPI::erase(tBlockSize blockSize, uint32_t startAddress) const
{
    nrfx_err_t errCode;

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

    return errCode == NRFX_SUCCESS;
}

/**
 * Erase the whole chip
 * @return True on success
 */
bool QSPI::chipErase() const
{
    return NRFX_SUCCESS == nrfx_qspi_chip_erase();
}

/**
 * Write some data out to the qspi device
 * @param data A pointer to an array of data to write out
 * @param len Number of bytes to send, must be uint32_t aligned
 */
bool QSPI::write(void const* data, size_t len, uint32_t startAddress) const
{
    return NRFX_SUCCESS == nrfx_qspi_write(data, len, startAddress);
}

/**
 * Read from the qspi device
 * @param data A pointer to some memory to write the data into
 * @param len Number of bytes to read
 */
bool QSPI::read(void* data, size_t len, uint32_t& startAddress) const
{
    auto result = nrfx_qspi_read(data, len, startAddress);
    startAddress += len;
    return NRFX_SUCCESS == result;
}


#ifdef DC801_EMBEDDED

void QSPI::HandleROMUpdate(std::shared_ptr<EngineInput> inputHandler, std::shared_ptr<FrameBuffer> frameBuffer) const
{
    debug_print("Checking for ROM update on SD card");
    // handles hardware inputs and makes their state available
    inputHandler->HandleKeyboard();

    //used to verify whether a save is compatible with game data
    uint32_t scenarioDataCRC32;
    uint32_t scenarioDataLength;
    uint32_t engineVersion;

    //skip 'MAGEGAME' and engine version at front of .dat file
    uint32_t offset = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;

    char gameDatHashSD[ENGINE_ROM_MAGIC_HASH_LENGTH + 1]{ 0 };
    char gameDatHashROM[ENGINE_ROM_MAGIC_HASH_LENGTH + 1]{ 0 };
    auto gameDatSDPresent = false;
    auto eraseWholeRomChip = false;
    auto headerHashMatch = false;

    char debugString[512]{ 0 };
    char sdReadBuffer[ENGINE_ROM_SD_CHUNK_READ_SIZE]{ 0 };


    if (!read(&engineVersion, sizeof(engineVersion), offset))
    {
        error_print("Failed to read engineVersion");
    }

    auto romFileIn = SDCardFileStream{ MAGE_GAME_DAT_PATH, std::ios_base::in | std::ios_base::binary };

    if (romFileIn)
    {
        if (!romFileIn.read(gameDatHashSD, ENGINE_ROM_MAGIC_HASH_LENGTH))
        {
            error_print("Could not read hash from game.dat on SD card");
        }
        else
        {
            headerHashMatch = strcmp(gameDatHashSD, gameDatHashROM) != 0;
            if (!headerHashMatch)
            {

                //this will copy from the file `MAGE/game.dat` on the SD card into the ROM chip.
                auto romFileSize = (uint32_t)std::filesystem::file_size(MAGE_GAME_DAT_PATH);
                if (romFileSize > ENGINE_ROM_MAX_DAT_FILE_SIZE)
                {
                    ENGINE_PANIC(
                        "Your game.dat is larger than %d bytes.\n"
                        "You will need to reduce its size to use it\n"
                        "on this board.",
                        ENGINE_ROM_MAX_DAT_FILE_SIZE
                    );
                }

                //48 chars is a good character width for screen width plus some padding
                sprintf(debugString,
                    "Hash doesn't match, press Mem3 to attempt update\n\n"
                    " SD hash: %s\n"
                    "ROM hash: %s\n\n"
                    "Would you like to update your scenario data?\n"
                    "------------------------------------------------\n\n\n"
                    "    > Press MEM0 to cancel\n\n"
                    "    > Press MEM2 to erase whole ROM for recovery\n\n"
                    "    > Press MEM3 to update the ROM",
                    gameDatHashSD,
                    gameDatHashROM);
                debug_print(debugString);


                frameBuffer->clearScreen(COLOR_BLACK);
                frameBuffer->printMessage(debugString, Monaco9, 0xffff, 16, 16);
                frameBuffer->blt();
                
                auto activatedButtons = inputHandler->GetButtonActivatedState();
                do
                {
                    nrf_delay_ms(10);
                    inputHandler->HandleKeyboard();
                    if (activatedButtons.IsPressed(KeyPress::Mem0))
                    {
                        // frameBuffer->clearScreen(COLOR_BLACK);
                        // frameBuffer->blt();
                        return;
                    }
                    else if (activatedButtons.IsPressed(KeyPress::Mem2))
                    {
                        eraseWholeRomChip = true;
                    }
                    activatedButtons = inputHandler->GetButtonActivatedState();
                } while (!activatedButtons.IsPressed(KeyPress::Mem2) && !activatedButtons.IsPressed(KeyPress::Mem3));


                if (eraseWholeRomChip)
                {
                    frameBuffer->printMessage("Erasing WHOLE ROM chip.\nPlease be patient, this may take a few minutes", Monaco9, COLOR_WHITE, 16, 96);
                    frameBuffer->blt();
                    if (!chipErase())
                    {
                        ENGINE_PANIC("Failed to erase WHOLE ROM Chip.");
                    }
                }
                else
                {
                    frameBuffer->printMessage("Erasing ROM chip", Monaco9, COLOR_WHITE, 16, 96);
                    frameBuffer->blt();
                    // I mean, you _COULD_ start by erasing the whole chip...
                    // or you could do it one page at a time, so it saves a LOT of time

                    for (auto currentAddress = uint32_t{ 0 }; currentAddress < romFileSize; currentAddress += ENGINE_ROM_ERASE_PAGE_SIZE)
                    {
                        //Debug Print:
                        sprintf(debugString, "Erasing currentAddress: %08u\nromFileSize:%08u", currentAddress, romFileSize);
                        debug_print(debugString);
                        frameBuffer->fillRect(0, 96, DrawWidth, 96, COLOR_BLACK);
                        frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
                        frameBuffer->blt();

                        if (!erase(tBlockSize::BLOCK_SIZE_256K, currentAddress))
                        {
                            ENGINE_PANIC("Failed to send erase command.");
                        }
                        while (isBusy())
                        {
                            // is very busy
                        }
                    }

                    // erase save games at the end of ROM chip too when copying
                    // because new dat files means new save flags and variables
                    for (uint8_t i = 0; i < ENGINE_ROM_SAVE_GAME_SLOTS; i++)
                    {
                        EraseSaveSlot(i);
                    }
                }

                //then write the entire SD card game.dat file to the ROM chip ENGINE_ROM_SD_CHUNK_READ_SIZE bytes at a time.
                for (auto currentAddress = 0; romFileIn && currentAddress < romFileSize; currentAddress += std::min(ENGINE_ROM_SD_CHUNK_READ_SIZE, (romFileSize - currentAddress)))
                {
                    // copy the file into the buffer
                    if (!romFileIn.read(sdReadBuffer, ENGINE_ROM_SD_CHUNK_READ_SIZE))
                    {
                        ENGINE_PANIC("Desktop build: ROM->RAM read failed");
                    }

                    //write the buffer to the ROM chip:
                    uint32_t romPagesToWrite = ENGINE_ROM_SD_CHUNK_READ_SIZE / ENGINE_ROM_WRITE_PAGE_SIZE;
                    uint32_t partialPageBytesLeftOver = ENGINE_ROM_SD_CHUNK_READ_SIZE % ENGINE_ROM_WRITE_PAGE_SIZE;
                    if (partialPageBytesLeftOver)
                    {
                        romPagesToWrite += 1;
                    }
                    for (auto i = uint32_t{ 0 }; i < romPagesToWrite; i++)
                    {
                        //debug_print("Writing ROM Page %d/%d offset from %d", i, romPagesToWrite, currentAddress);
                        //Debug Print:
                        sprintf(debugString, "Copying currentAddress: %08u\nromFileSize:%08u", currentAddress, romFileSize);
                        frameBuffer->fillRect(0, 96, DrawWidth, 96, COLOR_BLACK);
                        frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
                        frameBuffer->blt();

                        auto romPageOffset = i * ENGINE_ROM_WRITE_PAGE_SIZE;
                        auto readOffset = sdReadBuffer + romPageOffset;
                        auto writeOffset = currentAddress + romPageOffset;
                        auto shouldUsePartialBytes = (i == (romPagesToWrite - 1)) && (partialPageBytesLeftOver != 0);
                        auto writeSize = shouldUsePartialBytes ? partialPageBytesLeftOver : ENGINE_ROM_WRITE_PAGE_SIZE;

                        if (i == (romPagesToWrite - 1))
                        {
                            debug_print("Write Size at %d is %d", i, writeSize);
                        }
                        write((uint8_t*)readOffset, writeSize, writeOffset);
                        // TODO FIXME
                        //verify that the data was correctly written or return false.
                        // Verify(
                        //     writeOffset,
                        //     writeSize,
                        //     (uint8_t*)readOffset,
                        //     true
                        // );
                    }
                }
                headerHashMatch = true;
            }
        }
    }

    if (!read(&scenarioDataCRC32, sizeof(scenarioDataCRC32), offset))
    {
        error_print("Failed to read scenarioDataCRC32");
    }

    if (!read(&scenarioDataLength, sizeof(scenarioDataLength), offset))
    {
        error_print("Failed to read scenarioDataLength");
    }

    const char* updateMessagePrefix;
    if (!headerHashMatch)
    {
        updateMessagePrefix = "The file `game.dat` on your SD card does not\n"
            "match what is on your badge ROM chip.";
    }
    else if (inputHandler->GetButtonState().IsPressed(KeyPress::Mem3))
    {
        updateMessagePrefix = "You have held down MEM3 while booting.\n"
            "You may force update `game.dat` on badge.";
    }
    else
    {
        debug_print("ROM file matched")
            // there is no update, and user is not holding MEM3, proceed as normal
            return;
    }

    frameBuffer->clearScreen(COLOR_BLACK);


    romFileIn.close();
    uint32_t romPagesToWrite = ENGINE_ROM_SD_CHUNK_READ_SIZE / ENGINE_ROM_WRITE_PAGE_SIZE;
    uint32_t partialPageBytesLeftOver = ENGINE_ROM_SD_CHUNK_READ_SIZE % ENGINE_ROM_WRITE_PAGE_SIZE;
    if (partialPageBytesLeftOver)
    {
        romPagesToWrite += 1;
    }
    //print success message:
    debug_print("Successfully copied ROM to QSPI ROM")
        frameBuffer->fillRect(0, 96, DrawWidth, 96, 0x0000);
    frameBuffer->printMessage("SD -> ROM chip copy success", Monaco9, 0xffff, 16, 96);
    frameBuffer->blt();


    offset = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;
    if (!read(&engineVersion, sizeof(engineVersion), offset))
    {
        error_print("Failed to read engineVersion");
    }

    if (engineVersion != ENGINE_VERSION)
    {
        throw std::runtime_error{ "game.dat is incompatible with Engine" };
        // \n\nEngine version : % d\ngame.dat version : % d", ENGINE_VERSION, engineVersion };
    }
}

void QSPI::EraseSaveSlot(uint8_t slotIndex) const
{
#ifdef DC801_EMBEDDED
    const auto slotAddress = getSaveSlotAddressByIndex(slotIndex);
    if (!erase(tBlockSize::BLOCK_SIZE_256K, slotAddress))
    {
        ENGINE_PANIC("Failed to send erase command for save slot.");
    }
    while (isBusy())
    {
        // is very busy
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
