#include "EngineROM.h"
#include "FrameBuffer.h"

#ifdef DC801_EMBEDDED
#include "qspi.h"
extern QSPI qspiControl;

#else

#endif //DC801_DESKTOP

#ifdef DC801_EMBEDDED


void HandleROMUpdate(std::shared_ptr<FrameBuffer> frameBuffer)
{
    // handles hardware inputs and makes their state available
    inputHandler->HandleKeyboard();
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
        // there is no update, and user is not holding MEM3, proceed as normal
        return;
    }

    // show update confirmation
    char debugString[512];

    // frameBuffer->clearScreen(COLOR_BLACK);
    // //48 chars is a good character width for screen width plus some padding
    // sprintf(debugString,
    //    "%s\n\n"
    //    " SD hash: %s\n"
    //    "ROM hash: %s\n\n"
    //    "Would you like to update your scenario data?\n"
    //    "------------------------------------------------\n\n\n"
    //    "    > Press MEM0 to cancel\n\n"
    //    "    > Press MEM2 to erase whole ROM for recovery\n\n"
    //    "    > Press MEM3 to update the ROM",
    //    updateMessagePrefix,
    //    gameDatHashSDString,
    //    gameDatHashROMString);
    // frameBuffer->printMessage(debugString, Monaco9, 0xffff, 16, 16);
    // frameBuffer->blt();

    do
    {
        nrf_delay_ms(10);
        inputHandler->HandleKeyboard();
        if (EngineInput_Activated.mem0)
        {
            // frameBuffer->clearScreen(COLOR_BLACK);
            // frameBuffer->blt();
            return;
        }
        else if (EngineInput_Activated.mem2)
        {
            eraseWholeRomChip = true;
        }
    } while (!EngineInput_Activated.mem2 && !EngineInput_Activated.mem3);

    if (!SD_Copy(gameDatFilesize, gameDat, eraseWholeRomChip))
    {
        ENGINE_PANIC("SD Copy Operation was not successful.");
    }
}

void EraseSaveSlot(uint8_t slotIndex)
{
#ifdef DC801_EMBEDDED
    if (!qspiControl.erase(tBlockSize::BLOCK_SIZE_256K, getSaveSlotAddressByIndex(slotIndex)))
    {
        ENGINE_PANIC("Failed to send erase command for save slot.");
    }
    while (qspiControl.isBusy())
    {
        // is very busy
    }
#else

#endif
}

void WriteSaveSlot(uint8_t slotIndex, const MageSaveGame* saveData) const
{
#ifdef DC801_EMBEDDED
    EraseSaveSlot(slotIndex);
    auto offset = getSaveSlotAddressByIndex(slotIndex);
    //       if (!qspiControl.write(saveData, sizeof(MageSaveGame), offset))
    //       {
    //          ENGINE_PANIC(errorString);
    //       }
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

//this will copy from the file `MAGE/game.dat` on the SD card into the ROM chip.
bool SD_Copy(
    uint32_t gameDatFilesize,
    std::filesystem::path gameDatPath,
    bool eraseWholeRomChip
)
{
    if (gameDatFilesize > ENGINE_ROM_MAX_DAT_FILE_SIZE)
    {
        ENGINE_PANIC(
            "Your game.dat is larger than %d bytes.\n"
            "You will need to reduce its size to use it\n"
            "on this board.",
            ENGINE_ROM_MAX_DAT_FILE_SIZE
        );
    }
    char debugString[128];
    FRESULT result;
    UINT count = 0;
    frameBuffer->clearScreen(COLOR_BLACK);
    uint32_t currentAddress = 0;
    uint8_t sdReadBuffer[ENGINE_ROM_SD_CHUNK_READ_SIZE]{ 0 };
    if (eraseWholeRomChip)
    {
        frameBuffer->printMessage("Erasing WHOLE ROM chip.\nPlease be patient, this may take a few minutes", Monaco9, COLOR_WHITE, 16, 96);
        frameBuffer->blt();
        if (!qspiControl.chipErase())
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
        while (currentAddress < gameDatFilesize)
        {
            if (!qspiControl.erase(tBlockSize::BLOCK_SIZE_256K, currentAddress))
            {
                ENGINE_PANIC("Failed to send erase command.");
            }
            while (qspiControl.isBusy())
            {
                // is very busy
            }
            //Debug Print:
            sprintf(debugString, "Erasing currentAddress: %08u\ngameDatFilesize:%08u", currentAddress, gameDatFilesize);
            frameBuffer->fillRect(0, 96, ScreenWidth, 96, COLOR_BLACK);
            frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
            frameBuffer->blt();
            currentAddress += ENGINE_ROM_ERASE_PAGE_SIZE;
        }

        // erase save games at the end of ROM chip too when copying
        // because new dat files means new save flags and variables
        for (uint8_t i = 0; i < ENGINE_ROM_SAVE_GAME_SLOTS; i++)
        {
            EngineROM<THeaders...>::EraseSaveSlot(i);
        }
    }

    currentAddress = 0;
    //then write the entire SD card game.dat file to the ROM chip ENGINE_ROM_SD_CHUNK_READ_SIZE bytes at a time.
    while (currentAddress < gameDatFilesize)
    {
        uint32_t chunkSize = MIN(ENGINE_ROM_SD_CHUNK_READ_SIZE, (gameDatFilesize - currentAddress));
        //seek to the currentAddress on the SD card:
        result = f_lseek(&gameDat, currentAddress);
        if (result != FR_OK)
        {
            ENGINE_PANIC("Error seeking to game.dat position\nduring ROM copy procedure.");
        }
        //then read the next set of bytes into the buffer:
        result = f_read(&gameDat, sdReadBuffer, chunkSize, &count);
        if (result != FR_OK)
        {
            ENGINE_PANIC("Error reading game.dat from SD card\nduring ROM copy procedure.");
        }
        //write the buffer to the ROM chip:
        uint32_t romPagesToWrite = chunkSize / ENGINE_ROM_WRITE_PAGE_SIZE;
        uint32_t partialPageBytesLeftOver = chunkSize % ENGINE_ROM_WRITE_PAGE_SIZE;
        if (partialPageBytesLeftOver)
        {
            romPagesToWrite += 1;
        }
        for (uint32_t i = 0; i < romPagesToWrite; i++)
        {
            //debug_print("Writing ROM Page %d/%d offset from %d", i, romPagesToWrite, currentAddress);
            uint32_t romPageOffset = i * ENGINE_ROM_WRITE_PAGE_SIZE;
            bool shouldUsePartialBytes = (i == (romPagesToWrite - 1)) && (partialPageBytesLeftOver != 0);
            uint32_t writeSize = shouldUsePartialBytes
                ? partialPageBytesLeftOver
                : ENGINE_ROM_WRITE_PAGE_SIZE;

            if (i == (romPagesToWrite - 1))
            {
                debug_print("Write Size at %d is %d", i, writeSize);
            }
            Write(
                currentAddress + romPageOffset,
                writeSize,
                (uint8_t*)(sdReadBuffer + romPageOffset)
            );
            //verify that the data was correctly written or return false.
            Verify(
                currentAddress + romPageOffset,
                writeSize,
                (uint8_t*)(sdReadBuffer + romPageOffset),
                true
            );
        }
        //Debug Print:
        sprintf(debugString, "Copying currentAddress: %08u\ngameDatFilesize:%08u", currentAddress, gameDatFilesize);
        frameBuffer->fillRect(0, 96, ScreenWidth, 96, COLOR_BLACK);
        frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
        frameBuffer->blt();
        currentAddress += chunkSize;
    }
    //print success message:
    frameBuffer->fillRect(0, 96, ScreenWidth, 96, 0x0000);
    frameBuffer->printMessage("SD -> ROM chip copy success", Monaco9, 0xffff, 16, 96);
    frameBuffer->blt();
    return true;
}
#endif //DC801_EMBEDDED
