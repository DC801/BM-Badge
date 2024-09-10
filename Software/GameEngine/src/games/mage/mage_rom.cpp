#include "mage_rom.h"

#ifdef DC801_EMBEDDED 
#include "custom_board.h"
#endif


const MageGeometry* MageTileset::GetGeometryForTile(uint16_t tileIndex) const
{
   auto geometriesPtr = (uint16_t*)((uint8_t*)&Rows + sizeof(uint16_t));

   if (tileIndex >= Cols * Rows || !geometriesPtr[tileIndex]) { return nullptr; }
   auto geometryIndex = geometriesPtr[tileIndex];

   return ROM()->GetReadPointerByIndex<MageGeometry>(geometryIndex - 1);
}

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

//std::unique_ptr<MageROM>& ROM()
const MageROM* ROM()
{
   //static std::unique_ptr<MageROM> romPtr;
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
