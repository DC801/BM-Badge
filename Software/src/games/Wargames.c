//
// Created by hamster on 8/4/18.
//
// Now with 20% more GLOBAL THERMONUCLEAR WAR
//

#define WARGAMES

#include "common.h"
#include "Wargames.h"

const char* wg_login = "HAMSTER";
const char* wg_help = "HELP";
const char* wg_games_help = "HELP GAMES";
const char* wg_password = "6642"; // silkscreen dc27
const char* wg_list_games = "LIST GAMES";
const char* wg_keyword = "TIC-TAC-TOE";
const char* wg_keyword_gtw = "GLOBAL THERMONUCLEAR WAR";

// List of games
#define NUM_WG_GAMES 15
const char* wg_games[NUM_WG_GAMES] = {
        "FALKEN'S MAZE",
        "BLACK JACK",
        "GIN RUMMY",
        "HEARTS",
        "CHECKERS",
        "CHESS",
        "POKER",
        "FIGHTER COMBAT",
        "GUERRILLA ENGAGEMENT",
        "DESERT WARFARE",
        "AIR-TO-GROUND ACTIONS",
        "THEATREWIDE TACTICAL WARFARE",
        "THEATREWIDE BIOTOXIC AND CHEMICALWARFARE",
		"",
        "GLOBAL THERMONUCLEAR WAR"
};

#define ESCAPE "\x1b"
#define ANSI_CSI ESCAPE"["
#define CLEARSCREEN ESCAPE"[2J"


#define WG_TIMEOUT  5000
#define MAX_WG_LEN  64

WG_DATA WG_Data;

/**
 * Init the game data
 */
void wg_Init(void){
    memset(&WG_Data, 0, sizeof(WG_Data));
}


void wg_Reset() {
    wg_SendString(CLEARSCREEN);
    wg_SendString(ESCAPE"[0;0H");
    wg_SendString(ESCAPE"[0m");
    nrf_delay_ms(500);
    wg_SendString("\n\r\n\rLOGIN: ");
    WG_Data.state = wg_state_login;
    WG_Data.loginTimestamp = getSystick();
}
/**
 * Got a string from the user
 * @param len length of string
 */
bool wg_GotString(char *string, size_t len){

    for(int i = 0 ; i < strlen(string); i++){
        string[i] = toupper(string[i]);
    }

    printf("Got string (%d): '%s'\n", len, string);
    printf("State in %d\n", WG_Data.state);

    switch(WG_Data.state){
        case wg_state_waiting:
            wg_Reset();
            break;
        case wg_state_login: {
            // Still trying to guess login name

            if (strncmp(string, wg_login, strlen(wg_login)) == 0) {
                WG_Data.state = wg_state_password;
                nrf_delay_ms(500);
                wg_SendString("\r\n\r\nPASSWORD: ");
            }
            else if(strncmp(string, wg_games_help, strlen(wg_games_help)) == 0) {
                wg_SendString("\r\n\r\n'GAMES' REFERS TO MODELS, SIMULATIONS AND GAMES\r\n");
                wg_SendString("WHICH HAVE TACTICAL AND STRATEGIC APPLICATIONS.\r\n\r\n");
                wg_SendString("LOGIN: ");
            }
            else if(strncmp(string, wg_help, strlen(wg_help)) == 0) {
                wg_SendString("\r\n\r\nHELP NOT AVAILABLE\r\n\r\n\r\n");
                wg_SendString("LOGIN: ");
            }
            else if(strncmp(string, wg_list_games, strlen(wg_list_games)) == 0) {
                wg_ListGames();
                wg_SendString("LOGIN: ");
            }
            else {
                wg_ConnectionTerminated();
                WG_Data.state = wg_state_waiting;
            }
        }
            break;
        case wg_state_password:
            // Trying to guess the password

            nrf_delay_ms(500);
            if (strncmp(string, wg_password, strlen(wg_password)) == 0) {

                nrf_delay_ms(250);
                wg_SendString(CLEARSCREEN);
                wg_SendString(ESCAPE"[5;0H");
                wg_SendString("WELCOME PROFESSOR HAMSTER.");
                wg_SendString(ESCAPE"[8;0H");

                if(user.wargameUnlock){
                    wg_SendString("THIS GAME ALREADY SOLVED");
                }
                else{
                    wg_SendString("SHALL WE PLAY A GAME?");
                    WG_Data.state = wg_state_keyword;
                }
                wg_SendString(ESCAPE"[12;0H");
            }
            else if (user.wargameUnlock){
                wg_Identifcation();
            }
            else {
                wg_ConnectionTerminated();
                WG_Data.state = wg_state_waiting;
            }
            break;
        case wg_state_keyword:
            // Waiting for the keyword to play tic-tac-toe
            nrf_delay_ms(500);

            if(strncmp(string, wg_list_games, strlen(wg_list_games)) == 0){
                wg_ListGames();
            }
            else if(strncmp(string, wg_keyword, strlen(wg_keyword)) == 0){
                WG_Data.playTTT = true;
                WG_Data.state = wg_state_playing;
                TicTacToe();
                return false;
            }
            else if(strncmp(string, wg_help, strlen(wg_help)) == 0) {
                wg_SendString("\r\n\r\nHELP NOT AVAILABLE\r\n\r\n\r\n");
            }
            else if(strncmp(string, wg_keyword_gtw, strlen(wg_keyword_gtw)) == 0) {
                nrf_delay_ms(250);
                wg_SendString(CLEARSCREEN);
                wg_SendString(ESCAPE"[10;20H");
                wg_SendString(ESCAPE"[0;4;5m");
                wg_SendString("** GAME ROUTINE RUNNING **");
                wg_SendString(ESCAPE"[0m");
                wg_SendString(ESCAPE"[0;24H");
            }
            else {
                wg_Identifcation();
                WG_Data.state = wg_state_waiting;
            }
            break;
        case wg_state_playing:
            // Playing the game, wait for an outcome

            break;
        case wg_state_unlocked:
            // Player won!
        	return false;

            break;
        default:
            break;
    }

    return true;
}


/**
 * Send a string to the UART
 * @param string
 */
void wg_SendString(const char *string){
	nrf_delay_ms(20);
    usb_serial_write(string, strlen(string));
    app_usbd_event_queue_process();
}


/**
 * Send the list of games to the UART
 */
void wg_ListGames(void){
    nrf_delay_ms(500);

    wg_SendString("\r\n");
    wg_SendString("\r\n");

    for(uint8_t i = 0; i < NUM_WG_GAMES; i++){
        wg_SendString("\r\n");
        wg_SendString(wg_games[i]);
    }

    wg_SendString("\r\n");
    wg_SendString("\r\n");

}

/**
 * Raise the play game flag
 * @return true if we should play the game
 */
bool wg_JumpToGame(void){
    if(WG_Data.playTTT == true){
        WG_Data.playTTT = false;
        return true;
    }
    printf("start menu");
    menu();
    return false;
}


/**
 * Display the unlock text
 */
void wg_Unlock(void){

    nrf_delay_ms(250);
    wg_SendString(CLEARSCREEN);
    wg_SendString(ESCAPE"[5;0H");
    wg_SendString("GREETINGS PROFESSOR HAMSTER");
    wg_SendString(ESCAPE"[8;0H");
    wg_SendString("A STRANGE GAME.");
    wg_SendString(ESCAPE"[9;0H");
    wg_SendString("THE ONLY WINNING MOVE IS NOT TO PLAY.");
    wg_SendString(ESCAPE"[12;0H");
    wg_SendString("HOW ABOUT A NICE GAME OF WHISKY SHOTS?");
    wg_SendString(ESCAPE"[15;0H");
    wg_SendString(ESCAPE"[0;4;5m");
    wg_SendString("POWER RESTORED TO THRUSTERS");
    wg_SendString(ESCAPE"[0m");
    user.wargameUnlock = true;
}

/**
 * Not really terminated, but hey
 */
void wg_ConnectionTerminated(void){

    wg_SendString(CLEARSCREEN);
    wg_SendString(ESCAPE"[0;5m");
    wg_SendString(ESCAPE"[20;20H");
    wg_SendString("IDENTIFICATION NOT RECOGNIZED BY SYSTEM");
    wg_SendString(ESCAPE"[21;26H");
    wg_SendString("--CONNECTION TERMINATED--");
    wg_SendString(ESCAPE"[0m");

}


/**
 * Oh, don't worry, I know who you are
 */
void wg_Identifcation(void){

    nrf_delay_ms(250);
    wg_SendString(CLEARSCREEN);
    wg_SendString(ESCAPE"[10;20H");
    wg_SendString(ESCAPE"[0;4;5m");
    wg_SendString("** IDENTIFICATION NOT RECOGNIZED **");
    wg_SendString(ESCAPE"[0;5m");
    wg_SendString(ESCAPE"[11;28H");
    wg_SendString("** ACCESS DENIED **");
    wg_SendString(ESCAPE"[0m");

}
