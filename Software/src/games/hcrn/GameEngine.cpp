//
//  Game.cpp
//  DC801
//
//  Created by Professor Plum on 3/6/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#include "GameEngine.h"
#include "Turret.h"
#include "Robot.h"
#include "Laser.h"
#include "Scout.h"
#include "Marine.h"
#include "nearby.h"
#include "NPC.h"

#include "config/custom_board.h"

#include "modules/adc.h"
#include "modules/ble.h"
#include "modules/drv_st7735.h"
#include "modules/gfx.h"
#include "modules/led.h"

#include "utility.h"

#include "FrameBuffer.h"
#include "sprites_raw.h"

#include <cstring>
#include <cstddef>
#include <cstdio>

#ifndef DC801_EMBEDDED
#include "sdk_shim.h"
#endif

GameEngine game;

char ble_name[11];
uint16_t talking_timer = 0;

LEDID shiplights[] = {
    LED_WEAPONS1,
    LED_WEAPONS2,
    LED_COMPBAY,
    LED_HULL1,
    LED_HULL2,
    LED_HULL3,
    LED_HULL4,
    LED_CARGO,
    LED_DAMAGED,
    LED_SHIELDS,
    LED_COMM1,
    LED_COMM2,
    LED_BRIDGE,
    LED_ENGINE1,
};

uint8_t sheep_drawn = 0;

uint8_t dmgRooms[] = {39, 40, 45, 46, 51, 52, 53, 58, 59};

void shipLightsOff() {
    for (unsigned int i=0; i<(sizeof(shiplights)/sizeof(LEDID)); ++i)
        ledOff(shiplights[i]);
    ledShow();
}

void shipLightsOn() {
    for (unsigned int i=0; i<(sizeof(shiplights)/sizeof(LEDID)); ++i)
        ledOn(shiplights[i]);
    ledShow();
}

GameEngine::GameEngine() : lastFrame(0), lastThink(0){
    for (int i=0; i<24; ++i) {
        objects[i] = NULL;
    }
    memset(mapstates, 0, sizeof(mapstates));
    memset(gamestate, 0, sizeof(gamestate));
    //gamestate = 0xFFFFFFFF;
    memset(ble_name, 0, sizeof(ble_name));
}

GameEngine::~GameEngine() {

}

static void introCallback(uint8_t frame, void *p_data){

}

void GameEngine::run() {
    printf("Game starting\n");
    quit = false;
    ledsOff();
    racestart = 0;

    util_gfx_draw_raw_file("hcrn/display.raw", 0, 0, 128, 128, introCallback, true, NULL);

    changeRoom(16);
    player.setLife(60);

    if (FR_OK == f_stat(SAVEFILE, NULL) ) {
        loadGame(SAVEFILE);
    }

#ifdef DC801_EMBEDDED
    lastTime = millis();
#endif

#ifdef DC801_DESKTOP
    SDL_Event e;
    lastTime = SDL_GetTicks();
#endif

    while (!quit) {
        #ifdef DC801_DESKTOP
            if (application_quit != 0)
            {
                break;
            }

            uint32_t now = SDL_GetTicks();

            loop(millis_elapsed(now, lastTime));

            while (SDL_PollEvent(&e)) {
                if (e.type == SDL_QUIT){
                    quit = true;
                }

                if (e.type == SDL_KEYDOWN) {
                    if (e.key.keysym.sym == SDLK_ESCAPE) {
                        quit = true;
                    }

                    if (e.key.keysym.scancode == SDL_SCANCODE_Q) {
                        quit = true;
                    }
                }
            }
        #endif

        #ifdef DC01_EMBEDDED
            uint32_t now = millis();

            loop(millis_elapsed(now, lastTime));
            lastTime = now;
            app_usbd_event_queue_process();
        #endif
    }

    //Game Over
    uint16_t fontcolor = st7735_color565(220, 220, 220);
    area_t area = {32, 55, 96, 80};
    util_gfx_set_color(fontcolor);
    util_gfx_cursor_area_set(area);
    util_gfx_set_font(FONT_PRACTICAL);
    util_gfx_set_cursor(area.xs, area.ys+1);
    util_gfx_print("Game Over");
    nrf_delay_ms(1000);
    pauseUntilPress(USER_BUTTON_A);

    //debounce
    while (isButtonDown(USER_BUTTON_A))
        nrf_delay_ms(10);

}

void GameEngine::loop(uint32_t dt) {
    lastFrame += dt;
    lastThink += dt;

    if (lastFrame > FRAME_INTERVAL) {
        while (st7735_is_busy()) {
            APP_ERROR_CHECK(sd_app_evt_wait());
        }

        //canvas.clearScreen(RGB(0,0,255));
        //canvas.drawHorizontalLine(10, 20, 100, RGB(0,255,0));
        currentRoom.draw(&canvas);
        for (int i=0; i<24; ++i)
            if (objects[i])
                objects[i]->draw(&canvas);
        player.draw(&canvas);
        lastFrame %= FRAME_INTERVAL;

        if (_flicker) {
            if ((_flicker % 2) && ((_flicker < 4) || (_flicker>47))) {
                canvas.mask(player.position.x, player.position.y, 16, 32, 48);
                shipLightsOff();
            }
            else
                shipLightsOn();
            if (!--_flicker)
                updateShipLights();
        }
        else if (!isTaskComplete(CORE_POWERED))
            canvas.mask(player.position.x, player.position.y, 16, 32, 48);
        for (unsigned int i=0; i< sizeof(dmgRooms); ++i)
            if (currentRoom.getId() == dmgRooms[i])
                canvas.mask(player.position.x, player.position.y, 16, 32, 48);


        // TODO: battery notification here.
        int battery_level = getBatteryPercent();
        if ( (battery_level <= 25) && battery_level != 0){
        	int BATTERY_WIDTH = 17;
        	int BATTERY_HEIGHT = 10;
        	switch(battery_level){
        	        case 25:
        	        	canvas.drawImage(128-BATTERY_WIDTH, 0, BATTERY_WIDTH, BATTERY_HEIGHT, battery_raw, BATTERY_WIDTH * 2, 0, BATTERY_WIDTH*6);
        	            break;
        	        case 1:
        	        	canvas.drawImage(128-BATTERY_WIDTH, 0, BATTERY_WIDTH, BATTERY_HEIGHT, battery_raw, BATTERY_WIDTH * 1, 0, BATTERY_WIDTH*6);
        	            break;
        	        case 0:
        	        	canvas.drawImage(128-BATTERY_WIDTH, 0, BATTERY_WIDTH, BATTERY_HEIGHT, battery_raw, BATTERY_WIDTH * 0, 0, BATTERY_WIDTH*6);
        	        	break;
        	        default:
        	            break;
        	}
        }

        canvas.blt();

        if (isTaskComplete(RACE_START) && !isTaskComplete(BEAT_RACE)) {
            if (racestart == 0)
                racestart = getSystick();
            int secs = 0;
            if (isTaskComplete(RACE_START_AT_THRUSTERS))
            	secs = RACETIME + racestart - getSystick();
            else
            	secs = RACETIME + racestart - getSystick() - 45; //started at weapons 45s less time

            if (secs < 0)
                player.setLife(0);

            char line[5]= {0};

            sprintf(line, "%d:%02d", secs/60, secs%60);
            util_gfx_set_color(st7735_color565(220, 220, 220));
            util_gfx_set_font(FONT_PRACTICAL);
            util_gfx_set_cursor(90, 115);
            util_gfx_print(line);
        }

        if (!isTaskComplete(MESSAGE1)) {
            ShowDialog("Oh good, you're awake.\nI was starting to think \nyou would never come\nback.\n", MILLER_AVATAR, true);
            if (!DialogRequestResponse("You okay?\nIs anything broken?","I feel like shit. What\n did you do to me?", "Na. I'm OK.", MILLER_AVATAR))
            	ShowDialog("This wasn't me. I just\nfound you. You're going\nto feel like this for the\nfor next bit, so you \nmight as well get used \nto it.", MILLER_AVATAR, true);
            else
            	ShowDialog("I'm glad you're doing\nwell. You might feel a\nbit off for the next\nwhile, but that's\nexpected.", MILLER_AVATAR, true);
            ShowDialog("The ship doesn't seem\nto be powered up. You \nneed to find a terminal.\nGo see if you can get\nsome lights on.", MILLER_AVATAR, true);
            if (!DialogRequestResponse("Do you think you can\nhandle that?","I'm a big boy. Of\ncourse I can.", "I think I'd like some\nhelp.", MILLER_AVATAR))
            	ShowDialog("Well. Don't get cocky\nkid. Move along.", MILLER_AVATAR, true);
            else
            	ShowDialog("Sorry. I can't help on\nthis one.\n\nYou can handle this.", MILLER_AVATAR, true);
            completeTask(MESSAGE1);
        }

        if (!isTaskComplete(LEAVE_FIRST_ROOM_MESSAGE)) {
        	if (currentRoom.getId() == 23 || currentRoom.getId() == 9){
        		talking_timer += dt;
        		if (talking_timer > 25){
					ShowDialog("Also, I didn't to tell you\nbut I have no idea\nwhat's going on either.\n            \nSo don't ask me.", MILLER_AVATAR, true);
					completeTask(LEAVE_FIRST_ROOM_MESSAGE);
        		}
        	}
        }

        if (!isTaskComplete(PICKED_UP_GUN_MESSAGE)) {
        	if (currentRoom.getId() == 24 && isTaskComplete(HAS_GUN)){
        		if(!isTaskComplete(RESET_TIMER_THREE)){
        			dt = 0;
        			talking_timer = 0;
        			completeTask(RESET_TIMER_THREE);
        		}
        		talking_timer += dt;
        		if (talking_timer > 15){
        			ShowDialog("You found a gun. Nice\nwork kid. Do you know\nhow to use it?\n                      \nEh. You'll figure it out.", MILLER_AVATAR, true);
                    ShowDialog("The lights are still off\nthough...\nBetter get on that.", MILLER_AVATAR, false);
					completeTask(PICKED_UP_GUN_MESSAGE);
        		}
        	}
        }

        if (!isTaskComplete(CORE_POWERED_MESSAGE)) {
        	if (currentRoom.getId() == 18 && isTaskComplete(CORE_POWERED)){
        		if(!isTaskComplete(RESET_TIMER_ONE)){
        			dt = 0;
        			talking_timer = 0;
        			completeTask(RESET_TIMER_ONE);
        		}
        		talking_timer += dt;
        		if (talking_timer > 40){
		            if (!DialogRequestResponse("Ok. So you got the\npower back on. Thanks.","Yes. Now tell me\nwhat's going on!?", "I'm awesome like\n that aren't I?", MILLER_AVATAR))
		            	ShowDialog("Sure. You deserve that\nmuch at least.", MILLER_AVATAR, true);
		            else
		            	ShowDialog("Yeah, sure you are...\nI guess you deserve a\ncrown too?", MILLER_AVATAR, true);

		            if (!DialogRequestResponse("How much do you\nknow about the ship?","The terminal said it\nwas named Tahsheep?", "I have no idea where\nI am.", MILLER_AVATAR))
		            	ShowDialog("Very good. You must be\npaying attention.\nTasheep. Cute name.\nYou'll see later that\nthe captain had a 'thing'\nfor sheep.", MILLER_AVATAR, true);
		            else
		            	ShowDialog("Oh boy. You must have\nhit your head hard.\nThe name of the ship\nis Tasheep and you're\nin space... On the\nship.", MILLER_AVATAR, true);

	            	ShowDialog("It used to be called...\nRoci... Quixote... Um...\nI don't remember. It was\na weird name though.\nAnyways, obviously the", MILLER_AVATAR, true);
		            ShowDialog("ship is broken. Getting\nthe lights on was the\nfirst step of getting\nout of here. We need\neverything else working\ntoo.", MILLER_AVATAR, true);
		            ShowDialog("That's on you.\nGood luck.\nMake your way to the\nbridge. Don't get hurt.\nSystems are turned\non now.", MILLER_AVATAR, false);
		            completeTask(CORE_POWERED_MESSAGE);
		            game.saveGame();
        		}
        	}
        }

// broken sheep code
//        if (sheep_drawn != 0 && currentRoom.getId() != 89){
//#ifdef DEBUGMODE
//        	printf("clear sheep drawn, sheep_drawn: %d\n", sheep_drawn);
//#endif
//        	sheep_drawn = 0;
//        }

        if (currentRoom.getId() == 89){
        	// broken sheep code
/*        	// get number of sheep in area
        	uint8_t numBadges = getNumDC801Badges();
#ifdef DEBUGMODE
        	printf("numBadges: %d, sheep_drawn: %d\n", numBadges, sheep_drawn);
#endif
        	int square_size = 12;

        	if (numBadges > 0 || sheep_drawn > 0){ // add 1nd sheep
        		///canvas.drawImage(3 * square_size,  3 * square_size, TILE_SIZE, TILE_SIZE, ble_raw, 0, TILE_SIZE*3, TILE_SIZE*2, BGCOLOR);
        		game.addObject(new NPC(Point(3 * square_size, 4 * square_size), DC801_duzzy));
        		printf("add sheep 1\n");
        		if (sheep_drawn == 0)
        			sheep_drawn += 1;
        	}
        	if (numBadges > 1 || sheep_drawn > 1){ // add 2nd sheep
        		//canvas.drawImage(6 * square_size,  3 * square_size, TILE_SIZE, TILE_SIZE, ble_raw, 0, TILE_SIZE*3, TILE_SIZE*2, BGCOLOR);
        		game.addObject(new NPC(Point(6 * square_size, 3 * square_size), DC801_duzzy));
        		printf("add sheep 2\n");
        		if (sheep_drawn == 1)
        			sheep_drawn += 1;
        	}
        	else if (numBadges > 2 && sheep_drawn > 2){ // etc
        		game.addObject(new NPC(Point(3 * square_size, 4 * square_size), DC801_duzzy));
        	}
        	else if (numBadges > 3 && sheep_drawn >= 3){
        		game.addObject(new NPC(Point(2 * square_size, 5 * square_size), DC801_duzzy));
        	}
        	else if (numBadges > 4 && sheep_drawn >= 4){
        		game.addObject(new NPC(Point(1 * square_size, 9 * square_size), DC801_duzzy));
        	}
        	else if (numBadges > 5 && sheep_drawn >= 5){
        		game.addObject(new NPC(Point(7 * square_size, 6 * square_size), DC801_duzzy));
        	}*/

        	if(!isTaskComplete(BRIDGE_MESSAGE)){
	            ShowDialog("Welcome to the bridge.\nSee what I mean about\nthe sheep? Go check on\nthe systems and see\nwhat else is broken.", MILLER_AVATAR, false);
	            completeTask(BRIDGE_MESSAGE);
        	}

        }


        if (!isTaskComplete(HOSTILES_MESSAGE)) {
        	if (currentRoom.getId() == 50 && isTaskComplete(SHOOT_OUT)){
        		talking_timer += dt;
        		if (talking_timer > 30){
        			ShowAlert("---- WARNING ----\nIntruders detected!");
	            	ShowDialog("They must have\nboarded the ship\nthrough the damaged\nhull. Be prepared for\nanything.", MILLER_AVATAR, true);
		            completeTask(HOSTILES_MESSAGE);
        		}
        	}
        }


        if (!isTaskComplete(FLICKER_MESSAGE)) {
        	if (currentRoom.getId() == 23 && isTaskComplete(FIRST_ATTEMPT)){
        		if(!isTaskComplete(RESET_TIMER_TWO)){
        			talking_timer = 0;
        			completeTask(RESET_TIMER_TWO);
        		}
        		else {
        		talking_timer += dt;
					if (talking_timer > 200){
						ShowDialog("You had the lights on\nfor a second.", MILLER_AVATAR, true);
						completeTask(FLICKER_MESSAGE);
					}
        		}
        	}
        }

        if (!isTaskComplete(BIGGER_GUN_MESSAGE)) {
        	if (currentRoom.getId() == 30 && isTaskComplete(HAS_ROCKETS)){
        		talking_timer += dt;
        		if (talking_timer > 60){
	            	ShowDialog("You found yourself a   \nbigger gun. That\nlooks useful.", MILLER_AVATAR, true);
		            completeTask(BIGGER_GUN_MESSAGE);
        		}
        	}
        }

        if (currentRoom.getId() == 54 && game.isTaskComplete(COMMS_ON) && morseGetRunning()){
        	morseStop();
        }

        if (currentRoom.getId() == 47 && game.isTaskComplete(COMMS_ON) && !morseGetRunning()){
        	morseStart();
        }

        if(!isTaskComplete(POST_COMMS_MESSAGE)){
        	if(currentRoom.getId() == 54 && isTaskComplete(COMMS_ON)){
        		talking_timer += dt;
        		if (talking_timer > 20){
	            	ShowDialog("We have comms on.\nWe have the ship\nfixed. We've sent a\ndistress signal. Time\nto get out of here.", MILLER_AVATAR, true);
	            	ShowDialog("Head to the bridge.", MILLER_AVATAR, false);
	            	completeTask(POST_COMMS_MESSAGE);
        		}
        	}
        }



        if (!isTaskComplete(FINAL_FLEET_ALERT)) {
        	if (currentRoom.getId() == 64 && isTaskComplete(COMMS_ON)){
        		talking_timer += dt;
        		if (talking_timer > 30){
        			ShowAlert("---- WARNING ----\nMultiple Ships Inbound!");
	            	ShowDialog("BOOK IT!\nThis is going to be\nworse than the last\none.", MILLER_AVATAR, true);
		            completeTask(FINAL_FLEET_ALERT);
        		}
        	}
        }
    }

    if (lastThink > THINK_INTERVAL) {
        if (!player.think(&currentRoom))
            quit = true;
        for (int i=0; i<24; ++i)
            if (objects[i])
                if (!objects[i]->think(&currentRoom))
                    delObject(i);

        for(int i=0; i<24; ++i)
            if (objects[i]) {
                for(int j=i+1; j<24;++j)
                    if (objects[j])
                        if (objects[i]->getBoundingbox().intersects(objects[j]->getBoundingbox())) {
                            objects[i]->collide(objects[j]);
                            objects[j]->collide(objects[i]);
                        }

                if (objects[i]->getBoundingbox().intersects(player.getBoundingbox())) {
                    objects[i]->collide(&player);
                    player.collide(objects[i]);
                }
            }

        if ((currentRoom.getId() == 30) && isTaskComplete(SHOOT_OUT) && (!isTaskComplete(EXPLODED))) {
            int count = 0;
            for (int i=0; i<24; ++i) {
                if (objects[i] != NULL) {
                    if (!objects[i]->playerTeam)
                        count++;
                }
            }
            if (count < 5) {
                uint8_t r;
                nrf_drv_rng_rand(&r,1);
                r %= 3;
                Point at = Point(12, 36 + 12 * r);
                addObject(new Marine(at));
            }
        }
        lastThink %= THINK_INTERVAL;
    }

    if (player.position.x < TILE_SIZE/2) {
        changeRoom(currentRoom.getNextRoom(LEFT));
        player.position.x = GWIDTH - TILE_SIZE/2;
    }
    else if (player.position.x > (GWIDTH - TILE_SIZE/2)) {
        changeRoom(currentRoom.getNextRoom(RIGHT));
        player.position.x = TILE_SIZE/2;
    }
    else if (player.position.y < TILE_SIZE/2) {
        changeRoom(currentRoom.getNextRoom(UP));
        player.position.y = GHEIGHT - TILE_SIZE/2;
    }
    else if (player.position.y > (GHEIGHT - TILE_SIZE/2)) {
        changeRoom(currentRoom.getNextRoom(DOWN));
        player.position.y = TILE_SIZE/2;
    }

}


void GameEngine::changeRoom(int id) {
    for (int i=0; i<24; ++i) {
        if (objects[i]) {
            delete objects[i];
            objects[i] = NULL;
        }
    }
    currentRoom = Room(id, mapstates[id]);
    updateLocator();

    //Enable voltage measuring
    if (id == 0)
        nrf_gpio_pin_set(27);
    else
        nrf_gpio_pin_clear(27);

}

void GameEngine::addObject(GameObject *obj) {
#ifdef DEBUGMODE
    printf("Attempting to add object.\n");
#endif
    for (int i=8; i<24; ++i) {
        if (objects[i] == NULL) {
            objects[i] = obj;
#ifdef DEBUGMODE
    printf("Added object to %d\n", i);
#endif
            return;
        }
    }
    //no room for it so drop it on the floor
#ifdef DEBUGMODE
    printf("Add object failed. No room on in objects array.\n");
#endif
    delete obj;
}

void GameEngine::addObject(GameObject *obj, uint8_t id) {
    if (objects[id]) //this shouldn't happen
        delete objects[id];
    objects[id] = obj;
}

void GameEngine::delObject(int idx) {
    if (idx<8)
        mapstates[currentRoom.getId()] |= (1<<idx);
    delete objects[idx];
    objects[idx] = NULL;
}

Player* GameEngine::getPlayer() {
    return &player;
}


bool GameEngine::isBlocked(Rect box) {
    for (int i=0; i<24; ++i) {
        if (objects[i])
            if (objects[i]->isBlocking())
                if (box.intersects(objects[i]->getBoundingbox()))
                    return true;
    }
    return false;
}


bool GameEngine::isTaskComplete(Checkpoint it) {
    uint8_t i = it /8;
    uint8_t b = it % 8;
    return (gamestate[i] & (1<<b));
}

void GameEngine::completeTask(Checkpoint it) {
    uint8_t i = it /8;
    uint8_t b = it % 8;
    gamestate[i] |= (1<<b);
    updateShipLights();
    updateScore();
}

void GameEngine::unCompleteTask(Checkpoint it) {
    uint8_t i = it /8;
    uint8_t b = it % 8;
    gamestate[i] ^= (1<<b);
    updateShipLights();
    updateScore();
}


void GameEngine::interact(Rect loc) {
    //TODO: stop game timer
    for (int i=0; i<24; ++i) {
        if (objects[i])
            if (loc.intersects(objects[i]->getBoundingbox()))
                objects[i]->interact(&canvas);
    }
}


void GameEngine::flicker(bool twice) {
    _flicker = twice?50:4;
}

uint32_t crc32_for_byte(uint32_t r) {
    for(int j = 0; j < 8; ++j)
        r = (r & 1? 0: (uint32_t)0xEDB88320L) ^ r >> 1;
    return r ^ (uint32_t)0xFF000000L;
}

void crc32(const void *data, size_t n_bytes, uint32_t* crc) {
    static uint32_t table[0x100];
    if(!*table)
        for(size_t i = 0; i < 0x100; ++i)
            table[i] = crc32_for_byte(i);
    for(size_t i = 0; i < n_bytes; ++i)
        *crc = table[(uint8_t)*crc ^ ((uint8_t*)data)[i]] ^ *crc >> 8;
}

bool GameEngine::saveGame(const char* filename) {
    FIL file;
    uint32_t crc=0;
    uint32_t did = NRF_FICR->DEVICEADDR[0];

    if (game.isTaskComplete(RACE_START) && (!game.isTaskComplete(BEAT_RACE) && (currentRoom.getId() != 4))) {
        printf("Player tried to save during race! No cheating!\n");
        return false;
    }
    if (!game.isTaskComplete(SETBLE))
    	snprintf(ble_name, 11, "TaSheep801");

    uint8_t p[4] = {(uint8_t)player.position.x, (uint8_t)player.position.y, (uint8_t)player.getLife(), currentRoom.getId()};
    UINT br=0;

    FRESULT result = f_open(&file, filename, FA_WRITE | FA_OPEN_ALWAYS);
    if (result != FR_OK) {
        NRF_LOG_INFO("Can't load file %s\n", filename);
        return false;
    }

    crc32(p, 4, &crc);
    f_write(&file, p, 4, &br);
    crc32(gamestate, sizeof(gamestate), &crc);
    f_write(&file, gamestate, sizeof(gamestate), &br);
    crc32(mapstates, sizeof(mapstates), &crc);
    f_write(&file, mapstates, sizeof(mapstates), &br);
    crc32(&did, sizeof(did), &crc);
    f_write(&file, &did, sizeof(did), &br);
    crc32(&ble_name, sizeof(ble_name), &crc);
    f_write(&file, &ble_name, sizeof(ble_name), &br);
    f_write(&file, &crc, sizeof(crc), &br);
    f_close(&file);
    return true;
}


bool GameEngine::loadGame(const char* filename) {
    FIL file;
    uint32_t crc=0, check=0;
    uint32_t did;

    uint8_t p[4];
    UINT br=0;

    FRESULT result = f_open(&file, filename, FA_READ | FA_OPEN_EXISTING);
    if (result != FR_OK) {
        NRF_LOG_INFO("Can't load file %s\n", filename);
        return false;
    }

    f_read(&file, p, 4, &br);
    crc32(p, 4, &crc);
    player.position = Point(p[0], p[1]);
    int life = p[2];
    if (life < 33) life = 33; //don't want to restore a save with low life
    player.setLife(life);
    changeRoom(p[3]);
    f_read(&file, gamestate, sizeof(gamestate), &br);
    crc32(gamestate, sizeof(gamestate), &crc);
    f_read(&file, mapstates, sizeof(mapstates), &br);
    crc32(mapstates, sizeof(mapstates), &crc);
    f_read(&file, &did, sizeof(did), &br);
    crc32(&did, sizeof(did), &crc);
    f_read(&file, &ble_name, sizeof(ble_name), &br);
    crc32(&ble_name, sizeof(ble_name), &crc);
    f_read(&file, &check, sizeof(crc), &br);
    f_close(&file);

    bool failed=false;
    if (did != NRF_FICR->DEVICEADDR[0]) {
        NRF_LOG_INFO("Save file not for this device! %x!=%x", did, NRF_FICR->DEVICEADDR[0]);
        failed = true;
    }
    if (check != crc) {
        NRF_LOG_INFO("Bad CRC! %x!=%x", crc, check);
        failed = true;
    }
    if (failed) {
        changeRoom(16);
        player.setLife(60);
        memset(mapstates, 0, sizeof(mapstates));
        memset(gamestate, 0, sizeof(gamestate));
        NRF_LOG_INFO("Deleting %s", filename);
        f_unlink(filename);
    }
    updateShipLights();
    advertising_setUser(ble_name);
    updateScore();
    return true;
}

void GameEngine::updateShipLights() {
    shipLightsOff();

    if (isTaskComplete(ALL_DONE)) {
        ledPulse(LED_PERSON_COMPBAY);
        ledPulse(LED_PERSON_ENGINE);
        ledPulse(LED_PERSON_SHIELDS);
        ledPulse(LED_PERSON_ENGINEERING);
        ledPulse(LED_PERSON_CARGO);
        ledPulse(LED_PERSON_DAMAGED);
        ledPulse(LED_PERSON_BRIDGE);
    }

    if (isTaskComplete(FIRST_ATTEMPT)) {
        ledOn(LED_CARGO);
        ledOn(LED_HULL3);
        ledPulse(LED_ENGINEERING);
    }
    else {
        ledPulse(LED_HULL3);
        return;
    }

    if (isTaskComplete(CORE_POWERED)) {
        ledOn(LED_ENGINEERING);
    }
    else {
        ledPulse(LED_ENGINEERING);
        return;
    }

    if (isTaskComplete(COMP_UNLOCKED)) {
        ledOn(LED_COMPBAY);
    }
    else {
        ledPulse(LED_COMPBAY);
        return;
    }

    if (isTaskComplete(BRIDGE_OPEN)) {
        ledOn(LED_BRIDGE);
    }
    else {
        ledPulse(LED_BRIDGE);
        return;
    }

    if (isTaskComplete(TRUSTERS_ON)) {
        ledOn(LED_ENGINE1);
        ledOn(LED_ENGINE2);
        ledPwm(LED_THRUST_B, 30);
        ledPwm(LED_THRUST_G, 30);
    }
    else {
        ledPulse(LED_ENGINE1);
        ledPulse(LED_ENGINE2);
    }

    if (isTaskComplete(WEAPONS_ON)) {
        ledOn(LED_WEAPONS1);
        ledOn(LED_WEAPONS2);
    }
    else {
        ledPulse(LED_WEAPONS1);
        ledPulse(LED_WEAPONS2);
    }

    if (isTaskComplete(RACE_START))
            ledPulseFast(LED_BRIDGE);
    else
        return;

    if (isTaskComplete(BEAT_RACE)) {
        ledOn(LED_BRIDGE);
    }
    else
        return;


    if (isTaskComplete(SHIELDS_ON)) {
        ledOn(LED_SHIELDS);
    }
    else {
        ledPulse(LED_SHIELDS);
        return;
    }

    if (isTaskComplete(DEAD_OPEN)) {
        ledOn(LED_DAMAGED);
    }
    else {
        ledPulse(LED_DAMAGED);
        return;
    }

    if (isTaskComplete(COMMS_ON)) {
        ledOn(LED_COMM1);
        ledOn(LED_COMM2);
    }
    else {
        ledPulse(LED_COMM1);
        ledPulse(LED_COMM2);
        return;
    }

    if (!isTaskComplete(ALL_DONE)) {
        ledPulse(LED_BRIDGE);
    }


}

void GameEngine::updateLocator() {
    ledOff(LED_PERSON_COMPBAY);
    ledOff(LED_PERSON_CARGO);
    ledOff(LED_PERSON_DAMAGED);
    ledOff(LED_PERSON_SHIELDS);
    ledOff(LED_PERSON_BRIDGE);
    ledOff(LED_PERSON_ENGINE);
    ledOff(LED_PERSON_ENGINEERING);

    switch (currentRoom.getId()) {
        case 0:
        case 37:
        case 38:
        case 43:
        case 44:
        case 49:
        case 50:
        case 56:
        case 57:
            ledOn(LED_PERSON_COMPBAY);
            break;
        case 2:
        case 3:
        case 4:
        case 5:
            ledOn(LED_PERSON_ENGINE);
            break;
        case 12:
        case 19:
        case 26:
        case 33:
            ledOn(LED_PERSON_SHIELDS);
            break;
        case 10:
        case 11:
        case 17:
        case 18:
        case 24:
        case 25:
        case 32:
            ledOn(LED_PERSON_ENGINEERING);
            break;
        case 9:
        case 16:
        case 23:
        case 30:
        case 31:
            ledOn(LED_PERSON_CARGO);
            break;
        case 39:
        case 40:
        case 45:
        case 46:
        case 47:
        case 51:
        case 52:
        case 53:
        case 54:
        case 58:
        case 59:
        case 60:
        case 61:
            ledOn(LED_PERSON_DAMAGED);
            break;
        case 100:
            ledOn(LED_PERSON_BRIDGE);
            break;
        default:
            break;
    }
    ledShow();
}

void GameEngine::updateScore(){
	int score = getScore();

	advertising_setScore(score);
	printf("Score: %d\n", score);
}

int GameEngine::getScore(){
	int score = 0;

	if (isTaskComplete(ALL_DONE))
		score = 801;
	else {
		for (int i = 0; i < GAMESTATE_SIZE; i++){
			for (uint16_t k = 0; k < 8; k++){
				score += (gamestate[i] & ( 1 << k )) >> k;
			}
		}
	}
	return score;
}
