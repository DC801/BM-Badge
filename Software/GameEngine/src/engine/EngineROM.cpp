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

template<typename... THeaders>
std::filesystem::directory_entry EngineROM<THeaders...>::getOrCreateSaveFilePath() const
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
#endif //DC801_DESKTOP

template<typename... THeaders>
void EngineROM<THeaders...>::ErrorUnplayable()
{
   //let out the magic s̶m̶o̶k̶e̶ goat
   ENGINE_PANIC(
      "ROM header invalid. Game cannot start.\n"
      "Goat is sad.   ##### ####     \n"
      "             ##   #  ##       \n"
      "            #   (-)    #      \n"
      "            #+       ######   \n"
      "            #^             ## \n"
      "             ###           #  \n"
      "               #  #      # #  \n"
      "               ##  ##  ##  #  \n"
      "               ######  #####  \n"
   );
}

template<typename... THeaders>
MageSaveGame EngineROM<THeaders...>::ReadSaveSlot(uint8_t slotIndex) const
{
#ifdef DC801_EMBEDDED
   Read(
      getSaveSlotAddressByIndex(slotIndex),
      length,
      data,
      "Failed to read saveGame from ROM"
   );
#else
   auto saveFilePath = getOrCreateSaveFilePath();
   const char* saveFileName = saveFileSlotNames[slotIndex];
   
   auto fileDirEntry = std::filesystem::directory_entry{ std::filesystem::absolute(saveFileName) };
   if (fileDirEntry.exists())
   {
      auto fileSize = fileDirEntry.file_size();
      debug_print("Save file size: %zu\n", (uint32_t)fileDirEntry.file_size());

      auto saveFile = std::fstream{ saveFileName, std::ios::in | std::ios::binary };
      if (!saveFile.good())
      {
         int error = errno;
         fprintf(stderr, "Error: %s\n", strerror(error));
         ENGINE_PANIC("Desktop build: SAVE file missing");
      }
      else
      {
         const auto saveSize = sizeof(MageSaveGame);
         saveFile.read((char*)currentSave, saveSize);
         auto readCount = saveFile.gcount();
         if (readCount != saveSize)
         {
            // The file save_*.dat on disk can't be read?
            // Empty out the destination.
            saveGame.reset();
         }
         saveFile.close();
      }
   }
#endif
   return saveGame;
}

template<typename... THeaders>
void EngineROM<THeaders...>::EraseSaveSlot(uint8_t slotIndex)
{
#ifdef DC801_EMBEDDED
   if (!qspiControl.erase(
      tBlockSize::BLOCK_SIZE_256K,
      getSaveSlotAddressByIndex(slotIndex)
   ))
   {
      ENGINE_PANIC("Failed to send erase command for save slot.");
   }
   while (qspiControl.isBusy())
   {
      // is very busy
   }
#endif //DC801_EMBEDDED
}

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
         p_canvas()->fillRect(0, 96, WIDTH, 96, COLOR_BLACK);
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
      p_canvas()->fillRect(0, 96, WIDTH, 96, COLOR_BLACK);
      p_canvas()->printMessage(debugString, Monaco9, COLOR_WHITE, 16, 96);
      p_canvas()->blt();
      currentAddress += chunkSize;
   }
   //print success message:
   p_canvas()->fillRect(0, 96, WIDTH, 96, 0x0000);
   p_canvas()->printMessage("SD -> ROM chip copy success", Monaco9, 0xffff, 16, 96);
   p_canvas()->blt();
   return true;
}
#endif //DC801_EMBEDDED

//bool EngineROM<THeaders...>::Read(uint32_t address, uint32_t length, uint8_t* data) const
//{
//   if (data == NULL)
//   {
//      ENGINE_PANIC("EngineROM<THeaders...>::Read: Null pointer");
//   }
//
//#ifdef DC801_EMBEDDED
//   //this is the number of whole words to read from the starting adddress:
//   uint32_t truncatedAlignedLength = (length / sizeof(uint32_t));
//   //read in all but the last word if aligned data
//   uint32_t* dataU32 = (uint32_t*)data;
//   //get word-aligned pointers to the ROM:
//   volatile uint32_t* romDataU32 = (volatile uint32_t*)(ROM_START_ADDRESS + address);
//   for (uint32_t i = 0; i < truncatedAlignedLength; i++)
//   {
//      dataU32[i] = romDataU32[i];
//   }
//   //now we need to convert the word-aligned number of reads back to a uint8_t aligned
//   //value where we will start reading the remaining bytes.
//   truncatedAlignedLength = (truncatedAlignedLength * sizeof(uint32_t));
//   uint32_t numUnalignedBytes = length - truncatedAlignedLength;
//   if (numUnalignedBytes)
//   {
//      address += truncatedAlignedLength;
//      //get byte-aligned rom data at the new address:
//      volatile uint8_t* romDataU8 = (volatile uint8_t*)(ROM_START_ADDRESS + address);
//      //fill in the unaligned bytes only and ignore the rest:
//      for (uint8_t i = 0; i < numUnalignedBytes; i++)
//      {
//         data[truncatedAlignedLength + i] = romDataU8[i];
//      }
//   }
//#else
//   if (address + length > ENGINE_ROM_MAX_DAT_FILE_SIZE) { ENGINE_PANIC("EngineROM<THeaders...>::Read: address + length exceeds maximum dat file size"); }
//   memmove(data, romDataInDesktopRam.get() + address, length);
//#endif
//   return true;
//}

template<typename... THeaders>
bool EngineROM<THeaders...>::Write(uint32_t address, uint32_t length, uint8_t* data, const char* errorString)
{
   if (address % sizeof(uint32_t) || length % sizeof(uint32_t))
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
   if (!qspiControl.write(data, length, address))
   {
      ENGINE_PANIC(errorString);
   }
#else
   if (!romFile.good())
   {
      ENGINE_PANIC("Game Data file is not open");
   }

   if (romFile.seekp(address, std::ios_base::beg))
   {
      ENGINE_PANIC("Failed to seek into Game Data");
   }

   romFile.write((const char*)data, length);
#endif
   return true;
}
