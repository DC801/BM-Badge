//
//  shots.h
//  DC801
//
//

#ifndef shots_h
#define shots_h

#include "_old_object.h"

class shot : public object {
public:
	shot(sprite obj_spz, coordinates start, Direction dir, int dmg, int spd);
    
    void draw(FrameBuffer* canvas);
    box getBoundingbox();
    bool think(box* room);
    void collide(object* other);
        
    coordinates heading;
    int speed;
    
private:
    int damage;
};

#endif /* shots_h */
