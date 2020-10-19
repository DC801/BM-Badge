//
// Created by hamster on 7/29/18.
//
// Play Space Invaders
//

#define INVADERS

#include "Space_Invaders.h"

#define PROGMEM

extern "C" {
#include "modules/led.h"
#include "modules/sd.h"
#include "utility.h"
#include "fonts/computerfont12pt7b.h"
}

#ifdef DC801_DESKTOP
#include "sdk_shim.h"
#endif

#ifdef DC801_EMBEDDED
#include "app_error.h"
#include "nrf_soc.h"
#endif

#define ENEMY_NUM 15
#define ENEMY_ROWS 3

#define INVADER_HEIGHT  12
#define INVADER_WIDTH 10
#define TANK_HEIGHT 12
#define TANK_WIDTH 12

#define GINTERVAL 	50

#define POINTS_LEVEL_UP 100
#define POINTS_INVADER  10

#define INVADER_SIZE    (INVADER_HEIGHT * INVADER_WIDTH * 2)
#define TANK_SIZE       (TANK_HEIGHT * TANK_WIDTH * 2)

static void drawTank(uint8_t x);
static void drawInvader(uint8_t x, uint8_t y, uint8_t type);
static void drawAllInvaders();
static void updateInvaders(bool move);
static void pauseGame();
static void levelUp();
static void resetBoard();
static void updateScore(int points);
static void drawLives();
static void drawScore(int points);
static void updateBullet();
static void drawBullet(void);

// Game play data
struct {
    uint8_t invaderSprite[7][INVADER_SIZE];
    uint8_t tankSprite[TANK_SIZE];

    TANK tank;
    ENEMY enemy[ENEMY_NUM];
    BULLET bullet;

    bool toggle;
    bool bounce;
    uint8_t enemyRemaining;
    uint8_t level;
    uint8_t powerup;
    bool quitGame;
    int score;
    gameType gameplay;
} Invaders;




/**
 * Play the space invaders game
 * @return score earned in game
 */
invadersScore SpaceInvaders(gameType type, bool bonusLife, int extraLevels) {
	uint32_t lasttime = millis();
    bool thrustersOn = false;

    uint8_t updateCounter = 0;
    uint8_t bulletCounter = 0;

    memset(&Invaders, 0, sizeof(Invaders));

    Invaders.enemyRemaining = ENEMY_NUM;
    Invaders.gameplay = type;

    if(Invaders.gameplay == normal || Invaders.gameplay == hcrn_normal)
    	Invaders.tank.lives = 3;
    else if (bonusLife)
    	Invaders.tank.lives = 2;
    else
    	Invaders.tank.lives = 1;
    Invaders.tank.x = 58;
    Invaders.quitGame = false;

    memset(Invaders.invaderSprite, 0, sizeof(Invaders.invaderSprite));
    memset(Invaders.tankSprite, 0, sizeof(Invaders.tankSprite));
    memset(&Invaders.bullet, 0, sizeof(Invaders.bullet));

    util_sd_load_file("GAMES/INVADERS/BOOM.RAW", Invaders.invaderSprite[6], INVADER_SIZE);
    if(type == normal){
    // Load SDCard sprites into memory for fast access
    util_sd_load_file("GAMES/INVADERS/INV1-1.RAW", Invaders.invaderSprite[0], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/INV1-2.RAW", Invaders.invaderSprite[1], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/INV2-1.RAW", Invaders.invaderSprite[2], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/INV2-2.RAW", Invaders.invaderSprite[3], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/INV3-1.RAW", Invaders.invaderSprite[4], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/INV3-2.RAW", Invaders.invaderSprite[5], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/BOOM.RAW", Invaders.invaderSprite[6], INVADER_SIZE);
    util_sd_load_file("GAMES/INVADERS/TANK.RAW", Invaders.tankSprite, TANK_SIZE);
    }

    resetBoard();
    int skipLevels = 0;
    if (Invaders.gameplay != normal && extraLevels != 0){
    	skipLevels = extraLevels / 2;
    }

    while (!Invaders.quitGame) {
		uint32_t now = millis();
		uint32_t dt = millis_elapsed(now, lasttime);
		if (dt > GINTERVAL) {
			while (ili9341_is_busy()) {
            	APP_ERROR_CHECK(sd_app_evt_wait());
        	}



			//canvas.clearScreen(RGB(0,0,0));
			canvas.fillRect(0, 16, WIDTH, HEIGHT-16, COLOR_BLACK);
			//do frame drawing here
			canvas.drawLine(0, 16, WIDTH, 16, RGB(0, 0, 255));
			drawAllInvaders();
			drawTank(Invaders.tank.x);
			drawBullet();
			drawLives();
			//drawScore(Invaders.score);
			canvas.blt();

			//do logic updates here

			if (updateCounter++ >= (10 / (Invaders.level + 1))) {
				updateInvaders(true);
				updateCounter = 0;
			}

			updateBullet();


			//baddies move/think

//    	printf("loopSTART\n");

			switch (getButton(false)) {
				case USER_BUTTON_A:
					// Fire!
					// Bullet starts from the top of the tank
					if (!Invaders.bullet.active) {
						Invaders.bullet.active = true;
						if (Invaders.gameplay == normal){
							Invaders.bullet.x = Invaders.tank.x + 6;
							Invaders.bullet.y = 116;
						}
						else {
							Invaders.bullet.x = Invaders.tank.x + 6;
							Invaders.bullet.y = 116;
						}
					    if (Invaders.gameplay != normal)
					    	ledGunsShoot(100);
					}
					break;
				case USER_BUTTON_B:
					// Pause game
					if(Invaders.gameplay == normal){
						while (getButton(false)) {}
						pauseGame();
					}
					break;
				case USER_BUTTON_RIGHT:
					// Move tank right
					if (Invaders.tank.x < WIDTH - 16) {
						Invaders.tank.x += 4;
					}
                    if (!thrustersOn && Invaders.gameplay != normal) {
                        thrustersOn = true;
                        ledPwm(LED_MEM3, 30);
                        ledPwm(LED_PAGE, 30);
                    }
					break;
				case USER_BUTTON_LEFT:
					// Move tank left
					if (Invaders.tank.x > 4) {
						Invaders.tank.x -= 4;
					}
                    if (!thrustersOn && Invaders.gameplay != normal) {
                        thrustersOn = true;
                        ledPwm(LED_MEM3, 30);
                        ledPwm(LED_PAGE, 30);
                    }
					break;
                default:
                    if (thrustersOn && Invaders.gameplay != normal) {
                        thrustersOn = false;
                        ledOff(LED_MEM3);
                        ledOff(LED_PAGE);
                    }
                    break;
			}

			// Determine if quit
			if (Invaders.tank.lives == 0)
				Invaders.quitGame = true;
			if (Invaders.gameplay == hcrn_level1 && Invaders.level == 4)
				Invaders.quitGame = true;
			if (Invaders.gameplay == hcrn_level2 && Invaders.level == (8 - skipLevels))
				Invaders.quitGame = true;

			lasttime = now;
		}


    }

    bool win = false;
	canvas.clearScreen(RGB(0,0,0));
	canvas.blt();

	// util_gfx_set_font(FONT_COMPUTER_12PT);
	// util_gfx_set_color(COLOR_BLACK);

	if (Invaders.gameplay == normal)
    {
        canvas.fillRect(0, 50, WIDTH, 35, COLOR_RED);
		//util_gfx_fill_rect(0, 50, WIDTH, 35, COLOR_RED);

        canvas.printMessage("GAME OVER", Computerfont12pt7b, COLOR_BLACK, 5, 60);
		// util_gfx_set_cursor(5, 60);
		// util_gfx_print("GAME OVER");
	}
	else if (Invaders.tank.lives == 0)
    {
        canvas.fillRect(0, 50, WIDTH, 35, COLOR_RED);
		// util_gfx_fill_rect(0, 50, WIDTH, 35, COLOR_RED);

        canvas.printMessage("DEAD", Computerfont12pt7b, COLOR_BLACK, 40, 60);
		// util_gfx_set_cursor(40, 60);
		// util_gfx_print("DEAD");
	}
	else
    {
        canvas.fillRect(0, 50, WIDTH, 35, COLOR_GREEN);
		// util_gfx_fill_rect(0, 50, WIDTH, 35, COLOR_GREEN);

        canvas.printMessage("SURVIVED", Computerfont12pt7b, COLOR_BLACK, 15, 60);
		// util_gfx_set_cursor(15, 60);
		// util_gfx_print("SURVIVED");
		win = true;
	}

	while (getButton(false) != USER_BUTTON_A) {
		// Wait until pressed
	}
	while (getButton(false) == USER_BUTTON_A) {
		// Wait until released
	}

    return {Invaders.score, Invaders.level, win} ;
}

/**
 *
 * Draw the tank at the X location
 * @param newX New location
 * @param oldX Old location
 */
static void drawTank(uint8_t x) {
    // Erase the old tank
    //util_gfx_fill_rect(0, 116, WIDTH, 116, COLOR_BLACK);
    canvas.fillRect(0, 116, WIDTH, WIDTH-116, COLOR_BLACK);
    // Draw the new one
    if (Invaders.gameplay == normal)
    	canvas.drawImage(x, 116, 12, 12, Invaders.tankSprite, COLOR_BLACK);
    else
    	canvas.drawImage(x, 116, 12, 12, hcrn_tank_raw, COLOR_BLACK);
}


/**
 * Calculate the invaders location
 * @param move should the invaders move?
 */
static void updateInvaders(bool move) {

    uint8_t drop = 0;
    uint8_t maxY = 0;

    if (move) {

        // Calculate if we need to bounce
        for (uint8_t i = 0; i < ENEMY_NUM; i++) {

            if (!Invaders.enemy[i].dead || Invaders.enemy[i].type != 6) {
                if (!Invaders.bounce) {
                    // Going right
                    if (Invaders.enemy[i].x >= WIDTH - 16) {
                        // Bounce left!
                        Invaders.bounce = true;
                        drop = 4;
                        break;
                    }
                } else {
                    if (Invaders.enemy[i].x <= 4) {
                        // Bounce right!
                        Invaders.bounce = false;
                        drop = 4;
                        break;
                    }
                }

            }
        }
        // Toggle the Glyphs
        Invaders.toggle = !Invaders.toggle;
    }


    for (uint8_t i = 0; i < ENEMY_NUM; i++) {
        if (!Invaders.enemy[i].dead) {

            // Drop down the invaders if needed
            Invaders.enemy[i].y += drop;

            if (Invaders.enemy[i].y > 104) {
                // Hit the tank, lost a life
                Invaders.tank.lives--;
                Invaders.powerup = 0;
                resetBoard();
                return;
            }
        }
        if (!Invaders.enemy[i].cleared) {
            if (Invaders.enemy[i].y > maxY) {
                maxY = Invaders.enemy[i].y;
            }
            Invaders.enemy[i].cleared = Invaders.enemy[i].dead;
        }
        if (move && Invaders.enemy[i].type == 6)
        	Invaders.enemy[i].dead = true;
    }

    for (uint8_t i = 0; i < ENEMY_NUM; i++) {
        if (!Invaders.enemy[i].dead) {
            if (!Invaders.bounce) {
                // go right
                Invaders.enemy[i].x += 4;
            } else {
                Invaders.enemy[i].x -= 4;
            }
        }
    }

}

void drawAllInvaders(){
    // Draw them all
    for (uint8_t i = 0; i < ENEMY_NUM; i++) {
        if (!Invaders.enemy[i].dead) {
            if (Invaders.enemy[i].type == 6) {
                drawInvader(Invaders.enemy[i].x, Invaders.enemy[i].y, Invaders.enemy[i].type);
            } else {
                drawInvader(Invaders.enemy[i].x, Invaders.enemy[i].y, Invaders.enemy[i].type + Invaders.toggle);
            }

        }
    }
}

/**
 * Draw an invader at a given place on the screen
 * @param x left side
 * @param y top side
 * @param type which invader to show
 */
static void drawInvader(uint8_t x, uint8_t y, uint8_t type) {
	if (Invaders.gameplay == normal)
		canvas.drawImage(x, y, 12, 10, Invaders.invaderSprite[type]);
	else {
		switch(type){
		case 0 :
			canvas.drawImage(x, y, 12, 10, hcrn_INV1_1_raw);
			break;
		case 1 :
			canvas.drawImage(x, y, 12, 10, hcrn_INV1_2_raw);
			break;
		case 2 :
			canvas.drawImage(x, y, 12, 10, hcrn_INV2_1_raw);
			break;
		case 3 :
			canvas.drawImage(x, y, 12, 10, hcrn_INV2_2_raw);
			break;
		case 4 :
			canvas.drawImage(x, y, 12, 10, hcrn_INV3_1_raw);
			break;
		case 5 :
			canvas.drawImage(x, y, 12, 10, hcrn_INV3_2_raw);
			break;
		case 6 :
			canvas.drawImage(x, y, 12, 10, Invaders.invaderSprite[type]);
			break;
		}
	}
}


/**
 * Show a pause game banner, and if needed, exit the game
 */
static void pauseGame(void) {
    canvas.fillRect(0, 50, WIDTH, 35, COLOR_YELLOW);
    // util_gfx_fill_rect(0, 50, WIDTH, 35, COLOR_YELLOW);

    canvas.printMessage("PAUSED", Computerfont12pt7b, COLOR_BLACK, 30, 60);
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
                Invaders.quitGame = true;
            }

            // Wait for button release
            while (getButton(false)) {}
        }
    }
}


/**
 * Clear the board and get ready for another round
 */
static void resetBoard(void) {
    Invaders.enemyRemaining = ENEMY_NUM;

    memset(Invaders.enemy, 0, sizeof(Invaders.enemy));

    Invaders.toggle = false;
    Invaders.bounce = false;

    uint8_t counter = 0;
    for (uint8_t i = 0; i < ENEMY_ROWS; i++) {
        for (uint8_t j = 0; j < (ENEMY_NUM / ENEMY_ROWS); j++) {
            Invaders.enemy[counter].x = j * 20;
            Invaders.enemy[counter].y = 20 + (i * 20);
            Invaders.enemy[counter].dead = false;
            Invaders.enemy[counter].type = i * 2;

            counter++;
        }
    }

    //util_gfx_fill_screen(COLOR_BLACK);
    canvas.clearScreen(RGB(0,0,0));
    canvas.blt();

	area_t game_area = {0, 0, WIDTH, HEIGHT};
    canvas.setTextArea(&game_area);
	// util_gfx_cursor_area_set(game_area);
	// util_gfx_set_cursor(game_area.xs, game_area.ys);
    updateInvaders(false);
    drawTank(Invaders.tank.x);
    updateScore(0);
}


/**
 * Set a level up LED
 */
static void levelUp(void) {

    switch (Invaders.level) {
        case 0:
            setLevelLEDs(LEVEL0);
            break;
        case 1:
        case 2:
            setLevelLEDs(LEVEL1);
            break;
        case 3:
        case 4:
            setLevelLEDs(LEVEL2);
            break;
        case 5:
        case 6:
            setLevelLEDs(LEVEL3);
            break;
        default:
            setLevelLEDs(LEVEL4);
    }

    Invaders.level++;
    Invaders.powerup++;
    resetBoard();

    updateScore(POINTS_LEVEL_UP + (Invaders.level + 1));

    switch (Invaders.powerup) {
        case 0:
            setPowerUpLEDs(POWERUP_0);
            break;
        case 1:
        case 2:
            setPowerUpLEDs(POWERUP_1);
            break;
        case 3:
        case 4:
            setPowerUpLEDs(POWERUP_2);
            break;
        case 5:
        case 6:
            setPowerUpLEDs(POWERUP_3);
            break;
        default:
            setPowerUpLEDs(POWERUP_3);
    }

}

/**
 * Update the scoreboard
 */
static void updateScore(int points) {

    if (points != 0) {
        Invaders.score = Invaders.score
                         + (points * (Invaders.level + 1)
                            + (((Invaders.powerup + 1) * 0.10) * points));
    }
    drawScore(points);
}

static void drawScore(int points) {
	if (Invaders.gameplay == normal){
		canvas.fillRect(30, 0, WIDTH - ((TANK_WIDTH + 2) * 3) - 30, 15, COLOR_BLACK);
	    char header[25];
	    snprintf(header, 25, "L%d", Invaders.level);
	    canvas.printMessage(header, gameplay5pt7b, COLOR_BLUE, 5, 5);
	    snprintf(header, 25, "%u", Invaders.score);
	    canvas.printMessage(header, gameplay5pt7b, COLOR_BLUE, 30, 5);
	}
	else {
		canvas.fillRect(55, 0, WIDTH - ((TANK_WIDTH + 2) * 3) - 55, 15, COLOR_BLACK);
	    char header[25];
	    snprintf(header, 25, "WAVE %d", Invaders.level);
	    canvas.printMessage(header, gameplay5pt7b, COLOR_BLUE, 5, 5);
	    snprintf(header, 25, "%u", Invaders.score);
	    canvas.printMessage(header, gameplay5pt7b, COLOR_BLUE, 55, 5);
	}

    drawLives();
}
static void drawLives() {
    for (uint8_t i = 0; i < Invaders.tank.lives; i++) {
    	if (Invaders.gameplay == normal){
    		canvas.drawImage( WIDTH - ((TANK_WIDTH + 2) * (i + 1)), 0, TANK_WIDTH, TANK_HEIGHT, Invaders.tankSprite);
    	}
    	else{
    		canvas.drawImage( WIDTH - ((TANK_WIDTH + 2) * (i + 1)), 0, TANK_WIDTH, TANK_HEIGHT, hcrn_tank_raw);
    	}
    }
}

/**
 * Update the bullet position
 */
static void updateBullet(void) {

    for (uint8_t i = 0; i < ENEMY_NUM; i++) {
        if (Invaders.bullet.active && !Invaders.enemy[i].dead) {
            // See if we killed it
            if (((Invaders.enemy[i].y + INVADER_HEIGHT + 2) >= (Invaders.bullet.y)) &&
                ((Invaders.enemy[i].y - 2) <= (Invaders.bullet.y))) {

                // Same plane, did it hit?

                if ((Invaders.enemy[i].x - 2 <= Invaders.bullet.x) &&
                    ((Invaders.enemy[i].x + INVADER_WIDTH + 2) >= Invaders.bullet.x)) {
                    // Got it!
                    Invaders.bullet.active = false;
                    Invaders.enemy[i].type = 6;
                    Invaders.enemyRemaining--;

                    updateScore(POINTS_INVADER);

                    if (Invaders.enemyRemaining == 0) {
                        // Level up!
                        levelUp();
                    } else {
                        updateInvaders(false);
                    }
                    continue;
                }
            }
        }
    }

    // Move the bullet
    if (Invaders.bullet.active) {
        Invaders.bullet.y -= 4;

        // Cancel the bullet if it is near the top
        if (Invaders.bullet.y < 32) {
            Invaders.bullet.active = false;
        }
    }
}

static void drawBullet(void) {
	if(Invaders.bullet.active){
		if (Invaders.gameplay == normal){
			canvas.fillRect(   Invaders.bullet.x - 2, Invaders.bullet.y - 2, 4, 4, COLOR_WHITE);
		}
		else {
			canvas.fillRect(   Invaders.bullet.x - 2, Invaders.bullet.y - 2, 2, 2, RGB(128, 128, 128));
		}

	}
}
