/*
    robin verton, dec 2015
    implementation of the RC4 algo
*/

#include "common.h"

#define N 256   // 2^8

void swap(unsigned char *a, unsigned char *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int KSA(const char *key, unsigned char *S) {

    int len = strlen(key);
    int j = 0;

    for(int i = 0; i < N; i++)
        S[i] = i;

    for(int i = 0; i < N; i++) {
        j = (j + S[i] + key[i % len]) % N;

        swap(&S[i], &S[j]);
    }

    return 0;
}

int PRGA(unsigned char *S, unsigned char *data, size_t dataLen) {

    int i = 0;
    int j = 0;

    for(size_t n = 0; n < dataLen; n++) {
        i = (i + 1) % N;
        j = (j + S[i]) % N;

        swap(&S[i], &S[j]);
        int rnd = S[(S[i] + S[j]) % N];

        data[n] = rnd ^ data[n];

    }

    return 0;
}

int RC4(const char *key, unsigned char *data, size_t dataLen) {

    unsigned char S[N];
    KSA(key, S);

    PRGA(S, data, dataLen);

    return 0;
}

#ifdef DC801_EMBEDDED
int decryptFile(const char* key, const char* infile, const char* outfile) {
	unsigned char S[N];
	unsigned char buff[2048];
	FIL inF, outF;
	unsigned int read, write;
	int ret;

	KSA(key, S);

	if (FR_OK != f_open(&inF, infile, FA_READ | FA_OPEN_EXISTING)) {
		NRF_LOG_INFO("Can't load file %s", infile);
		ret = -1;
		goto done;
	}

	ret = f_open(&outF, outfile, FA_WRITE | FA_OPEN_ALWAYS);
	if (FR_OK != ret) {
		NRF_LOG_INFO("Can't create file %s (%d)", outfile, ret);
		ret = -2;
		goto done;
	}

	while (true) {
		if (FR_OK != f_read(&inF, buff, sizeof(buff), &read)){
			NRF_LOG_INFO("Unable to read from %s", infile);
			ret = -3;
			goto done;
		}
		if (read == 0)
			break;

		PRGA(S, buff, read);

		if (FR_OK != f_write(&outF, buff, read, &write)) {
			NRF_LOG_INFO("Unable to write to %s", outfile);
			ret = -4;
			goto done;
		}
		if (read != sizeof(buff))
			break;
	}
	ret = 0;
done:
	f_close(&inF);
	f_close(&outF);
	if (0 != ret)
		f_unlink(outfile);
	return ret;
}
#endif

#ifdef DC801_DESKTOP
int decryptFile(const char* key, const char* infile, const char* outfile) {
	unsigned char S[N];
	unsigned char buff[2048];
	FIL *inF, *outF;
	unsigned int read, write;
	int ret;

	KSA(key, S);

	if (FR_OK != f_open(&inF, infile, FA_READ | FA_OPEN_EXISTING)) {
		NRF_LOG_INFO("Can't load file %s", infile);
		ret = -1;
		goto done;
	}

	ret = f_open(&outF, outfile, FA_WRITE | FA_OPEN_ALWAYS);
	if (FR_OK != ret) {
		NRF_LOG_INFO("Can't create file %s (%d)", outfile, ret);
		ret = -2;
		goto done;
	}

	while (true) {
		if (FR_OK != f_read(inF, buff, sizeof(buff), &read)){
			NRF_LOG_INFO("Unable to read from %s", infile);
			ret = -3;
			goto done;
		}
		if (read == 0)
			break;

		PRGA(S, buff, read);

		if (FR_OK != f_write(outF, buff, read, &write)) {
			NRF_LOG_INFO("Unable to write to %s", outfile);
			ret = -4;
			goto done;
		}
		if (read != sizeof(buff))
			break;
	}
	ret = 0;
done:
	f_close(inF);
	f_close(outF);
	if (0 != ret)
		f_unlink(outfile);
	return ret;
}
#endif




