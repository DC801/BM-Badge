#include "common.h"
#include "memfs.h"

#define MAX_FILES 64            // Ability to limit maximum files at compile time to save memory
#if MAX_FILES > 64
#error "Can't support more than 64 files in memfs"
#endif

typedef struct
{
    uint8_t     open:1;         // Bit  0      : File is open (1) or closed (0)
    uint8_t     fileno:6;       // Bit  1 to  7: Maximum open files: 64
    uint32_t    address:25;     // Bit  8 to 32: Maximum addressible range 32MB
    uint8_t     error:7;        // Bit 33 to 39: File error
    uint32_t    offset:25;      // Bit 40 to 64: Current file offset
} memfs_fileblock;

memfs_fileblock open_files[MAX_FILES];

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
    // TODO: Implement me
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

    // TODO: Implement me
    return 0;
}

// Creates a file with the supplied size, then opens it for editing in append mode.
//  This is more efficient than using fopen because the file should not need to be moved
//  unless you append more data than the supplied size.
// Return value: See fopen
uint8_t memfs_link(const char *filename, size_t size)
{
    // TODO: Implement me
    return 0xFF;
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
    // TODO: Implement me
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

MEMFS_ERROR memfs_ferror(uint8_t file)
{
    if (file >= MAX_FILES)
    {
        return MEMFS_ERR_FOR;
    }

    return (MEMFS_ERROR)open_files[file].error;
}
