//
//  GameObject.h
//  DC801
//
//  Created by Professor Plum on 3/18/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef GameObject_h
#define GameObject_h

#include "common.h"
#include "Point.h"
#include "Rect.h"
#include "FrameBuffer.h"
#include "Room.h"

class GameObject {
public:
    GameObject(): blocking(false) {};
    virtual ~GameObject() {};
    
    virtual void draw(FrameBuffer* canvas)=0;
    virtual Rect getBoundingbox()=0;
    virtual bool think(Room* room)=0;
    virtual void collide(GameObject* other)=0;
    virtual void takeDamage(int num) {life-=num;};
    bool isBlocking() {return blocking;};
    virtual void interact(FrameBuffer* canvas) {};
    int getLife() {return life;};
    
    bool playerTeam;
    bool blocking;
    Point position;
protected:
    int life;
};


class Dummy : public GameObject {
public:
    Dummy() {};
    ~Dummy() {};
    
    void draw(FrameBuffer* canvas) {};
    Rect getBoundingbox() {return Rect();};
    bool think(Room *room) {return true;};
    void collide(GameObject* other) {};
};

#endif /* GameObject_h */
