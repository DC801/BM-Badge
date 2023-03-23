#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

#include "Header.h"
#include "EnginePanic.h"
#include "utility.h"
#include <stdint.h>
#include <stddef.h>
#include <array>
#include <memory>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <tuple>
#include <vector>

enum struct MageEntityFieldOffset : uint8_t
{
   x = 12,
   y = 14,
   onInteractScriptId = 16,
   onTickScriptId = 18,
   primaryId = 20,
   secondaryId = 22,
   primaryIdType = 24,
   currentAnimation = 25,
   currentFrame = 26,
   direction = 27,
   hackableStateA = 28,
   hackableStateB = 29,
   hackableStateC = 30,
   hackableStateD = 31
};

static const inline auto ENGINE_VERSION = 3;
static const inline auto MAGE_ENTITY_NAME_LENGTH = 12;
static const inline auto MAGE_NUM_MEM_BUTTONS = 4;
static const inline auto DEFAULT_MAP = 0;
static const inline auto MAGE_NO_WARP_STATE = ((uint16_t)-1);

//this is the number of chars that are used in the entity struct as part of the entity name
#define MAGE_SAVE_FLAG_COUNT 2048
#define MAGE_SAVE_FLAG_BYTE_COUNT (MAGE_SAVE_FLAG_COUNT / 8)
#define MAGE_SCRIPT_VARIABLE_COUNT 256

#include <iterator>

template <typename TData>
class Header
{
public:
   Header() noexcept = default;
   Header(uint32_t count, uint32_t& address) noexcept
      : count(count), baseAddress(address)
   {
      address += 2 * sizeof(uint32_t) * count;
   }

   uint32_t Count() const { return count; }
   uint32_t address(uint32_t romDataAddress, uint16_t i) const
   {
      auto offsets = (const uint32_t*)(romDataAddress + baseAddress);
      return offsets[i % count];
   }
   uint32_t Length(uint32_t romDataAddress, uint16_t i) const
   {
      auto lengths = (const uint32_t*)(romDataAddress + baseAddress + sizeof(uint32_t) * count);
      return lengths[i % count];
   }
   
private:
   uint32_t count;
   uint32_t baseAddress;

}; //class Header

struct MageSaveGame
{
   const char identifier[8]{ 'M', 'A', 'G', 'E', 'S', 'A', 'V', 'E' };
   uint32_t engineVersion{ ENGINE_VERSION };
   uint32_t scenarioDataCRC32{ 0 };
   uint32_t saveDataLength{ sizeof(MageSaveGame) };
   char name[MAGE_ENTITY_NAME_LENGTH]{ "Bub" };
   //this stores the byte offsets for the hex memory buttons:
   std::array<uint8_t, MAGE_NUM_MEM_BUTTONS> memOffsets{
      (uint8_t)MageEntityFieldOffset::x,
      (uint8_t)MageEntityFieldOffset::y,
      (uint8_t)MageEntityFieldOffset::primaryId, // entityType
      (uint8_t)MageEntityFieldOffset::direction,
   };
   uint16_t currentMapId{ DEFAULT_MAP };
   uint16_t warpState{ MAGE_NO_WARP_STATE };
   uint8_t paddingA{ 0 };
   uint8_t paddingB{ 0 };
   uint8_t paddingC{ 0 };
   uint8_t saveFlags[MAGE_SAVE_FLAG_BYTE_COUNT]{ 0 };
   uint16_t scriptVariables[MAGE_SCRIPT_VARIABLE_COUNT]{ 0 };
};


#define DESKTOP_SAVE_FILE_PATH "MAGE/save_games/"

//this is the path to the game.dat file on the SD card.
//if an SD card is inserted with game.dat in this location
//and its header hash is different from the one in the ROM chip
//it will automatically be loaded.
#define MAGE_GAME_DAT_PATH "MAGE/game.dat"

//size of chunk to be read/written when writing game.dat to ROM per loop
#define ENGINE_ROM_SD_CHUNK_READ_SIZE 65536

//This is the smallest page we know how to erase on our chip,
//because the smaller values provided by nordic are incorrect,
//and this is the only one that has worked for us so far
//262144 bytes = 256KB
#define ENGINE_ROM_ERASE_PAGE_SIZE 262144

//size of largest single Write data that can be sent at one time:
//make sure that ENGINE_ROM_SD_CHUNK_READ_SIZE is evenly divisible by this
//or you'll lose data.
#define ENGINE_ROM_WRITE_PAGE_SIZE 512

//this is the length of the 'identifier' at the start of the game.dat file:
#define ENGINE_ROM_IDENTIFIER_STRING_LENGTH 8

//this is the length of the 'engine rom version number' at the start of the game.dat file:
//it is to determine if the game rom is compatible with the engine version
#define ENGINE_ROM_VERSION_NUMBER_LENGTH 4

//this is the length of the crc32 that follows the magic string in game.dat
//it is used to let us check if we need to re-flash the ROM chip with the file on
//the SD card.
#define ENGINE_ROM_CRC32_LENGTH 4

//this is the length of the scenario data from the 0 address to the end
#define ENGINE_ROM_GAME_LENGTH 4

#define ENGINE_ROM_START_OF_CRC_OFFSET (ENGINE_ROM_IDENTIFIER_STRING_LENGTH + ENGINE_ROM_VERSION_NUMBER_LENGTH)

#define ENGINE_ROM_MAGIC_HASH_LENGTH (ENGINE_ROM_START_OF_CRC_OFFSET + ENGINE_ROM_CRC32_LENGTH + ENGINE_ROM_GAME_LENGTH)

//this is all the bytes on our ROM chip. We aren't able to write more than this
//to the ROM chip, as there are no more bytes on it. Per the datasheet, there are 32MB,
//which is defined as 2^25 bytes available for writing.
//We are also subtracting ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE for save data and the end of rom
#define ENGINE_ROM_SAVE_GAME_SLOTS 3
#define ENGINE_ROM_QSPI_CHIP_SIZE 33554432
#define ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE (ENGINE_ROM_ERASE_PAGE_SIZE * ENGINE_ROM_SAVE_GAME_SLOTS)
#define ENGINE_ROM_MAX_DAT_FILE_SIZE (ENGINE_ROM_QSPI_CHIP_SIZE - ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE)
#define ENGINE_ROM_SAVE_OFFSET (ENGINE_ROM_MAX_DAT_FILE_SIZE)

//This is a return code indicating that the verification was successful
//it needs to be a negative number, as the Verify function returns
//the failure address which is a uint32_t and can include 0
#define ENGINE_ROM_VERIFY_SUCCESS -1

static const char* saveFileSlotNames[ENGINE_ROM_SAVE_GAME_SLOTS] = {
   DESKTOP_SAVE_FILE_PATH "save_0.dat",
   DESKTOP_SAVE_FILE_PATH "save_1.dat",
   DESKTOP_SAVE_FILE_PATH "save_2.dat"
};

/////////////////////////////////////////////////////////////////////////////////
// https://ngathanasiou.wordpress.com/2020/07/09/avoiding-compile-time-recursion/
template <class T, std::size_t I, class Tuple>
constexpr bool match_v = std::is_same_v<T, std::tuple_element_t<I, Tuple>>;

template <class T, class Tuple, class Idxs = std::make_index_sequence<std::tuple_size_v<Tuple>>>
struct type_index;

template <class T, template <class...> class Tuple, class... Args, std::size_t... Is>
struct type_index<T, Tuple<Args...>, std::index_sequence<Is...>>
   : std::integral_constant<std::size_t, ((Is* match_v<T, Is, Tuple<Args...>>) + ... + 0)>
{
   static_assert(1 == (match_v<T, Is, Tuple<Args...>> +... + 0), "T doesn't appear once in Tuple");
};

template <class T, class Tuple>
constexpr std::size_t type_index_v = type_index<T, Tuple>::value;
// https://ngathanasiou.wordpress.com/2020/07/09/avoiding-compile-time-recursion/
/////////////////////////////////////////////////////////////////////////////////


template<typename... THeaders>
struct EngineROM
{
   EngineROM()
   {
#ifdef DC801_EMBEDDED
      FIL gameDat;
      FRESULT result;
      UINT count;
      char gameDatHashSD[ENGINE_ROM_MAGIC_HASH_LENGTH + 1]{ 0 };
      char gameDatHashROM[ENGINE_ROM_MAGIC_HASH_LENGTH + 1]{ 0 };
      bool gameDatSDPresent = false;
      bool eraseWholeRomChip = false;
      // Look on the SD card to read `game.dat` filesize, OR see if it is present at all:
      uint32_t gameDatFilesize = util_sd_file_size(filename);
      if (gameDatFilesize > 0)
      {
         // Open magegame.dat file on SD card
         result = f_open(&gameDat, filename, FA_READ | FA_OPEN_EXISTING);
         if (result == FR_OK)
         {
            result = f_lseek(&gameDat, 0);
            if (result == FR_OK)
            {
               // get the gameDatHashSD from the SD card game.dat:
               result = f_read(&gameDat, (uint8_t*)gameDatHashSD, ENGINE_ROM_MAGIC_HASH_LENGTH, &count);
               gameDatSDPresent = result == FR_OK;
            }
         }
      }

      if (!gameDatSDPresent)
      {
         if (!isRomPlayable)
         {
            // no SD card, rom is invalid - literally unplayable
            ErrorUnplayable();
         }
         // jump right to game
         return;
      }
      else if (Magic())
      {
         // we have SD, and the rom seems valid - check if hashes are the same

         // get the gameDatHashROM from the ROM chip:
         Read(0, ENGINE_ROM_MAGIC_HASH_LENGTH, (uint8_t*)gameDatHashROM);
         char gameDatHashSDString[9] = { 0 };
         char gameDatHashROMString[9] = { 0 };
         sprintf(gameDatHashSDString, "%08X", gameDatHashSD[ENGINE_ROM_START_OF_CRC_OFFSET]);
         sprintf(gameDatHashROMString, "%08X", gameDatHashROM[ENGINE_ROM_START_OF_CRC_OFFSET]);

         // compare the two header hashes:
         bool headerHashMatch = (strcmp(gameDatHashSD, gameDatHashROM) == 0);

         // handles hardware inputs and makes their state available
         inputHandler->HandleKeyboard();
         const char* updateMessagePrefix;
         if (!headerHashMatch)
         {
            updateMessagePrefix = "The file `game.dat` on your SD card does not\n"
               "match what is on your badge ROM chip.";
         }
         else if (EngineInput_Buttons.mem3)
         {
            updateMessagePrefix = "You have held down MEM3 while booting.\n"
               "You may force update `game.dat` on badge.";
         }
         else
         {
            // there is no update, and user is not holding MEM3, proceed as normal
            result = f_close(&gameDat);
            return;
         }

         // show update confirmation
         char debugString[512];
         p_canvas()->clearScreen(COLOR_BLACK);
         //48 chars is a good character width for screen width plus some padding
         sprintf(debugString,
            "%s\n\n"
            " SD hash: %s\n"
            "ROM hash: %s\n\n"
            "Would you like to update your scenario data?\n"
            "------------------------------------------------\n\n\n"
            "    > Press MEM0 to cancel\n\n"
            "    > Press MEM2 to erase whole ROM for recovery\n\n"
            "    > Press MEM3 to update the ROM",
            updateMessagePrefix,
            gameDatHashSDString,
            gameDatHashROMString);
         p_canvas()->printMessage(debugString, Monaco9, 0xffff, 16, 16);
         p_canvas()->blt();

         do
         {
            nrf_delay_ms(10);
            inputHandler->HandleKeyboard();
            if (EngineInput_Activated.mem0)
            {
               p_canvas()->clearScreen(COLOR_BLACK);
               p_canvas()->blt();
               return;
            }
            else if (EngineInput_Activated.mem2)
            {
               eraseWholeRomChip = true;
            }
         } while (!EngineInput_Activated.mem2 && !EngineInput_Activated.mem3);
      }

      if (!EngineRom::SD_Copy(gameDatFilesize, gameDat, eraseWholeRomChip))
      {
         ENGINE_PANIC("SD Copy Operation was not successful.");
      }
      //close game.dat file when done:
      // TODO: this can leak in quite a few ways, wrap it
      result = f_close(&gameDat);
#else
      auto romFileSize = 0;

      auto filePath = std::filesystem::absolute(MAGE_GAME_DAT_PATH);
      if (std::filesystem::exists(filePath))
      {
         romFileSize = std::filesystem::file_size(MAGE_GAME_DAT_PATH);

         if (romFileSize > ENGINE_ROM_MAX_DAT_FILE_SIZE)
         {
            ENGINE_PANIC("Invalid ROM file size: larger than the hardware's ROM chip capacity!");
         }
         auto romFile = std::fstream{ filePath, std::ios_base::in | std::ios_base::out | std::ios_base::binary };

         // copy the file into the buffer
         if (!romFile.read(romDataInDesktopRam.get(), romFileSize))
         {
            ENGINE_PANIC("Desktop build: ROM->RAM read failed");
         }
         romFile.close();
      }
      else
      {
         ENGINE_PANIC("Unable to read ROM file size at %s", MAGE_GAME_DAT_PATH);
      }
#endif

      // Verify magic string is on ROM when we're done:
      if (!Magic())
      {
         ErrorUnplayable();
      }

      uint32_t address = ENGINE_ROM_MAGIC_HASH_LENGTH;
      headers = headersFor<THeaders...>(address);
   }
   ~EngineROM() = default;

   bool Magic() const { return VerifyEqualsAtOffset(0, "MAGEGAME"); }

   void ErrorUnplayable()
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

   template <typename TData>
   uint16_t GetCount() { return getHeader<TData>().Count(); }

   template <typename T>
   void Read(T& t, uint32_t& address, size_t count = 1) const
   {
      static_assert(std::is_scalar_v<T> || std::is_standard_layout_v<T>, "T must be a scalar or standard-layout type");
      auto elementSize = sizeof(std::remove_all_extents_t<T>);
      auto dataLength = count * elementSize;

      if (address + dataLength > ENGINE_ROM_MAX_DAT_FILE_SIZE)
      {
         throw std::runtime_error{ "EngineROM::Read: address + length exceeds maximum dat file size" };
      }

      auto dataPointer = (uint8_t*)romDataInDesktopRam.get() + address;
      memcpy(&t, dataPointer, dataLength);
      address += dataLength;
      
   }

   template <typename T>
   uint32_t GetAddress(uint16_t index) const
   {
      auto&& header = getHeader<T>();
      auto address = header.address((uint32_t)romDataInDesktopRam.get(), index % header.Count());
      return address;
   }

   template <typename T>
   const T* GetReadPointerByIndex(uint16_t index) const
   {
      static_assert(sizeof(romDataInDesktopRam.get()) == 4, "Expected 32-bit pointers");
      auto&& header = getHeader<T>();
      auto address = header.address((uint32_t)romDataInDesktopRam.get(), index);
      
      return reinterpret_cast<const T*>((uint32_t)romDataInDesktopRam.get() + address);
   }

   template <typename T>
   const T* GetReadPointerToAddress(uint32_t& address, size_t count = 1) const
   {
      static_assert(std::is_standard_layout<T>::value, "Must use a standard layout type");
      auto dataLength = count * sizeof(T);
      if (address + dataLength > ENGINE_ROM_MAX_DAT_FILE_SIZE)
      {
         throw std::runtime_error{ "EngineROM::GetReadPointerToAddress: address + length exceeds maximum dat file size" };
      }
      auto readPointer = reinterpret_cast<const T*>(romDataInDesktopRam.get() + address);
      address += dataLength;
      return readPointer;
   }

   template <typename T>
   std::unique_ptr<T> InitializeRAMCopy(uint16_t index) const
   {
      static_assert(std::is_constructible_v<T, uint32_t&>, "Must have a constructor accepting a uint32_t& address");
      auto address = getHeader<T>().address((uint32_t)romDataInDesktopRam.get(), index);

      return std::make_unique<T>(address);
   }

   std::shared_ptr<MageSaveGame> GetCurrentSave() const
   {
      return currentSave;
   }

   void SetCurrentSave(uint32_t scenarioDataCRC32)
   {
      auto newSave = new MageSaveGame{};
      newSave->scenarioDataCRC32 = scenarioDataCRC32;
      currentSave.reset(newSave);
   }

   template <typename T>
   void InitializeVectorFrom(std::vector<T>& v, uint32_t& address, size_t count) const
   {
      static_assert(std::is_constructible_v<T, uint32_t&> || std::is_standard_layout_v<T>, "Must be constructible from an address or a standard layout type");
      for (auto i = 0; i < count; i++)
      {
         if constexpr (std::is_standard_layout_v<T>)
         {
            v.push_back(*(const T*)(romDataInDesktopRam.get() + address));
            address += sizeof(T);
         }
         else
         {
            v.push_back(T{ address });
         }
      }
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
//       if (!qspiControl.write(data, length, offset))
//       {
//          ENGINE_PANIC(errorString);
//       }
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


   bool VerifyEqualsAtOffset(uint32_t address, std::string value) const
   {
      if (value.empty())
      {
         ENGINE_PANIC("EngineROM<THeaders...>::VerifyEqualsAtOffset: Empty string");
      }

      for (uint32_t i = 0; i < value.size(); i++)
      {
         if (i >= ENGINE_ROM_MAX_DAT_FILE_SIZE || value[i] != romDataInDesktopRam[i])
         {
            return false;
         }
      }
      return true;
   }

   void LoadSaveSlot(uint8_t slotIndex)
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
            saveFile.read((char*)currentSave.get(), sizeof(MageSaveGame));
            if (saveFile.gcount() != sizeof(MageSaveGame))
            {
               // The file save_*.dat on disk can't be read?
               // Empty out the destination.
               currentSave.reset();
            }
            saveFile.close();
         }
      }
#endif
   }

   void EraseSaveSlot(uint8_t slotIndex)
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
#else

#endif
   }

   void WriteSaveSlot(uint8_t slotIndex, const MageSaveGame* saveData) const
   {
#ifdef DC801_EMBEDDED
      EraseSaveSlot(slotIndex);
      Write(
         getSaveSlotAddressByIndex(slotIndex),
         saveData
      );
#else
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

#ifdef DC801_EMBEDDED
   bool SD_Copy(uint32_t gameDatFilesize, FIL gameDat, bool eraseWholeRomChip);
#endif
   constexpr uint32_t getSaveSlotAddressByIndex(uint8_t slotIndex) const
   {
      return ENGINE_ROM_SAVE_OFFSET + (slotIndex * ENGINE_ROM_ERASE_PAGE_SIZE);
   }

private:
   std::tuple<Header<THeaders>...> headers;
   std::shared_ptr<MageSaveGame> currentSave{};

#ifndef DC801_EMBEDDED
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
   std::unique_ptr<char[]> romDataInDesktopRam{ new char[ENGINE_ROM_MAX_DAT_FILE_SIZE] { 0 } };
#endif

   template <typename TData>
   constexpr const Header<TData>& getHeader() const
   {
      constexpr std::size_t index = type_index_v<Header<TData>, std::tuple<Header<THeaders>...>>;
      return std::get<index>(headers);
   }

   template <typename T>
   auto headerFor(uint32_t& address) const
   {
      uint32_t count;
      Read(count, address);
      return Header<T>{count, address};
   }

   template <typename... TRest>
   auto headersFor(uint32_t& address) const
   {
      return std::tuple<Header<TRest>...>{headerFor<TRest>(address)...};
   }

};

#endif
