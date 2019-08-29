//
//  Boss.h
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Boss_h
#define Boss_h

#include "GameObject.h"

class Boss : public GameObject {
public:
    Boss(Point at);
    ~Boss();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    AniState state;
    Direction facing;
    int frame, lastThought;
};
#endif /* Boss_h */
