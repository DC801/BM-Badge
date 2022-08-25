#ifndef SHIM_FILESYSTEM_H
#define SHIM_FILESYSTEM_H


#include <stdint.h>

#include "sdk_shim.h"

#ifdef __cplusplus
extern "C" {
#endif

#define FIL FILE

#define FSIZE_t long int

#define UINT unsigned int

typedef enum {
	FR_OK = 0,						/* (0) Succeeded */
	FR_DISK_ERR,					/* (1) A hard error occurred in the low level disk I/O layer */
	FR_INT_ERR,						/* (2) Assertion failed */
	FR_NOT_READY,					/* (3) The physical drive cannot work */
	FR_NO_FILE,						/* (4) Could not find the file */
	FR_NO_PATH,						/* (5) Could not find the path */
	FR_INVALID_NAME,				/* (6) The path name format is invalid */
	FR_DENIED,						/* (7) Access denied due to prohibited access or directory full */
	FR_EXIST,						/* (8) Access denied due to prohibited access */
	FR_INVALID_OBJECT,				/* (9) The file/directory object is invalid */
	FR_WRITE_PROTECTED,				/* (10) The physical drive is write protected */
	FR_INVALID_DRIVE,				/* (11) The logical drive number is invalid */
	FR_NOT_ENABLED,					/* (12) The volume has no work area */
	FR_NO_FILESYSTEM,				/* (13) There is no valid FAT volume */
	FR_MKFS_ABORTED,				/* (14) The f_mkfs() aborted due to any problem */
	FR_TIMEOUT,						/* (15) Could not get a grant to access the volume within defined period */
	FR_LOCKED,						/* (16) The operation is rejected according to the file sharing policy */
	FR_NOT_ENOUGH_CORE,				/* (17) LFN working buffer could not be allocated */
	FR_TOO_MANY_OPEN_FILES,			/* (18) Number of open files > _FS_LOCK */
	FR_INVALID_PARAMETER			/* (19) Given parameter is invalid */
} FRESULT;

#define FILENAME_SIZE 256
typedef struct {
	FSIZE_t			fsize;			/* File size */
	unsigned short	fdate;			/* Modified date */
	unsigned short	ftime;			/* Modified time */
	unsigned char	fattrib;		/* File attribute */
	char			fname[FILENAME_SIZE];		/* File name */
} FILINFO;

/* File access mode and open method flags (3rd argument of f_open) */
#define	FA_READ				0x01
#define	FA_WRITE			0x02
#define	FA_OPEN_EXISTING	0x00
#define	FA_CREATE_NEW		0x04
#define	FA_CREATE_ALWAYS	0x08
#define	FA_OPEN_ALWAYS		0x10
#define	FA_OPEN_APPEND		0x30

/* Format options (2nd argument of f_mkfs) */
#define FM_FAT				0x01
#define FM_FAT32			0x02
#define FM_EXFAT			0x04
#define FM_ANY				0x07
#define FM_SFD				0x08

/* Filesystem type (FATFS.fs_type) */
#define FS_FAT12			1
#define FS_FAT16			2
#define FS_FAT32			3
#define FS_EXFAT			4

/* File attribute bits for directory entry (FILINFO.fattrib) */
#define	AM_RDO				0x01	/* Read only */
#define	AM_HID				0x02	/* Hidden */
#define	AM_SYS				0x04	/* System */
#define AM_DIR				0x10	/* Directory */
#define AM_ARC				0x20	/* Archive */

FRESULT f_open (FIL** fp, const char* path, unsigned char mode);					/* Open or create a file */
FRESULT f_close (FIL* fp);							 								/* Close an open file object */
FRESULT f_read (FIL* fp, void* buff, unsigned int btr, unsigned int* br);			/* Read data from the file */
FRESULT f_write (FIL* fp, const void* buff, unsigned int btw, unsigned int* bw);	/* Write data to the file */
FRESULT f_lseek (FIL* fp, FSIZE_t ofs);												/* Move file pointer of the file object */
FRESULT f_stat (const char* path, FILINFO* fno);									/* Get file status */
FRESULT f_unlink (const char* path);												/* Delete an existing file or directory */

FSIZE_t f_tell(FIL* fp);

struct __dirstream
{
	void* __fd;
	char* __data;
	int __entry_data;
	char* __ptr;
	int __entry_ptr;
	size_t __allocation;
	size_t __size;
	//__libc_lock_define(__lock)
};

typedef struct __dirstream DIR;

#ifndef WIN32
FRESULT f_opendir(DIR** dp, const char* path);										/* Open a directory */
FRESULT f_closedir (DIR* dp);														/* Close an open directory */
FRESULT f_readdir (DIR* dp, FILINFO* fno);											/* Read a directory item */
#endif

#ifdef __cplusplus
}
#endif

#endif
