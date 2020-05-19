//
//  Robot.h
//  DC801
//
//  Created by Professor Plum on 4/8/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Robot_h
#define Robot_h

#include "GameObject.h"

class Robot : public GameObject {
public:
    Robot(Point at);
    ~Robot();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    AniState state;
    Direction facing;
    int frame, lastThought;
};

#endif /* Robot_h */
