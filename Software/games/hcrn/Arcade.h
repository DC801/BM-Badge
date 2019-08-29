//
//  Arcade.h
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Arcade_h
#define Arcade_h

#include "GameObject.h"

class Arcade : public GameObject {
public:
    Arcade(Point at);
    ~Arcade();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    void takeDamage(int num);
    void interact(FrameBuffer* canvas);
    
private:
    int frame;
};
#endif /* Arcade_h */
