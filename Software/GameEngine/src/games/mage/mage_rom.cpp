#include "mage_rom.h"



//    bool Write(uint32_t offset, uint32_t length, uint8_t* data, const char* errorString)
//    {
//       if (offset % sizeof(uint32_t) || length % sizeof(uint32_t))
//       {
//          ENGINE_PANIC(
//             "Address or Length of write is not aligned to uint32_t\n"
//             "You can't do this, fix whatever is\n"
//             "sending an unaligned write."
//          );
//       }
//       if (data == NULL)
//       {
//          ENGINE_PANIC("EngineROM<THeaders...>::Write: Null pointer");
//       }

// #ifdef DC801_EMBEDDED
// #else
//       if (!romFile.good())
//       {
//          ENGINE_PANIC("Game Data file is not open");
//       }

//       if (romFile.seekp(offset, std::ios_base::beg))
//       {
//          ENGINE_PANIC("Failed to seek into Game Data");
//       }

//       romFile.write((const char*)data, length);
// #endif
//       return true;
//    }

std::unique_ptr<MageROM>& ROM()
{
   static std::unique_ptr<MageROM> romPtr;
#ifdef DC801_EMBEDDED 
   // point to 0x12000000 - the beginning of the QSPI ROM using XIP mapping
   static auto romPtr = std::make_unique<MageROM>((char*)0x12000000);   
#else
   auto filePath = std::filesystem::absolute(MAGE_GAME_DAT_PATH);
   static auto romData = new char[ENGINE_ROM_MAX_DAT_FILE_SIZE] { 0 } ;
   if (!romPtr)
   {
      if (std::filesystem::exists(filePath))
      {
         auto romFileSize = std::filesystem::file_size(MAGE_GAME_DAT_PATH);

         if (romFileSize > ENGINE_ROM_MAX_DAT_FILE_SIZE)
         {
            ENGINE_PANIC("Invalid ROM file size: larger than the hardware's ROM chip capacity!");
         }
         auto romFile = std::fstream{ filePath, std::ios_base::in | std::ios_base::out | std::ios_base::binary };

         // copy the file into the buffer
         if (!romFile.read(romData, romFileSize))
         {
            ENGINE_PANIC("Desktop build: ROM->RAM read failed");
         }
         romFile.close();
      }
      else
      {
         ENGINE_PANIC("Unable to read ROM file size at %s", MAGE_GAME_DAT_PATH);
      }
   }
   romPtr = std::make_unique<MageROM>(romData);
#endif
   return romPtr;
}
