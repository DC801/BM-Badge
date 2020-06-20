/**
 *
 * @file main.c
 *
 * @date May 24, 2017
 * @author hamster
 *
 * @brief This is the entry point for the DC801 DC26 party badge
 *
 */

#include <stdint.h>
#include "common.h"
#include "user.h"

#ifdef DC801_DESKTOP
#include<signal.h>

const int SCREEN_WIDTH = 128;
const int SCREEN_HEIGHT = 128;

SDL_Window* window = NULL;
SDL_Renderer* renderer = NULL;

volatile sig_atomic_t application_quit = 0;

void sig_handler(int signo)
{
    if (signo == SIGINT)
    {
        printf("received SIGINT\n");
        application_quit = 1;
    }
}

#endif

#define XVAL(x) #x
#define VAL(x)  XVAL(x)

/*
#pragma message ("TIMER_ENABLED=" VAL(TIMER_ENABLED))
#pragma message ("TIMER1_ENABLED=" VAL(TIMER1_ENABLED))
#pragma message ("NRFX_TIMER_ENABLED=" VAL(NRFX_TIMER_ENABLED))
#pragma message ("NRFX_TIMER1_ENABLED=" VAL(NRFX_TIMER1_ENABLED))
*/


volatile bool partyMode = false;
volatile bool sheepMode = false;

APP_TIMER_DEF(standby_animation_timer_id);

static void standby_animation_timeout_handler(void *p_context) {
    UNUSED_PARAMETER(p_context);

    p_canvas()->drawStop();
    // util_gfx_draw_raw_file_stop();
}

/**
 * Initialize the buttons
 */
static void button_init(void){
    // Setup the buttons
    #ifdef DC801_EMBEDDED
    nrf_gpio_cfg_input(USER_BUTTON_UP, NRF_GPIO_PIN_NOPULL);
    nrf_gpio_cfg_input(USER_BUTTON_DOWN, NRF_GPIO_PIN_NOPULL);
    nrf_gpio_cfg_input(USER_BUTTON_LEFT, NRF_GPIO_PIN_NOPULL);
    nrf_gpio_cfg_input(USER_BUTTON_RIGHT, NRF_GPIO_PIN_NOPULL);
    nrf_gpio_cfg_input(USER_BUTTON_A, NRF_GPIO_PIN_NOPULL);
    nrf_gpio_cfg_input(USER_BUTTON_B, NRF_GPIO_PIN_NOPULL);
    #else
    nrf_gpio_cfg_input(USER_BUTTON_UP, NRF_GPIO_PIN_PULLUP);
    nrf_gpio_cfg_input(USER_BUTTON_DOWN, NRF_GPIO_PIN_PULLUP);
    nrf_gpio_cfg_input(USER_BUTTON_LEFT, NRF_GPIO_PIN_PULLUP);
    nrf_gpio_cfg_input(USER_BUTTON_RIGHT, NRF_GPIO_PIN_PULLUP);
    nrf_gpio_cfg_input(USER_BUTTON_A, NRF_GPIO_PIN_PULLUP);
    nrf_gpio_cfg_input(USER_BUTTON_B, NRF_GPIO_PIN_PULLUP);
    #endif
}

/**
 * Initialize the speaker
 */
static void speaker_init(void){
    // Setup the beeper
    nrf_gpio_cfg_output(SPEAKER);
}

/**
 * Initialize the logging backend for logging over JTAG
 */
static void log_init(void){
    ret_code_t err_code = NRF_LOG_INIT(NULL);
    APP_ERROR_CHECK(err_code);

    NRF_LOG_DEFAULT_BACKENDS_INIT();
}

/**
 * Handler to show the LEDs during bootup animation
 * @param frame
 * @param p_data
 */
static void bootCallback(uint8_t frame, void *p_data){
    const int speed = 4;

    if (frame == 5) {
        ledOn(LED_COMPBAY);
        ledOn(LED_CARGO);
        ledOn(LED_DAMAGED);
        ledOn(LED_SHIELDS);
        ledOn(LED_DAMAGED);
        ledOn(LED_BRIDGE);
        ledShow();
    }
    else if (frame == 30) {
        ledOn(LED_GUN1);
        ledOn(LED_GUN2);
        ledOn(LED_GUN3);
        ledOn(LED_GUN4);
        ledShow();
    }
    else if (frame == 45) {
        ledOn(LED_WEAPONS1);
        ledOn(LED_WEAPONS2);
        ledShow();
    }
    else if (frame == 55) {
        ledOn(LED_COMM1);
        ledOn(LED_COMM2);
        ledShow();
    }
    else if (frame == 70) {
        ledOn(LED_HULL1);
        ledOn(LED_HULL2);
        ledOn(LED_HULL3);
        ledOn(LED_HULL4);
        ledShow();
    }
    else if (frame == 75) {
        ledOn(LED_ENGINE1);
        ledOn(LED_ENGINE2);
        ledOn(LED_ENGINEERING);
        ledShow();
    }
    else if (frame == 85) {
        ledOn(LED_LIFE1);
        ledShow();
    }
    else if (frame == 95) {
        ledOn(LED_LIFE2);
        ledShow();
    }
    else if (frame == 105) {
        ledOn(LED_LIFE3);
        ledShow();
    }
    else if (frame == 115) {
        ledOn(LED_LIFE4);
        ledShow();
    }
    else if (frame == 125) {
        ledOn(LED_LIFE5);
        ledShow();
    }
    else if ((frame == 145) || (frame == 155) || (frame == 165) || (frame == 175)) {
        ledOff(LED_COMPBAY);
        ledOff(LED_CARGO);
        ledOff(LED_DAMAGED);
        ledOff(LED_SHIELDS);
        ledOff(LED_DAMAGED);
        ledOff(LED_BRIDGE);
        ledOff(LED_ENGINE1);
        ledOff(LED_ENGINE2);
        ledOff(LED_ENGINEERING);
        ledOn(LED_PERSON_COMPBAY);
        ledOn(LED_PERSON_CARGO);
        ledOn(LED_PERSON_DAMAGED);
        ledOn(LED_PERSON_SHIELDS);
        ledOn(LED_PERSON_BRIDGE);
        ledOn(LED_PERSON_ENGINE);
        ledOn(LED_PERSON_ENGINEERING);
        ledShow();
    }
    else if ((frame == 140) || (frame == 150) || (frame == 160) || (frame == 170) || (frame == 180)) {
        ledOn(LED_COMPBAY);
        ledOn(LED_CARGO);
        ledOn(LED_DAMAGED);
        ledOn(LED_SHIELDS);
        ledOn(LED_DAMAGED);
        ledOn(LED_BRIDGE);
        ledOn(LED_ENGINE1);
        ledOn(LED_ENGINE2);
        ledOn(LED_ENGINEERING);
        ledOff(LED_PERSON_COMPBAY);
        ledOff(LED_PERSON_CARGO);
        ledOff(LED_PERSON_DAMAGED);
        ledOff(LED_PERSON_SHIELDS);
        ledOff(LED_PERSON_BRIDGE);
        ledOff(LED_PERSON_ENGINE);
        ledOff(LED_PERSON_ENGINEERING);
        ledShow();
    }
    else if (frame == 195) {
        ledPulse(LED_PERSON_ENGINEERING);
        ledShow();
    }
}

/**
 * Handler to show the LED blink during party mode
 * @param frame
 * @param p_data
 */
static void partyCallback(uint8_t frame, void *p_data){

}

typedef enum {
    item_games,
    item_extras,
    item_credits,
    NUM_MENU_MAIN_ITEMS
} MENU_MAIN;


MENU mainMenu[NUM_MENU_MAIN_ITEMS] = {
        { item_games, "Games" },
        { item_extras, "Extras"},
        { item_credits, "Credits" },
};

/**
 * @brief Main app
 * @return Not used
 */
int main(void){

    #ifdef DC801_DESKTOP

    signal(SIGINT, sig_handler);

    #endif

    // Setup the system
    log_init();
    button_init();
    speaker_init();


    // Timers
    app_timer_init();
    usb_serial_init();

    // BLE
    //gap_params_init();
    ble_stack_init();
    scan_start();

#ifdef DC801_EMBEDDED
    // Init the display
    st7735_init();
	st7735_start();
	util_gfx_init();
#endif

    // Init the random number generator
    nrf_drv_rng_init(NULL);

    // Setup the battery monitor
    adc_configure();
    adc_start();

    // Setup the UART
    uart_init();

    // Setup I2C
    twi_master_init();

    // Setup I2S
    i2s_master_init();

    // Setup LEDs
    ledInit();
    ledsOff();

    morseInit();

    if(!util_sd_init()){
        util_sd_error();
    }

#ifdef DC801_DESKTOP
    if(SDL_Init(SDL_INIT_VIDEO) < 0)
    {
        printf("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
        exit(1);
    }
    else
    {
        //Create window
        SDL_CreateWindowAndRenderer(512, 512, SDL_WINDOW_SHOWN, &window, &renderer);

        if( window == NULL )
        {
            printf("Window could not be created! SDL_Error: %s\n", SDL_GetError());
            exit(1);
        }
        else
        {
            SDL_RenderSetLogicalSize(renderer, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
    }
#endif

    // Boot! Boot! Boot!
    printf("Booted!\n");
    // printf goes to the RTT_Terminal.log after you've fired up debug.sh

    EEpwm_init();

    // Init the WarGames game
    wg_Init();

    // Configure the systick
    sysTickStart();

    // Setup a timer for shutting down animations in standby
    app_timer_create(&standby_animation_timer_id, APP_TIMER_MODE_SINGLE_SHOT, standby_animation_timeout_handler);

    const char* ble_name = "TaSheep801"; // must be 10char
    printf("advertising user: %s\n", ble_name);
    advertising_setUser(ble_name);
    ble_adv_start();

#ifdef DC801_EMBEDDED
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wmissing-noreturn"
#endif
    while(true) {

        #ifdef DC801_DESKTOP

        if (application_quit)
        {
            break;
        }

        #endif

        p_canvas()->clearScreen(COLOR_BLACK);
        // util_gfx_fill_screen(COLOR_BLACK);

        // HCRN();
        MAGE();
    }
#ifdef DC801_EMBEDDED
#pragma clang diagnostic pop
#endif

#ifdef DC801_DESKTOP
    SDL_DestroyWindow(window);
    SDL_Quit();

    printf("Exiting gracefully...\n");
    return 0;
#endif
}

/**
 * Show the standby screen
 * @param p_context
 */
void showStandby(void){

    uint16_t nearbyCounter = 0;
    uint16_t animationCounter = 0;
    uint8_t delayCount = 0;
    drawStandby();

    while(true){
        if(getButton(false)){
            // User pressed a button
            return;
        }
        nrf_delay_ms(25);

        if(partyMode){
            // PARTYYYY!
            p_canvas()->drawLoopImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP6.RAW", partyCallback, NULL);
            // util_gfx_draw_raw_file("/EXTRAS/SHEEP6.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, partyCallback, true, NULL);
        }

        if(sheepMode){
            // SHEEEEP
            do{
                uint8_t i;

                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP1.RAW");
                // util_gfx_draw_raw_file("/EXTRAS/SHEEP1.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                for(i = 0; i < 100; i++){
                    if(getButton(false)){
                        break;
                    }
                    nrf_delay_ms(25);
                }

                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP2.RAW");
                // util_gfx_draw_raw_file("/EXTRAS/SHEEP2.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                for(i = 0; i < 100; i++){
                    if(getButton(false)){
                        break;
                    }
                    nrf_delay_ms(25);
                }

                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP3.RAW");
                // util_gfx_draw_raw_file("/EXTRAS/SHEEP3.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                for(i = 0; i < 100; i++){
                    if(getButton(false)){
                        break;
                    }
                    nrf_delay_ms(25);
                }

                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP4.RAW");
                // util_gfx_draw_raw_file("/EXTRAS/SHEEP4.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                for(i = 0; i < 100; i++){
                    if(getButton(false)){
                        break;
                    }
                    nrf_delay_ms(25);
                }

                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP5.RAW");
                // util_gfx_draw_raw_file("/EXTRAS/SHEEP5.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                for(i = 0; i < 100; i++){
                    if(getButton(false)){
                        break;
                    }
                    nrf_delay_ms(25);
                }

                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "EXTRAS/SHEEP6.RAW");
                // util_gfx_draw_raw_file("/EXTRAS/SHEEP6.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                for(i = 0; i < 100; i++){
                    if(getButton(false)){
                        break;
                    }
                    nrf_delay_ms(25);
                }
            }while (!getButton(false));
        }

        if(animationCounter ++ > (15000 / 25)){
            // Show an animation

            uint8_t rand;
            nrf_drv_rng_rand(&rand, 1);

            char files[64][9];
            uint8_t numFiles = 0;

            memset(files, 0, sizeof(files));

            numFiles = getFiles(files, "/EXTRAS", 64);

            rand = rand % numFiles;

            app_timer_start(standby_animation_timer_id, APP_TIMER_TICKS(10000), NULL);

            char filename[21];
            snprintf(filename, 21, "/EXTRAS/%s.RAW", files[rand]);

            p_canvas()->drawLoopImageFromFile(0, 0, WIDTH, HEIGHT, filename);
            // util_gfx_draw_raw_file(filename, 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, true, NULL);

            animationCounter = 0;

            drawStandby();

        }

        if(nearbyCounter++ > (5000 / 25)){
            // Draw a shout
            uint8_t rand;
            nrf_drv_rng_rand(&rand, 1);

            bool haveBadge = false;
            BADGE_ADV badge;
            rand = rand % getBadgeNum();

            if(getBadge(rand, &badge)){

                if(getBadgeIconFile(badge.group) != NULL)
                {
                    p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, getBadgeIconFile(badge.group));
                    // util_gfx_draw_raw_file(getBadgeIconFile(badge.group), 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);
                }
                else
                {
                    p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "GROUPS/MISSING.RAW");
                    // util_gfx_draw_raw_file("/GROUPS/MISSING.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                    p_canvas()->fillRect(0, 0, WIDTH, 15, COLOR_BLACK);
                    // util_gfx_fill_rect(0, 0, GFX_WIDTH, 15, COLOR_BLACK);

                    // uint16_t w, h;
                    // util_gfx_get_text_bounds(groupName, 0, 0, &w, &h);

                    const char *groupName = getBadgeGroupName(badge.group);
                    bounds_t bounds = { 0 };
                    p_canvas()->getTextBounds(VeraMono5pt7b, groupName, 0, 0, &bounds);

                    char name[16];
                    snprintf(name, 16, "%s", groupName);

                    p_canvas()->printMessage(name, VeraMono5pt7b, COLOR_WHITE, 64 - (bounds.width / 2), 2);
                    // util_gfx_set_font(FONT_VERAMONO_5PT);
                    // util_gfx_set_cursor(64 - (w / 2), 2);
                    // util_gfx_print(name);
                }

                for(int i = 0; i < 10; i++){
                    if(i % 2 == 0) {
                        setPowerUpLEDs(POWERUP_4);
                        setLevelLEDs(LEVEL0);
                    }
                    else{
                        setPowerUpLEDs(POWERUP_0);
                        setLevelLEDs(LEVEL4);
                    }

                    delayCount = 0;
                    while(delayCount++ < 10) {
                        if(getButton(false)){
                            setPowerUpLEDs(POWERUP_0);
                            setLevelLEDs(LEVEL0);
                            return;
                        }
                        nrf_delay_ms(25);
                    }
                }
                setPowerUpLEDs(POWERUP_0);
                setLevelLEDs(LEVEL0);

                delayCount = 0;
                while(delayCount++ < 40) {
                    if(getButton(false)){
                        return;
                    }
                    nrf_delay_ms(25);
                }

                drawStandby();
            }

            nearbyCounter = 0;

        }
    }

}

typedef enum {
    game_invaders,
    game_snake,
    game_pips_the_et,
    game_tic_tac_toe,
    NUM_MENU_GAMES_ITEMS
} MENU_GAMES;


MENU gameMenu[NUM_MENU_GAMES_ITEMS] = {
        { game_invaders, "Invaders" },
        { game_snake, "Snake" },
        { game_pips_the_et, "Pips the ET" },
        { game_tic_tac_toe, "TicTacToe" }
};


/**
 * Show the games menu
 */
void games(void){

    drawScreenTemplate();

    int retScore = 0;
    int getGame;
    getGame = getMenuSelection(gameMenu, 25, ARRAY_SIZE(gameMenu) , 4, 15000, true);

    switch(getGame){
        case game_invaders:
            // Space invaders
            retScore = SpaceInvaders(normal, false, 0).score;
            break;
        case game_snake:
            // Snake run
            retScore = Snake();
            break;
        case game_pips_the_et:
            retScore = PipsTheET();
            break;
        case game_tic_tac_toe:
            retScore = TicTacToe();
            break;
        default:
            break;
    }


    // Figure out the score modifier
    retScore = retScore + (retScore * ((getTotalScoreModifier() / 100)));

    // Calculate the user's score
    if(user.score + retScore > 0){
        user.score += retScore;
    }
    else{
        user.score = 0;
    }

    //storeUser();
    //advertising_setScore(user.score);

}




typedef enum {
    extra_fun,
    extra_version,
    NUM_MENU_EXTRA_ITEMS
} MENU_EXTRA;


MENU extraMenu[NUM_MENU_EXTRA_ITEMS] = {
        { extra_fun, "Fun Stuff" },
        { extra_version, "Version" }
};

/**
 * Show the extras menu
 */
void extras(void)
{
    drawScreenTemplate();

    int getExtra = getMenuSelection(extraMenu, 25, ARRAY_SIZE(extraMenu), 4, 15000, true);

    switch(getExtra)
    {
        case extra_fun:
            extraFunBrowser();
            break;
        case extra_version:
            extraVersion();
            break;
        default:
            break;
    }
}

/**
 * Show the credits
 */
void credits(void)
{
    p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "CREDITS.RAW");
    // util_gfx_draw_raw_file("CREDITS.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

    while(true)
    {
        if(getButton(false))
        {
            // User pressed a button
            return;
        }
        nrf_delay_ms(10);
    }
}


void menu(void)
{
    p_canvas()->clearScreen(COLOR_BLACK);
    // util_gfx_fill_screen(COLOR_BLACK);

    drawScreenTemplate();

    int subMenu = getMenuSelection(mainMenu, 25, ARRAY_SIZE(mainMenu), 4, 15000, true);

    switch(subMenu)
    {
        case item_games:
            games();
            break;
        case item_extras:
            extras();
            break;
        case item_credits:
            credits();
            break;
        default:
            return;
    }
}
