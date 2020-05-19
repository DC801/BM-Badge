//
// DC801
//

void serial_Init(void);
bool serial_GotString(char *string, uint8_t len);
void serial_send_string(const char *string);
bool serial_getSolved();
void serial_openChallenge();
void serial_closeChallenge();
