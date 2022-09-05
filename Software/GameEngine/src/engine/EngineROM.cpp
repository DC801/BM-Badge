#include "EngineROM.h"
#include "EnginePanic.h"
#include "games/mage/mage_defines.h"
#include "utility.h"
#include <filesystem>
#include <fstream>

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif // EMSCRIPTEN

#ifdef DC801_EMBEDDED
#include "qspi.h"
extern QSPI qspiControl;

#else
FILE* romfile = NULL;
char* romDataInDesktopRam = new char[ENGINE_ROM_MAX_DAT_FILE_SIZE]{ 0 };
char saveFileSlotNames[ENGINE_ROM_SAVE_GAME_SLOTS][32] = {
	DESKTOP_SAVE_FILE_PATH "save_0.dat",
	DESKTOP_SAVE_FILE_PATH "save_1.dat",
	DESKTOP_SAVE_FILE_PATH "save_2.dat"
};

void makeSureSaveFilePathExists() {
	auto saveDir = std::filesystem::directory_entry{ DESKTOP_SAVE_FILE_PATH };
	if (!saveDir.exists()) {
		if (!std::filesystem::create_directories(saveDir)) {
			throw "Couldn't create save directory";
		}
	}
}
#endif //DC801_DESKTOP

EngineROM::EngineROM() noexcept
{
#ifdef DC801_EMBEDDED
	isRomPlayable = Magic();
	FIL gameDat;
	FRESULT result;
	UINT count;
	char gameDatHashSD[ENGINE_ROM_MAGIC_HASH_LENGTH + 1]{ 0 };
	char gameDatHashROM[ENGINE_ROM_MAGIC_HASH_LENGTH + 1]{ 0 };
	bool gameDatSDPresent = false;
	bool eraseWholeRomChip = false;
	// Look on the SD card to read `game.dat` filesize, OR see if it is present at all:
	uint32_t gameDatFilesize = util_sd_file_size(filename);
	if (gameDatFilesize > 0) {
		// Open magegame.dat file on SD card
		result = f_open(&gameDat, filename, FA_READ | FA_OPEN_EXISTING);
		if (result == FR_OK) {
			result = f_lseek(&gameDat, 0);
			if (result == FR_OK) {
				// get the gameDatHashSD from the SD card game.dat:
				result = f_read(
					&gameDat,
					(uint8_t*)gameDatHashSD,
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
		ErrorUnplayable();
	}
	else if (gameDatSDPresent && !isRomPlayable) {
		// we have SD, rom is invalid - skip directly to the copy operation
	}
	else if (gameDatSDPresent && isRomPlayable) {
		// we have SD, and the rom seems valid - check if hashes are the same

		// get the gameDatHashROM from the ROM chip:
		Read(
			0,
			ENGINE_ROM_MAGIC_HASH_LENGTH,
			(uint8_t*)gameDatHashROM,
			"Failed to read header hash from ROM"
		);
		char gameDatHashSDString[9] = { 0 };
		char gameDatHashROMString[9] = { 0 };
		sprintf(
			gameDatHashSDString,
			"%02X%02X%02X%02X",
			gameDatHashSD[ENGINE_ROM_START_OF_CRC_OFFSET],
			gameDatHashSD[ENGINE_ROM_START_OF_CRC_OFFSET + 1],
			gameDatHashSD[ENGINE_ROM_START_OF_CRC_OFFSET + 2],
			gameDatHashSD[ENGINE_ROM_START_OF_CRC_OFFSET + 3]
		);
		sprintf(
			gameDatHashROMString,
			"%02X%02X%02X%02X",
			gameDatHashROM[ENGINE_ROM_START_OF_CRC_OFFSET],
			gameDatHashROM[ENGINE_ROM_START_OF_CRC_OFFSET + 1],
			gameDatHashROM[ENGINE_ROM_START_OF_CRC_OFFSET + 2],
			gameDatHashROM[ENGINE_ROM_START_OF_CRC_OFFSET + 3]
		);

		// compare the two header hashes:
		bool headerHashMatch = (strcmp(gameDatHashSD, gameDatHashROM) == 0);

		// handles hardware inputs and makes their state available
		inputHandler->HandleKeyboard();
		char updateMessagePrefix[128];
		if (!headerHashMatch) {
			sprintf(
				updateMessagePrefix,
				"The file `game.dat` on your SD card does not\n"
				"match what is on your badge ROM chip."
			);
		}
		else if (EngineInput_Buttons.mem3) {
			sprintf(
				updateMessagePrefix,
				"You have held down MEM3 while booting.\n"
				"You may force update `game.dat` on badge."
			);
		}
		else {
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
			"    > Press MEM2 to erase whole ROM for recovery\n\n"
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
			inputHandler->HandleKeyboard();
			if (EngineInput_Activated.mem0) {
				p_canvas()->clearScreen(COLOR_BLACK);
				p_canvas()->blt();
				return;
			}
			if (EngineInput_Activated.mem2) {
				eraseWholeRomChip = true;
				showOptions = false;
			}
			if (EngineInput_Activated.mem3) {
				showOptions = false;
			}
		}
	}
	if (!EngineRom::SD_Copy(gameDatFilesize, gameDat, eraseWholeRomChip)) {
		ENGINE_PANIC("SD Copy Operation was not successful.");
	}
	//close game.dat file when done:
	result = f_close(&gameDat);
#else
	auto romFileSize = 0;
	if (std::filesystem::exists(MAGE_GAME_DAT_PATH)) {
		romFileSize = std::filesystem::file_size(MAGE_GAME_DAT_PATH);
		printf(
			"EngineROM::Init - romFileSize: %d\n",
			romFileSize
		);
	}
	else {
		ENGINE_PANIC(
			"Desktop build:\n"
			"    Unable to read ROM file size at %s",
			MAGE_GAME_DAT_PATH
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

	auto file = std::ifstream{ MAGE_GAME_DAT_PATH, std::ios::binary };
	
	/* copy the file into the buffer */
	if (!file.read(romDataInDesktopRam, romFileSize))
	{
		ENGINE_PANIC("Desktop build: ROM->RAM read failed");
	}
	file.close();
	// romfile = fopen(MAGE_GAME_DAT_PATH, "rb");
	// if (romfile == NULL)
	// {
	// 	int error = errno;
	// 	fprintf(stderr, "Error: %s\n", strerror(error));
	// 	ENGINE_PANIC(
	// 		"Desktop build:\n"
	// 		"    Unable to open ROM file for reading"
	// 	);
	// }
#endif

	// Verify magic string is on ROM when we're done:
	if (!EngineROM::Magic()) {
		EngineROM::ErrorUnplayable();
	}
}

void EngineROM::ErrorUnplayable() {
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

void EngineROM::ReadSaveSlot(
	uint8_t slotIndex,
	size_t dataLength,
	uint8_t* data
) {
#ifdef DC801_EMBEDDED
	Read(
		getSaveSlotAddressByIndex(slotIndex),
		length,
		data,
		"Failed to read saveGame from ROM"
	);
#else
	makeSureSaveFilePathExists();
	char* saveFileName = saveFileSlotNames[slotIndex];
	auto fileDirEntry = std::filesystem::directory_entry{ std::filesystem::absolute(saveFileName) };
	if (fileDirEntry.exists()) {
		auto saveFile = std::fstream{ saveFileName, std::ios::in | std::ios::out | std::ios::binary };
		if (!saveFile.good()) {
			int error = errno;
			fprintf(stderr, "Error: %s\n", strerror(error));
			ENGINE_PANIC("Desktop build: SAVE file missing");
		}
		else
		{
			auto fileSize = fileDirEntry.file_size();

			debug_print(
				"Save file size: %zu\n",
				(uint32_t)fileDirEntry.file_size()
			);
			
			saveFile.read((char*)data, fileSize);

			auto readCount = saveFile.gcount();
			if (fileSize != readCount)
			{
				// The file save_*.dat on disk can't be read?
				// Empty out the destination.
				memset(data, 0, dataLength);
			}
		}
	}
#endif
}

void EngineROM::EraseSaveSlot(uint8_t slotIndex) {
#ifdef DC801_EMBEDDED
	if (!qspiControl.erase(
		tBlockSize::BLOCK_SIZE_256K,
		getSaveSlotAddressByIndex(slotIndex)
	)) {
		ENGINE_PANIC("Failed to send erase command for save slot.");
	}
	while (qspiControl.isBusy()) {
		// is very busy
	}
#endif //DC801_EMBEDDED
}

void EngineROM::WriteSaveSlot(
	uint8_t slotIndex,
	size_t length,
	uint8_t* hauntedDataPointer
) {
#ifdef DC801_EMBEDDED
	uint8_t localUnHauntedSaveDataCopy[length];
	memcpy(
		&localUnHauntedSaveDataCopy,
		hauntedDataPointer,
		length
	);
	EngineRom::EraseSaveSlot(slotIndex);
	EngineRom::Write(
		getSaveSlotAddressByIndex(slotIndex),
		length,
		// hauntedDataPointer, // DO NOT USE, HAUNTED!!!
		(uint8_t*)&localUnHauntedSaveDataCopy,
		"Failed to write currentSave into ROM"
	);
#else
	// Why is this named `hauntedDataPointer`?
	// Because horrifyingly, depending WHERE you get this pointer FROM,
	// when you write it to ROM, it MAY be prefixed with extra 2 bytes of data,
	// likely the registers are being over-written on embedded.
	// So what's the solution on the embedded version of the code?
	// Copy the data from the hauntedDataPointer to a locally scoped stack copy,
	// and write to ROM from the pointer to the locally scoped stack copy.
	// This may actually be a compiler bug, or ROM interface black magic.
	makeSureSaveFilePathExists();
	char* saveFileName = saveFileSlotNames[slotIndex];
	FILE* saveFile = fopen(saveFileName, "r+b");
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
//this will copy from the file `MAGE/game.dat` on the SD card into the ROM chip.
bool EngineRom::SD_Copy(
	uint32_t gameDatFilesize,
	FIL gameDat,
	bool eraseWholeRomChip
) {
	if (gameDatFilesize > ENGINE_ROM_MAX_DAT_FILE_SIZE) {
		ENGINE_PANIC(
			"Your game.dat is larger than %d bytes.\n"
			"You will need to reduce its size to use it\n"
			"on this board.",
			ENGINE_ROM_MAX_DAT_FILE_SIZE
		);
	}
	char debugString[128];
	FRESULT result;
	UINT count = 0;
	p_canvas()->clearScreen(COLOR_BLACK);
	uint32_t currentAddress = 0;
	uint8_t sdReadBuffer[ENGINE_ROM_SD_CHUNK_READ_SIZE]{ 0 };
	if (eraseWholeRomChip) {
		p_canvas()->printMessage(
			"Erasing WHOLE ROM chip.\n"
			"Please be patient, this may take a few minutes",
			Monaco9,
			COLOR_WHITE,
			16,
			96
		);
		p_canvas()->blt();
		if (!qspiControl.chipErase()) {
			ENGINE_PANIC("Failed to erase WHOLE ROM Chip.");
		}
	}
	else {
		p_canvas()->printMessage(
			"Erasing ROM chip",
			Monaco9,
			COLOR_WHITE,
			16,
			96
		);
		p_canvas()->blt();
		// I mean, you _COULD_ start by erasing the whole chip...
		// or you could do it one page at a time, so it saves a LOT of time
		while (currentAddress < gameDatFilesize) {
			if (!qspiControl.erase(tBlockSize::BLOCK_SIZE_256K, currentAddress)) {
				ENGINE_PANIC("Failed to send erase command.");
			}
			while (qspiControl.isBusy()) {
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
		for (uint8_t i = 0; i < ENGINE_ROM_SAVE_GAME_SLOTS; i++) {
			EngineRom::EraseSaveSlot(i);
		}
	}

	currentAddress = 0;
	//then write the entire SD card game.dat file to the ROM chip ENGINE_ROM_SD_CHUNK_READ_SIZE bytes at a time.
	while (currentAddress < gameDatFilesize) {
		uint32_t chunkSize = MIN(ENGINE_ROM_SD_CHUNK_READ_SIZE, (gameDatFilesize - currentAddress));
		//seek to the currentAddress on the SD card:
		result = f_lseek(&gameDat, currentAddress);
		if (result != FR_OK) {
			ENGINE_PANIC("Error seeking to game.dat position\nduring ROM copy procedure.");
		}
		//then read the next set of bytes into the buffer:
		result = f_read(
			&gameDat,
			sdReadBuffer,
			chunkSize,
			&count
		);
		if (result != FR_OK) {
			ENGINE_PANIC("Error reading game.dat from SD card\nduring ROM copy procedure.");
		}
		//write the buffer to the ROM chip:
		uint32_t romPagesToWrite = chunkSize / ENGINE_ROM_WRITE_PAGE_SIZE;
		uint32_t partialPageBytesLeftOver = chunkSize % ENGINE_ROM_WRITE_PAGE_SIZE;
		if (partialPageBytesLeftOver) {
			romPagesToWrite += 1;
		}
		for (uint32_t i = 0; i < romPagesToWrite; i++)
		{
			//debug_print("Writing ROM Page %d/%d offset from %d", i, romPagesToWrite, currentAddress);
			uint32_t romPageOffset = i * ENGINE_ROM_WRITE_PAGE_SIZE;
			bool shouldUsePartialBytes = (i == (romPagesToWrite - 1)) && (partialPageBytesLeftOver != 0);
			uint32_t writeSize = shouldUsePartialBytes
				? partialPageBytesLeftOver
				: ENGINE_ROM_WRITE_PAGE_SIZE;

			if (i == (romPagesToWrite - 1)) {
				debug_print("Write Size at %d is %d", i, writeSize);
			}
			EngineRom::Write(
				currentAddress + romPageOffset,
				writeSize,
				(uint8_t*)(sdReadBuffer + romPageOffset),
				"Failed to write buffer to ROM chip\nduring ROM copy procedure."
			);
			//verify that the data was correctly written or return false.
			EngineRom::Verify(
				currentAddress + romPageOffset,
				writeSize,
				(uint8_t*)(sdReadBuffer + romPageOffset),
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

bool EngineROM::Read(
	uint32_t address,
	uint32_t length,
	uint8_t* data,
	const char* errorString
)
{
#ifdef DC801_EMBEDDED
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM::Read: Null pointer");
	}

	//this is the number of whole words to read from the starting adddress:
	uint32_t truncatedAlignedLength = (length / sizeof(uint32_t));
	//read in all but the last word if aligned data
	uint32_t* dataU32 = (uint32_t*)data;
	//get word-aligned pointers to the ROM:
	volatile uint32_t* romDataU32 = (volatile uint32_t*)(ROM_START_ADDRESS + address);
	for (uint32_t i = 0; i < truncatedAlignedLength; i++) {
		dataU32[i] = romDataU32[i];
	}
	//now we need to convert the word-aligned number of reads back to a uint8_t aligned
	//value where we will start reading the remaining bytes.
	truncatedAlignedLength = (truncatedAlignedLength * sizeof(uint32_t));
	uint32_t numUnalignedBytes = length - truncatedAlignedLength;
	if (numUnalignedBytes)
	{
		address += truncatedAlignedLength;
		//get byte-aligned rom data at the new address:
		volatile uint8_t* romDataU8 = (volatile uint8_t*)(ROM_START_ADDRESS + address);
		//fill in the unaligned bytes only and ignore the rest:
		for (uint8_t i = 0; i < numUnalignedBytes; i++) {
			data[truncatedAlignedLength + i] = romDataU8[i];
		}
	}
#else
	memmove(data, romDataInDesktopRam + address, length);
#endif
	return true;
}

bool EngineROM::Write(
	uint32_t address,
	uint32_t length,
	uint8_t* data,
	const char* errorString
)
{
	if (length % sizeof(uint32_t)) {
		ENGINE_PANIC(
			"Length of write is not aligned to uint32_t\n"
			"You can't do this, fix whatever is\n"
			"sending an unaligned write."
		);
	}
#ifdef DC801_EMBEDDED
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM::Write: Null pointer");
	}

	if (!qspiControl.write(data, length, address))
	{
		ENGINE_PANIC(errorString);
	}
	return true;
#else
	if (romfile == NULL || data == NULL)
	{
		ENGINE_PANIC("Game Data file is not open");
	}

	if (fseek(romfile, address, SEEK_SET) != 0)
	{
		ENGINE_PANIC("Failed to seek into Game Data");
	}

	return fwrite(data, sizeof(uint8_t), length, romfile) == length;
#endif
}

uint32_t EngineROM::Verify(
	uint32_t address,
	uint32_t length,
	const uint8_t* data,
	bool throwErrorWithLog = false
)
{
	if (data == NULL)
	{
		ENGINE_PANIC("EngineROM::Verify: Null pointer");
	}
	char debugString[128];
	// auto readBuffer = std::make_unique<uint8_t[]>(dataLength);
	// Read(
	// 	address,
	// 	dataLength,
	// 	readBuffer.get(),
	// 	"Failed to read from Rom in EngineROM::Verify"
	// );

	for (uint32_t i = 0; i < length; i++) {
		if (data[i] != romDataInDesktopRam[i]) {
			if (throwErrorWithLog) {
				sprintf(
					debugString,
					"EngineROM::Verify failed at address %d\nTest: %d\n ROM: %d",
					address + i,
					data[i],
					romDataInDesktopRam[i]
				);
				debug_print("%s", debugString);
				ENGINE_PANIC(debugString);
			}
			//return address in ROM where memory does not match
			return address + i;
		}
	}
	return length;
}

bool EngineROM::Magic() {
	uint8_t length = ENGINE_ROM_IDENTIFIER_STRING_LENGTH;
	uint8_t magic[] = ENGINE_ROM_GAME_IDENTIFIER_STRING;
	uint32_t bytesVerified = EngineROM::Verify(
		0,
		length,
		magic
	);
	return bytesVerified == length;
}
