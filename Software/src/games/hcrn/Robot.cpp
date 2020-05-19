//
//  Robot.cpp
//  DC801
//
//  Created by Professor Plum on 4/8/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Robot.h"
#include "GameEngine.h"
#include "sprites_raw.h"

Robot::Robot(Point at) : state(IDLE), facing(UP), frame(0), lastThought(8) {
    life=25;
    playerTeam=false;
    position = at+ Point(6,6);
}

Robot::~Robot() {
}

void Robot::draw(FrameBuffer* canvas) {
    if (state == DYING) {
        canvas->drawImage(position.x-TILE_SIZE/2, position.y-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, explode_raw, frame++ * TILE_SIZE, 0, 4*TILE_SIZE, BGCOLOR);
        if (frame == 4)
            state = DEAD;
        return;
    }
    int x=0, y=0;
    switch (facing) {
        case UP: y=0; break;
        case LEFT: y=TILE_SIZE; break;
        case DOWN: y=TILE_SIZE*2; break;
        case RIGHT: y=TILE_SIZE*3; break;
        default: break;
    }
    if (state == IDLE)
        x = 0;
    else if (state == WALKING)
        x = (frame%3)*TILE_SIZE;
    
    canvas->drawImage(position.x-TILE_SIZE/2, position.y-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, robot2_raw, x, y, TILE_SIZE*3, BGCOLOR);
    
    frame++;
}

Rect Robot::getBoundingbox() {
    return Rect(position-Point(5,5), position+Point(5,5));
}

bool Robot::think(Room *room) {
    if (state == DEAD) return false;
    if ((life <=0) && (state != DYING)) {
        state = DYING;
        frame=0;
    }
    if (state==DYING) return true;
    
    if (lastThought) {
        --lastThought;
        if (state==WALKING) {
            switch (facing) {
                case UP:
                    position+=Point(0,-1);
                    break;
                case DOWN:
                    position+=Point(0,1);
                    break;
                case LEFT:
                    position+=Point(-1,0);
                    break;
                case RIGHT:
                    position+=Point(1,0);
                    break;
                default:
                    break;
            }
        }
    }
    else {
    
        Direction prefrence[4];
        
        Point heading = game.getPlayer()->position - position;
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
        if (choice < 25) choice = 0;
        else if (choice < 50) choice = 1;
        else if (choice < 55) choice = 2;
        else if (choice < 60) choice = 3;
        else {
            state = IDLE;
            lastThought = 8;
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
            if (room->isWalkable(Rect(check-Point(5,5), check+Point(5,5)))) {
                facing = prefrence[choice];
                state = WALKING;
                lastThought = TILE_SIZE;
            }
        }
    }
    
    return true;
}


void Robot::collide(GameObject *other) {
    if (state == DYING)
        return;
    if (other->playerTeam != playerTeam) {
        other->takeDamage(10);
    }
}
