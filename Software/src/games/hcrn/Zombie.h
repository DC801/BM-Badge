//
//  Zombie.h
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Zombie_h
#define Zombie_h

#include "GameObject.h"

class Zombie : public GameObject {
public:
    Zombie(Point at);
    ~Zombie();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    
private:
    AniState state;
    Direction facing;
    int frame, lastThought;
};
#endif /* Zombie_h */
