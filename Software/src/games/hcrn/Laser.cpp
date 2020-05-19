//
//  Laser.cpp
//  DC801
//
//  Created by Professor Plum on 4/9/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Laser.h"
#include "sprites_raw.h"


Laser::Laser(Point at, Direction rotation) {
    position = at;
    switch (rotation) {
        case UP:
        case DOWN:
            facing=UP;
            break;
        case LEFT:
        case RIGHT:
            facing=LEFT;
            break;
        default:
            break;
    }
    
    life = 0;
    tick = rand()%50;
    playerTeam=false;
}

Laser::~Laser() {
    
}

void Laser::draw(FrameBuffer* canvas) {
    int x = TILE_SIZE*6;
    if (tick%50 > 25) {
        x=(tick%3)*TILE_SIZE*2;
    }
    if (facing==LEFT)
        canvas->drawImage(position.x, position.y, TILE_SIZE*2, TILE_SIZE, laser_raw, x,  TILE_SIZE*2, TILE_SIZE*8, BGCOLOR);
    else
        canvas->drawImage(position.x, position.y, TILE_SIZE, TILE_SIZE*2, laser_raw, x, 0, TILE_SIZE*8, BGCOLOR);
    tick++;
}

Rect Laser::getBoundingbox() {
    if (facing==LEFT)
        return Rect(position + Point(0,4), TILE_SIZE*2, 3);
    else
        return Rect(position + Point(4,0), 3, TILE_SIZE*2);
}

bool Laser::think(Room *room) {
    return true;
}

void Laser::collide(GameObject* other) {
    if (tick%50 > 25) {
        if (other->playerTeam != playerTeam) {
            other->takeDamage(15);
        }
    }
}
