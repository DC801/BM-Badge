//
//  Pickup.h
//  DC801
//
//  Created by Professor Plum on 4/9/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Pickup_h
#define Pickup_h

#include "GameObject.h"

class Pickup : public GameObject {
public:
    Pickup(Point at, int Type);
    ~Pickup();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    int frame;
    bool gone;
    int type;
};

#endif /* Pickup_h */
