//
//  Turret.h
//  DC801
//
//  Created by Professor Plum on 3/26/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Turret_h
#define Turret_h

#include "GameObject.h"

class Turret : public GameObject {
public:
    Turret(Point at);
    ~Turret();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);

    
    AniState state;
    Direction facing;
    int lastShot, frame;
};

#endif /* Turret_h */
