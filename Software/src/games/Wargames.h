//
// Created by hamster on 8/4/18.
//

#ifndef DC26_BADGE_WARGAMES_H
#define DC26_BADGE_WARGAMES_H

#ifdef __cplusplus
extern "C" {
#endif

#define GAMES_TO_UNLOCK 2

void wg_Init(void);
bool wg_GotString(char *string, size_t len);
void wg_Reset();
bool wg_JumpToGame(void);
void wg_Unlock(void);

typedef enum{
    wg_state_waiting,
    wg_state_login,
    wg_state_password,
    wg_state_keyword,
    wg_state_playing,
    wg_state_unlocked
} WG_STATE;

typedef struct {
    WG_STATE state;
    bool showLogin;
    bool loggedIn;
    uint32_t loginTimestamp;
    uint8_t gamesPlayed;
    bool playTTT;
} WG_DATA;

extern WG_DATA WG_Data;

#ifdef WARGAMES

void wg_SendString(const char *string);
void wg_ListGames(void);
void wg_ConnectionTerminated(void);
void wg_Identifcation(void);

#endif

#ifdef __cplusplus
}
#endif

#endif //DC26_BADGE_WARGAMES_H
