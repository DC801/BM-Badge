//
//  Marine.h
//  DC801
//
//  Created by Professor Plum on 5/3/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Marine_h
#define Marine_h

#include "GameObject.h"

class Marine : public GameObject {
public:
    Marine(Point at);
    ~Marine();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    AniState state;
    Direction facing;
    int frame, lastThought, lastShot;
};

#endif /* Marine_h */
