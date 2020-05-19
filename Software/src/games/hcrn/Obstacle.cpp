//
//  Obstacle.cpp
//  DC801
//
//  Created by Professor Plum on 4/19/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Obstacle.h"
#include "sprites_raw.h"
#include "GameEngine.h"

Obstacle::Obstacle() : destroy(false){
    life=100;
    blocking = true;
}

Obstacle::Obstacle(Point at, dude_id t) : type(t), destroy(false) {
    life = 100;
    blocking = true;
    position = at;
}

Obstacle::~Obstacle() {
    
}

void Obstacle::draw(FrameBuffer* canvas) {
    const uint16_t * data;
    int sx=TILE_SIZE;
    int sy=TILE_SIZE;
    int pitch=TILE_SIZE;
    int fx=0;
    int fy=0;
    switch (type) {
        case DOOR_UD:
            fy=TILE_SIZE;
            sy=TILE_SIZE*2;
            data = door_raw;
            break;
        case DOOR_LR:
            data = door_raw;
            break;
        case RUBBLE:
            data = rubble_raw;
            break;
        default:
            return;
    }
    canvas->drawImage(position.x, position.y, sx, sy, data, fx, fy, pitch, BGCOLOR);
}

Rect Obstacle::getBoundingbox() {
    if (type == RUBBLE)
        return Rect(position, TILE_SIZE, TILE_SIZE);
    else if (type == DOOR_UD)
        return Rect(position, TILE_SIZE, 2*TILE_SIZE);
    return Rect(position, TILE_SIZE, TILE_SIZE);
}

bool Obstacle::think(Room* room) {
    uint8_t roomid = room->getId();
    //big ugly code block
    if ((roomid == 23) && game.isTaskComplete(FIRST_ATTEMPT))
        return false;
    else if ((roomid == 25) && game.isTaskComplete(CORE_POWERED))
        return false;
    else if ((roomid == 57) && game.isTaskComplete(COMP_UNLOCKED))
        return false;
    else if ((roomid == 86) && game.isTaskComplete(BRIDGE_OPEN))
        return false;
    else if ((roomid == 0) && game.isTaskComplete(COMP_UNLOCKED))
        return false;
    else if ((roomid == 10) && game.isTaskComplete(COMP_UNLOCKED))
        return false;
    else if ((roomid == 53) && game.isTaskComplete(DEAD_OPEN))
        return false;
    else if ((roomid == 84) && game.isTaskComplete(B_DCZIA))
        return false;
    
    return !destroy;
}

void Obstacle::collide(GameObject* other) {
    if ((other->playerTeam) && (other != game.getPlayer()) && (type == RUBBLE)) {
        if (game.isTaskComplete(HAS_ROCKETS))
            destroy = true;
    }
}

