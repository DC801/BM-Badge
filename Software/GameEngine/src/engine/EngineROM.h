#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

#include <stdint.h>
#include "EnginePanic.h"
#include "FrameBuffer.h"
#include "fonts/Monaco9.h"

#include "convert_endian.h"
#include "utility.h"

#ifndef DC801_EMBEDDED
#include <errno.h>
#include <string.h>
#include <sys/stat.h>
#include "sdk/shim/shim_err.h"

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif // EMSCRIPTEN

#ifdef __cplusplus
extern "C" {
#endif

#define DESKTOP_SAVE_FILE_PATH "MAGE/save_games/"

#endif

//size of chunk to be read/written when writing game.dat to ROM per loop
#define ENGINE_ROM_SD_CHUNK_READ_SIZE 65536

//This is the smallest page we know how to erase on our chip,
//because the smaller values provided by nordic are incorrect,
//and this is the only one that has worked for us so far
//262144 bytes = 256KB
#define ENGINE_ROM_ERASE_PAGE_SIZE 262144

//size of largest single EngineROM_Write data that can be sent at one time:
//make sure that ENGINE_ROM_SD_CHUNK_READ_SIZE is evenly divisible by this
//or you'll lose data.
#define ENGINE_ROM_WRITE_PAGE_SIZE 512

//this 'identifier' will appear at the start of game.dat.
//it is used to verify that the binary file is formatted correctly.
#define ENGINE_ROM_GAME_IDENTIFIER_STRING {'M','A','G','E','G','A','M','E'}

//this is the 'magic string' that will appear at the start of game.dat.
//it is used to verify that the binary file is formatted correctly.
#define ENGINE_ROM_SAVE_IDENTIFIER_STRING {'M','A','G','E','S','A','V','E'}

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
//it needs to be a negative number, as the EngineROM_Verify function returns
//the failure address which is a uint32_t and can include 0
#define ENGINE_ROM_VERIFY_SUCCESS -1

void EngineROM_Init();
void EngineROM_Deinit();
bool EngineROM_Magic();
void EngineROM_ErrorUnplayable();

bool EngineROM_Read(
	uint32_t address,
	uint32_t length,
	uint8_t *data,
	const char *errorString
);
bool EngineROM_Write(
	uint32_t address,
	uint32_t length,
	uint8_t *data,
	const char *errorString
);
uint32_t EngineROM_Verify(
	uint32_t address,
	uint32_t length,
	const uint8_t *data,
	bool throwErrorWithLog
);
uint32_t getSaveSlotAddressByIndex(uint8_t slotIndex);
void EngineROM_ReadSaveSlot(
	uint8_t slotIndex,
	size_t length,
	uint8_t *data
);
void EngineROM_EraseSaveSlot(uint8_t slotIndex);
void EngineROM_WriteSaveSlot(
	uint8_t slotIndex,
	size_t length,
	uint8_t *hauntedDataPointer
);

#ifdef DC801_EMBEDDED

bool EngineROM_SD_Copy(
	uint32_t gameDatFilesize,
	FIL gameDat,
	bool eraseWholeRomChip
);
#endif


#ifdef __cplusplus
}
#endif


#endif
