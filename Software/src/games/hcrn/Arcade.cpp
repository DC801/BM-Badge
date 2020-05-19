//
//  Arcade.cpp
//  DC801
//
//  Created by Professor Plum on 5/2/19.
//

#include "Arcade.h"
#include "GameEngine.h"
#include "sprites_raw.h"

Arcade::Arcade(Point at) : frame(0) {
    life=100;
    position = at;
    blocking = true;
    
}

Arcade::~Arcade() {
}

void Arcade::draw(FrameBuffer* canvas) {
    int x=0;
    
    x = TILE_SIZE * (frame%3);
    
    canvas->drawImage(position.x, position.y, TILE_SIZE, 16, arcade_raw, x, 0, TILE_SIZE*3, BGCOLOR);
    
    frame++;
}

Rect Arcade::getBoundingbox() {
    return Rect(position+Point(1,1), position+Point(11,11));
}

bool Arcade::think(Room *room) {
    return true;
}


void Arcade::collide(GameObject *other) {
    
}

void Arcade::takeDamage(int d) {
    
}

void Arcade::interact(FrameBuffer* canvas) {
    if (!game.isTaskComplete(ARCADE_OPENED)){
    	//game.ShowAlert("Downloading arcade\nto terminal..."); // TODO: doesn't render perfect
    	game.ShowAlert("Downloading arcade"); // TODO: doesn't render perfect
    	nrf_delay_ms(100);
    	game.ShowAlert("Downloaded!");
    	game.completeTask(ARCADE_OPENED);
    }
    game.saveGame();
    menu();
    
}
