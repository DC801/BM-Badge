#include "EngineROM.h"
#include "EnginePanic.h"
#include "utility.h"

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif // EMSCRIPTEN

#ifdef DC801_EMBEDDED
#include "qspi.h"
extern QSPI qspiControl;

#else

#endif //DC801_DESKTOP

#ifdef DC801_EMBEDDED
//this will copy from the file `MAGE/game.dat` on the SD card into the ROM chip.
bool EngineROM<THeaders...>::SD_Copy(
   uint32_t gameDatFilesize,
   FIL gameDat,
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
   p_canvas()->clearScreen(COLOR_BLACK);
   uint32_t currentAddress = 0;
   uint8_t sdReadBuffer[ENGINE_ROM_SD_CHUNK_READ_SIZE]{ 0 };
   if (eraseWholeRomChip)
   {
      p_canvas()->printMessage(
         "Erasing WHOLE ROM chip.\n"
         "Please be patient, this may take a few minutes",
         Monaco9,
         COLOR_WHITE,
         16,
         96
      );
      p_canvas()->blt();
      if (!qspiControl.chipErase())
      {
         ENGINE_PANIC("Failed to erase WHOLE ROM Chip.");
      }
   }
   else
   {
      p_canvas()->printMessage(
         "Erasing ROM chip",
         Monaco9,
         COLOR_WHITE,
         16,
         96
      );
      p_canvas()->blt();
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
         p_canvas()->fillRect(0, 96, DrawWidth, 96, COLOR_BLACK);
         p_canvas()->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
         p_canvas()->blt();
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
      p_canvas()->fillRect(0, 96, DrawWidth, 96, COLOR_BLACK);
      p_canvas()->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
      p_canvas()->blt();
      currentAddress += chunkSize;
   }
   //print success message:
   p_canvas()->fillRect(0, 96, DrawWidth, 96, 0x0000);
   p_canvas()->printMessage("SD -> ROM chip copy success", Monaco9, 0xffff, 16, 96);
   p_canvas()->blt();
   return true;
}
#endif //DC801_EMBEDDED

template<typename... THeaders>
bool EngineROM<THeaders...>::Write(uint32_t offset, uint32_t length, uint8_t* data, const char* errorString)
{
   if (offset % sizeof(uint32_t) || length % sizeof(uint32_t))
   {
      ENGINE_PANIC(
         "Address or Length of write is not aligned to uint32_t\n"
         "You can't do this, fix whatever is\n"
         "sending an unaligned write."
      );
   }
   if (data == NULL)
   {
      ENGINE_PANIC("EngineROM<THeaders...>::Write: Null pointer");
   }

#ifdef DC801_EMBEDDED
   if (!qspiControl.write(data, length, offset))
   {
      ENGINE_PANIC(errorString);
   }
#else
   if (!romFile.good())
   {
      ENGINE_PANIC("Game Data file is not open");
   }

   if (romFile.seekp(offset, std::ios_base::beg))
   {
      ENGINE_PANIC("Failed to seek into Game Data");
   }

   romFile.write((const char*)data, length);
#endif
   return true;
}
