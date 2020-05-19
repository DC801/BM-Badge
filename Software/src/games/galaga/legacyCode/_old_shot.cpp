//
//  shot.cpp
//  DC801
//
//

#include "_old_shot.h"

#include "../hcrn/FrameBuffer.h"
#include "_old_object.h"

shot::shot(sprite obj_spz, coordinates start, Direction dir, int dmg, int spd) {
    life=1;
    position=start;
    damage=dmg;
    playerTeam = true;
    speed=spd;
    obj_sprite = obj_spz;
    switch (dir){
        case UP:
            heading = {0, -speed};
            break;
        case DOWN:
            heading = {0, speed};
            break;
        case LEFT:
            heading = {-speed, 0};
            obj_sprite.sprite_size = { obj_sprite.sprite_size.y, obj_sprite.sprite_size.x };
            break;
        case RIGHT:
            heading = {speed, 0};
            obj_sprite.sprite_size = { obj_sprite.sprite_size.y, obj_sprite.sprite_size.x };
            break;
        default:
            heading = {0, -speed};
            obj_sprite.sprite_size = { obj_sprite.sprite_size.y, obj_sprite.sprite_size.x };
            break;
    }
}

void shot::draw(FrameBuffer* canvas) {
	position = {position.x + heading.x, position.y + heading.y};
	canvas->drawImage(position.x, position.y, obj_sprite.sprite_size.x, obj_sprite.sprite_size.y, obj_sprite.sprite_data, RGB(0,0,0));
//    int x = ((frame/2)%4)*4;
//    if (playerTeam) {
//        int y = (abs(heading.x) > abs(heading.y))?4:0;
//        if (damage > 10)
//            canvas->drawImage(position.x-4, position.y-4, 8, 8, pshot2_raw, x, y, 32, BGCOLOR);
//        else
//            canvas->drawImage(position.x-2, position.y-2, 4, 4, pshot_raw, x, y, 16, RGB(32,49,69));
//    }
//    else {
//        int y = 0;
//        canvas->drawImage(position.x-2, position.y-2, 4, 4, bshot_raw, x, y, 16, BGCOLOR);
//    }
//    frame++;
}
box shot::getBoundingbox() {
    return {position.x, position.y, position.x + obj_sprite.sprite_size.x, position.y + obj_sprite.sprite_size.y};
}


void shot::collide(object *other) {
    if (other->playerTeam != playerTeam) {
        other->takeDamage(damage);
        life=0;
    }
}
