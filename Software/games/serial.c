//
// DC801
//

#include "../common.h"
#include <games/serial.h>

#define ESCAPE "\x1b"
#define ANSI_CSI ESCAPE"["
#define CLEARSCREEN ESCAPE"[2J"

#define SERIAL_TIMEOUT  5000
#define MAX_SERIAL_LEN  64

bool solved = false;
bool chal_opened = false;

bool serial_GotString(char *string, uint8_t len){

	int newArray = 0;
    for(int i = 0 ; i < strlen(string); i++){
    	if(string[i] != '\b' && string[i] != 0x7F && string[i] != 0x0D){ //0x7F = DEL key  0x0D = Carriage Return
            newArray += 1;
    	}
    }

    char clean_string[newArray + 1];
    int x = 0;
    for(int i = 0; x <= newArray; i++){
    	if(string[i] != '\b' && string[i] != 0x0D){ //0x7F = DEL key
    		if (string[i] == 0x7F){
    			x -=1 ;
				clean_string[x] = toupper(string[i]);
    		} else {
				clean_string[x] = toupper(string[i]);
				x += 1;
    		}
    	}
    }

    clean_string[x + 1] = '\0';

    printf("Got UART string: '%s'\n", clean_string);
    if (chal_opened){
		if ((strncmp("OPEN", clean_string, strlen(string)) == 0) && strlen(string) != 0) {
			printf("Triggered OPEN\n");
			serial_send_string(CLEARSCREEN);
			serial_send_string(ESCAPE"[0;0H");
			serial_send_string(ESCAPE"[5m");
			serial_send_string("UART DOOR TERMINAL\n\r\n\r");
			serial_send_string(ESCAPE"[0m");
			serial_send_string("DOOR UNLOCKED");
			solved = true;
		} else if ((strncmp("CLOSE", clean_string, strlen(string)) == 0) && strlen(string) != 0) {
			printf("Triggered CLOSE\n");
			serial_send_string(CLEARSCREEN);
			serial_send_string(ESCAPE"[0;0H");
			serial_send_string(ESCAPE"[5m");
			serial_send_string("UART DOOR TERMINAL\n\r\n\r");
			serial_send_string(ESCAPE"[0m");
			serial_send_string("DOOR ALREADY CLOSED");
		} else {
			printf("Triggered OTHER\n");
			serial_send_string(CLEARSCREEN);
			serial_send_string(ESCAPE"[0;0H");
			serial_send_string(ESCAPE"[5m");
			serial_send_string("UART DOOR TERMINAL\n\r\n\r");
			serial_send_string(ESCAPE"[0m");
			serial_send_string("OPTIONS:\n\r\n\r> OPEN\n\r> CLOSE\n\r\n\rCHOICE: ");
		}
    }
    else {
		printf("Triggered CHAL_CLOSED\n");
		serial_send_string(CLEARSCREEN);
		serial_send_string(ESCAPE"[0;0H");
		serial_send_string(ESCAPE"[5m");
		serial_send_string("NO TERMINAL CURRENTLY ACCESSIBLE\n\r\n\r");
		serial_send_string(ESCAPE"[0m");
    }
	memset(clean_string, 0, sizeof clean_string );

    return true;
}

void serial_send_string(const char *string){
    uint8_t i = 0;
    for(i = 0; i < MAX_SERIAL_LEN; i++){
        if(string[i] == '\0'){
            break;
        }
        app_uart_put((uint8_t)string[i]);
    }
}

bool serial_getSolved(){
	return solved;
}

void serial_openChallenge(){
	chal_opened = true;
}
void serial_closeChallenge(){
	chal_opened = false;
}
