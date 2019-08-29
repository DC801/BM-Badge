//
//  Obstacle.h
//  DC801
//
//  Created by Professor Plum on 4/19/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Obstacle_h
#define Obstacle_h

#include "GameObject.h"

class Obstacle : public GameObject {
public:
    Obstacle();
    Obstacle(Point at, dude_id t);
    ~Obstacle();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room* room);
    void collide(GameObject* other);
    
private:
    dude_id type;
    bool destroy;
};

#endif /* Obstacle_h */
