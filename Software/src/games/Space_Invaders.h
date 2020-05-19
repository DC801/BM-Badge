//
// Created by hamster on 7/29/18.
//

#ifndef DC26_BADGE_SPACEINVADERS_H
#define DC26_BADGE_SPACEINVADERS_H

#ifdef INVADERS

typedef struct {
    uint8_t x;
    uint8_t lives;
} TANK;

typedef struct {
    uint8_t x;
    uint8_t y;
    uint8_t type;
    bool dead;
    bool cleared;
} ENEMY;

#define MY_BULLET 0
#define ENEMY_BULLET 1

typedef struct {
    uint8_t x;
    uint8_t y;
    bool active;
} BULLET;


static void drawTank(uint8_t x);
static void drawInvader(uint8_t x, uint8_t y, uint8_t type);
static void drawAllInvaders();
static void updateInvaders(bool move);
static void pauseGame();
static void levelUp();
static void resetBoard();
static void updateScore(int points);
static void drawLives();
static void drawScore(int points);
static void updateBullet();
static void drawBullet(void);

#endif


#endif //DC26_BADGE_SPACEINVADERS_H
