//
//  Player.cpp
//  DC801
//
//  Created by Professor Plum on 3/6/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "Player.h"
#include "GameEngine.h"
#include "Projectile.h"
#include "sprites_raw.h"

#ifndef min
#define min(a,b) ((a)<(b)?(a):(b))
#endif

#ifndef max
#define max(a,b) ((a)>(b)?(a):(b))
#endif

Player::Player() : state(AniState::IDLE), facing(Direction::RIGHT), frame(0), lastShot(0), invuln(0) {
    position= Point(60, 48);
    life=100;
    playerTeam = true;
}

Player::~Player() {}


bool Player::think(Room *room) {
    if (state == DEAD)
        return false;
    else if (state == DYING)
        return true;
    else if (life <= 0) {
        state = DYING;
        frame = 0;
        return true;
    }
    Point newpos =position;
    
    if (isButtonDown(USER_BUTTON_UP)) {
        state = WALKING;
        facing = UP;
        newpos += Point(0,-1);
    }
    else if (isButtonDown(USER_BUTTON_DOWN)) {
        state = WALKING;
        facing = DOWN;
        newpos += Point(0,1);
    }
    else if (isButtonDown(USER_BUTTON_LEFT)) {
        state = WALKING;
        facing = LEFT;
        newpos += Point(-1,0);
    }
    else if (isButtonDown(USER_BUTTON_RIGHT)) {
        state = WALKING;
        facing = RIGHT;
        newpos += Point(1,0);
    }
    else {
        state = IDLE;
    }
    
    if ((lastShot<=0) && (isButtonDown(USER_BUTTON_B))) {
        if (game.isTaskComplete(HAS_GUN)) {
            int dmg = 10;
            if (game.isTaskComplete(HAS_ROCKETS))
                dmg = 20;
            Projectile *shot = new Projectile(position, facing, dmg);
            game.addObject(shot);
            lastShot = 15;
        }
    }
    
    if ((lastShot<=0) && (isButtonDown(USER_BUTTON_A))) {
        game.interact(getInteractBox());
    }
    
    Rect newbox = Rect(newpos-hSize, newpos+hSize-Point(1,0));
    if (room->isWalkable(newbox)) {
        position = newpos;
    }
    else if ((facing == UP) || (facing == DOWN)) {
        //we're going to try and help a little if they are off by a pixel
        newbox.shift(Point(-1,0));
        newpos += Point(-1,0);
        if (room->isWalkable(newbox))
            position = newpos;
        else {
            newbox.shift(Point(2,0));
            newpos += Point(2,0);
            if (room->isWalkable(newbox))
                position = newpos;
        }
    }
    else {
        newbox.shift(Point(0,-1));
        newpos += Point(0,-1);
        if (room->isWalkable(newbox))
            position = newpos;
        else {
            newpos += Point(0,2);
            newbox.shift(Point(0,2));
            if (room->isWalkable(newbox))
                position = newpos;
        }
    }
    
    if (lastShot) --lastShot;
    if (invuln) --invuln;
    
    return true;
}

void Player::draw(FrameBuffer* canvas) {
    int x=0, y=0;
    switch (facing) {
        case RIGHT: y=0; break;
        case DOWN: y=TILE_SIZE; break;
        case LEFT: y=TILE_SIZE*2; break;
        case UP: y=TILE_SIZE*3; break;
        default:
            break;
    }
    if (state == DYING) {
        x=TILE_SIZE*4;
        if (frame == 4)
            state = DEAD;
    }
    if (state == IDLE)
        x = 0;
    else if (state == WALKING)
        x = ((frame/2)%4)*TILE_SIZE;
    
    if ((invuln%3)!=2)
        canvas->drawImage(position.x-TILE_SIZE/2, position.y-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, p12_raw, x, y, TILE_SIZE*5, BGCOLOR);
   frame++;
}

Rect Player::getBoundingbox() {
    return  Rect(position-hSize, position+hSize);
}

void Player::collide(GameObject *other) {
    
}

#define LIFEMARK(x) (LEDPattern)(min(x, 20)/5)
void Player::takeDamage(int num) {
    if (invuln) return;
    setLife(min(100, life-num));
#ifdef DEBUGMODE
    // unlimited life cheat
    setLife(100);
#endif
    if (num > 0)
        invuln = 50;
}

void Player::setLife(int val) {
    life = val;
    
    if ((life > 0) && ((state == DYING) || (state == DEAD)))
        state = IDLE;
    
    //Update life lights
    if (life >= 100)
        ledOn(LED_LIFE1);
    else if (life > 80)
        ledPwm(LED_LIFE1, 13 * (life-80));
    else
        ledOff(LED_LIFE1);
    if (life >= 80)
        ledOn(LED_LIFE2);
    else if (life > 60)
        ledPwm(LED_LIFE2, 13 * (life-60));
    else
        ledOff(LED_LIFE2);
    if (life >= 60)
        ledOn(LED_LIFE3);
    else if (life > 40)
        ledPwm(LED_LIFE3, 13 * (life-40));
    else
        ledOff(LED_LIFE3);
    if (life >= 40)
        ledOn(LED_LIFE4);
    else if (life > 20)
        ledPwm(LED_LIFE4, 13 * (life-20));
    else
        ledOff(LED_LIFE4);
    if (life <= 0)
        ledOff(LED_LIFE5);
    else if (life < 10)
        ledPulseFast(LED_LIFE5);
    else if (life < 20)
        ledPulse(LED_LIFE5);
    else
        ledOn(LED_LIFE5);
    ledShow();
}

Rect Player::getInteractBox() {
    Rect ret = getBoundingbox();
    switch (facing) {
        case UP:
            ret.shift(Point(0,-TILE_SIZE));
            break;
        case DOWN:
            ret.shift(Point(0,TILE_SIZE));
            break;
        case LEFT:
            ret.shift(Point(-TILE_SIZE,0));
            break;
        case RIGHT:
            ret.shift(Point(TILE_SIZE,0));
            break;
        default:
            break;
    }
    return ret;
}
