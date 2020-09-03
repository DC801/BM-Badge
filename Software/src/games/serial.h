//
// DC801
//

#ifndef SERIAL_H
#define SERIAL_H

#ifdef __cplusplus
extern "C" {
#endif

void serial_Init(void);
bool serial_GotString(char *string, uint8_t len);
void serial_send_string(const char *string);
bool serial_getSolved();
void serial_openChallenge();
void serial_closeChallenge();

#ifdef __cplusplus
}
#endif

#endif
