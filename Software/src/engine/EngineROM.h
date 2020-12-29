#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

//size of chunk to be read/written when writing game.dat to ROM per loop
#define ENGINE_ROM_SD_CHUNK_READ_SIZE 65536

//size of largest single EngineROM_Write data that can be sent at one time:
//make sure that ENGINE_ROM_SD_CHUNK_READ_SIZE is evenly divisible by this 
//or you'll lose data.
#define ENGINE_ROM_WRITE_PAGE_SIZE 512

//this is the 'magic string' that will appear at the start of game.dat.
//it is used to verify that the binary file is formatted correctly.
#define ENGINE_ROM_MAGIC_STRING "MAGEGAME"

//this is the length of the 'magic string' at the start of the game.dat file:
#define ENGINE_ROM_MAGIC_STRING_LENGTH 8

//this is the length of the timestamp that follows the magic string in game.dat
//it is used to let us check if we need to re-flash the ROM chip with the file on
//the SD card.
#define ENGINE_ROM_TIMESTAMP_LENGTH 24

//this is all the bytes on our ROM chip. We aren't able to write more than this
//to the ROM chip, as there are no more bytes on it. Per the datasheet, there are 32MB,
//which is defined as 2^25 bytes available for writing.
//We are also subtracting 4096 for ENGINE_ROM_SAVE_FLAG_RESERVED_MEMORY_SIZE
#define ENGINE_ROM_SAVE_FLAG_RESERVED_MEMORY_SIZE 4096
#define ENGINE_ROM_MAX_DAT_FILE_SIZE (33554432 - ENGINE_ROM_SAVE_FLAG_RESERVED_MEMORY_SIZE)

//This is a return code indicating that the verification was successful
//it needs to be a negative number, as the EngineROM_Verify function returns 
//the failure address which is a uint32_t and can include 0
#define ENGINE_ROM_VERIFY_SUCCESS -1

bool EngineROM_Init(void);
void EngineROM_Deinit(void);
bool EngineROM_Magic(const uint8_t *magic, uint8_t length);

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data);
uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data);
int64_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data);
bool EngineROM_SD_Copy(uint32_t gameDatFilesize, FIL gameDat);

#endif
