#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

#include <stdint.h>
#include <stddef.h>
#include <memory>

struct EngineROM
{
   EngineROM() noexcept;
   ~EngineROM() = default;

   bool Magic();
   void ErrorUnplayable();

   bool Read(
      uint32_t address,
      uint32_t length,
      uint8_t* data,
      const char* errorString
   );
   bool Write(
      uint32_t address,
      uint32_t length,
      uint8_t* data,
      const char* errorString
   );
   uint32_t Verify(
      uint32_t address,
      uint32_t length,
      const uint8_t* data,
      bool throwErrorWithLog
   );
   uint32_t getSaveSlotAddressByIndex(uint8_t slotIndex);
   void ReadSaveSlot(
      uint8_t slotIndex,
      size_t length,
      uint8_t* data
   );
   void EraseSaveSlot(uint8_t slotIndex);
   void WriteSaveSlot(
      uint8_t slotIndex,
      size_t length,
      uint8_t* hauntedDataPointer
   );
#ifdef DC801_EMBEDDED

   bool SD_Copy(
      uint32_t gameDatFilesize,
      FIL gameDat,
      bool eraseWholeRomChip
   );
#endif

};




#endif
