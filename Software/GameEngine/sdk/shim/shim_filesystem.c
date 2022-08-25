#include <cstdio>

#include "shim_filesystem.h"

#ifdef __cplusplus
extern "C" {
#endif
FRESULT f_open(FIL** fp, const char* path, unsigned char mode)
{
	// Verify arguments are valid
	if (path == NULL)
	{
		fprintf(stderr, "f_open error: Invalid arguments\n");
		return FR_INVALID_PARAMETER;
	}

	const char *modes;

	// Cover only the modes in use
	if (mode == (FA_READ | FA_OPEN_EXISTING))
	{
		// Open for read in byte mode
		modes = "rb";
	}
	else if (mode == (FA_WRITE | FA_OPEN_ALWAYS))
	{
		// Open for write in byte mode
		// File is created if it does not exist
		// File is truncated to zero length and position to start of file
		modes = "wb";
	}
	else
	{
		fprintf(stderr, "f_open error: Unknown mode (%d)\n", mode);
		return FR_INVALID_PARAMETER;
	}

	// Attempt open
	FILE *retval = fopen(path, modes);

	// A valid pointer will be returned on success
	if (retval)
	{
		*fp = retval;
		return FR_OK;
	}

	// Capture errno
	int error = errno;

	// See why we failed
	switch (error)
	{
		// The fopen() function shall fail if:
		case EACCES:
			// Search permission is denied on a component of the path prefix, or the file exists and the permissions specified by mode are denied, or the file does not exist and write permission is denied for the parent directory of the file to be created.
			fprintf(stderr, "f_open error: [EACCESS]\n");
			return FR_DENIED;
		case EINTR:
			// A signal was caught during fopen().
			fprintf(stderr, "f_open error: [EINTR]\n");
			return FR_TIMEOUT;
		case EISDIR:
			// The named file is a directory and mode requires write access.
			fprintf(stderr, "f_open error: [EISDIR]\n");
			return FR_NO_FILE;
		case ELOOP:
			// A loop exists in symbolic links encountered during resolution of the path argument.
			// More than {SYMLOOP_MAX} symbolic links were encountered during resolution of the path argument.
			fprintf(stderr, "f_open error: [ELOOP]\n");
			return FR_TIMEOUT;
		case EMFILE:
			// All file descriptors available to the process are currently open.
			// {STREAM_MAX} streams are currently open in the calling process.
			// {FOPEN_MAX} streams are currently open in the calling process.
			fprintf(stderr, "f_open error: [EMFILE]\n");
			return FR_TOO_MANY_OPEN_FILES;
		case ENAMETOOLONG:
			// The length of a pathname exceeds {PATH_MAX}, or pathname resolution of a symbolic link produced an intermediate result with a length that exceeds {PATH_MAX}.
			// The length of a component of a pathname is longer than {NAME_MAX}.
			fprintf(stderr, "f_open error: [ENAMETOOLONG]\n");
			return FR_INVALID_PARAMETER;
		case ENFILE:
			// The maximum allowable number of files is currently open in the system.
			fprintf(stderr, "f_open error: [ENFILE]\n");
			return FR_TOO_MANY_OPEN_FILES;
		case ENOENT:
			// The mode string begins with 'r' and a component of pathname does not name an existing file, or mode begins with 'w' or 'a' and a component of the path prefix of pathname does not name an existing file, or pathname is an empty string.
			fprintf(stderr, "f_open error: [ENOENT]\n");
			return FR_NO_FILE;
		case ENOTDIR:
			// The pathname argument contains at least one non- <slash> character and ends with one or more trailing <slash> characters. If pathname without the trailing <slash> characters would name an existing file, an [ENOENT] error shall not occur.
			// A component of the path prefix names an existing file that is neither a directory nor a symbolic link to a directory, or the pathname argument contains at least one non- <slash> character and ends with one or more trailing <slash> characters and the last pathname component names an existing file that is neither a directory nor a symbolic link to a directory.
			fprintf(stderr, "f_open error: [ENOTDIR]\n");
			return FR_NO_PATH;
		case ENOSPC:
			// The directory or file system that would contain the new file cannot be expanded, the file does not exist, and the file was to be created.
			fprintf(stderr, "f_open error: [ENOSPC]\n");
			return FR_NOT_ENOUGH_CORE;
		case ENXIO:
			// The named file is a character special or block special file, and the device associated with this special file does not exist.
			fprintf(stderr, "f_open error: [ENXIO]\n");
			return FR_NOT_READY;
		case EOVERFLOW:
			// The named file is a regular file and the size of the file cannot be represented correctly in an object of type off_t.
			fprintf(stderr, "f_open error: [EOVERFLOW]\n");
			return FR_INVALID_OBJECT;
		case EROFS:
			// The named file resides on a read-only file system and mode requires write access.
			fprintf(stderr, "f_open error: [EROFS]\n");
			return FR_WRITE_PROTECTED;

		// The fopen() function may fail if:
		case EINVAL:
			// The value of the mode argument is not valid.
			fprintf(stderr, "f_open error: [EINVAL]\n");
			return FR_INVALID_PARAMETER;
		case ENOMEM:
			// Insufficient storage space is available.
			fprintf(stderr, "f_open error: [ENOMEM]\n");
			return FR_NOT_ENOUGH_CORE;
		case ETXTBSY:
			// The file is a pure procedure (shared text) file that is being executed and mode requires write access.
			fprintf(stderr, "f_open error: [ETXBSY]\n");
			return FR_DENIED;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_open error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FRESULT f_close (FIL* fp)
{
	// Verify argument is valid
	if (fp == NULL)
	{
		fprintf(stderr, "f_close error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// Attempt close
	int retval = fclose(fp);

	// Returns 0 upon success
	if (retval == 0)
	{
		return FR_OK;
	}

	// Capture errno
	int error = errno;

	// See why we failed
	switch (error)
	{
		// The fclose() function shall fail if:
		case EAGAIN:
			// The O_NONBLOCK flag is set for the file descriptor underlying stream and the thread would be delayed in the write operation.
			fprintf(stderr, "f_close error: [EAGAIN]\n");
			return FR_TIMEOUT;
		case EBADF:
			// The file descriptor underlying stream is not valid.
			fprintf(stderr, "f_close error: [EBADF]\n");
			return FR_NO_FILE;
		case EFBIG:
			// An attempt was made to write a file that exceeds the maximum file size.
			// An attempt was made to write a file that exceeds the file size limit of the process.
			// The file is a regular file and an attempt was made to write at or beyond the offset maximum associated with the corresponding stream.
			fprintf(stderr, "f_close error: [EFBIG]\n");
			return FR_INVALID_PARAMETER;
		case EINTR:
			// The fclose() function was interrupted by a signal.
			fprintf(stderr, "f_close error: [EINTR]\n");
			return FR_DISK_ERR;
		case EIO:
			// The process is a member of a background process group attempting to write to its controlling terminal, TOSTOP is set, the calling thread is not blocking SIGTTOU, the process is not ignoring SIGTTOU, and the process group of the process is orphaned. This error may also be returned under implementation-defined conditions.
			fprintf(stderr, "f_close error: [EIO]\n");
			return FR_DISK_ERR;
		case ENOMEM:
			// The underlying stream was created by open_memstream() or open_wmemstream() and insufficient memory is available.
			fprintf(stderr, "f_close error: [ENOMEM]\n");
			return FR_NOT_ENOUGH_CORE;
		case ENOSPC:
			// There was no free space remaining on the device containing the file or in the buffer used by the fmemopen() function.
			fprintf(stderr, "f_close error: [ENOSPC]\n");
			return FR_NOT_ENABLED;
		case EPIPE:
			// An attempt is made to write to a pipe or FIFO that is not open for reading by any process. A SIGPIPE signal shall also be sent to the thread.
			fprintf(stderr, "f_close error: [EPIPE]\n");
			return FR_DENIED;

		// The fclose() function may fail if:
		case ENXIO:
			// A request was made of a nonexistent device, or the request was outside the capabilities of the device.
			fprintf(stderr, "f_close error: [ENXIO]\n");
			return FR_NOT_READY;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_close error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FRESULT f_read (FIL* fp, void* buff, unsigned int btr, unsigned int* br)
{
	// Verify arguments are valid
	if ((fp == NULL) || (buff == NULL) || (br == NULL))
	{
		fprintf(stderr, "f_read error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// Attempt read
	size_t retval = fread(buff, sizeof(uint8_t), (size_t)btr, fp);

	// Set number of bytes read
	*br = (unsigned int)retval;

	// Capture errno
	int error = errno;

	// We have to check errno, since failure will not necessarily
	//  be indicated by return value
	if (error == 0)
	{
		return FR_OK;
	}

	// See why we failed
	switch (error)
	{
		// The fread() function shall fail if data needs to be read and:
		case EAGAIN:
			// The O_NONBLOCK flag is set for the file descriptor underlying stream and the thread would be delayed in the fread() operation.
			//fprintf(stderr, "f_read warning: [EAGAIN]\n");
			return FR_OK;
		case EBADF:
			// The file descriptor underlying stream is not a valid file descriptor open for reading.
			fprintf(stderr, "f_read error: [EBADF]\n");
			return FR_NO_FILE;
		case EINTR:
			// The read operation was terminated due to the receipt of a signal, and no data was transferred.
			fprintf(stderr, "f_read error: [EINTR]\n");
			return FR_DISK_ERR;
		case EIO:
			// A physical I/O error has occurred, or the process is in a background process group attempting to read from its controlling terminal, and either the calling thread is blocking SIGTTIN or the process is ignoring SIGTTIN or the process group of the process is orphaned. This error may also be generated for implementation-defined reasons.
			fprintf(stderr, "f_read error: [EIO]\n");
			return FR_DISK_ERR;
		case EOVERFLOW:
			// The file is a regular file and an attempt was made to read at or beyond the offset maximum associated with the corresponding stream.
			fprintf(stderr, "f_read error: [EOVERFLOW]\n");
			return FR_INVALID_PARAMETER;

		// The fread() function may fail if:
		case ENOMEM:
			// Insufficient storage space is available.
			fprintf(stderr, "f_read error: [ENOMEM]\n");
			return FR_NOT_ENOUGH_CORE;
		case ENXIO:
			// A request was made of a nonexistent device, or the request was outside the capabilities of the device.
			fprintf(stderr, "f_read error: [ENXIO]\n");
			return FR_NOT_READY;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_read error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FRESULT f_write (FIL* fp, const void* buff, unsigned int btw, unsigned int* bw)
{
	// Verify arguments are valid
	if ((fp == NULL) || (buff == NULL) || (bw == NULL))
	{
		fprintf(stderr, "f_write error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// Attempt write
	size_t retval = fwrite(buff, sizeof(uint8_t), (size_t)btw, fp);

	// Set number of bytes written
	*bw = (unsigned int)retval;

	// Capture errno
	int error = errno;

	// We have to check errno, since failure will not necessarily
	//  be indicated by return value
	if (error == 0)
	{
		return FR_OK;
	}

	// See why we failed
	switch (error)
	{
		// The fwrite() function shall fail if either the stream is unbuffered or the stream's buffer needs to be flushed, and:
		case EAGAIN:
			// The O_NONBLOCK flag is set for the file descriptor underlying stream and the thread would be delayed in the write operation.
			fprintf(stderr, "f_write error: [EAGAIN]\n");
			return FR_TIMEOUT;
		case EBADF:
			// The file descriptor underlying stream is not a valid file descriptor open for writing.
			fprintf(stderr, "f_write error: [EBADF]\n");
			return FR_NO_FILE;
		case EFBIG:
			// An attempt was made to write to a file that exceeds the maximum file size.
			// An attempt was made to write to a file that exceeds the file size limit of the process.
			// The file is a regular file and an attempt was made to write at or beyond the offset maximum.
			fprintf(stderr, "f_write error: [EFBIG]\n");
			return FR_INVALID_PARAMETER;
		case EINTR:
			// The write operation was terminated due to the receipt of a signal, and no data was transferred.
			fprintf(stderr, "f_write error: [EINTR]\n");
			return FR_DISK_ERR;
		case EIO:
			// A physical I/O error has occurred, or the process is a member of a background process group attempting to write to its controlling terminal, TOSTOP is set, the calling thread is not blocking SIGTTOU, the process is not ignoring SIGTTOU, and the process group of the process is orphaned. This error may also be returned under implementation-defined conditions.
			fprintf(stderr, "f_write error: [EIO]\n");
			return FR_DISK_ERR;
		case ENOSPC:
			// There was no free space remaining on the device containing the file.
			fprintf(stderr, "f_write error: [ENOSPC]\n");
			return FR_NOT_ENABLED;
		case EPIPE:
			// An attempt is made to write to a pipe or FIFO that is not open for reading by any process. A SIGPIPE signal shall also be sent to the thread.
			fprintf(stderr, "f_write error: [EPIPE]\n");
			return FR_DENIED;

		// The fwrite() function may fail if:
		case ENOMEM:
			// Insufficient storage space is available.
			fprintf(stderr, "f_write error: [ENOMEM]\n");
			return FR_NOT_ENOUGH_CORE;
		case ENXIO:
			// A request was made of a nonexistent device, or the request was outside the capabilities of the device.
			fprintf(stderr, "f_write error: [ENXIO]\n");
			return FR_NOT_READY;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_write error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FRESULT f_lseek (FIL* fp, FSIZE_t ofs)
{
	// Verify arguments are valid
	if (fp == NULL)
	{
		fprintf(stderr, "f_lseek error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// Attempt seek
	off_t retval;

retry:
	retval = fseek(fp, (long)ofs, SEEK_SET);

	// Return value is >= 0 upon success
	if (retval >= 0)
	{
		return FR_OK;
	}

	// Capture errno
	int error = errno;

	if (error == EAGAIN)
	{
		// The O_NONBLOCK flag is set for the file descriptor and the thread would be delayed in the write operation.
		fprintf(stderr, "f_lseek warning: [EAGAIN]\n");
		goto retry;
	}

	if (error == EINTR)
	{
		// The write operation was terminated due to the receipt of a signal, and no data was transferred.
		fprintf(stderr, "f_lseek warning: [EINTR]\n");
		goto retry;
	}

	// See why we failed
	switch (error)
	{
		// The fseek() functions shall fail if, either the stream is unbuffered or the stream's buffer needed to be flushed, and the call to fseek() causes an underlying lseek() or write() to be invoked, or:
		case EBADF:
			// The file descriptor underlying the stream file is not open for writing or the stream's buffer needed to be flushed and the file is not open.
			fprintf(stderr, "f_lseek error: [EBADF]\n");
			return FR_NO_FILE;
		case EFBIG:
			// An attempt was made to write a file that exceeds the maximum file size.
			// An attempt was made to write a file that exceeds the file size limit of the process.
			// The file is a regular file and an attempt was made to write at or beyond the offset maximum associated with the corresponding stream.
			fprintf(stderr, "f_lseek error: [EFBIG]\n");
			return FR_INVALID_PARAMETER;
		case EINVAL:
			// The whence argument is invalid. The resulting file-position indicator would be set to a negative value.
			fprintf(stderr, "f_lseek error: [EINVAL]\n");
			return FR_INVALID_PARAMETER;
		case EIO:
			// A physical I/O error has occurred, or the process is a member of a background process group attempting to perform a write() to its controlling terminal, TOSTOP is set, the calling thread is not blocking SIGTTOU, the process is not ignoring SIGTTOU, and the process group of the process is orphaned. This error may also be returned under implementation-defined conditions.
			fprintf(stderr, "f_lseek error: [EIO]\n");
			return FR_DISK_ERR;
		case ENOSPC:
			// There was no free space remaining on the device containing the file.
			fprintf(stderr, "f_lseek error: [ENOSPC]\n");
			return FR_NOT_ENABLED;
		case EOVERFLOW:
			// For fseek(), the resulting file offset would be a value which cannot be represented correctly in an object of type long.
			fprintf(stderr, "f_lseek error: [EOVERFLOW]\n");
			return FR_INVALID_OBJECT;
		case EPIPE:
			// An attempt was made to write to a pipe or FIFO that is not open for reading by any process; a SIGPIPE signal shall also be sent to the thread.
			fprintf(stderr, "f_lseek error: [EPIPE]\n");
			return FR_DENIED;
		case ESPIPE:
			// The file descriptor underlying stream is associated with a pipe, FIFO, or socket.
			fprintf(stderr, "f_lseek error: [ESPIPE]\n");
			return FR_DENIED;

		// The fseek() function may fail if:
		case ENXIO:
			// A request was made of a nonexistent device, or the request was outside the capabilities of the device.
			fprintf(stderr, "f_lseek error: [ENXIO]\n");
			return FR_NOT_READY;


		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_lseek error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FRESULT f_stat (const char* path, FILINFO* fno)
{
	// Verify arguments are valid
	if (path == NULL)
	{
		fprintf(stderr, "f_stat error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// The fatfs library either does not need to, or implicitly
	//  opens the file prior to running stat. So let's open the file
	FILE *fp = fopen(path, "r");

	// Pointer will be non-null on success
	if (fp == NULL)
	{
		// Capture errno
		int error = errno;

		// See why we failed
		switch (error)
		{
			// The fopen() function shall fail if:
			case EACCES:
				// Search permission is denied on a component of the path prefix, or the file exists and the permissions specified by mode are denied, or the file does not exist and write permission is denied for the parent directory of the file to be created.
				fprintf(stderr, "f_stat (fopen) error: [EACCESS]\n");
				break;
			case EINTR:
				// A signal was caught during fopen().
				fprintf(stderr, "f_stat (fopen) error: [EINTR]\n");
				break;
			case EISDIR:
				// The named file is a directory and mode requires write access.
				fprintf(stderr, "f_stat (fopen) error: [EISDIR]\n");
				break;
			case ELOOP:
				// A loop exists in symbolic links encountered during resolution of the path argument.
				// More than {SYMLOOP_MAX} symbolic links were encountered during resolution of the path argument.
				fprintf(stderr, "f_stat (fopen) error: [ELOOP]\n");
				break;
			case EMFILE:
				// All file descriptors available to the process are currently open.
				// {STREAM_MAX} streams are currently open in the calling process.
				// {FOPEN_MAX} streams are currently open in the calling process.
				fprintf(stderr, "f_stat (fopen) error: [EMFILE]\n");
				break;
			case ENAMETOOLONG:
				// The length of a pathname exceeds {PATH_MAX}, or pathname resolution of a symbolic link produced an intermediate result with a length that exceeds {PATH_MAX}.
				// The length of a component of a pathname is longer than {NAME_MAX}.
				fprintf(stderr, "f_stat (fopen) error: [ENAMETOOLONG]\n");
				break;
			case ENFILE:
				// The maximum allowable number of files is currently open in the system.
				fprintf(stderr, "f_stat (fopen) error: [ENFILE]\n");
				break;
			case ENOENT:
				// The mode string begins with 'r' and a component of pathname does not name an existing file, or mode begins with 'w' or 'a' and a component of the path prefix of pathname does not name an existing file, or pathname is an empty string.
				fprintf(stderr, "f_stat (fopen) error: [ENOENT]\n");
				break;
			case ENOTDIR:
				// The pathname argument contains at least one non- <slash> character and ends with one or more trailing <slash> characters. If pathname without the trailing <slash> characters would name an existing file, an [ENOENT] error shall not occur.
				// A component of the path prefix names an existing file that is neither a directory nor a symbolic link to a directory, or the pathname argument contains at least one non- <slash> character and ends with one or more trailing <slash> characters and the last pathname component names an existing file that is neither a directory nor a symbolic link to a directory.
				fprintf(stderr, "f_stat (fopen) error: [ENOTDIR]\n");
				break;
			case ENOSPC:
				// The directory or file system that would contain the new file cannot be expanded, the file does not exist, and the file was to be created.
				fprintf(stderr, "f_stat (fopen) error: [ENOSPC]\n");
				break;
			case ENXIO:
				// The named file is a character special or block special file, and the device associated with this special file does not exist.
				fprintf(stderr, "f_stat (fopen) error: [ENXIO]\n");
				break;
			case EOVERFLOW:
				// The named file is a regular file and the size of the file cannot be represented correctly in an object of type off_t.
				fprintf(stderr, "f_stat (fopen) error: [EOVERFLOW]\n");
				break;
			case EROFS:
				// The named file resides on a read-only file system and mode requires write access.
				fprintf(stderr, "f_stat (fopen) error: [EROFS]\n");
				break;

			// The fopen() function may fail if:
			case EINVAL:
				// The value of the mode argument is not valid.
				fprintf(stderr, "f_stat (fopen) error: [EINVAL]\n");
				break;
			case ENOMEM:
				// Insufficient storage space is available.
				fprintf(stderr, "f_stat (fopen) error: [ENOMEM]\n");
				break;
			case ETXTBSY:
				// The file is a pure procedure (shared text) file that is being executed and mode requires write access.
				fprintf(stderr, "f_stat (fopen) error: [ETXBSY]\n");
				break;

			default:
				// Unknown failure (catch all)
				fprintf(stderr, "f_stat (fopen) error: [UNKNOWN] (%d)\n", error);
				break;
		}

		fprintf(stderr, "f_stat (fopen) error: Unable to open file: %s\n", path);
		return FR_NO_FILE;
	}

	// We have an open file, now it's time to attempt fstat
	struct stat buffer;
	int retval = fstat(_fileno(fp), &buffer);

	// Returns 0 upon success
	if (retval == 0)
	{
		// Now we need to close the file
		int close = fclose(fp);

		// Returns 0 upon success
		if (close != 0)
		{
			// Capture errno
			int error = errno;

			// See why we failed
			switch (error)
			{
				// The fclose() function shall fail if:
				case EAGAIN:
					// The O_NONBLOCK flag is set for the file descriptor underlying stream and the thread would be delayed in the write operation.
					fprintf(stderr, "f_stat (fclose) error: [EAGAIN]\n");
					return FR_TIMEOUT;
				case EBADF:
					// The file descriptor underlying stream is not valid.
					fprintf(stderr, "f_stat (fclose) error: [EBADF]\n");
					return FR_NO_FILE;
				case EFBIG:
					// An attempt was made to write a file that exceeds the maximum file size.
					// An attempt was made to write a file that exceeds the file size limit of the process.
					// The file is a regular file and an attempt was made to write at or beyond the offset maximum associated with the corresponding stream.
					fprintf(stderr, "f_stat (fclose) error: [EFBIG]\n");
					return FR_INVALID_PARAMETER;
				case EINTR:
					// The fclose() function was interrupted by a signal.
					fprintf(stderr, "f_stat (fclose) error: [EINTR]\n");
					return FR_DISK_ERR;
				case EIO:
					// The process is a member of a background process group attempting to write to its controlling terminal, TOSTOP is set, the calling thread is not blocking SIGTTOU, the process is not ignoring SIGTTOU, and the process group of the process is orphaned. This error may also be returned under implementation-defined conditions.
					fprintf(stderr, "f_stat (fclose) error: [EIO]\n");
					return FR_DISK_ERR;
				case ENOMEM:
					// The underlying stream was created by open_memstream() or open_wmemstream() and insufficient memory is available.
					fprintf(stderr, "f_stat (fclose) error: [ENOMEM]\n");
					return FR_NOT_ENOUGH_CORE;
				case ENOSPC:
					// There was no free space remaining on the device containing the file or in the buffer used by the fmemopen() function.
					fprintf(stderr, "f_stat (fclose) error: [ENOSPC]\n");
					return FR_NOT_ENABLED;
				case EPIPE:
					// An attempt is made to write to a pipe or FIFO that is not open for reading by any process. A SIGPIPE signal shall also be sent to the thread.
					fprintf(stderr, "f_stat (fclose) error: [EPIPE]\n");
					return FR_DENIED;

				// The fclose() function may fail if:
				case ENXIO:
					// A request was made of a nonexistent device, or the request was outside the capabilities of the device.
					fprintf(stderr, "f_stat (fclose) error: [ENXIO]\n");
					return FR_NOT_READY;

				default:
					// Unknown failure (catch all)
					fprintf(stderr, "f_stat (fclose) error: [UNKNWON] (%d)\n", error);
					return FR_TIMEOUT;
			}
		}

		// If we care about file info
		if (fno != NULL)
		{
			// Map struct stat to struct FILINFO

			/* typedef struct {
				FSIZE_t			fsize;			// File size
				unsigned short	fdate;			// Modified date
				unsigned short	ftime;			// Modified time
				unsigned char	fattrib;		// File attribute
				char			fname[FILENAME_SIZE];		// File name
			} FILINFO; */

			/*struct stat {
				dev_t st_dev;					// ID of device containing the file.
				ino_t st_ino;					// Serial number for the file.
				mode_t st_mode;					// Access mode and file type for the file
				nlink_t st_nlink;				// Number of links to the file.
				uid_t st_uid;					// User ID of file owner.
				gid_t st_gid;					// Group ID of group owner.
				dev_t st_rdev;					// Device ID (if the file is a character or block special device).
				off_t st_size;					// File size in bytes (if the file is a regular file).
				time_t st_atime;				// Time of last access.
				time_t st_mtime;				// Time of last data modification.
				time_t st_ctime;				// Time of last file status change.
				blksize_t st_blksize;			// A file system-specific preferred I/O block size for this object. On some file system types, this may vary from file to file.
				blkcnt_t st_blocks;				// Number of blocks allocated for this file.
				mode_t st_attr;					// The DOS-style attributes for this file.
			};*/

			// File size
			fno->fsize = (FSIZE_t)buffer.st_size;
			// File date unused
			fno->fdate = 0;
			// File time unused
			fno->ftime = 0;
			// File attributes unused
			fno->fattrib = 0;
			// File name unused
			fno->fname[0] = 0;
		}

		return FR_OK;
	}

	// Capture errno
	int error = errno;

	// See why we failed
	switch (error)
	{
		// The fstat() function shall fail if:
		case EBADF:
			// The fildes argument is not a valid file descriptor.
			fprintf(stderr, "f_stat error: [EBADF]\n");
			return FR_NO_FILE;
		case EIO:
			// An I/O error occurred while reading from the file system.
			fprintf(stderr, "f_stat error: [EIO]\n");
			return FR_DISK_ERR;
		case EOVERFLOW:
			// The file size in bytes or the number of blocks allocated to the file or the file serial number cannot be represented correctly in the structure pointed to by buf.
			// One of the values is too large to store into the structure pointed to by the buf argument.
			fprintf(stderr, "f_stat error: [EOVERFLOW]\n");
			return FR_INVALID_OBJECT;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_stat error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FRESULT f_unlink (const char* path)
{
	// Verify argument is valid
	if (path != NULL)
	{
		fprintf(stderr, "f_unlink error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// Attempt unlink
	int retval = _unlink(path);

	// Return value 0 means success
	if (retval == 0)
	{
		return FR_OK;
	}

	// Capture errno
	int error = errno;

	// See why we failed
	switch (error)
	{
		// The unlink() function shall fail and shall not unlink the file if:
		case EACCES:
			// Search permission is denied for a component of the path prefix, or write permission is denied on the directory containing the directory entry to be removed.
			// The S_ISVTX flag is set on the directory containing the file referred to by the path argument and the caller is not the file owner, nor is the caller the directory owner, nor does the caller have appropriate privileges.
			fprintf(stderr, "f_unlink error: [EACCESS]\n");
			return FR_DENIED;
		case EBUSY:
			// The file named by the path argument cannot be unlinked because it is being used by the system or another process and the implementation considers this an error.
			// The file named by path is a named STREAM.
			fprintf(stderr, "f_unlink error: [EBUSY]\n");
			return FR_DENIED;
		case ELOOP:
			// A loop exists in symbolic links encountered during resolution of the path argument.
			// More than {SYMLOOP_MAX} symbolic links were encountered during resolution of the path argument.
			fprintf(stderr, "f_unlink error: [ELOOP]\n");
			return FR_INVALID_OBJECT;
		case ENAMETOOLONG:
			// The length of the path argument exceeds {PATH_MAX} or a pathname component is longer than {NAME_MAX}.
			// As a result of encountering a symbolic link in resolution of the path argument, the length of the substituted pathname string exceeded {PATH_MAX}.
			fprintf(stderr, "f_unlink error: [ENAMETOOLONG]\n");
			return FR_INVALID_NAME;
		case ENOENT:
			// A component of path does not name an existing file or path is an empty string.
			fprintf(stderr, "f_unlink error: [ENOENT]\n");
			return FR_NO_PATH;
		case ENOTDIR:
			// A component of the path prefix is not a directory.
			fprintf(stderr, "f_unlink error: [ENOTDIR]\n");
			return FR_INVALID_OBJECT;
		case EPERM:
			// The file named by path is a directory, and either the calling process does not have appropriate privileges, or the implementation prohibits using unlink() on directories.
			fprintf(stderr, "f_unlink error: [EPERM]\n");
			return FR_DENIED;
		case EROFS:
			// The directory entry to be unlinked is part of a read-only file system.
			fprintf(stderr, "f_unlink error: [EROFS]\n");
			return FR_DENIED;


		// The unlink() function may fail and not unlink the file if:
		case ETXTBSY:
			// The entry to be unlinked is the last directory entry to a pure procedure (shared text) file that is being executed.
			fprintf(stderr, "f_unlink error: [EXTBSY]\n");
			return FR_DENIED;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_unlink error: [UNKNWON] (%d)\n", error);
			return FR_TIMEOUT;
	}
}

FSIZE_t f_tell(FIL* fp)
{
	// Verify argument is valid
	if (fp == NULL)
	{
		fprintf(stderr, "f_tell error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

	// Attempt ftell
	long len = ftell(fp);

	// Length >= 0 means success
	if (len >= 0)
	{
		return (FSIZE_t)len;
	}

	// Capture errno
	int error = errno;

	// See why we failed. Note, there's not much we can do here
	//  since the application doesn't do any error checking on
	//  this function. Best we can do is let someone know.
	switch (error)
	{
		// The ftell function shall fail if:

		case EBADF:
			// The file descriptor underlying stream is not an open file descriptor.
			fprintf(stderr, "f_tell error: [EBADF]\n");
			return 0;
		case EOVERFLOW:
			// For ftell(), the current file offset cannot be represented correctly in an object of type long.
			fprintf(stderr, "f_tell error: [EOVERFLOW]\n");
			return 0;
		case ESPIPE:
			// The file descriptor underlying stream is associated with a pipe, FIFO, or socket.
			fprintf(stderr, "f_tell error: [ESPIPE]\n");
			return 0;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_tell error: [UNKNWON] (%d)\n", error);
			return 0;
	}
}


FRESULT f_opendir(DIR** dp, const char* path)
{
	// Verify arguments aren't null
	if (path == NULL)
	{
		fprintf(stderr, "f_opendir error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}
#ifdef WIN32
	return FR_OK;
#else
	// Attempt opendir
	DIR *retval = opendir(path);

	// Valid pointer means success
	if (retval)
	{
		*dp = retval;
		return FR_OK;
	}

	// Capture errno
	int error = errno;

	// See why we failed
	switch (error)
	{
		// The opendir() function shall fail if:
		case EACCES:
			// Search permission is denied for the component of the path prefix of dirname or read permission is denied for dirname.
			fprintf(stderr, "f_opendir error: [EACCESS]\n");
			return FR_DENIED;
		case ELOOP:
			// A loop exists in symbolic links encountered during resolution of the dirname argument.
			// More than {SYMLOOP_MAX} symbolic links were encountered during resolution of the dirname argument.
			fprintf(stderr, "f_opendir error: [ELOOP]\n");
			return FR_INVALID_NAME;
		case ENAMETOOLONG:
			// The length of the dirname argument exceeds {PATH_MAX} or a pathname component is longer than {NAME_MAX}.
			// As a result of encountering a symbolic link in resolution of the dirname argument, the length of the substituted pathname string exceeded {PATH_MAX}.
			fprintf(stderr, "f_opendir error: [ENAMETOOLONG]\n");
			return FR_INVALID_NAME;
		case ENOENT:
			// A component of dirname does not name an existing directory or dirname is an empty string.
			fprintf(stderr, "f_opendir error: [ENOENT]\n");
			return FR_NO_FILE;
		case ENOTDIR:
			// A component of dirname is not a directory.
			fprintf(stderr, "f_opendir error: [ENOTDIR]\n");
			return FR_NO_PATH;

		// The opendir() function may fail if:
		case EMFILE:
			// {OPEN_MAX} file descriptors are currently open in the calling process.
			fprintf(stderr, "f_opendir error: [EMFILE]\n");
			return FR_DENIED;
		case ENFILE:
			// Too many files are currently open in the system.
			fprintf(stderr, "f_opendir error: [ENFILE]\n");
			return FR_TOO_MANY_OPEN_FILES;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_opendir error: [UNKNOWN] (%d)\n", error);
			return FR_TIMEOUT;
	}
#endif
}

FRESULT f_closedir (DIR* dp)
{
	// Verify argument isn't null
	if (dp == NULL)
	{
		fprintf(stderr, "f_closedir error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}
#ifdef WIN32
	return FR_OK;
#else
	int retval;

	// Try closedir
retry:
	retval = closedir(dp);

	// Return value 0 means success
	if (retval == 0)
	{
		return FR_OK;
	}

	// Captrue errno
	int error = errno;

	// If the system call was interrupted, retry
	if (error == EINTR)
	{
		// The closedir() function was interrupted by a signal.
		fprintf(stderr, "f_closedir warning: [EINTR]\n");
		goto retry;
	}

	// See why we failed
	switch (error)
	{
		// The closedir() function may fail if:

		case EBADF:
			// The dirp argument does not refer to an open directory stream.
			fprintf(stderr, "f_closedir error: [EBADF]\n");
			return FR_NO_PATH;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_closedir error: [UNKNOWN] (%d)\n", error);
			return FR_TIMEOUT;
	}
#endif
}

FRESULT f_readdir (DIR* dp, FILINFO* fno)
{
	// Verify arguments aren't null
	if ((dp == NULL) || (fno == NULL))
	{
		fprintf(stderr, "f_readdir error: Invalid argument\n");
		return FR_INVALID_PARAMETER;
	}

#ifndef WIN32
	// Attempt readdir
	struct dirent *entry = readdir(dp);

	// Valid pointer means success
	if (entry)
	{
		// Map struct dirent to FILINFO

		/* typedef struct {
			FSIZE_t			fsize;			// File size
			unsigned short	fdate;			// Modified date
			unsigned short	ftime;			// Modified time
			unsigned char	fattrib;		// File attribute
			char			fname[FILENAME_SIZE];		// File name
		} FILINFO; */

		/*struct dirent {
			ino_t			d_ino;			// inode number
			off_t			d_off;			// offset to the next dirent
			unsigned short	d_reclen;		// length of this record
			unsigned char	d_type;			// type of file; not supported
											//   by all file system types
			char			d_name[256];	// filename
		};*/

		// File size is unused
		fno->fsize = 0;
		// File date is unused
		fno->fdate = 0;
		// File time is unused
		fno->ftime = 0;

		// File attributes (We only care about directories)
		if (entry->d_type & DT _DIR)
		{
			fno->fattrib |= AM_DIR;
		}

		// File name
		memcpy(fno->fname, entry->d_name, FILENAME_SIZE - 1);
		fno->fname[FILENAME_SIZE - 1] = 0;
		return FR_OK;
	}

	// Capture errno
	int error = errno;

	// See why we failed
	switch (error)
	{
		// These functions shall fail if:
		case EOVERFLOW:
			// One of the values in the structure to be returned cannot be represented correctly.
			fprintf(stderr, "f_readdir error: [EOVERFLOW]\n");
			return FR_INVALID_OBJECT;

		// These functions may fail if:

		case EBADF:
			// The dirp argument does not refer to an open directory stream.
			fprintf(stderr, "f_readdir error: [EBADF]\n");
			return FR_NO_PATH;
		case ENOENT:
			// The current position of the directory stream is invalid.
			fprintf(stderr, "f_readdir error: [ENOENT]\n");
			return FR_NO_FILE;

		default:
			// Unknown failure (catch all)
			fprintf(stderr, "f_readdir error: [UNKNOWN] (%d)\n", error);
			return FR_TIMEOUT;
	}
#else
	return FR_OK;
#endif
}

bool util_sd_init(void)
{
	return true;
}

#ifdef __cplusplus
}
#endif


