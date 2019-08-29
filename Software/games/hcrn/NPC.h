//
//  NPC.h
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef NPC_h
#define NPC_h

#include "GameObject.h"
#include "GameEngine.h"

class NPC : public GameObject {
public:
    NPC(Point at, int Type);
    ~NPC();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room *room);
    void collide(GameObject* other);
    void takeDamage(int num);
    void interact(FrameBuffer* canvas);
    
private:
    int frame;
    int type;
    int y;
    Checkpoint bitmask;
    BADGE_GROUP group;
    const char *avatar, *goodmsg, *badmsg;
};
#endif /* NPC_h */
