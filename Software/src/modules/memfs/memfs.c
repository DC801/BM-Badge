#include "common.h"
#include "memfs.h"

#include "nrfx_qspi.h"

#include <string.h>

#define MAX_FILES 64            // Ability to limit maximum files at compile time to save memory
#if MAX_FILES > 64
#error "Can't support more than 64 files in memfs"
#endif

#define FILE_TABLE_START	0x2000000
#define FILE_MASK			0b1100011
#define MAX_FILENAME		0x7E		// 126 bytes + null

#define QSPI_SCK NRF_GPIO_PIN_MAP(0, 12)
#define QSPI_CSN NRF_GPIO_PIN_MAP(0, 2)
#define QSPI_IO0 NRF_GPIO_PIN_MAP(0, 13)
#define QSPI_IO1 NRF_GPIO_PIN_MAP(1, 12)
#define QSPI_IO2 NRF_GPIO_PIN_MAP(0, 14)
#define QSPI_IO3 NRF_GPIO_PIN_MAP(0, 1)

typedef struct
{
	uint8_t mask:7;				// File mask, valid file is FILE_MASK
	uint32_t address:25;		// File address in memory
} memfs_filetable;

typedef struct
{
	uint8_t filename_len:7;		// Max filename 127 bytes including null
	uint32_t file_len:25;		// Max file length covers 32MB
} memfs_fileentry;

typedef struct
{
	uint8_t		open:1;			// Bit  0      : File is open (1) or closed (0)
	uint8_t		fileno:6;		// Bit  1 to  7: Maximum open files: 64
	uint32_t	address:25;		// Bit  8 to 32: Maximum addressible range 32MB
	uint8_t		error:7;		// Bit 33 to 39: File error
	uint32_t	offset:25;		// Bit 40 to 64: Current file offset
} memfs_fileblock;

memfs_fileblock open_files[MAX_FILES];
uint8_t file_buffer[127];

int is_aligned(const void *restrict pointer, size_t byte_count)
{
	return ((uintptr_t)pointer % byte_count) == 0;
}

size_t align_up(size_t value, int align)
{
	return (((value) + ((align) - 1)) & ~((align) - 1));
}

// QSPI reads and writes have some hardware limitations
// Alignment:
//   Extra zero bytes will be added at the beginning if not 4-byte aligned
// Length:
//   Data will be truncated to 4 byte alignment
// Address:
//   The target address on the device should also be 4 byte aligned to prevent issues
int qspi_write(const uint8_t *data, size_t length, uint32_t address)
{
	if (data == NULL)
	{
		return -5;
	}

	if (is_aligned(data, 4) == 0)
	{
		return -1;
	}

	if ((length % 4) != 0)
	{
		return -2;
	}

	if ((address % 4) != 0)
	{
		return -3;
	}

	if (NRFX_SUCCESS != nrfx_qspi_write(data, length, address))
	{
		return -4;
	}

	return 0;
}

int qspi_read(uint8_t *data, size_t length, uint32_t address)
{
	if (data == NULL)
	{
		return -5;
	}

	if (is_aligned(data, 4) == 0)
	{
		return -1;
	}

	if ((length % 4) != 0)
	{
		return -2;
	}

	if ((address % 4) != 0)
	{
		return -3;
	}

	if (NRFX_SUCCESS != nrfx_qspi_read(data, length, address))
	{
		return -4;
	}

	return 0;
}

int memfs_get_table(memfs_filetable *table, uint32_t address)
{
	if (table == NULL)
	{
		return -2;
	}

	uint8_t *ptr = (uint8_t *)table;

	// Read file table entry
	if (qspi_read(ptr, sizeof(memfs_filetable), address) != 0)
	{
		return -1;
	}

	if (table->mask == FILE_MASK)
	{
		return 0;
	}

	return 1;
}

int memfs_get_entry(memfs_fileentry *entry, const memfs_filetable *table)
{
	if ((table == NULL) || (entry == NULL))
	{
		return -3;
	}

	if (table->mask != FILE_MASK)
	{
		return -2;
	}

	uint8_t *ptr = (uint8_t *)entry;

	// Read the file entry
	if (qspi_read(ptr, sizeof(memfs_fileentry), table->address) != 0)
	{
		return -1;
	}

	return 0;
}

int memfs_get_filename(const memfs_filetable *table, memfs_fileentry *entry)
{
	if ((table == NULL) || (entry == NULL))
	{
		return -4;
	}

	if (table->mask != FILE_MASK)
	{
		return -3;
	}

	if (memfs_get_entry(entry, table) != 0)
	{
		return -2;
	}

	uint8_t length = entry->filename_len;

	// Read the filename
	if (qspi_read(file_buffer, length, table->address + sizeof(memfs_filetable)) != 0)
	{
		return -1;
	}

	file_buffer[length] = 0;	// Terminate string
	return length;
}

uint8_t memfs_get_fileno(void)
{
	uint8_t fileno = 0xFF;

	for (uint8_t i = 0; i < MAX_FILES; i++)
	{
		if (open_files[i].open == 0)
		{
			fileno = i;
			break;
		}
	}

	return fileno;
}

void memfs_init(void)
{
	nrfx_qspi_config_t qspi_config =
	{
		.xip_offset = 0,
		.pins =
		{
			.sck_pin = QSPI_SCK,
			.csn_pin = QSPI_CSN,
			.io0_pin = QSPI_IO0,
			.io1_pin = QSPI_IO1,
			.io2_pin = QSPI_IO2,
			.io3_pin = QSPI_IO3,
		},
		.prot_if =
		{
			.readoc = NRF_QSPI_READOC_READ4IO,
			.writeoc = NRF_QSPI_WRITEOC_PP4IO,
			.addrmode = NRF_QSPI_ADDRMODE_32BIT,
			.dpmconfig = false,
		},
		.phy_if =
		{
			.sck_freq = NRF_QSPI_FREQ_32MDIV1,
			.sck_delay = 1,
			.spi_mode = NRF_QSPI_MODE_0,
			.dpmen = false,
		},
		.irq_priority = QSPI_CONFIG_IRQ_PRIORITY,
	};

	if (NRFX_SUCCESS != nrfx_qspi_init(&qspi_config, NULL, NULL))
	{
		return;
	}

	nrf_qspi_cinstr_conf_t cinstr_conf =
	{
		.opcode = 0xF0,				// Software reset
		.length = NRF_QSPI_CINSTR_LEN_1B,
		.io2_level = true,
		.io3_level = true,
		.wipwait = false,
		.wren = false
	};

	// Software reset memory chip
	if (NRFX_SUCCESS != nrfx_qspi_cinstr_xfer(&cinstr_conf, NULL, NULL))
	{
		return;
	}

	// Switch to QSPI mode
	cinstr_conf.opcode = 0x01;	// Write configuration registers
	cinstr_conf.length = NRF_QSPI_CINSTR_LEN_3B;
	cinstr_conf.wren = true;
	uint8_t buffer[] =
	{
		0x02,		// Enable quad mode
		0x00,
	};

	if (NRFX_SUCCESS != nrfx_qspi_cinstr_xfer(&cinstr_conf, buffer, NULL))
	{
		return;
	}
}

// Implicitly opens files in append mode. For a file which does not exist,
//  the file is created with a size of 1. This is really inefficient because the
//  file may need to be moved multiple times as data is appended to it. Avoid
//  using fopen to create files unless you absolutely will not know the size
//  ahead of time. The best way to create files is to use the link function.
// Return value:
//     [0, MAX_FILES): File was opened and is ready to be used
//  [MAX_FILES, 0xF0): Reserved
//       [0xF0, 0xFF]: An error occured
uint8_t memfs_fopen(const char *filename)
{
	uint8_t fileno = memfs_get_fileno();

	// If we're out of open files
	if (fileno == 0xFF)
	{
		return 0xFF;
	}

	// Walk the file table
	uint32_t address = FILE_TABLE_START;
	memfs_filetable table = { 0 };
	memfs_fileentry entry = { 0 };

	do
	{
		address -= sizeof(memfs_filetable);

		// If it's a valid file
		if (memfs_get_table(&table, address) == 0)
		{
			int length = memfs_get_filename(&table, &entry);

			if (length < 1)
			{
				return 0xFF;
			}

			// See if it's our file
			if (strncmp(filename, (const char *)file_buffer, length) == 0)
			{
				open_files[fileno].open = 1;
				open_files[fileno].fileno = fileno;
				open_files[fileno].address = table.address + strlen(filename) + sizeof(memfs_fileentry);
				open_files[fileno].error = MEMFS_ERR_NONE;
				open_files[fileno].offset = 0;

				return fileno;
			}
		}
	} while (table.mask == FILE_MASK);

	return 0xFF;
}

// Closes a file.
// Return value:
//   0: Success, file is closed.
//  -1: Fail, no such file to close
int memfs_fclose(uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return -1;
	}

	open_files[file].open = 0;
	return 0;
}

// Creates a file with the supplied size, then opens it for editing in append mode.
//  This is more efficient than using fopen because the file should not need to be moved
//  unless you append more data than the supplied size.
// Return value: See fopen
uint8_t memfs_link(const char *filename, size_t size)
{
	if (filename == NULL)
	{
		return 0xFF;
	}

	uint8_t fileno = memfs_get_fileno();

	// If we're out of open files
	if (fileno == 0xFF)
	{
		return 0xFF;
	}

	size_t length = strlen(filename);

	// Truncate filename
	if (length > MAX_FILENAME)
	{
		length = MAX_FILENAME;
	}

	memcpy(file_buffer, filename, length);
	file_buffer[length] = 0;				// Terminate, if needed

	// Once terminated, pad length to 4 bytes
	length = align_up(length, 4);

	uint32_t table_address = FILE_TABLE_START;
	memfs_filetable last_table = { 0 };

	// Walk the file table and find the first invalid entry
	do
	{
		table_address -= sizeof(memfs_filetable);
		memfs_filetable table = { 0 };

		// Pull the next table
		if (memfs_get_table(&table, table_address) != 0)
		{
			return 0xFF;
		}

		// If it's invalid, we're done here
		if (table.mask != FILE_MASK)
		{
			break;
		}

		// Otherwise, keep track of the last valid table.
		memcpy(&last_table, &table, sizeof(memfs_filetable));
	} while (last_table.mask != FILE_MASK);

	uint32_t new_entry_addr;

	// Compute the new entry address if needed
	if (last_table.mask == FILE_MASK)
	{
		memfs_fileentry last_entry = { 0 };

		if (memfs_get_entry(&last_entry, &last_table) != 0)
		{
			return 0xFF;
		}

		new_entry_addr = last_entry.filename_len + last_entry.file_len;
	}
	else
	{
		// Otherwise, we have no entries. Start at 0.
		new_entry_addr = 0;
	}

	// Define new file table with computed address
	memfs_filetable new_table =
	{
		.mask = FILE_MASK,
		.address = new_entry_addr,
	};

	// And a dummy file with passed filename
	memfs_fileentry new_entry =
	{
		.file_len = 4,
		.filename_len = length,
	};

	// Write the new file table
	if (qspi_write((uint8_t *)&new_table, sizeof(memfs_filetable), table_address) != 0)
	{
		return 0xFF;
	}

	// Write the new file entry
	if (qspi_write((uint8_t *)&new_entry, sizeof(memfs_fileentry), new_entry_addr) != 0)
	{
		return 0xFF;
	}

	// Offset the address to the file name
	new_entry_addr += sizeof(memfs_fileentry);

	// Write truncated/padded filename
	if (qspi_write(file_buffer, length, new_entry_addr) != 0)
	{
		return 0xFF;
	}

	// Open the file
	open_files[fileno].open = 1;
	open_files[fileno].fileno = fileno;
	open_files[fileno].address = new_table.address + length + sizeof(memfs_fileentry);
	open_files[fileno].error = MEMFS_ERR_NONE;
	open_files[fileno].offset = 0;

	return fileno;
}

// Deletes a file and closes the handle. The handle can't be used after being unlinked.
// Return value:
//   0: Success, the file is deleted and the handle is closed
//  -1: Faile, no such file to unlink
int memfs_unlink(uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return -1;
	}

	// TODO: Implement me
	return 0;
}

// Erases all files on the memory chip
int memfs_erase(void)
{
	if (nrfx_qspi_erase(NRF_QSPI_ERASE_LEN_ALL, 0) != NRFX_SUCCESS)
	{
		return -1;
	}

	return 0;
}

// Reads a block of data
// Return value: The number of bytes read. Will stop reading at EOF
size_t memfs_fread(void *buffer, size_t size, size_t nitems, uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return -1;
	}

	// TODO: Implement me
	return 0;
}

// Writes a block of data
// Return value: The number of bytes written. Expect this operation to take a very
//  long time if the file size increases. Data written within the file will overwrite
//  existing data. Data written at EOF will be appended.
size_t memfs_fwrite(const void *buffer, size_t size, size_t nitems, uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return -1;
	}

	// TODO: Implement me
	return 0;
}

// Warning: Will take forever
// Uses an internal buffer with EasyDMA to defragment files and reclaim space
// between files. All files are stored contiguously.
int memfs_defrag(void)
{
	// TODO: Implement me
	return 0;
}

// This funciton will wrap positively and negatively so that the resulting absolute
//  offset is within the interval [0, size], where size is the size of the file in bytes
// Return value:
// 0:  Success, no wrapping
// 1:  Success, offset was wrapped either negativel or positively
// -1: Failure (Check ferror)
int memfs_fseek(uint8_t file, long offset, MEMFS_WHENCE whence)
{
	uint8_t wrapped = 0;

	if (file >= MAX_FILES)
	{
		return -1;
	}

	long size = memfs_fstat(file);

	if (size == -1)
	{
		open_files[file].error = MEMFS_ERR_FTS;
		return -1;
	}

	// Wrap the offset to the file size
	if (offset > size)
	{
		wrapped = 1;

		do
		{
			offset -= size;
		} while (offset > size);
	}

	// Wrap the offset negatively
	if (offset < 0)
	{
		// Twos complement negate
		long pos = (~offset) + 1;

		if (pos > size)
		{
			wrapped = 1;

			do
			{
				offset -= size;
			} while (offset > size);
		}

		// Negate again so we get the wrapped negative value
		offset = (~pos) + 1;
	}

	// Seek from start of file
	if (whence == MEMFS_WHENCE_START)
	{
		// If the passed offset is negative, wrap backwards
		if (offset < 0)
		{
			wrapped = 1;
			offset += size;
		}

		// Move to wrapped absolute offset
		open_files[file].offset = offset;
	}
	// Seek from current position
	else if (whence == MEMFS_WHENCE_CURRENT)
	{
		// Wrap the incremented offset to the file size
		if ((offset + open_files[file].offset) > size)
		{
			wrapped = 1;
			offset -= size;
		}

		// Increment current offset by wrapped offset
		open_files[file].offset += offset;
	}
	// Seek from end of file
	else if (whence == MEMFS_WHENCE_END)
	{
		if (offset < 0)
		{
			// Move backwards
			open_files[file].offset = size + offset;
		}
		else
		{
			// Wrap forwards
			wrapped = 1;
			open_files[file].offset = offset - 1;
		}
	}

	return wrapped;
}

long memfs_ftell(uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return -1;
	}

	return (long)open_files[file].offset;
}

long memfs_fstat(uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return -1;
	}

	// TODO: Implement me
	return 0;
}

// Reads the file table and computes the size of all files, then returns the number of free bytes
size_t memfs_free(void)
{
	// TODO: Implement me
	return 0;
}

MEMFS_ERROR memfs_ferror(uint8_t file)
{
	if (file >= MAX_FILES)
	{
		return MEMFS_ERR_FOR;
	}

	return (MEMFS_ERROR)open_files[file].error;
}
