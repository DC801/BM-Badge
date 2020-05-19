//
//  GameObject.h
//  DC801
//

#ifndef object_h
#define object_h

#include "../hcrn/FrameBuffer.h"

struct box {
	int xs, ys, xe, ye;
};

struct coordinates {
	int x, y;
};

struct objsize {
	uint8_t x, y;
};

struct sprite {
    const uint16_t *sprite_data;
    objsize sprite_size;
};

class object {
public:
    virtual ~object() {};
    
    virtual void draw(FrameBuffer* canvas)=0;
    virtual box getBoundingbox()=0;
    virtual void collide(object* other)=0;
    virtual void takeDamage(int num) {life-=num;};
    virtual void interact(FrameBuffer* canvas) {};
    int getLife() {return life;};
    
    bool playerTeam;
    coordinates position;
    sprite obj_sprite;

protected:
    int life;
};

#endif /* object */
