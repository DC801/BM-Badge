#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

//size of chunk to be read/written when writing game.dat to ROM
#define ENGINE_ROM_SD_CHUNK_READ_SIZE 65536

//this is the 'magic string' that will appear at the start of game.dat.
//it is used to verify that the binary file is formatted correctly.
#define ENGINE_ROM_MAGIC_STRING "MAGEGAME"

//this is the length of the 'magic string' at the start of the game.dat file:
#define ENGINE_ROM_MAGIC_STRING_LENGTH 8

//this is the length of the timestamp that follows the magic string in game.dat
//it is used to let us check if we need to re-flash the ROM chip with the file on
//the SD card.
#define ENGINE_ROM_TIMESTAMP_LENGTH 24

bool EngineROM_Init(void);
void EngineROM_Deinit(void);
bool EngineROM_Magic(const uint8_t *magic, uint8_t length);

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data);
uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data);
bool EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data);

#endif
