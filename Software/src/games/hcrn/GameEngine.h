//
//  Game.hpp
//  DC801
//
//  Created by DC801 for DEFCON27.

#ifndef Game_h
#define Game_h

#include "hcrn_common.h"
#include "Player.h"
#include "Room.h"
#include "FrameBuffer.h"
#include "GameObject.h"

#define THINK_INTERVAL 25
#define FRAME_INTERVAL 50
#define GAMESTATE_SIZE 12

#define MILLER_AVATAR "HCRN/miller.bmp"

enum Checkpoint {
    FIRST_ATTEMPT,
    CORE_POWERED,
    HAS_GUN,
    COMP_UNLOCKED,
    BRIDGE_OPEN,
    TRUSTERS_ON,
    WEAPONS_ON,
    BEAT_RACE,
    SHOOT_OUT,
    HAS_ROCKETS,
    SHIELDS_ON,
    DEAD_OPEN,
    COMMS_ON,
    MORSE,
    ALL_DONE,
    B_BENDER,
    B_FURRY,
    B_DCZIA,
    B_KIDZ,
    B_PIRATE,
    B_DC801,
    RACE_START,
    LEAVE_FIRST_ROOM_MESSAGE,
    PICKED_UP_GUN_MESSAGE,
    CORE_POWERED_MESSAGE,
	BIGGER_GUN_MESSAGE,
	COMMS_EXTERNAL_MESSAGE,
    MESSAGE1,
    EXPLODED,
    FIRST_BRIDGE_MESSAGE,
	TERMINAL_BOOT,
	RESET_TIMER_ONE,
	RESET_TIMER_TWO,
	FLICKER_MESSAGE,
	RESET_TIMER_THREE,
	SETBLE,
	BRIDGE_MESSAGE,
	L337_SCORE,
	RACE_START_AT_THRUSTERS,
	HOSTILES_MESSAGE,
	POST_COMMS_MESSAGE,
	FINAL_FLEET_ALERT,
	ARCADE_OPENED
};

#define SAVEFILE "HCRN/player.sav"

#define RACETIME    240

class GameEngine {
public:
    GameEngine();
    ~GameEngine();

    void run();
    void addObject(GameObject* obj);
    void addObject(GameObject* obj, uint8_t id);
    Player* getPlayer();

    bool isBlocked(Rect box);

    bool saveGame(const char* filename=SAVEFILE);
    bool loadGame(const char* filename=SAVEFILE);

    bool isTaskComplete(Checkpoint it);
    void completeTask(Checkpoint it);
    void unCompleteTask(Checkpoint it);

    void flicker(bool twice);

    void interact(Rect loc);

    void WriteMessage(const char* message, uint16_t fontcolor, GFXfont font, area_t area);
    int DrawInput(int inputs, int16_t HEIGHT_OFFSET, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight);
    void DrawInputText(char* response, int inputs, uint8_t start_char, uint8_t numOfChars, uint8_t initialize_char, int16_t HEIGHT_OFFSET, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight);
    bool DrawThisOrThat(const char* query, area_t query_area, const char* response_one, const char* response_two, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight);
    uint8_t DrawManyOptions(const char *options[], area_t area, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight);
    void DrawDialogBackground(const char* avatar, uint16_t bgcolor, uint16_t outer_bevel, uint16_t inner_bevel);
    void DrawTerminalBackground(uint16_t bgcolor, uint16_t outer_bevel, uint16_t inner_bevel);
    void ShowDialog(const char* message, const char* avatar, bool page=false);
    bool DialogRequestResponse(const char* query, const char* response_one, const char* response_two, const char* avatar);
    void TerminalRequestName(const char* query, int inputs, char* response);
    void TerminalBoot(void);
    uint8_t TerminalMenu(const char* header, const char *options[]);
    int ShowTerminal(const char* message, int inputs);
    void ShowTerminalText(const char* message, int inputs, char* response);
    void ShowTerminalNoResponse(const char* message);
    int ShowTerminalCaptcha(const char* above_captcha_message, const char* below_captcha_message, int inputs, const char* captcha);
    bool TerminalRequestResponse(const char* query, const char* response_one, const char* response_two);
    void ShowTerminalError(const char* message, const char* error_message, int8_t error_lines_down);
    void DrawPopup(area_t area, int padding_x, int padding_y);
    void Scanning(bool found);
    void ShowAlert(const char* message);
    int getScore();
    void updateShipLights();

private:
    void loop(uint32_t dt);
    void changeRoom(int id);
    void delObject(int idx);

    void doMesageOverlay(const char* message);
    int doInputOverlay(const char* message, int inputs);


    void updateLocator();
    void updateScore();

    bool quit;
    uint32_t lastFrame, lastThink, _flicker, lastTime;

    Player player;
    Room currentRoom;

    GameObject* objects[24];
    uint32_t racestart;
    uint8_t mapstates[100];
    uint8_t gamestate[GAMESTATE_SIZE];

};

extern char ble_name[11];
extern GameEngine game;

#endif /* Game_h */
