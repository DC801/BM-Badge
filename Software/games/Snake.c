//
// Created by sirged on 8/1/18.
// Modified by hamster on 8/8/18 for max lols

#define SNAKE

#include "Snake.h"

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

#define HEIGHT 21
#define WIDTH 21

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

    util_gfx_fill_screen(COLOR_BLACK);

    util_gfx_fill_rect(0, 0, GFX_WIDTH, 16, COLOR_BLACK);
    util_gfx_draw_line(0, 16, GFX_WIDTH, 16, COLOR_BLUE);

	area_t game_area = {0, 0, GFX_WIDTH, GFX_HEIGHT};
	util_gfx_cursor_area_set(game_area);
	util_gfx_set_cursor(game_area.xs, game_area.ys);


    util_gfx_set_font(FONT_COMPUTER_12PT);
    if (rand > 128) {
        util_gfx_set_color(COLOR_RED);
        util_gfx_set_cursor(44, 40);
        util_gfx_print("OMG");
        util_gfx_set_cursor(20, 58);
        util_gfx_print("A SNAKE");
        retScore = -100;
    } else {
        util_gfx_set_color(COLOR_GREEN);
        util_gfx_set_cursor(5, 55);
        util_gfx_print("NO SNAKES!");
        retScore = 100;
    }

    util_gfx_set_font(FONT_GAMEPLAY_5PT);
    util_gfx_set_color(COLOR_BLUE);
    util_gfx_set_cursor(5, 5);
    char header[25];
    snprintf(header, 25, "%d", retScore);
    util_gfx_print(header);

    while (!getButton(false)) {}
    while (getButton(false)) {}

    return retScore;

    /**
    char board[WIDTH][HEIGHT];
    struct SNAKE_TILE *head = NULL;
    if ((head = malloc(sizeof(struct SNAKE_TILE))) == NULL)
        return -1;
    head->x = 0;
    head->y = 0;
    head->next = NULL;
    init_board(&board[WIDTH][HEIGHT]);
    int score = 0;
    int direction_of_travel = WEST;

    do {

        // Get move
        switch(getButton(false)){
            case USER_BUTTON_B:
                // Pause game
                while(getButton(false)){ }
                if (pauseSnake())
                    return score;
                break;
            case USER_BUTTON_RIGHT:
                direction_of_travel = EAST;
                break;
            case USER_BUTTON_LEFT:
                direction_of_travel = WEST;
                break;
            case USER_BUTTON_UP:
                direction_of_travel = NORTH;
                break;
            case USER_BUTTON_DOWN:
                direction_of_travel = SOUTH;
                break;
        }

        // Step game
        int new_x = head->x;
        int new_y = head->y;
        switch (direction_of_travel) {
            case NORTH:
                if (head->y == 0)
                    return score;
                new_y--;
                break;
            case SOUTH:
                if (head->x == WIDTH - 1)
                    return score;
                new_x++;
                break;
            case EAST:
                if (head->y == HEIGHT - 1)
                    return score;
                new_y++;
                break;
            case WEST:
                if (head->x == 0)
                    new_x--;
                break;
        }
        // Check for collision with self
        struct SNAKE_TILE* node = head;
        while (node != NULL) {
            if (node->x == new_x && node->y == new_y)
                return score;
            node = node->next;
        }
        // Push new head
        if ((node = malloc(sizeof(struct SNAKE_TILE))) == NULL)
            return -1;
        node->next = head;
        node = head;
        // Check for food
        bool ate_food = false;
        switch (board[head->x][head->y]) {
            case TILE_FOOD_1:
            case TILE_FOOD_2:
            case TILE_FOOD_3:
                score += 10;
                ate_food = true;
                break;
        }
        if (!ate_food) {
            struct SNAKE_TILE* last_node = head;
            node = head->next;
            while (node != NULL) {
                if (node->next == NULL)
                    last_node->next = NULL;
                last_node = node;
                node = node->next;
            }
        }


        // Print board
        util_gfx_fill_screen(COLOR_BLACK);
        util_gfx_fill_rect(0,50,128,35,COLOR_GREEN);

    } while (true);

     */
}

static void init_board(char *board) {
    int length = WIDTH * HEIGHT;
    for (int i = 0; i < length; i++) {
        board = TILE_EMPTY;
        board++;
    }
}

static bool pauseSnake(void) {

    util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_YELLOW);
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_BLACK);
    util_gfx_set_cursor(30, 60);
    util_gfx_print("PAUSED");

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

    util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_BLACK);

    return false;
}
