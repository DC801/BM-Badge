//
// Created by sirged on 8/1/18.
//

#ifndef SOFTWARE_SNAKE_H
#define SOFTWARE_SNAKE_H

#include <common.h>
#include <stdlib.h>
#include "../common.h"

//snake
int Snake(void);

struct SNAKE_TILE {
    int x;
    int y;
    struct SNAKE_TILE *next;
};

static int run_game();
static void init_board(char* board);
static bool pauseSnake();

#endif //SOFTWARE_SNAKE_H
