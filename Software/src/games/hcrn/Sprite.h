//
//  Sprite.h
//  DC801
//
//  Created by Professor Plum on 5/10/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Sprite_h
#define Sprite_h

#include "GameObject.h"

class Sprite : public GameObject {
public:
    Sprite();
    Sprite(Point at, dude_id t);
    ~Sprite();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room* room);
    void collide(GameObject* other);
    
private:
    int w,h;
    int frame, framemod;
    const uint16_t * data;
    dude_id type;
};

#endif /* Sprite_h */
