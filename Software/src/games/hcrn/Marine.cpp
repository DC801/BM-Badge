//
//  Marine.cpp
//  DC801
//
//  Created by Professor Plum on 5/3/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Marine.h"
#include "GameEngine.h"
#include "sprites_raw.h"
#include "Projectile.h"

Marine::Marine(Point at) : state(IDLE), facing(UP), frame(0), lastThought(8) {
    life=15;
    playerTeam=false;
    position = at+ Point(4,4);
}

Marine::~Marine() {
}

void Marine::draw(FrameBuffer* canvas) {
    if (state == DYING) {
        canvas->drawImage(position.x-4, position.y-4, 8, 8, marine_raw, 8*4, 0, 40, RGB(32,49,69));
        if (frame++  == 4)
            state = DEAD;
        return;
    }
    int x=0, y=0;
    switch (facing) {
        case LEFT: y=0; break;
        case UP: y=8; break;
        case DOWN: y=8*2; break;
        case RIGHT: y=8*3; break;
        default: break;
    }
    if (state == IDLE)
        x = 0;
    else if (state == WALKING)
        x = (frame%4)*8;
    
    canvas->drawImage(position.x-4, position.y-4, 8, 8, marine_raw, x, y, 40, RGB(32,49,69));
    
    frame++;
}

Rect Marine::getBoundingbox() {
    return Rect(position-Point(4,4), position+Point(4,4));
}

bool Marine::think(Room *room) {
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
        if (choice < 15) choice = 0;
        else if (choice < 30) choice = 1;
        else if (choice < 40) choice = 2;
        else if (choice < 50) choice = 3;
        else if (choice < 60) {
            Point p;
            switch (facing) {
                case UP:
                    p = Point(0,-1); break;
                case DOWN:
                    p = Point(0,1); break;
                case LEFT:
                    p = Point(-1,0); break;
                case RIGHT:
                    p = Point(1,0); break;
                default:
                    p = Point(-1,0); break;
            }
            Projectile *shot = new Projectile(position, p);
            game.addObject(shot);
            lastThought = 12;
            state = IDLE;
            return true;
        }
        else {
            state = IDLE;
            lastThought = 12;
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
            if (room->isWalkable(Rect(check-Point(3,3), check+Point(3,3)))) {
                facing = prefrence[choice];
                state = WALKING;
                lastThought = TILE_SIZE;
            }
        }
    }
    
    return true;
}


void Marine::collide(GameObject *other) {
    if (state == DYING)
        return;
    
    if (other->playerTeam != playerTeam) {
        other->takeDamage(20);
    }
}
