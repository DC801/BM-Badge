//
//  Laser.h
//  DC801
//
//  Created by Professor Plum on 4/9/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Laser_h
#define Laser_h

#include "GameObject.h"

class Laser : public GameObject {
public:
    Laser(Point at, Direction rotation);
    ~Laser();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
    
    Direction facing;
    int tick;
};

#endif /* Laser_h */
