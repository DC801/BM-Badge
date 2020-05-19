//
//  Spider.h
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Spider_h
#define Spider_h

#include "GameObject.h"

class Spider : public GameObject {
public:
    Spider(Point at);
    ~Spider();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    AniState state;
    Direction facing;
    int frame, lastThought;
};
#endif /* Spider_h */
