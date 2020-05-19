//
//  TNT.h
//  DC801
//
//  Created by Professor Plum on 4/19/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef TNT_h
#define TNT_h

#include "GameObject.h"

class Tnt : public GameObject {
public:
    Tnt(Point at);
    ~Tnt();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room* room);
    void collide(GameObject* other);
    
private:
    int frame;
    bool destroy, shot;
};

#endif /* TNT_h */
