#ifndef ROM_UPDATER_H
#define ROM_UPDATER_H

#ifdef DC801_EMBEDDED

#include "qspi.h"
#include "sd.h"
#include "utility.h"
#include "fonts/Monaco9.h"


//size of chunk to be read/written when writing game.dat to ROM per loop
static const inline uint32_t ENGINE_ROM_SD_CHUNK_READ_SIZE = 65536;

//size of largest single Write data that can be sent at one time:
//make sure that ENGINE_ROM_SD_CHUNK_READ_SIZE is evenly divisible by this
//or you'll lose data.
static const inline uint32_t ENGINE_ROM_WRITE_PAGE_SIZE = 512;

class RomUpdater
{
public:
    RomUpdater(std::shared_ptr<EngineInput> inputHandler, std::shared_ptr<FrameBuffer> frameBuffer)
        : inputHandler(inputHandler), frameBuffer(frameBuffer) {}


    void HandleROMUpdate(QSPI& qspi, SDCard& sdCard) const
    {
        if (!sdCard)
        {
            debug_print("No SD card present on boot");
            return;
        }
        debug_print("Checking for ROM update on SD card");


        auto sdFile = sdCard.openFile(MAGE_GAME_DAT_PATH);
        if (!sdFile)
        {
            debug_print("No game.dat file found");
            frameBuffer->fillRect(0, 96, DrawWidth, 96, 0x0000);
            frameBuffer->printMessage("No game.dat file found", Monaco9, 0xffff, 16, 96);
            return;
        }

        //this will copy from the file `MAGE/game.dat` on the SD card into the ROM chip.
        auto romFileSize = sdFile.size();
        if (romFileSize > ENGINE_ROM_MAX_DAT_FILE_SIZE)
        {
            ENGINE_PANIC(
                "Your game.dat is larger than %d bytes.\n"
                "You will need to reduce its size to use it\n"
                "on this board.",
                ENGINE_ROM_MAX_DAT_FILE_SIZE
            );
        }

        // handles hardware inputs and makes their state available
        inputHandler->HandleKeyboard();

        //used to verify whether a save is compatible with game data
        uint32_t gameDatHashROM;
        uint32_t gameDatHashSD;

        uint32_t engineVersionROM;
        uint32_t engineVersionSD;

        auto headerHashMatch = false;

        //skip 'MAGEGAME' and engine version at front of ROM
        uint32_t offsetROM = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;
        if (!qspi.read((char*)&engineVersionROM, sizeof(engineVersionROM), offsetROM))
        {
            error_print("Failed to read engineVersionROM");
            frameBuffer->fillRect(0, 96, DrawWidth, 96, 0x0000);
            frameBuffer->printMessage("Could not read engineVersion from ROM", Monaco9, 0xffff, 16, 96);
        }

        if (!qspi.read((char*)&gameDatHashROM, sizeof(gameDatHashROM), offsetROM))
        {
            error_print("Failed to read gameDatHashROM");
        }


        frameBuffer->fillRect(0, 96, DrawWidth, 96, 0x0000);
        frameBuffer->printMessage("Successfully opened " MAGE_GAME_DAT_PATH ", reading hash...", Monaco9, 0xffff, 16, 96);

        if (FR_OK != sdFile.lseek(ENGINE_ROM_IDENTIFIER_STRING_LENGTH))
        {
           error_print("Could not seek to beyond MAGEGAME in SD card");
        }

        if (!sdFile.read(&engineVersionSD, sizeof(engineVersionSD)))
        {
           error_print("Could not read engine version of SD card");
        }

        if (!sdFile.read(&gameDatHashSD, sizeof(gameDatHashSD)))
        {
            error_print("Could not read hash from game.dat on SD card");
            frameBuffer->fillRect(0, 96, DrawWidth, 96, 0x0000);
            frameBuffer->printMessage("Could not read hash from game.dat on SD card", Monaco9, 0xffff, 16, 96);
        }
        headerHashMatch = gameDatHashROM != gameDatHashSD;

        auto updateMessagePrefix = "Data mismatch between ROM and SD card";
        if (inputHandler->GetButtonState().IsPressed(KeyPress::Mem3))
        {
            updateMessagePrefix = "MEM3 held during boot";
            headerHashMatch = false;
        }

        if (engineVersionROM != engineVersionSD || !headerHashMatch)
        {
            char debugString[512]{ 0 };

            //48 chars is a good character width for screen width plus some padding
            sprintf(debugString,
                "%s\n\n"
                " SD hash: %08x        SD version: %d\n"
                "ROM hash: %08x       ROM version: %d\n\n"
                "Would you like to update your scenario data?\n"
                "------------------------------------------------\n\n"

                "    > Press MEM0 to cancel\n"
                "    > Press MEM2 to erase whole ROM for recovery\n"
                "    > Press MEM3 to update the ROM",
                updateMessagePrefix,
                gameDatHashSD,
                engineVersionSD,
                gameDatHashROM,
                engineVersionROM);
            debug_print(debugString);
            frameBuffer->clearScreen(COLOR_BLACK);
            frameBuffer->printMessage(debugString, Monaco9, 0xffff, 16, 16);

            auto eraseWholeRomChip = false;
            auto activatedButtons = inputHandler->GetButtonActivatedState();
            while (true)
            {
                nrf_delay_ms(10);
                inputHandler->HandleKeyboard();
                if (activatedButtons.IsPressed(KeyPress::Mem0))
                {
                    frameBuffer->clearScreen(COLOR_BLACK);
                    frameBuffer->blt();
                    return;
                }
                else if (activatedButtons.IsPressed(KeyPress::Mem2))
                {
                    eraseWholeRomChip = true;
                    break;
                }
                else if (activatedButtons.IsPressed(KeyPress::Mem3))
                {
                    break;
                }
                activatedButtons = inputHandler->GetButtonActivatedState();
            };


            if (eraseWholeRomChip)
            {
                frameBuffer->printMessage("Erasing WHOLE ROM chip.\nPlease be patient, this may take a few minutes", Monaco9, COLOR_WHITE, 16, 96);
                frameBuffer->blt();
                if (!qspi.chipErase())
                {
                    ENGINE_PANIC("Failed to erase WHOLE ROM Chip.");
                }
            }
            else
            {
                sprintf(debugString, "Erasing ROM, romFileSize:%08x\n", romFileSize);
                frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);

                // I mean, you _COULD_ start by erasing the whole chip...
                // or you could do it one page at a time, so it saves a LOT of time
                for (auto offset = uint32_t{ 0 }; offset < romFileSize; offset += ENGINE_ROM_ERASE_PAGE_SIZE)
                {
                    //Debug Print:
                    sprintf(debugString, "Erasing: 0x%08x\n", offset);
                    debug_print(debugString);
                    frameBuffer->fillRect(0, 132, DrawWidth, DrawHeight - 132, COLOR_BLACK);
                    frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 132);

                    if (!qspi.erase(offset))
                    {
                        ENGINE_PANIC("Failed to send erase command.");
                    }
                }

                // erase save games at the end of ROM chip too when copying
                // because new dat files means new save flags and variables
                for (uint8_t i = 0; i < ENGINE_ROM_SAVE_GAME_SLOTS; i++)
                {
                    qspi.EraseSaveSlot(i);
                }
            }
            auto sdReadBuffer = std::make_unique<std::array<char, ENGINE_ROM_SD_CHUNK_READ_SIZE>>();
            
            //then write the entire SD card game.dat file to the ROM chip ENGINE_ROM_SD_CHUNK_READ_SIZE bytes at a time.
            for (auto offset = 0; offset < romFileSize; offset += ENGINE_ROM_SD_CHUNK_READ_SIZE)
            {
                auto copySize = std::min(ENGINE_ROM_SD_CHUNK_READ_SIZE, romFileSize - offset);
                sprintf(debugString, "Copying range %08x-%08x", offset, offset + copySize);
                debug_print(debugString);
                frameBuffer->fillRect(0, 140, DrawWidth, 11, COLOR_BLACK);
                frameBuffer->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 141);
                
                sdFile.lseek(offset);
                if (!sdFile.read(sdReadBuffer->data(), copySize))
                {
                    ENGINE_PANIC("Failed to read chunk from game.dat on SD");
                }
                
                //write the buffer to the ROM chip:
                if (!qspi.write(sdReadBuffer->data(), copySize, offset))
                {
                    ENGINE_PANIC("Failed to write chunk from game.dat to ROM");
                }
                
                // uint32_t romPagesToWrite = ENGINE_ROM_SD_CHUNK_READ_SIZE / ENGINE_ROM_WRITE_PAGE_SIZE;
                // uint32_t partialPageBytesLeftOver = ENGINE_ROM_SD_CHUNK_READ_SIZE % ENGINE_ROM_WRITE_PAGE_SIZE;
                // if (partialPageBytesLeftOver)
                // {
                //     romPagesToWrite += 1;
                // }

            //     for (auto i = uint32_t{ 0 }; i < romPagesToWrite; i++)
            //     {
            //         //debug_print("Writing ROM Page %d/%d offset from %d", i, romPagesToWrite, offset);
            //         //Debug Print:
                    

            //         auto romPageOffset = i * ENGINE_ROM_WRITE_PAGE_SIZE;
            //         auto readOffset = &(*sdReadBuffer)[romPageOffset];
            //         auto writeOffset = offset + romPageOffset;
            //         auto shouldUsePartialBytes = (i == (romPagesToWrite - 1)) && (partialPageBytesLeftOver != 0);
            //         auto writeSize = shouldUsePartialBytes ? partialPageBytesLeftOver : ENGINE_ROM_WRITE_PAGE_SIZE;

            //         if (i == (romPagesToWrite - 1))
            //         {
            //             debug_print("Write Size at %d is %d", i, writeSize);
            //         }
            //         // TODO FIXME
            //         //verify that the data was correctly written or return false.
            //         // Verify(
            //         //     writeOffset,
            //         //     writeSize,
            //         //     (uint8_t*)readOffset,
            //         //     true
            //         // );
            //     }
            }
            
            //reset offset to again skip 'MAGEGAME' and engine version at front of ROM
            offsetROM = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;
            if (!qspi.read((char*)&engineVersionROM, sizeof(engineVersionROM), offsetROM))
            {
                error_print("Failed to read engineVersionROM");
                frameBuffer->fillRect(0, 78, DrawWidth, 96, 0x0000);
                frameBuffer->printMessage("Could not read engineVersion from ROM", Monaco9, 0xffff, 16, 78);
            }

            if (!qspi.read((char*)&gameDatHashROM, sizeof(gameDatHashROM), offsetROM))
            {
                error_print("Failed to read gameDatHashROM");
            }
            
            //print success message:
            debug_print("Successfully copied ROM from SD to QSPI ROM");
            frameBuffer->fillRect(0, 78, DrawWidth, 96, 0x0000);
            frameBuffer->printMessage("Successfully copied ROM from SD to QSPI ROM", Monaco9, 0xffff, 16, 78);
        }
        

        headerHashMatch = gameDatHashROM != gameDatHashSD || engineVersionROM != engineVersionSD;

        if (!headerHashMatch)
        {
            throw std::runtime_error("The file `game.dat` on your SD card does not match what is on your badge ROM chip.");
        }
    }
private:
    std::shared_ptr<EngineInput> inputHandler;
    std::shared_ptr<FrameBuffer> frameBuffer;
    std::unique_ptr<SDCard> sdCard;
};

#endif //DC801_EMBEDDED

#endif // ROM_UPDATER_H