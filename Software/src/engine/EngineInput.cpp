#include "common.h"

bool running = true;

void EngineHandleInput (ButtonStates* buttons) {
    *buttons = {
        .up    = false,
        .down  = false,
        .left  = false,
        .right = false,
    };
    #ifdef DC801_DESKTOP
    SDL_Event e;
    if (application_quit != 0)
    {
        running = false;
    }

    while (SDL_PollEvent(&e))
    {
        if (e.type == SDL_QUIT)
        {
            running = false;
            break;
        }

        if (e.type == SDL_KEYDOWN)
        {
            if (
                e.key.keysym.sym == SDLK_ESCAPE
                || e.key.keysym.scancode == SDL_SCANCODE_Q
            )
            {
                running = false;
                break;
            }
        }
    }

    nrf_delay_ms(5);
    #endif

    #ifdef DC01_EMBEDDED
    app_usbd_event_queue_process();
    #endif

    if (isButtonDown(USER_BUTTON_UP)) {
        buttons->up = true;
    }
    if (isButtonDown(USER_BUTTON_DOWN)) {
        buttons->down = true;
    }
    if (isButtonDown(USER_BUTTON_LEFT)) {
        buttons->left = true;
    }
    if (isButtonDown(USER_BUTTON_RIGHT)) {
        buttons->right = true;
    }
}

bool EngineIsRunning() {
    return running;
}