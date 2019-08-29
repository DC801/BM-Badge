
//#include "../hcrn/GameEngine.h" // TODO: figure out why this has to be here
#include <games/galaga/resources/galaga_sprites.h>
#include "../hcrn/FrameBuffer.h"
#include "galaga.h"

#include "_old_shot.h"

#define GINTERVAL 	50 
#define SHOTDELAY 	200
#define SHIPWIDTH 	15
#define SHIPHEIGHT 	20

#define SHIP_SIZE    (SHIPHEIGHT * SHIPWIDTH * 2)

const uint8_t NUM_OF_OBJECTS = 64;
object* objects[NUM_OF_OBJECTS] = {0};
const uint8_t SCREEN_X = 128;
const uint8_t SCREEN_Y = 128;

typedef struct {
    sprite data;
    objsize size;
    //uint8_t tankSprite[TANK_SIZE];
} ship_sprite;

struct {
    ship_sprite gameShips[3];
    //uint8_t tankSprite[TANK_SIZE];
} Galaga;


extern "C" int galaga_run(int level, int sheep_nearby) {
	int score = 0;
	int lives=3;
	int16_t playerx = 64;
	int16_t playery = 100;
	int shipx = 0;
	int shipy = 0;
	uint32_t lasttime = millis();
	uint32_t lastshot=0;


	//initalization here
	memset(objects, 0, NUM_OF_OBJECTS * sizeof(object)); // Allocate and zero-initialize array

	// Load Sprites
	//bullet torpedo = {player_torp_raw, objsize{5, 7}};

	//ship(sprite obj_spz, coordinates start, Direction dir, int dmg, int spd, bullet obj_blt)
	//Galaga.gameShips[0] = ship(sprite{player_ship_raw, objsize{15, 20}}, coordinates{64, 100}, UP, 0, 2 , torpedo);
	Galaga.gameShips[0] = {player_ship_raw, objsize{15, 20}};

	// assign sprites to ships
	ship_sprite player_ship =  Galaga.gameShips[0];


	//main game loop
	while (lives) {
		uint32_t now = millis();
		uint32_t dt = millis_elapsed(now, lasttime);

		if (dt > GINTERVAL) {
			while (st7735_is_busy()) {
            	APP_ERROR_CHECK(sd_app_evt_wait());
        	}
			
			canvas.clearScreen(RGB(0,0,0));

			//do frame drawing here

			//canvas.drawImage(75 - SHIPWIDTH/2, 30, SHIPWIDTH, SHIPHEIGHT, player_ship, RGB(0,0,0));
			shipx = playerx - SHIPWIDTH/2;
			shipy = playery - SHIPHEIGHT/2;
			//util_gfx_fill_rect(shipx - 2, shipy, SHIPWIDTH + 4, SHIPHEIGHT, COLOR_BLACK);
			//util_gfx_draw_raw(shipx, shipy, SHIPWIDTH, SHIPHEIGHT, Galaga.invaderSprite[0]);


			canvas.drawImage(shipx, shipy, player_ship.size.y,  player_ship.size.x, player_ship.data.sprite_data, RGB(0,0,0));

			//canvas.drawImage(shipx, shipy, player_ship->ship.sprite_size.y, player_ship->ship.sprite_size.x, player_ship->ship.sprite_data, RGB(0,0,0));
			drawObjects(&canvas);

			canvas.blt();

			//do logic updates here

			int num_objects = 0;
		    for (int i=0; i<NUM_OF_OBJECTS; ++i) {
		        if (objects[i] != NULL) {
		            num_objects += 1;
		        }
		    }

			//baddies move/think

			if (isButtonDown(USER_BUTTON_LEFT)) {
				playerx = max(playerx - 2, SHIPWIDTH/2);
			}
			if (isButtonDown(USER_BUTTON_RIGHT)) {
				playerx = min(playerx + 2, 128 - (SHIPWIDTH/2));
			}
			if (isButtonDown(USER_BUTTON_A) && (millis_elapsed(now, lastshot) > SHOTDELAY)) {
				//add bullet
				//shot(uint8_t *p_raw, coordinates start, Direction dir, objsize sz, int dmg, int spd)
				//addObject(new shot(player_ship->bullet.sprite_data, coordinates{playerx , playery - 30}, UP, player_ship->bullet.sprite_size, 10, 2));
				ledGunsShoot(100);
				lastshot = now;
			}

			lasttime = now;
		}


	}

	return score;
}

void addObject(object *obj) {
    for (int i=0; i<NUM_OF_OBJECTS; ++i) {
        if (objects[i] == NULL) {
            objects[i] = obj;
            return;
        }
    }
    //no room for it so drop it on the floor
    delete obj;
}

void delObject(int idx) {
    delete objects[idx];
    objects[idx] = NULL;
}

void drawObjects(FrameBuffer* canvas) {
    for (int i=0; i<NUM_OF_OBJECTS; ++i) {
        if (objects[i] != NULL) {
        	objects[i]->draw(canvas);
        }
    }
}

void removeObjects() {
    for (int i=0; i<NUM_OF_OBJECTS; ++i) {
        if (objects[i] != NULL) {
            if(objects[i]->getBoundingbox().ye < 0 || objects[i]->getBoundingbox().ys > SCREEN_Y)
            	delObject(i);
        }
    }
}
