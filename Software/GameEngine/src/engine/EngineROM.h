#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

#include "Header.h"
#include "EnginePanic.h"
#include "utility.h"
#include <stdint.h>
#include <stddef.h>
#include <array>
#include <memory>
#include <cstddef>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <span>
#include <tuple>
#include <vector>

#define DESKTOP_SAVE_FILE_PATH "MAGE/save_games/"
static const inline uint8_t ENGINE_ROM_SAVE_GAME_SLOTS = 3;
static const char* saveFileSlotNames[ENGINE_ROM_SAVE_GAME_SLOTS] = {
   DESKTOP_SAVE_FILE_PATH "save_0.dat",
   DESKTOP_SAVE_FILE_PATH "save_1.dat",
   DESKTOP_SAVE_FILE_PATH "save_2.dat"
};

static const inline auto ENGINE_VERSION = 3;

template <typename TDataTag>
class Header
{
public:
   Header() noexcept = default;
   Header(uint32_t count, const uint32_t* offset) noexcept
      : count(count),
      offsets(offset, count),
      lengths(offset + sizeof(uint32_t) * count, count)
   {}

   uint16_t Count() const { return count; }
   uint32_t GetOffset(uint16_t i) const
   {
      return offsets[i % count];
   }
   uint32_t Length(uint16_t i) const
   {
      return lengths[i % count];
   }

private:
   uint16_t count;
   std::span<const uint32_t> offsets;
   std::span<const uint32_t> lengths;
}; //class Header

//size of chunk to be read/written when writing game.dat to ROM per loop
static const inline uint32_t ENGINE_ROM_SD_CHUNK_READ_SIZE = 65536;

//This is the smallest page that can be erased on the FL256SSVF01 chip which uses uniform 256kB page sizes
//262144 bytes = 256KB
static const inline uint32_t ENGINE_ROM_ERASE_PAGE_SIZE = 262144;

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

//this is the length of the scenario data from the 0 offset to the end
#define ENGINE_ROM_GAME_LENGTH 4

#define ENGINE_ROM_START_OF_CRC_OFFSET (ENGINE_ROM_IDENTIFIER_STRING_LENGTH + ENGINE_ROM_VERSION_NUMBER_LENGTH)

#define ENGINE_ROM_MAGIC_HASH_LENGTH (ENGINE_ROM_START_OF_CRC_OFFSET + ENGINE_ROM_CRC32_LENGTH + ENGINE_ROM_GAME_LENGTH)

//this is all the bytes on our ROM chip. We aren't able to write more than this
//to the ROM chip, as there are no more bytes on it. Per the datasheet, there are 32MB,
//which is defined as 2^25 bytes available for writing.
//We are also subtracting ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE for save data at the end of rom
static const inline uint32_t ENGINE_ROM_QSPI_CHIP_SIZE = 33554432;
static const inline uint32_t ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE = (ENGINE_ROM_ERASE_PAGE_SIZE * ENGINE_ROM_SAVE_GAME_SLOTS);
static const inline uint32_t ENGINE_ROM_MAX_DAT_FILE_SIZE = (ENGINE_ROM_QSPI_CHIP_SIZE - ENGINE_ROM_SAVE_RESERVED_MEMORY_SIZE);
static const inline uint32_t ENGINE_ROM_SAVE_OFFSET = (ENGINE_ROM_MAX_DAT_FILE_SIZE);

/////////////////////////////////////////////////////////////////////////////////
// https://ngathanasiou.wordpress.com/2020/07/09/avoiding-compile-time-recursion/
template <class T, uint32_t I, class Tuple>
constexpr bool match_v = std::is_same_v<T, std::tuple_element_t<I, Tuple>>;

template <class T, class Tuple, class Idxs = std::make_integer_sequence<uint32_t, std::tuple_size_v<Tuple>>>
struct type_index;

template <class T, template <class...> class Tuple, class... Args, uint32_t... Is>
struct type_index<T, Tuple<Args...>, std::integer_sequence<uint32_t, Is...>>
   : std::integral_constant<uint32_t, ((Is* match_v<T, Is, Tuple<Args...>>) + ... + 0)>
{
   static_assert(1 == (match_v<T, Is, Tuple<Args...>> +... + 0), "T doesn't appear once in Tuple");
};

template <class T, class Tuple>
constexpr uint32_t type_index_v = type_index<T, Tuple>::value;
// https://ngathanasiou.wordpress.com/2020/07/09/avoiding-compile-time-recursion/
/////////////////////////////////////////////////////////////////////////////////


template<typename TSave, typename... THeaders>
struct EngineROM
{
   // noexcept because we want to fail fast/call std::terminate if this fails
   EngineROM(char* romData) noexcept
      : romData(romData),
      headers(headersFor<THeaders...>(ENGINE_ROM_MAGIC_HASH_LENGTH))
   {
      // Verify magic string is on ROM:
      if (!Magic())
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
   }

   ~EngineROM() noexcept = default;

   bool Magic() const
   {
      const auto magicString = std::string{ "MAGEGAME" };

      for (std::size_t i = 0; i < magicString.size(); i++)
      {
         if (magicString[i] != romData[i])
         {
            return false;
         }
      }
      return true;
   }

   template <typename TData>
   constexpr uint16_t GetCount() { return getHeader<TData>().Count(); }

   template <typename T>
   void Read(T& t, uint32_t& offset, size_t count = 1) const
   {
      static_assert(std::is_scalar_v<T> || std::is_standard_layout_v<T>, "T must be a scalar or standard-layout type");
      auto elementSize = sizeof(std::remove_all_extents_t<T>);
      auto dataLength = count * elementSize;

      auto dataPointer = romData + offset;
      memcpy(&t, dataPointer, dataLength);
      offset += dataLength;
   }

   template <typename T>
   constexpr uint32_t GetOffsetByIndex(uint16_t index) const
   {
      return getHeader<T>().GetOffset(index);
   }

   template <typename TLookup, typename TCast = TLookup>
   constexpr const TCast* GetReadPointerByIndex(uint16_t index) const
   {
      auto offset = getHeader<TLookup>().GetOffset(index);
      return reinterpret_cast<const TCast*>(romData + offset);
   }

   template <typename T>
   const T* GetReadPointerToAddress(uint32_t& offset) const
   {
      auto readPointer = reinterpret_cast<const T*>(romData + offset);
      offset += sizeof(T);
      return readPointer;
   }

   template <typename T>
   inline std::unique_ptr<T> InitializeRAMCopy(uint16_t index) const
   {
      static_assert(std::is_constructible_v<T, uint32_t&>, "Must be constructible from an offset");

      auto offset = getHeader<T>().GetOffset(index);
      return std::make_unique<T>(offset);
   }

   template <typename T>
   void InitializeVectorFrom(std::vector<T>& v, uint32_t& offset, uint16_t count) const
   {
      static_assert(std::is_constructible_v<T, uint32_t&> || std::is_standard_layout_v<T>,
         "Must be constructible from an offset or a standard layout type");

      for (auto i = 0; i < count; i++)
      {
         if constexpr (std::is_standard_layout_v<T>)
         {
            v.push_back(*(const T*)(romData + offset));
            offset += sizeof(T);
         }
         else
         {
            v.push_back(T{ offset });
         }
      }
   }

   bool VerifyEqualsAtOffset(uint32_t offset, std::string value) const
   {
      if (value.empty())
      {
         ENGINE_PANIC("EngineROM<THeaders...>::VerifyEqualsAtOffset: Empty string");
      }

      for (std::size_t i = 0; i < value.size(); i++)
      {
         if (i >= ENGINE_ROM_MAX_DAT_FILE_SIZE || value[i] != romData[i])
         {
            return false;
         }
      }
      return true;
   }

   constexpr TSave GetCurrentSaveCopy() const
   {
      return currentSave;
   }

   constexpr const TSave& GetCurrentSave() const
   {
      return currentSave;
   }

   constexpr void SetCurrentSave(TSave save)
   {
      currentSave = save;
   }

   constexpr const TSave& ResetCurrentSave(uint32_t scenarioDataCRC32)
   {
      auto newSave = TSave{};
      newSave.scenarioDataCRC32 = scenarioDataCRC32;
      currentSave = newSave;
      return currentSave;
   }

   void LoadSaveSlot(uint8_t slotIndex)
   {
#ifdef DC801_EMBEDDED
      auto saveAddress = uint32_t{ ENGINE_ROM_SAVE_OFFSET + (slotIndex * ENGINE_ROM_ERASE_PAGE_SIZE) };
      Read(currentSave, saveAddress);
#else

      auto saveFilePath = std::filesystem::directory_entry{ std::filesystem::absolute(DESKTOP_SAVE_FILE_PATH) };
      if (!saveFilePath.exists())
      {
         if (!std::filesystem::create_directories(saveFilePath))
         {
            throw "Couldn't create save directory";
         }
      }
      const char* saveFileName = saveFileSlotNames[slotIndex];

      auto fileDirEntry = std::filesystem::directory_entry{ std::filesystem::absolute(saveFileName) };
      if (fileDirEntry.exists())
      {
         auto fileSize = fileDirEntry.file_size();
         debug_print("Save file size: %zu\n", (std::size_t)fileDirEntry.file_size());

         auto saveFile = std::fstream{ saveFileName, std::ios::in | std::ios::binary };
         if (!saveFile.good())
         {
            int error = errno;
            fprintf(stderr, "Error: %s\n", strerror(error));
            ENGINE_PANIC("Desktop build: SAVE file missing");
         }
         else
         {
            saveFile.read((char*)&currentSave, sizeof(TSave));
            if (saveFile.gcount() != sizeof(TSave))
            {
               // The file on disk can't be read?
               // Empty out the destination.
               currentSave = TSave{};
            }
            saveFile.close();
         }
      }
#endif
   }

private:
   char* romData{0x0};
   std::tuple<Header<THeaders>...> headers;
   TSave currentSave{};

   template <typename TData>
   constexpr const Header<TData>& getHeader() const
   {
      constexpr auto index = type_index_v<Header<TData>, std::tuple<Header<THeaders>...>>;
      return std::get<index>(headers);
   }

   template <typename T>
   auto headerFor(uint32_t& offset) const
   {
      const auto count = *(const uint32_t*)(romData + offset);
      offset += sizeof(uint32_t);
      const auto header = Header<T>(count, (const uint32_t*)(romData + offset));
      offset += sizeof(uint32_t) * count * 2;
      return header;
   }

   template <typename... TRest>
   auto headersFor(uint32_t offset) const
   {
      return std::tuple<Header<TRest>...>{headerFor<TRest>(offset)...};
   }
};

#endif
