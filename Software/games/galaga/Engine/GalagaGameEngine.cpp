/*
 * GalagaGameEngine.cpp
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */
#include <games/galaga/Objects/RenderedObjects.h>
#include "games/galaga/Engine/ResourceLoader/ResourceLoader.h"

#include "GalagaGameEngine.h"
#include "games/galaga/Resources/maps/Level1.h"



GalagaGameEngine galagaGame;

GalagaGameEngine::GalagaGameEngine() : lastFrame(0){
    for (int i=0; i<16; ++i) {
//        objects[i] = NULL;
    }
    memset(mapstates, 0, sizeof(mapstates));
    memset(gamestate, 0, sizeof(gamestate));
    window = RenderedObjects();
    userControls = CheckInput();
    ResourceLoader* resourceLoader = ResourceLoader::getInstance();
    (*resourceLoader).setRenderedObject(&window);


    //gamestate = 0xFFFFFFFF;

}

//RenderedObjects* GalagaGameEngine::getRenderedObjects(){
//	return &window;
//}

int GalagaGameEngine::start() {
    printf("Game starting\n");
    quit = false;
    racestart = 0;


    Level1 level = Level1(&window);
    level.setup();
    printf("SetupFinished\n");

    lastTime = millis();
    while (!quit){
    	uint32_t current = millis();
        loop(millis_elapsed(current, lastTime));
        lastTime = current;
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

    return 1;

}

void GalagaGameEngine::loop(uint32_t dt) {
    lastFrame += dt;
    lastProcess += dt;
    if (lastFrame > FRAME_INTERVAL) {
        while (st7735_is_busy()) {
            APP_ERROR_CHECK(sd_app_evt_wait());
        }




       window.renderCanvas();
       userControls.CheckUserInput();


       lastFrame %= FRAME_INTERVAL;
    }

    if (lastProcess > PROCESS_INTERVAL) {



 	   lastProcess %= PROCESS_INTERVAL;
    }

}
