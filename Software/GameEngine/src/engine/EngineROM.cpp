#include "common.h"
#include "EngineROM.h"
#include "EnginePanic.h"
#include "FrameBuffer.h"
#include "fonts/Monaco9.h"
#include "games/mage/mage_defines.h"

#ifdef DC801_DESKTOP
#include <errno.h>
#include <string.h>
#include <sys/stat.h>

FILE *romfile = NULL;
uint8_t romDataInDesktopRam[ENGINE_ROM_MAX_DAT_FILE_SIZE] = {0};
char saveFileSlotNames[ENGINE_ROM_SAVE_GAME_SLOTS][16] = {
	"MAGE/save_0.dat",
	"MAGE/save_1.dat",
	"MAGE/save_2.dat"
};
#endif //DC801_DESKTOP

#ifdef DC801_EMBEDDED
#include "qspi.h"
extern QSPI qspiControl;

#endif //DC801_EMBEDDED

void EngineROM_Init()
{
	bool isRomPlayable = false;
	const char filename[] = MAGE_GAME_DAT_PATH;
#ifdef DC801_EMBEDDED
	isRomPlayable = EngineROM_Magic();
	FIL gameDat;
	FRESULT result;
	UINT count;
	char gameDatHashSD[ENGINE_ROM_MAGIC_HASH_LENGTH + 1] {0};
	char gameDatHashROM[ENGINE_ROM_MAGIC_HASH_LENGTH + 1] {0};
	bool gameDatSDPresent = false;
	// Look on the SD card to read `game.dat` filesize, OR see if it is present at all:
	uint32_t gameDatFilesize = util_sd_file_size(filename);
	if(gameDatFilesize > 0) {
		// Open magegame.dat file on SD card
		result = f_open(&gameDat, filename, FA_READ | FA_OPEN_EXISTING);
		if (result == FR_OK) {
			result = f_lseek(&gameDat, 0);
			if (result == FR_OK) {
				// get the gameDatHashSD from the SD card game.dat:
				result = f_read(
					&gameDat,
					(uint8_t *) gameDatHashSD,
					ENGINE_ROM_MAGIC_HASH_LENGTH,
					&count
				);
				gameDatSDPresent = result == FR_OK;
			}
		}
	}

	if (!gameDatSDPresent && isRomPlayable) {
		// jump right to game
		return;
	}
	else if (!gameDatSDPresent && !isRomPlayable) {
		// no SD card, rom is invalid - literally unplayable
		EngineROM_ErrorUnplayable();
	}
	else if (gameDatSDPresent && !isRomPlayable) {
		// we have SD, rom is invalid - skip directly to the copy operation
	}
	else if (gameDatSDPresent && isRomPlayable) {
		// we have SD, and the rom seems valid - check if hashes are the same

		// get the gameDatHashROM from the ROM chip:
		EngineROM_Read(
			0,
			ENGINE_ROM_MAGIC_HASH_LENGTH,
			(uint8_t *) gameDatHashROM,
			"Failed to read header hash from ROM"
		);
		char gameDatHashSDString[9] = {0};
		char gameDatHashROMString[9] = {0};
		sprintf(
			gameDatHashSDString,
			"%02X%02X%02X%02X",
			gameDatHashSD[8],
			gameDatHashSD[9],
			gameDatHashSD[10],
			gameDatHashSD[11]
		);
		sprintf(
			gameDatHashROMString,
			"%02X%02X%02X%02X",
			gameDatHashROM[8],
			gameDatHashROM[9],
			gameDatHashROM[10],
			gameDatHashROM[11]
		);

		// compare the two header hashes:
		bool headerHashMatch = (strcmp(gameDatHashSD, gameDatHashROM) == 0);

		// handles hardware inputs and makes their state available
		EngineHandleInput();
		char updateMessagePrefix[128];
		if (!headerHashMatch) {
			sprintf(
				updateMessagePrefix,
				"The file `game.dat` on your SD card does not\n"
				"match what is on your badge ROM chip."
			);
		} else if (EngineInput_Buttons.mem3) {
			sprintf(
				updateMessagePrefix,
				"You have held down MEM3 while booting.\n"
				"You may force update `game.dat` on badge."
			);
		} else {
			// there is no update, and user is not holding MEM3, proceed as normal
			result = f_close(&gameDat);
			return;
		}

		// show update confirmation
		char debugString[512];
		p_canvas()->clearScreen(COLOR_BLACK);
		//48 chars is a good character width for screen width plus some padding
		sprintf(
			debugString,
			"%s\n\n"
			" SD hash: %s\n"
			"ROM hash: %s\n\n"
			"Would you like to update your scenario data?\n"
			"------------------------------------------------\n\n\n"
			"    > Press MEM0 to cancel\n\n"
			"    > Press MEM3 to update the ROM",
			updateMessagePrefix,
			gameDatHashSDString,
			gameDatHashROMString
		);
		p_canvas()->printMessage(
			debugString,
			Monaco9,
			0xffff,
			16,
			16
		);
		p_canvas()->blt();
		bool showOptions = true;
		while (showOptions) {
			nrf_delay_ms(10);
			EngineHandleInput();
			if (EngineInput_Activated.mem0) {
				p_canvas()->clearScreen(COLOR_BLACK);
				p_canvas()->blt();
				return;
			}
			if (EngineInput_Activated.mem3) {
				showOptions = false;
			}
		}
	}
	if(!EngineROM_SD_Copy(gameDatFilesize, gameDat)){
		ENGINE_PANIC("SD Copy Operation was not successful.");
	}
	//close game.dat file when done:
	result = f_close(&gameDat);
#endif //DC801_EMBEDDED
#ifdef DC801_DESKTOP
	struct stat stats;
	size_t romFileSize = 0;
	if (stat(filename, &stats) == 0) {
		romFileSize = stats.st_size;
		printf(
			"EngineROM_Init - romFileSize: %d\n",
			romFileSize
		);
	} else {
		ENGINE_PANIC(
			"Desktop build:\n"
			"    Unable to read ROM file size"
		);
	}

	if (romFileSize > ENGINE_ROM_MAX_DAT_FILE_SIZE) {
		ENGINE_PANIC(
			"Desktop build:\n"
			"    Invalid ROM file size!\n"
			"    This is larger than the hardware's\n"
			"    ROM chip capacity!\n"
		);
	}

	romfile = fopen(filename, "rb");
	if (romfile == NULL)
	{
		int error = errno;
		fprintf(stderr, "Error: %s\n", strerror(error));
		ENGINE_PANIC(
			"Desktop build:\n"
			"    Unable to open ROM file for reading"
		);
	}

	/* copy the file into the buffer */
	if (fread(romDataInDesktopRam, romFileSize, 1, romfile) != 1)
	{
		fclose(romfile);
		ENGINE_PANIC("Desktop build: ROM->RAM read failed");
	}
#endif //DC801_DESKTOP
	// Verify magic string is on ROM when we're done:
	isRomPlayable = EngineROM_Magic();
	if (!isRomPlayable) {
		EngineROM_ErrorUnplayable();
	}
}

void EngineROM_ErrorUnplayable() {
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

uint32_t getSaveSlotAddressByIndex(uint8_t slotIndex) {
	return (
		ENGINE_ROM_SAVE_OFFSET
		+ (slotIndex * ENGINE_ROM_ERASE_PAGE_SIZE)
	);
}

void EngineROM_ReadSaveSlot(
	uint8_t slotIndex,
	size_t length,
	uint8_t *data
) {
	#ifdef DC801_DESKTOP
	char *saveFileName = saveFileSlotNames[slotIndex];
	FILE *saveFile = fopen(saveFileName, "r+b");
	if (saveFile == NULL) {
		saveFile = fopen(saveFileName, "w+b");
		if (saveFile == NULL) {
			int error = errno;
			fprintf(stderr, "Error: %s\n", strerror(error));
			ENGINE_PANIC("Desktop build: SAVE file missing");
		}
	}
	fseek(saveFile, 0, SEEK_END);
	size_t saveFileSize = ftell(saveFile);
	rewind(saveFile);
	debug_print(
		"Save file size: %d\n",
		saveFileSize
	);
	if(saveFileSize) {
		if (fread(data, saveFileSize, 1, saveFile) != 1) {
			fclose(saveFile);
			ENGINE_PANIC("Desktop build: SAVE file cannot be created");
		}
	} else {
		// The file save_*.dat on disk is empty?
		// Empty out the destination.
		for(size_t i = 0; i < length; i++) {
			data[i] = 0;
		}
	}
	fclose(saveFile);
	#endif //DC801_DESKTOP

	#ifdef DC801_EMBEDDED
	EngineROM_Read(
		getSaveSlotAddressByIndex(slotIndex),
		length,
		data,
		"Failed to read saveGame from ROM"
	);
	#endif //DC801_EMBEDDED
}

void EngineROM_EraseSaveSlot(uint8_t slotIndex) {
	#ifdef DC801_EMBEDDED
	if(!qspiControl.erase(
		tBlockSize::BLOCK_SIZE_256K,
		getSaveSlotAddressByIndex(slotIndex)
	)){
		ENGINE_PANIC("Failed to send erase command for save slot.");
	}
	while(qspiControl.isBusy()){
		// is very busy
	}
	#endif //DC801_EMBEDDED
}

void EngineROM_WriteSaveSlot(
	uint8_t slotIndex,
	size_t length,
	uint8_t *hauntedDataPointer
) {
	// Why is this named `hauntedDataPointer`?
	// Because horrifyingly, depending WHERE you get this pointer FROM,
	// when you write it to ROM, it MAY be prefixed with extra 2 bytes of data,
	// likely the registers are being over-written on embedded.
	// So what's the solution on the embedded version of the code?
	// Copy the data from the hauntedDataPointer to a locally scoped stack copy,
	// and write to ROM from the pointer to the locally scoped stack copy.
	// This may actually be a compiler bug, or ROM interface black magic.
	#ifdef DC801_DESKTOP
	char *saveFileName = saveFileSlotNames[slotIndex];
	FILE *saveFile = fopen(saveFileName, "r+b");
	if (saveFile == NULL) {
		saveFile = fopen(saveFileName, "w+b");
		if (saveFile == NULL) {
			int error = errno;
			fprintf(stderr, "Error: %s\n", strerror(error));
			ENGINE_PANIC("Desktop build: SAVE file cannot be created");
		}
	}
	fwrite(
		hauntedDataPointer,
		sizeof(MageSaveGame),
		1,
		saveFile
	);
	fclose(saveFile);
	#endif // DC801_DESKTOP

	#ifdef DC801_EMBEDDED
	uint8_t localUnHauntedSaveDataCopy[length];
	memcpy(
		&localUnHauntedSaveDataCopy,
		hauntedDataPointer,
		length
	);
	EngineROM_EraseSaveSlot(slotIndex);
	EngineROM_Write(
		getSaveSlotAddressByIndex(slotIndex),
		length,
		// hauntedDataPointer, // DO NOT USE, HAUNTED!!!
		(uint8_t *)&localUnHauntedSaveDataCopy,
		"Failed to write currentSave into ROM"
	);
	#endif // DC801_EMBEDDED
}

#ifdef DC801_EMBEDDED
//this will copy from the file `MAGE/game.dat` on the SD card into the ROM chip.
bool EngineROM_SD_Copy(uint32_t gameDatFilesize, FIL gameDat){
	if(gameDatFilesize > ENGINE_ROM_MAX_DAT_FILE_SIZE){
		ENGINE_PANIC("Your game.dat is larger than 33550336 bytes.\nYou will need to reduce its size to use it\non this board.");
	}
	char debugString[128];
	FRESULT result;
	UINT count;
	p_canvas()->clearScreen(COLOR_BLACK);
	p_canvas()->printMessage(
		"Erasing ROM chip",
		Monaco9,
		COLOR_WHITE,
		16,
		96
	);
	p_canvas()->blt();
	//then write the entire SD card game.dat file to the ROM chip MAGE_SD_CHUNK_READ_SIZE bytes at a time.
	uint32_t currentAddress = 0;
	uint8_t strBuffer[ENGINE_ROM_SD_CHUNK_READ_SIZE] {0};
	// I mean, you _COULD_ start by erasing the whole chip...
	// if(!qspiControl.chipErase()){
	// 	ENGINE_PANIC("Failed to erase ROM Chip.");
	// }
	// or you could do it one page at a time, so it saves a LOT of time
	while(currentAddress < gameDatFilesize){
		if(!qspiControl.erase(tBlockSize::BLOCK_SIZE_256K, currentAddress)){
			ENGINE_PANIC("Failed to send erase comand.");
		}
		while(qspiControl.isBusy()){
			// is very busy
		}
		//Debug Print:
		sprintf(
			debugString,
			"Erasing currentAddress: %08u\ngameDatFilesize:%08u",
			currentAddress,
			gameDatFilesize
		);
		p_canvas()->fillRect(
			0,
			96,
			WIDTH,
			96,
			COLOR_BLACK
		);
		p_canvas()->printMessage(
			debugString,
			Monaco9,
			COLOR_WHITE,
			16,
			96
		);
		p_canvas()->blt();
		currentAddress += ENGINE_ROM_ERASE_PAGE_SIZE;
	}

	// erase save games at the end of ROM chip too when copying
	// because new dat files means new save flags and variables
	for(uint8_t i = 0; i < ENGINE_ROM_SAVE_GAME_SLOTS; i++) {
		EngineROM_EraseSaveSlot(i);
	}

	currentAddress = 0;
	while(currentAddress < gameDatFilesize){
		uint32_t chunkSize = MIN(ENGINE_ROM_SD_CHUNK_READ_SIZE, (gameDatFilesize - currentAddress));
		//seek to the currentAddress on the SD card:
		result = f_lseek(&gameDat, currentAddress);
		if (result != FR_OK) {
			ENGINE_PANIC("Error seeking to game.dat position\nduring ROM erase procedure.");
		}
		//then read the next set of bytes into the buffer:
		result = f_read(
			&gameDat,
			strBuffer,
			chunkSize,
			&count
		);
		if (result != FR_OK) {
			ENGINE_PANIC("Error reading game.dat from SD card\nduring ROM erase procedure.");
		}
		//write the buffer to the ROM chip:
		uint32_t romPagesToWrite = chunkSize / ENGINE_ROM_WRITE_PAGE_SIZE;
		uint32_t partialPageBytesLeftOver = chunkSize % ENGINE_ROM_WRITE_PAGE_SIZE;
		if(partialPageBytesLeftOver){
			romPagesToWrite += 1;
		}
		for(uint32_t i=0; i<romPagesToWrite; i++)
		{
			//debug_print("Writing ROM Page %d/%d offset from %d", i, romPagesToWrite, currentAddress);
			uint32_t romPageOffset = i*ENGINE_ROM_WRITE_PAGE_SIZE;
			bool shouldUsePartialBytes = (i == (romPagesToWrite - 1)) && (partialPageBytesLeftOver != 0);
			uint32_t writeSize = shouldUsePartialBytes
				? partialPageBytesLeftOver
				: ENGINE_ROM_WRITE_PAGE_SIZE;

			if(i == (romPagesToWrite - 1)){
				debug_print("Write Size at %d is %d", i, writeSize);
			}
			EngineROM_Write(
				currentAddress + romPageOffset,
				writeSize,
				(uint8_t *)(strBuffer + romPageOffset),
				"Failed to write buffer to ROM chip\nduring ROM erase procedure."
			);
			//verify that the data was correctly written or return false.
			EngineROM_Verify(
				currentAddress + romPageOffset,
				writeSize,
				(uint8_t *)(strBuffer + romPageOffset),
				true
			);
		}
		//Debug Print:
		sprintf(
			debugString,
			"Copying currentAddress: %08u\ngameDatFilesize:%08u",
			currentAddress,
			gameDatFilesize
		);
		p_canvas()->fillRect(
			0,
			96,
			WIDTH,
			96,
			COLOR_BLACK
		);
		p_canvas()->printMessage(
			debugString,
			Monaco9,
			COLOR_WHITE,
			16,
			96
		);
		p_canvas()->blt();
		currentAddress += chunkSize;
	}
	//print success message:
	p_canvas()->fillRect(
		0,
		96,
		WIDTH,
		96,
		0x0000
	);
	p_canvas()->printMessage(
		"SD -> ROM chip copy success",
		Monaco9,
		0xffff,
		16,
		96
	);
	p_canvas()->blt();
	return true;
}
#endif //DC801_EMBEDDED

void EngineROM_Deinit() {
#ifdef DC801_DESKTOP
	if (romfile == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fclose(romfile) != 0)
	{
		ENGINE_PANIC("Failed to close Game Data file");
	}

	romfile = NULL;
#endif // DC801_DESKTOP
}

bool EngineROM_Read(
	uint32_t address,
	uint32_t length,
	uint8_t *data,
	const char *errorString
)
{
#ifdef DC801_EMBEDDED
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Read: Null pointer");
	}

	//this is the number of whole words to read from the starting adddress:
	uint32_t truncatedAlignedLength = (length / sizeof(uint32_t));
	//read in all but the last word if aligned data
	uint32_t *dataU32 = (uint32_t *)data;
	//get word-aligned pointers to the ROM:
	volatile uint32_t *romDataU32 = (volatile uint32_t *)(ROM_START_ADDRESS + address);
	for(uint32_t i=0; i<truncatedAlignedLength; i++){
		dataU32[i] = romDataU32[i];
	}
	//now we need to convert the word-aligned number of reads back to a uint8_t aligned
	//value where we will start reading the remaining bytes.
	truncatedAlignedLength = (truncatedAlignedLength * sizeof(uint32_t));
	uint32_t numUnalignedBytes = length - truncatedAlignedLength;
	if(numUnalignedBytes)
	{
		address += truncatedAlignedLength;
		//get byte-aligned rom data at the new address:
		volatile uint8_t *romDataU8 = (volatile uint8_t *)(ROM_START_ADDRESS + address);
		//fill in the unaligned bytes only and ignore the rest:
		for(uint8_t i=0; i<numUnalignedBytes; i++){
			data[truncatedAlignedLength+i] = romDataU8[i];
		}
	}
#endif // DC801_EMBEDDED
#ifdef DC801_DESKTOP
	memcpy(data, romDataInDesktopRam + address, length);
#endif // DC801_DESKTOP
	return true;
}

bool EngineROM_Write(
	uint32_t address,
	uint32_t length,
	uint8_t *data,
	const char *errorString
)
{
	if(length % sizeof(uint32_t)){
		ENGINE_PANIC(
			"Length of write is not aligned to uint32_t\n"
			"You can't do this, fix whatever is\n"
			"sending an unaligned write."
		);
	}
#ifdef DC801_EMBEDDED
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Write: Null pointer");
	}

	if(!qspiControl.write(data, length, address))
	{
		ENGINE_PANIC(errorString);
	}
	return true;
#endif // DC801_EMBEDDED
#ifdef DC801_DESKTOP
	if (romfile == NULL || data == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		ENGINE_PANIC("Failed to seek into Game Data");
	}

	return fwrite(data, sizeof(uint8_t), length, romfile) == length;
#endif // DC801_DESKTOP
}

uint32_t EngineROM_Verify(
	uint32_t address,
	uint32_t length,
	const uint8_t *data,
	bool throwErrorWithLog = false
)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM_Verify: Null pointer");
	}
	char debugString[128];
	uint8_t readBuffer[length];
	EngineROM_Read(
		address,
		length,
		readBuffer,
		"Failed to read from Rom in EngineROM_Verify"
	);

	for(uint32_t i=0; i<length; i++){
		if(data[i] != readBuffer[i]){
			if (throwErrorWithLog) {
				sprintf(
					debugString,
					"EngineROM_Verify failed at address %d\nTest: %d\n ROM: %d",
					address + i,
					data[i],
					readBuffer[i]
				);
				debug_print(debugString);
				ENGINE_PANIC(debugString);
			}
			//return address in ROM where memory does not match
			return address+i;
		}
	}
	return length;
}

bool EngineROM_Magic() {
	uint8_t length = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;
	uint8_t magic[] = ENGINE_ROM_GAME_IDENTIFIER_STRING;
	uint32_t bytesVerified = EngineROM_Verify(
		0,
		length,
		magic
	);
	return bytesVerified == length;
}
