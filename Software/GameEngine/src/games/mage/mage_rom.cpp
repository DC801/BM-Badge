#include "mage_rom.h"

#ifdef DC801_EMBEDDED 
#include "custom_board.h"
#endif

const MageROM* ROM()
{
   static const MageROM* romPtr;

   if (!romPtr)
   {
#ifdef DC801_EMBEDDED 
      // point to 0x12000000 - the beginning of the QSPI ROM using XIP mapping
      romPtr = std::make_unique<MageROM>((const char*)ROM_START_ADDRESS, ENGINE_ROM_MAX_DAT_FILE_SIZE);
#else
      auto filePath = std::filesystem::absolute(MAGE_GAME_DAT_PATH);
      if (std::filesystem::exists(filePath))
      {
         auto romFileSize = (uint32_t)std::filesystem::file_size(MAGE_GAME_DAT_PATH);
         static auto romData = new char[romFileSize] { 0 };
         auto romFile = std::fstream{ filePath, std::ios_base::in | std::ios_base::out | std::ios_base::binary };

         // copy the file into the buffer
         if (!romFile.read(romData, romFileSize))
         {
            ENGINE_PANIC("Desktop build: ROM->RAM read failed");
         }
         romFile.close();
         romPtr = new MageROM(romData, romFileSize);
      }
      else
      {
         ENGINE_PANIC("Unable to read ROM file size at %s", MAGE_GAME_DAT_PATH);
      }
#endif
   }
   return romPtr;
}
