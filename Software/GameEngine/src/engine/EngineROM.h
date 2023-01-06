#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

#include "Header.h"
#include "EnginePanic.h"
#include <stdint.h>
#include <stddef.h>
#include <array>
#include <memory>
#include <string>
#include <filesystem>
#include <fstream>
#include <tuple>
   
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
#define ENGINE_VERSION 3
#define MAGE_ENTITY_NAME_LENGTH 12
#define DEFAULT_PLAYER_NAME "Bub"
#define MAGE_NUM_MEM_BUTTONS 4
#define DEFAULT_MAP 0
#define MAGE_NO_WARP_STATE ((uint16_t)-1)

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
   Header(const uint8_t* base, uint32_t count, const uint32_t* offsets, const uint32_t* lengths) noexcept
      : count(count), offsets(offsets), lengths(lengths)
   {}

   //const TData* Get(uint32_t index) const
   //{
   //	if (0 == count) { return nullptr; }
   //	return (const T*)base + offset(index % count);
   //}

   //uint32_t count() const { return count; }
   uint32_t offset(uint32_t i) const { return offsets[i % count]; }
   uint32_t length(uint32_t i) const { return lengths[i % count]; }

private:
   const uint8_t* base;
   uint32_t count{ 0 };
   const uint32_t* offsets{ nullptr };
   const uint32_t* lengths{ nullptr };

}; //class Header

struct MageSaveGame
{
   const char identifier[8]{'M', 'A', 'G', 'E', 'S', 'A', 'V', 'E'};
   uint32_t engineVersion{ ENGINE_VERSION };
   uint32_t scenarioDataCRC32{ 0 };
   uint32_t saveDataLength{ sizeof(MageSaveGame) };
   char name[MAGE_ENTITY_NAME_LENGTH]{ DEFAULT_PLAYER_NAME };
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
   uint8_t saveFlags[MAGE_SAVE_FLAG_BYTE_COUNT] { 0 };
   uint16_t scriptVariables[MAGE_SCRIPT_VARIABLE_COUNT] { 0 };
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
         romFile = std::fstream{ filePath, std::ios_base::in | std::ios_base::out | std::ios_base::binary };
      }
      else
      {
         ENGINE_PANIC("Unable to read ROM file size at %s", MAGE_GAME_DAT_PATH);
      }


      // copy the file into the buffer
      if (!romFile.read(romDataInDesktopRam.get(), romFileSize))
      {
         ENGINE_PANIC("Desktop build: ROM->RAM read failed");
      }
#endif

      // Verify magic string is on ROM when we're done:
      if (!Magic())
      {
         ErrorUnplayable();
      }

      auto offset = 0;
      headers = headersFor<THeaders...>(offset);
   }
   ~EngineROM() = default;

   bool Magic() const { return VerifyEqualsAtOffset(0, "MAGEGAME"); }

   void ErrorUnplayable();

   template <typename T>
   void Read(T& t, uint32_t& offset, size_t count = 1) const
   {
      auto elementSize = sizeof(std::remove_pointer<T>::type);
      auto dataLength = count * elementSize;
      if constexpr (std::is_array<T>())
      {
         dataLength = count;
      }
      if (offset + dataLength > ENGINE_ROM_MAX_DAT_FILE_SIZE)
      {
         throw std::runtime_error{ "EngineROM::Read: address + length exceeds maximum dat file size" };
      }
      auto dataPointer = (uint8_t*)romDataInDesktopRam.get() + offset;
      memmove(&t, dataPointer, dataLength);
      offset += dataLength;
   };

   template <typename T>
   uint16_t GetAddress(uint16_t index) const
   {
      auto address = 0;// GetHelper<T>::get().offset(index % header.count());
      return address;
   }

   template <typename T>
   T* Get(uint16_t index) const
   {
      auto offset = (uint32_t)0;// GetHelper<T>::get().offset(index % header.count());
      //if (std::is_constructible<T, const EngineROM<THeaders...>*, uint32_t>::value)
      //{
      //   return T{ this, offset };
      //}

      T* t;
      GetPointerTo<T>(t, offset);
      return t;
   }

   std::shared_ptr<MageSaveGame> GetCurrentSave() const
   {
      return currentSave;
   }

   //template <typename T, typename... TRest>
   //const T* Get(uint16_t index) const
   //{
   //   return 
   //}
   template <typename T>
   uint16_t GetCount() const
   {
      return 0;
   }

   template <typename T>
   void GetPointerTo(T*& t, uint32_t& offset, size_t count = 1) const
   {
      auto dataLength = count * sizeof(T);
      if (offset + dataLength > ENGINE_ROM_MAX_DAT_FILE_SIZE)
      {
         throw std::runtime_error{ "EngineROM::GetPointerTo: offset + length exceeds maximum dat file size" };
      }
      auto address = romDataInDesktopRam.get() + offset;
      t = (T*)address;
      offset += sizeof(T) * count;
   }

   template <typename T>
   void InitializeCollectionOf(std::vector<T> &collection, uint32_t& offset, size_t count) const
   {
      collection.clear();
      for (auto i = 0; i < count; i++)
      {
         if constexpr (std::is_trivially_copyable<T>::value)
         {
            collection.push_back(T{ *(const T*)(romDataInDesktopRam.get() + offset) });
            offset += sizeof(T);
         }
         else
         {
            collection.push_back(T{ this, offset });
         }
      }
   }

   bool Write(uint32_t address, uint32_t length, uint8_t* data, const char* errorString);


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

   MageSaveGame ReadSaveSlot(uint8_t slotIndex) const;

   void EraseSaveSlot(uint8_t slotIndex);

   void WriteSaveSlot(uint8_t slotIndex, size_t length, const MageSaveGame* saveData) const
   {
#ifdef DC801_EMBEDDED
      EraseSaveSlot(slotIndex);
      Write(
         getSaveSlotAddressByIndex(slotIndex),
         length,
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
   static std::tuple<Header<THeaders>...> headers;
   std::shared_ptr<MageSaveGame> currentSave;

#ifndef DC801_EMBEDDED
   std::filesystem::directory_entry getOrCreateSaveFilePath() const;
   std::unique_ptr<char[]> romDataInDesktopRam{ new char[ENGINE_ROM_MAX_DAT_FILE_SIZE] { 0 } };
   std::fstream romFile;
#endif


   template <typename TData>
   Header<TData>&& getHeader() {
      return headers[tuple_element_index_v<TData, std::tuple<Header<THeaders>...>>];
   }

   template <typename T>
   constexpr Header<T> headerFor(uint32_t offset) const
   {
      uint32_t counts;
      const uint32_t* offsets;
      const uint32_t* lengths;

      Read(counts, offset);
      GetPointerTo(offsets, offset, counts);
      GetPointerTo(lengths, offset, counts);
      return Header<T>{(const uint8_t*)romDataInDesktopRam.get(), counts, offsets, lengths};
   }

   template <typename... DataType>
   constexpr std::tuple<Header<DataType>...> headersFor(uint32_t offset) const
   {
      return std::make_tuple(headerFor<DataType>(offset)...);
   }

};

#endif
