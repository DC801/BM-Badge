//
// Created by hamster on 8/1/18.
//

#ifndef DC26_BADGE_PIPSTHEET_H
#define DC26_BADGE_PIPSTHEET_H

int PipsTheET(void);

#ifdef PIPS

static void pauseGame(void);
static void updateSteps(int steps);
static void updateBanner(char *string);
static void movePips(uint8_t x, uint8_t y);
static bool checkIfInPit();
static void movePipsInPit(uint8_t x);

#endif

#endif //DC26_BADGE_PIPSTHEET_H
