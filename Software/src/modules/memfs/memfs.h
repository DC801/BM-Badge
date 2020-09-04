#ifndef MODULE_MEMFS_H
#define MODULE_MEMFS_H

#include <stdint.h>

typedef enum
{
    MEMFS_WHENCE_START,
    MEMFS_WHENCE_CURRENT,
    MEMFS_WHENCE_END
} MEMFS_WHENCE;

typedef enum
{
    MEMFS_ERR_NONE = 0x00,
    MEMFS_ERR_OOF  = 0x01,          // Out of files: Reached the max number of open files
    MEMFS_ERR_FOR  = 0x02,          // File number out of range. Must be < MAX_FILES
    MEMFS_ERR_FTS  = 0x03,          // Failed to seek, unable to read file size
    MEMFS_MAXIMUM_VALUE
} MEMFS_ERROR;

#if MEMFS_MAXIMUM_VALUE >= 0x7F
#error "Maximum number of memfs errors reached"
#endif

// File open/close
uint8_t memfs_fopen(const char *filename);
int     memfs_fclose(uint8_t file);

// File create/delete
uint8_t memfs_link(const char *filename, size_t size);
int     memfs_unlink(uint8_t file);
int     memfs_erase(void);

// File read/write

// Size:   object size in bytes (sizeof(uint32_t))
// Nitems: number of objects to read/write
size_t memfs_fread(void *buffer, size_t size, size_t nitems, uint8_t file);
size_t memfs_fwrite(const void *buffer, size_t size, size_t nitems, uint8_t file);
int    memfs_defrag(void);

// File information

// Offset: Negative values seek backwards
// Whence: Where to seek from. Start, current offset, or end
int    memfs_fseek(uint8_t file, long offset, MEMFS_WHENCE whence);
long   memfs_ftell(uint8_t file);
long   memfs_fstat(uint8_t file);
size_t memfs_free(void);

// File errors
MEMFS_ERROR memfs_ferror(uint8_t file);

#endif
