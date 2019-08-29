//
//  Projectile.h
//  DC801
//
//  Created by Professor Plum on 3/14/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Projectile_h
#define Projectile_h

#include "GameObject.h"

class Projectile : public GameObject {
public:
    Projectile();
    Projectile(Point start, Direction dir, int dmg=10);
    Projectile(Point start, Point dir, int dmg=5);
    ~Projectile();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room* room);
    void collide(GameObject* other);
        
    Point size, heading;
    
private:
    int damage, frame;
    Direction d;
    bool boom;
};

#endif /* Projectile_h */
