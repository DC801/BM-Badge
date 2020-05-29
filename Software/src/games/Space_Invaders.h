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

#endif


#endif //DC26_BADGE_SPACEINVADERS_H
