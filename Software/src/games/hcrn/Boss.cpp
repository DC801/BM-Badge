//
//  Boss.cpp
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Boss.h"
#include "GameEngine.h"
#include "sprites_raw.h"

Boss::Boss(Point at) : state(IDLE), facing(UP), frame(0), lastThought(8) {
    life=200;
    playerTeam=false;
    position = at;
}

Boss::~Boss() {
}

void Boss::draw(FrameBuffer* canvas) {
    int x=0, y=0;
    switch (facing) {
        case DOWN: y=0; break;
        case UP: y=TILE_SIZE*2; break;
        case RIGHT: y=TILE_SIZE*4; break;
        case LEFT: y=TILE_SIZE*6; break;
        default: break;
    }
    
    if (state == WALKING)
        x = ((frame/2)%4)*TILE_SIZE*2;
    
    canvas->drawImage(position.x, position.y, TILE_SIZE*2, TILE_SIZE*2, boss_raw, x, y, TILE_SIZE*8, BGCOLOR);
    
    if (state == DYING) {
        const int boomoff[5][2] = { {1,1}, {8,10}, {12,-2}, {-1, 13}, {6,6}};
        for (int i = 0; i< 5; ++i) {
            int idx = (frame - i*2);
            if ((idx < 0) || (idx > 4))
                continue;
            canvas->drawImage(position.x + boomoff[i][0], position.y + boomoff[i][1], TILE_SIZE, TILE_SIZE, explode_raw, frame * TILE_SIZE, 0, TILE_SIZE*4, BGCOLOR);
        }
        if (frame == 14)
            state = DEAD;
    }
    
    
    frame++;
}

Rect Boss::getBoundingbox() {
    return Rect(position+Point(2,2), position+Point(22,22));
}

bool Boss::think(Room *room) {
    if (state == DEAD) return false;
    if ((life <=0) && (state != DYING)) {
        state = DYING;
        frame=0;
    }
    if (state==DYING) return true;
    
    if (lastThought) {
        --lastThought;
        if ((lastThought%2) && (state==WALKING)) {
            switch (facing) {
                case UP:
                    position+=Point(0,-2);
                    break;
                case DOWN:
                    position+=Point(0,2);
                    break;
                case LEFT:
                    position+=Point(-2,0);
                    break;
                case RIGHT:
                    position+=Point(2,0);
                    break;
                default:
                    break;
            }
        }
    }
    else {
        
        Direction prefrence[4];
        
        Point heading = game.getPlayer()->position - position - Point(12,12);
        if (abs(heading.x) > abs(heading.y)) {
            if (heading.x <0) {
                prefrence[0] = RIGHT;
                prefrence[3] = LEFT;
            }
            else {
                prefrence[0] = LEFT;
                prefrence[3] = RIGHT;
            }
            if (heading.y<0) {
                prefrence[1] = DOWN;
                prefrence[2] = UP;
            }
            else {
                prefrence[1] = UP;
                prefrence[2] = DOWN;
            }
        }
        else {
            if (heading.y<0) {
                prefrence[0] = DOWN;
                prefrence[3] = UP;
            }
            else {
                prefrence[0] = UP;
                prefrence[3] = DOWN;
            }
            if (heading.x <0) {
                prefrence[1] = RIGHT;
                prefrence[2] = LEFT;
            }
            else {
                prefrence[1] = LEFT;
                prefrence[2] = RIGHT;
            }
        }
        int choice = rand() % 100;
        if (choice < 20) choice = 0;
        else if (choice < 40) choice = 1;
        else if (choice < 50) choice = 2;
        else if (choice < 60) choice = 3;
        else {
            state = IDLE;
            lastThought = TILE_SIZE*2;
            return true;
        }
        
        for (;choice<4; ++choice) {
            Point check = position;
            switch(prefrence[choice]) {
                case UP:
                    check += Point(0,-TILE_SIZE);
                    break;
                case DOWN:
                    check += Point(0,TILE_SIZE);
                    break;
                case LEFT:
                    check += Point(-TILE_SIZE,0);
                    break;
                case RIGHT:
                    check += Point(TILE_SIZE,0);
                    break;
                default:
                    break;
            }
            if (room->isWalkable(Rect(check+Point(1,1), check+Point(23,23)))) {
                facing = prefrence[choice];
                state = WALKING;
                lastThought = TILE_SIZE;
            }
        }
    }
    
    return true;
}


void Boss::collide(GameObject *other) {
    if (state == DYING)
        return;
    if (other->playerTeam != playerTeam) {
        other->takeDamage(20);
    }
}
