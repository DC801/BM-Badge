//
// Created by hamster on 8/1/18.
//
// The exciting 'PIPS THE ET' game
// Oh boy!
//

#define PIPS

#include "PipsTheET.h"

#define PIPS_SIZE (12 * 12 * 2)

struct {
    bool quitGame;
    uint16_t steps;
    uint8_t lives;
    uint8_t pipsSprite[PIPS_SIZE];
    uint8_t x;
    uint8_t y;
    bool inPit;
} Pips;

/**
 * Play Pips the ET, an exciting game with many features
 * @return a score
 */
int PipsTheET(void) {

    memset(&Pips, 0, sizeof(Pips));

    Pips.lives = 1;
    Pips.steps = 9999;
    Pips.x = 56;
    Pips.y = 24;

    util_gfx_fill_screen(COLOR_BLACK);
    util_gfx_fill_rect(0, 2, GFX_WIDTH, 17, COLOR_MAGENTA);
    util_gfx_fill_rect(0, 110, GFX_WIDTH, 16, COLOR_LIGHTBLUE);
	area_t game_area = {0, 0, GFX_WIDTH, GFX_HEIGHT};
	util_gfx_cursor_area_set(game_area);
	util_gfx_set_cursor(game_area.xs, game_area.ys);

    util_sd_load_file("GAMES/PIPS/PIPS.RAW", Pips.pipsSprite, PIPS_SIZE);
    movePips(Pips.x, Pips.y);

    updateSteps(Pips.steps);

    while (Pips.lives != 0 && !Pips.quitGame) {

        bool buttonPress = false;

        switch (getButton(false)) {
            case USER_BUTTON_A:
                break;
            case USER_BUTTON_B:
                // Pause game
                while (getButton(false)) {}
                pauseGame();
                break;
            case USER_BUTTON_RIGHT:
                // Move Pips right
                if (!Pips.inPit) {
                    if (Pips.x < (106)) {
                        Pips.x += 2;
                        Pips.steps--;
                        movePips(Pips.x, Pips.y);
                        buttonPress = true;
                    }
                } else {
                    if (Pips.x < (77)) {
                        Pips.x += 2;
                        Pips.steps--;
                        movePipsInPit(Pips.x);
                        buttonPress = true;
                    }
                }
                break;
            case USER_BUTTON_LEFT:
                // Move Pips left
                if (!Pips.inPit) {
                    if (Pips.x > 9) {
                        Pips.x -= 2;
                        Pips.steps--;
                        movePips(Pips.x, Pips.y);
                        buttonPress = true;
                    }
                } else {
                    if (Pips.x > (40)) {
                        Pips.x -= 2;
                        Pips.steps--;
                        movePipsInPit(Pips.x);
                        buttonPress = true;
                    }
                }
                break;
            case USER_BUTTON_UP:
                // Move Pips up
                if (!Pips.inPit) {
                    if (Pips.y > 25) {
                        Pips.y -= 2;
                        Pips.steps--;
                        movePips(Pips.x, Pips.y);
                        buttonPress = true;
                    }
                }
                break;
            case USER_BUTTON_DOWN:
                // Move Pips down
                if (!Pips.inPit) {
                    if (Pips.y < 93) {
                        Pips.y += 2;
                        Pips.steps--;
                        movePips(Pips.x, Pips.y);
                        buttonPress = true;
                    }
                }
                break;
            default:
                break;
        }

        if (!Pips.inPit) {
            if (checkIfInPit()) {
                updateBanner("OH NO");

                Pips.inPit = true;
                Pips.x = 58;
                movePipsInPit(Pips.x);
            } else {
                if (Pips.steps == 9996) {
                    updateBanner("->");
                }
                if (Pips.steps == 9750) {
                    updateBanner("^");
                }
                if (Pips.steps == 9500) {
                    updateBanner("HELP ME");
                }
                if (Pips.steps == 9280) {
                    updateBanner("...___...");
                }
                if (Pips.steps == 9100) {
                    updateBanner("PHONE PIPS");
                }
                if (Pips.steps == 8000) {
                    updateBanner("PIPS OMG");
                }
                if (Pips.steps == 7000) {
                    updateBanner("PLZ PIPS");
                }
                if (Pips.steps == 600) {
                    updateBanner("PHONE PIPS");
                }
                if (Pips.steps == 5000) {
                    updateBanner("PIPS OMG");
                }
                if (Pips.steps == 4000) {
                    updateBanner("PHONE PIPS");
                }
                if (Pips.steps == 3000) {
                    updateBanner("PIPS OMG");
                }
                if (Pips.steps == 2000) {
                    updateBanner("PHONE PIPS");
                }
                if (Pips.steps == 1000) {
                    updateBanner("ALMOST");
                }
                if (Pips.steps == 100) {
                    updateBanner("ITS");
                }
                if (Pips.steps == 75) {
                    updateBanner("FULL");
                }
                if (Pips.steps == 50) {
                    updateBanner("OF");
                }
                if (Pips.steps == 25) {
                    updateBanner("STARS");
                }
                if (Pips.steps == 0) {
                    updateBanner("WINNER");
                }
            }
        }

        if (buttonPress) {
            updateSteps(Pips.steps);
            if (Pips.steps == 0) {
                Pips.lives = 0;
            }
        } else {
            nrf_delay_us(25);
        }

    }


    if (Pips.lives == 0) {

        util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_RED);
        util_gfx_set_font(FONT_COMPUTER_12PT);
        util_gfx_set_color(COLOR_BLACK);
        util_gfx_set_cursor(5, 60);
        util_gfx_print("GAME OVER");

        while (getButton(false) != USER_BUTTON_A) {
            // Wait until pressed
        }
        while (getButton(false) == USER_BUTTON_A) {
            // Wait until released
        }
    }

    if (Pips.steps == 0 && !Pips.inPit) {
        return 50000;
    }

    return Pips.steps / 10;
}

/**
 * Update the banner at the top of the screen with a centered string
 * @param string
 */
static void updateBanner(char *string) {
    util_gfx_fill_rect(0, 2, GFX_WIDTH, 17, COLOR_MAGENTA);
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_LIGHTGREY);

	area_t game_area = {0, 0, GFX_WIDTH, GFX_HEIGHT};
	util_gfx_cursor_area_set(game_area);
	util_gfx_set_cursor(game_area.xs, game_area.ys);
    uint16_t w = 0;
    uint16_t h = 0;
    util_gfx_get_text_bounds(string, 0, 0, &w, &h);
    printf("Pips: '%s', w: %d\n", string, w);
    util_gfx_set_cursor(64 - (w / 2), 4);

    util_gfx_print(string);
}

/**
 * Check if Pips fell in a pit
 * @return true if in pit
 */
static bool checkIfInPit(void) {

    if (Pips.y >= 40 && Pips.y <= 78) {
        if (Pips.x >= 18 && Pips.x <= 32) {
            // Left pit
            return true;
        }
        if (Pips.x >= 82 && Pips.x <= 96) {
            // Right pit
            return true;
        }
    }


    if (Pips.x >= 50 && Pips.x <= 66) {
        if (Pips.y >= 40 && Pips.y <= 46) {
            // Top pit
            return true;
        }
        if (Pips.y >= 70 && Pips.y <= 78) {
            // Top pit
            return true;
        }
    }


    return false;
}

/**
 * Move pips on the screen
 * @param x left side
 * @param y top side
 */
static void movePips(uint8_t x, uint8_t y) {

    util_gfx_draw_raw_file("GAMES/PIPS/GAMEBACK.RAW", 0, 22, 128, 85, NULL, false, NULL);
    util_gfx_draw_raw(x, y, 12, 12, Pips.pipsSprite);

}

/**
 * Pips is in a pit.  He can only go right and left
 * @param x
 */
static void movePipsInPit(uint8_t x) {

    util_gfx_draw_raw_file("GAMES/PIPS/GAMEPIT.RAW", 0, 22, 128, 85, NULL, false, NULL);
    util_gfx_draw_raw(x, 83, 12, 12, Pips.pipsSprite);

}

/**
 * Pause the exciting action
 */
static void pauseGame(void) {

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
                Pips.quitGame = true;
            }

            // Wait for button release
            while (getButton(false)) {}
        }
    }

    util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_BLACK);

}

/**
 * Update the step counter at the bottom
 */
static void updateSteps(int steps) {

    util_gfx_fill_rect(36, 110, 56, 16, COLOR_LIGHTBLUE);

	area_t game_area = {0, 0, GFX_WIDTH, GFX_HEIGHT};
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_DARKGREEN);
	util_gfx_cursor_area_set(game_area);
	util_gfx_set_cursor(game_area.xs, game_area.ys);
    char header[6];
    snprintf(header, 6, "%u", steps);
    uint16_t w, h;
    util_gfx_get_text_bounds(header, 0, 0, &w, &h);
    util_gfx_set_cursor(64 - (w / 2), 111);
    printf("PipsSTEPS: '%s', w: %d\n", header, w);



    util_gfx_print(header);

}
