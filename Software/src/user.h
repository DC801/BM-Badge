//
// Created by hamster on 7/19/18.
//

#ifndef DC27_BADGE_USER_H
#define DC27_BADGE_USER_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    CLAN_MARVWASHERE,
    CLAN_HELGA,
    CLAN_801LABS,
    CLAN_THETRANSISTOR,
    CLAN_RAM,
    CLAN_BADGELIFE,
    CLAN_ADMIN
} CLAN;

typedef struct {
    CLAN clan;
    const char* name;
    const char* filename;
} CLAN_STRUCT;

typedef struct __attribute__ ((__packed__)) {
    uint8_t configured : 1;
    char name[11];
    uint32_t score;
    CLAN clan;
    int16_t modifier;
    uint32_t nemusAdventure;
    bool wargameUnlock;
} USER;

void loadUser(void);
void storeUser(void);
const char* getClanFile(CLAN clan);
const char* getClanName(CLAN clan);

int getTempScoreModifier(void);
void setTempScoreModifier(int);
void addTempScoreModifier(int modifier);
int getTotalScoreModifier(void);

extern USER user;

#define FIRST_ALLOWED_CHAR ' '
#define LAST_ALLOWED_CHAR '~'

#endif //DC27_BADGE_USER_H
