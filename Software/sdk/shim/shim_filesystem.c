#include "sdk_shim.h"

// TODO: Implement this shit

FRESULT f_open (FIL* fp, const char* path, unsigned char mode)
{
	UNUSED_PARAMETER(fp);
    UNUSED_PARAMETER(path);
    UNUSED_PARAMETER(mode);

    return FR_OK;
}

FRESULT f_close (FIL* fp)
{
	UNUSED_PARAMETER(fp);

    return FR_OK;
}

FRESULT f_read (FIL* fp, void* buff, unsigned int btr, unsigned int* br)
{
	UNUSED_PARAMETER(fp);
    UNUSED_PARAMETER(buff);
    
    *br = btr;

    return FR_OK;
}

FRESULT f_write (FIL* fp, const void* buff, unsigned int btw, unsigned int* bw)
{
	UNUSED_PARAMETER(fp);
    UNUSED_PARAMETER(buff);
    UNUSED_PARAMETER(btw);
    UNUSED_PARAMETER(bw);

    return FR_OK;
}

FRESULT f_lseek (FIL* fp, FSIZE_t ofs)
{
	UNUSED_PARAMETER(fp);
    UNUSED_PARAMETER(ofs);

    return FR_OK;
}

FRESULT f_stat (const char* path, FILINFO* fno)
{
	UNUSED_PARAMETER(path);
    UNUSED_PARAMETER(fno);

    return FR_OK;
}

FRESULT f_unlink (const char* path)
{
	UNUSED_PARAMETER(path);

    return FR_OK;
}

FSIZE_t f_tell(FIL* fp)
{
    UNUSED_PARAMETER(fp);

	return 0;
}

FRESULT f_opendir (DIR* dp, const char* path)
{
	
}

FRESULT f_closedir (DIR* dp)
{
	UNUSED_PARAMETER(dp);

    return FR_OK;
}

FRESULT f_readdir (DIR* dp, FILINFO* fno)
{
	UNUSED_PARAMETER(dp);
    UNUSED_PARAMETER(fno);

    return FR_OK;
}

bool util_sd_init(void)
{
    return true;
}