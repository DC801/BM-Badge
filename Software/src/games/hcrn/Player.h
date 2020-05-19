//
//  Player.h
//  DC801
//
//  Created by Professor Plum on 3/6/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Player_h
#define Player_h

#include "GameObject.h"

const Point hSize(3,4);

class Player: public GameObject {
public:
    Player();
    ~Player();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    void takeDamage(int num);
    void setLife(int val);
    
    AniState state;
    Direction facing;
    int frame;
    int lastShot;
    int invuln;
private:
    Rect getInteractBox();

    
    
};

#endif /* Player_h */
