//
// Created by sirged on 8/1/18.
// Modified by hamster on 8/8/18 for max lols

#define SNAKE

#include "Snake.h"
#include "games/hcrn/FrameBuffer.h"

#define FOOD_HEIGHT 6
#define FOOD_WIDTH 6
#define FOOD_SIZE (FOOD_HEIGHT * FOOD_WIDTH)

//#define NULL 0

#define NORTH 0
#define SOUTH 1
#define EAST 2
#define WEST 3

#define TILE_EMPTY 0
#define TILE_FOOD_1 1
#define TILE_FOOD_2 2
#define TILE_FOOD_3 3

#define SNAKE_HEIGHT 21
#define SNAKE_WIDTH 21

struct {
    uint8_t foodSprite[2][FOOD_SIZE];
    int score;
    //uint8_t snakeSprite[SNAKE_SIZE];
    //SNAKEHEAD snakehead;
    //FOOD food;
    //bool toggle;
    //bool bounce;
    //uint8_t foodRemaining;
    //uint8_t level;
    //uint8_t powerup;
    //bool quitGame;
} SnakeVal;

int Snake(void) {
    util_sd_load_file("GAMES/SNAKE/FOOD1.RAW", SnakeVal.foodSprite[0], FOOD_SIZE);
    util_sd_load_file("GAMES/SNAKE/FOOD2.RAW", SnakeVal.foodSprite[1], FOOD_SIZE);
    util_sd_load_file("GAMES/SNAKE/FOOD3.RAW", SnakeVal.foodSprite[2], FOOD_SIZE);

    return run_game();
}

static int run_game() {

    uint8_t rand;

    nrf_drv_rng_rand(&rand, 1);

    int retScore = 0;

    p_canvas()->clearScreen(COLOR_BLACK);
    // util_gfx_fill_screen(COLOR_BLACK);

    p_canvas()->fillRect(0, 0, WIDTH, 16, COLOR_BLACK);
    // util_gfx_fill_rect(0, 0, WIDTH, 16, COLOR_BLACK);
    p_canvas()->drawHorizontalLine(0, 16, WIDTH, COLOR_BLUE);
    // util_gfx_draw_line(0, 16, WIDTH, 16, COLOR_BLUE);

    area_t game_area = { 0, 0, WIDTH, HEIGHT };
    p_canvas()->setTextArea(&game_area);
	// area_t game_area = {0, 0, WIDTH, HEIGHT};
	// util_gfx_cursor_area_set(game_area);
	// util_gfx_set_cursor(game_area.xs, game_area.ys);

    // util_gfx_set_font(FONT_COMPUTER_12PT);
    if (rand > 128) {
        p_canvas()->printMessage("OMG", Computerfont12pt7b, COLOR_RED, 44, 40);
        // util_gfx_set_color(COLOR_RED);
        // util_gfx_set_cursor(44, 40);
        // util_gfx_print("OMG");

        p_canvas()->printMessage("A SNAKE", Computerfont12pt7b, COLOR_RED, 20, 58);
        // util_gfx_set_cursor(20, 58);
        // util_gfx_print("A SNAKE");
        retScore = -100;
    } else {
        p_canvas()->printMessage("NO SNAKES!", Computerfont12pt7b, COLOR_GREEN, 5, 55);
        // util_gfx_set_color(COLOR_GREEN);
        // util_gfx_set_cursor(5, 55);
        // util_gfx_print("NO SNAKES!");
        retScore = 100;
    }

    char header[25];
    snprintf(header, 25, "%d", retScore);

    p_canvas()->printMessage(header, gameplay5pt7b, COLOR_BLUE, 5, 5);
    // util_gfx_set_font(FONT_GAMEPLAY_5PT);
    // util_gfx_set_color(COLOR_BLUE);
    // util_gfx_set_cursor(5, 5);
    // util_gfx_print(header);

    while (!getButton(false)) {}
    while (getButton(false)) {}

    return retScore;
}

static void init_board(char *board) {
    int length = SNAKE_WIDTH * SNAKE_HEIGHT;
    for (int i = 0; i < length; i++) {
        board = TILE_EMPTY;
        board++;
    }
}

static bool pauseSnake(void) {
    p_canvas()->fillRect(0, 50, WIDTH, 35, COLOR_YELLOW);
    // util_gfx_fill_rect(0, 50, WIDTH, 35, COLOR_YELLOW);

    p_canvas()->printMessage("PAUSED", Computerfont12pt7b, COLOR_BLACK, 30, 60);
    // util_gfx_set_font(FONT_COMPUTER_12PT);
    // util_gfx_set_color(COLOR_BLACK);
    // util_gfx_set_cursor(30, 60);
    // util_gfx_print("PAUSED");

    uint8_t button;
    bool resume = false;

    while (!resume) {
        button = getButton(false);

        if (button != USER_BUTTON_NONE) {
            // Resume the game
            resume = true;

            // User wants to quit
            if (button == USER_BUTTON_B) {
                return true;
            }

            // Wait for button release
            while (getButton(false)) {}
        }
    }

    p_canvas()->fillRect(0, 50, WIDTH, 35, COLOR_BLACK);
    // util_gfx_fill_rect(0, 50, WIDTH, 35, COLOR_BLACK);

    return false;
}
