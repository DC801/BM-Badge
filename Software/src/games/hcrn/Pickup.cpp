//
//  Pickup.cpp
//  DC801
//
//  Created by Professor Plum on 4/9/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Pickup.h"
#include "GameEngine.h"
#include "sprites_raw.h"

Pickup::Pickup(Point at, int Type) {
    gone=false;
    position = at;
    type = Type;
}

Pickup::~Pickup() {
    
}

void Pickup::draw(FrameBuffer* canvas) {
    int off = 8;
    uint16_t bg = BGCOLOR;
    const uint16_t* img;
    switch (type) {
        case HEALTHPACK:
            img = healthpack_raw;
            off = TILE_SIZE;
            break;
        case GUN:
            img = gun_raw;
            bg = RGB(33, 50, 70);
            break;
        case ROCKET:
            img = gun2_raw;
            bg = RGB(33, 49, 69);
            break;
        default:
            img = NULL;
            break;
    }
    frame++;
    int x = 0;
    if ((frame%25) < 6)
        x=off;
    canvas->drawImage(position.x, position.y, off, off, img, x, 0, off*2, bg);
}

Rect Pickup::getBoundingbox() {
    return Rect(position, TILE_SIZE, TILE_SIZE);
}

bool Pickup::think(Room *room) {
    return !gone;
}

void Pickup::collide(GameObject* other) {
    if (other == game.getPlayer()) {
        switch(type) {
            case HEALTHPACK:
                other->takeDamage(-50);
                break;
            case GUN:
                game.completeTask(HAS_GUN);
                break;
            case ROCKET:
                game.completeTask(HAS_ROCKETS);
                break;
            default:
                break;
        }
        gone = true;
    }
}

