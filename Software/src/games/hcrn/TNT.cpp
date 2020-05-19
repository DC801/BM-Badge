//
//  Obstacle.cpp
//  DC801
//
//  Created by Professor Plum on 4/19/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "TNT.h"
#include "sprites_raw.h"
#include "GameEngine.h"

Tnt::Tnt(Point at) : frame(0), destroy(false), shot(false) {
    life = 100;
    blocking = true;
    position = at;
    if (game.isTaskComplete(EXPLODED))
        destroy = shot = true;
}

Tnt::~Tnt() {
}

void Tnt::draw(FrameBuffer* canvas) {
    int booms[10][2] = {{0,0},{2,12},{-10,-5},{-20,22},{3,36},{-12,-12},{-12,12},{-12, 1},{-15,36},{-10,20}};
    if (destroy) {
        canvas->drawImage(0, 12, 36, 72, after_raw, 0, 0, 36);
    }
    else if (shot) {
        for (int i=0; i<10; ++i) {
            if ((frame >= i) && (frame < (i+5)))
                canvas->drawImage(position.x + booms[i][0], position.y + booms[i][1], TILE_SIZE, TILE_SIZE, explode_raw, (frame - i) * TILE_SIZE, 0, TILE_SIZE*4, BGCOLOR);
        }
        if (++frame > 15) {
            destroy = true;
            game.completeTask(EXPLODED);
        }
    }
    else {
        canvas->drawImage(position.x, position.y, TILE_SIZE, TILE_SIZE, tnt_raw, 0, 0, TILE_SIZE, BGCOLOR);
    }
}

Rect Tnt::getBoundingbox() {
    if (destroy || shot)
        return Rect(Point(0,12), 36, 72);
    return Rect(position, TILE_SIZE, TILE_SIZE);
}

bool Tnt::think(Room* room) {
    return true;
}

void Tnt::collide(GameObject* other) {
    if ((other->playerTeam) && (other != game.getPlayer())) {
        if (game.isTaskComplete(HAS_ROCKETS))
            shot = true;
    }
    if (shot)
        other->takeDamage(100);
}

