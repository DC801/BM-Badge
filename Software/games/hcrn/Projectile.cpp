//
//  Projectile.cpp
//  DC801
//
//  Created by Professor Plum on 3/14/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Projectile.h"
#include "sprites_raw.h"

Projectile::Projectile() : size(2,2){
    boom=false;
}

Projectile::Projectile(Point start, Direction dir, int dmg) {
    life=1;
    boom=false;
    position=start;
    damage=dmg;
    d = dir;
    playerTeam = true;
    size = Point(4,4);
    if (damage > 10)
        size = Point(8,8);
    switch (dir){
        case UP:
            heading = Point(0,-2);
            break;
        case DOWN:
            heading = Point(0,2);
            break;
        case LEFT:
            heading = Point(-2,0);
            break;
        case RIGHT:
            heading = Point(2,0);
            break;
        default:
            heading = Point(2,0);
            break;
    }
}

Projectile::Projectile(Point start, Point dir, int dmg) : size(2,2), heading(dir) {
    life=1;
    damage=dmg;
    boom=false;
    position=start;
    playerTeam = false;
}

Projectile::~Projectile() {}

void Projectile::draw(FrameBuffer* canvas) {
    int x = ((frame/2)%4)*4;
    if (boom) {
        if ((playerTeam) && (damage > 10)) {
            int y=0;
            switch(d) {
                case LEFT:
                    y=0;break;
                case DOWN:
                    y=8;break;
                case RIGHT:
                    y=16;break;
                case UP:
                    y=24;break;
                default:
                    break;
            }
            canvas->drawImage(position.x-4, position.y-4, 8, 8, pshot2_raw, 32, y, 40, BGCOLOR);
        }
        boom = false;
        return;
    }
    
    if (playerTeam) {
        if (damage > 10) {
            int y = 0;
            switch(d) {
                case LEFT:
                    y=0;break;
                case DOWN:
                    y=8;break;
                case RIGHT:
                    y=16;break;
                case UP:
                    y=24;break;
                default:
                    break;
            }
            canvas->drawImage(position.x-4, position.y-4, 8, 8, pshot2_raw, abs(x*2), y, 40, BGCOLOR);
        }
        else {
            int y = (abs(heading.x) > abs(heading.y))?4:0;
            canvas->drawImage(position.x-2, position.y-2, 4, 4, pshot_raw, x, y, 16, RGB(32,49,69));
        }
    }
    else {
        int y = 0;
        canvas->drawImage(position.x-2, position.y-2, 4, 4, bshot_raw, x, y, 16, BGCOLOR);
    }
    frame++;
}
Rect Projectile::getBoundingbox() {
    Rect box(position, size.x, size.y);
    return box.shift(-size/2);
}

bool Projectile::think(Room* room) {
    if (life <=0){
        if (boom)
            return true;
        return false;
    }
    if (!room->isOpen(getBoundingbox())) {
        boom = true;
        life=0;
    }
    position += heading;
    if ((position.x<=0) || (position.x+size.x>=WIDTH) || (position.y<=0) || (position.y+size.y>=HEIGHT))
        return false;
    return true;
}

void Projectile::collide(GameObject *other) {
    if (other->playerTeam != playerTeam) {
        other->takeDamage(damage);
        boom=true;
    }
}
