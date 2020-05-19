//
//  Sprite.cpp
//  DC801
//
//  Created by Professor Plum on 5/10/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Sprite.h"
#include "sprites_raw.h"
#include "GameEngine.h"

Sprite::Sprite(){
    life=100;
}

Sprite::Sprite(Point at, dude_id t) {
    life = 100;
    position = at;
    frame = rand() %10;
    blocking = true;
    type = t;
    
    switch (t) {
        case COMPUTER:
            w=8;
            h=12;
            framemod=6;
            data = comp_raw;
            break;
        case SHIELDS:
            w=24;
            h=12;
            framemod=4;
            data = shield_raw;
            break;
        case CORE_SPARK:
            w=11;
            h=14;
            framemod=4;
            position+=Point(6,5);
            data = core_raw;
            break;
        case ENGINE:
            w=33;
            h=34;
            framemod=4;
            position-=Point(TILE_SIZE,0);
            data=engine_raw;
            break;
        default:
            h = w = 1;
            framemod = 1;
            data = turret2_raw;
    }
}

Sprite::~Sprite() {
    
}

void Sprite::draw(FrameBuffer* canvas) {
    if ((type == CORE_SPARK) && !game.isTaskComplete(CORE_POWERED))
        return;
    if ((type == SHIELDS) && !game.isTaskComplete(SHIELDS_ON))
        return;
    if ((type == ENGINE) && !game.isTaskComplete(TRUSTERS_ON))
        return;
    int pitch=w*framemod;
    int fx=w*(frame++ % framemod);
    canvas->drawImage(position.x, position.y, w, h, data, fx, 0, pitch, BGCOLOR);
}

Rect Sprite::getBoundingbox() {
    return Rect(position, w, h);
}

bool Sprite::think(Room* room) {
    return true;
}

void Sprite::collide(GameObject* other) {
}
