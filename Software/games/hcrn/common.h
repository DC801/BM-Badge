//
//  common.h
//  DC801
//
//  Created by Professor Plum on 3/6/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef common_h
#define common_h

#include <stdint.h>
extern "C" {
#include "../../common.h"
}

#define TILE_SIZE   12
#define BGCOLOR RGB(52,75,103)

enum AniState {
    IDLE,
    WALKING,
    ATTACKING,
    DYING,
    DEAD
};

enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    UPLEFT,
    UPRIGHT,
    DOWNLEFT,
    DOWNRIGHT
};

#endif /* common_h */
