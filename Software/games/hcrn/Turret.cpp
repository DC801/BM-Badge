//
//  Turret.cpp
//  DC801
//
//  Created by Professor Plum on 3/26/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Turret.h"
#include "Projectile.h"
#include "GameEngine.h"
#include "sprites_raw.h"

Turret::Turret(Point at) :state(IDLE), facing(UP), lastShot(50) {
    life=25;
    position=at+ Point(4,4);
    playerTeam=false;
}

Turret::~Turret() {
}

void Turret::draw(FrameBuffer* canvas) {
    if (state == DYING) {
        canvas->drawImage(position.x-TILE_SIZE/2, position.y-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, explode_raw, frame++ * TILE_SIZE, 0, TILE_SIZE*4, BGCOLOR);
        if (frame == 4)
            state = DEAD;
        return;
    }
    int y=0;
    switch(facing){
        case RIGHT:
            y=0;break;
        case UPRIGHT:
            y=1;break;
        case UP:
            y=2;break;
        case UPLEFT:
            y=3;break;
        case LEFT:
            y=4;break;
        case DOWNLEFT:
            y=5;break;
        case DOWN:
            y=6;break;
        case DOWNRIGHT:
            y=7;break;
    }
    canvas->drawImage(position.x-TILE_SIZE/2, position.y-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, turret2_raw, 0, y*TILE_SIZE, TILE_SIZE, BGCOLOR);
}

Rect Turret::getBoundingbox() {
    return Rect(position-Point(5,5), position+Point(5,5));
}

bool Turret::think(Room *room) {
    if (state == DEAD) return false;
    if ((life <=0) && (state != DYING)) {
        state = DYING;
        frame=0;
    }
    if (state==DYING) return true;
    
    Point heading = game.getPlayer()->position - position;
    if (heading.x < 0) {
        int slope=10*heading.y/heading.x;
        if (slope < -20) {facing=DOWN;}
        else if (slope < -5) {facing=DOWNLEFT;}
        else if (slope < 5) {facing=LEFT;}
        else if (slope < 20) {facing=UPLEFT;}
        else facing=UP;
    }
    else if(heading.x>0) {
        int slope=10*heading.y/heading.x;
        if (slope < -20) {facing=UP;}
        else if (slope < -5) {facing=UPRIGHT;}
        else if (slope < 5) {facing=RIGHT;}
        else if (slope < 20) {facing=DOWNRIGHT;}
        else facing=DOWN;
    }else if (heading.y > 0) {facing = DOWN;}
    else {facing = UP;}
    
    if (lastShot <= 0) {
        int l = sqrt(heading.y*heading.y+heading.x*heading.x);
        heading/=l/3;
        Projectile *shot = new Projectile(position, heading);
        game.addObject(shot);
        lastShot = 50;
    }
    
    if (lastShot) --lastShot;
    return true;
}

void Turret::collide(GameObject *other) {
    if (state == DYING)
        return;
    if (other->playerTeam != playerTeam) {
        other->takeDamage(5);
    }
}
