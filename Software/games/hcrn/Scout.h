//
//  Scout.h
//  DC801
//
//  Created by Professor Plum on 4/9/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Scout_h
#define Scout_h

#include "GameObject.h"

class Scout : public GameObject {
public:
    Scout(Point at);
    ~Scout();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    AniState state;
    Direction facing;
    int frame, lastThought, lastShot;
};

#endif /* Scout_h */
