/**
 *
 * Adapted from https://gist.github.com/pokerG/6ce000e2b125645ee33b
 *
 * Play Tic-Tac-Toe against a computer who uses the minimax algo to determine the perfect move
 *
 * hamster - 8/5/2018
 *
 */

#define TICTACTOE

#include "common.h"
//#include "Tic-Tac-Toe.h"

// Game data
struct {
    int score;
    bool quitGame;
    bool goFirst;
    PLAYER gameBoard[9];
    int state;
} TicTacToeData;

uint8_t WIDTH_OF_BOARD = 3;
uint8_t HEIGHT_OF_BOARD = 3;
uint8_t desired_slot = 0;

/**
 * Play tic-tac-toe
 * @return score earned
 */
int TicTacToe(void) {

    TicTacToeData.score = 0;
    TicTacToeData.goFirst = true;
    TicTacToeData.quitGame = false;
    TicTacToeData.state = state_inProgress;

    uint8_t toggleCounter = 0;
    bool toggle = false;

    memset(TicTacToeData.gameBoard, player_none, sizeof(TicTacToeData.gameBoard));
    uint8_t selection = 0;

    bool newGame = true;

    util_gfx_fill_screen(COLOR_BLACK);

    updateScore(0);

    while (!TicTacToeData.quitGame) {

        if (newGame) {
            TicTacToeData.state = state_inProgress;

            TicTacToeData.goFirst = getYN("GO FIRST?");
            newGame = false;
            memset(TicTacToeData.gameBoard, player_none, sizeof(TicTacToeData.gameBoard));

            if (!TicTacToeData.goFirst) {
                // Computer goes first
                uint8_t rand;
                nrf_drv_rng_rand(&rand, 1);
                drawCompute();
                TicTacToeData.gameBoard[rand % 9] = player_o;
            } else {
                selection = 4;
            }

            drawBoard(TicTacToeData.gameBoard);
            drawPlayer(selection, player_x);
        }

        switch (getButton(false)) {
            case USER_BUTTON_A:
                // Square selected
                TicTacToeData.gameBoard[selection] = player_x;
                drawBoard(TicTacToeData.gameBoard);
                while (getButton(false) == USER_BUTTON_A) {}

                TicTacToeData.state = gameState(TicTacToeData.gameBoard);

                if (!(TicTacToeData.state == state_win || TicTacToeData.state == state_lose ||
                      TicTacToeData.state == state_draw)) {

                    int move;
                    uint8_t played = 0;
                    uint8_t i;
                    for (i = 0; i < 9; i++) {
                        if (TicTacToeData.gameBoard[i] != player_none) {
                            played++;
                        }
                    }

                    if (played == 1) {
                        // First play, don't bother computing it
                    	move = computeMove(TicTacToeData.gameBoard);
                    } else {
                        // Compute computer's move
                        move = computeMove(TicTacToeData.gameBoard);
                    }

                    TicTacToeData.gameBoard[move] = player_o;

                    TicTacToeData.state = gameState(TicTacToeData.gameBoard);

                    drawBoard(TicTacToeData.gameBoard);

                    // Find a free spot to put the player's cursor
                    for (i = 0; i < 9; i++) {
                        if (TicTacToeData.gameBoard[i] == player_none) {
                            selection = i;
                            drawPlayer(selection, player_x);
                            break;
                        }
                    }

                }
                break;
            case USER_BUTTON_B:
                // Pause game
                while (getButton(false)) {}

                // Can't leave the game until it's unlocked
                if (WG_Data.state == wg_state_playing && !user.wargameUnlock) {
                    break;
                } else {
                    pauseGame();
                    drawBoard(TicTacToeData.gameBoard);
                }
                break;

            case USER_BUTTON_DOWN:
            	for (int i = 1; i < HEIGHT_OF_BOARD; i++){
            		desired_slot = selection + (WIDTH_OF_BOARD * i);
                	if(desired_slot <= (WIDTH_OF_BOARD * HEIGHT_OF_BOARD - 1) && TicTacToeData.gameBoard[desired_slot] == player_none){
                		drawPlayer(selection, player_none);
                        selection = desired_slot;
                        drawPlayer(desired_slot, player_x);
                        printf("Placing player at %d.\n", selection);
                	}
            	}
            	//debounce
                while (isButtonDown(USER_BUTTON_DOWN))
                    nrf_delay_ms(100);
                break;
            case USER_BUTTON_RIGHT:
                // Move to next available positive
            {
                uint8_t test = selection;
                for (int i = 0; i < 9; i++) {
                    if (++test > 8) {
                        test = 0;
                    }
                    if (TicTacToeData.gameBoard[test] == player_none) {
                        drawPlayer(selection, TicTacToeData.gameBoard[selection]);
                        selection = test;
                        drawPlayer(selection, player_x);
                        break;
                    }
                }
            }
                while (getButton(false)) {}
                break;

            case USER_BUTTON_UP:
            	for (int i = 1; i < HEIGHT_OF_BOARD; i++){
            		desired_slot = selection - (WIDTH_OF_BOARD * i);
                	if(desired_slot >= 0 && TicTacToeData.gameBoard[desired_slot] == player_none){
                		drawPlayer(selection, player_none);
                        selection = desired_slot;
                        drawPlayer(desired_slot, player_x);
                        printf("Placing player at %d.\n", selection);
                	}
            	}
            	//debounce
                while (isButtonDown(USER_BUTTON_UP))
                    nrf_delay_ms(100);
                break;
            case USER_BUTTON_LEFT:
                // Move to next available negative
            {
                int test = selection;
                for (int i = 0; i < 9; i++) {
                    if (--test < 0) {
                        test = 8;
                    }
                    if (TicTacToeData.gameBoard[test] == player_none) {
                        drawPlayer(selection, TicTacToeData.gameBoard[selection]);
                        selection = test;
                        drawPlayer(selection, player_x);
                        break;
                    }
                }
            }
                while (getButton(false)) {}
                break;

            default:
                break;
        }


        if (toggleCounter++ > 10) {
            toggle = !toggle;
            toggleCounter = 0;

            if (toggle) {
                drawPlayer(selection, player_x);
            } else {
                drawPlayer(selection, player_none);
            }

        }

        if (TicTacToeData.state == state_win || TicTacToeData.state == state_lose ||
            TicTacToeData.state == state_draw) {

            if (WG_Data.state == wg_state_playing && !user.wargameUnlock) {
                WG_Data.gamesPlayed++;
                if (WG_Data.gamesPlayed > GAMES_TO_UNLOCK) {
                    WG_Data.state = wg_state_unlocked;
                    wg_Unlock();
                    TicTacToeData.quitGame = true;
                    return 0;
                }
            }

            endGame(TicTacToeData.state);
            newGame = true;
        }

        nrf_delay_ms(25);

    }

    return TicTacToeData.score;

}


/**
 * Update the scoreboard
 */
static void updateScore(int points) {

    if (points != 0) {
        TicTacToeData.score = TicTacToeData.score + points;
    }

    util_gfx_fill_rect(0, 0, GFX_WIDTH, 17, COLOR_BLACK);
    util_gfx_draw_line(0, 16, GFX_WIDTH, 16, COLOR_BLUE);

    util_gfx_set_font(FONT_GAMEPLAY_5PT);
    util_gfx_set_color(COLOR_BLUE);
    util_gfx_set_cursor(5, 5);
    char header[25];
    snprintf(header, 25, "%d", TicTacToeData.score);
    util_gfx_print(header);

}


/**
 * Draw the game board
 */
static void drawBoard(PLAYER board[9]) {

    // Clear the board
    util_gfx_fill_rect(OFFSET, OFFSET, (BLOCKSIZE + SPACING) * 3, (BLOCKSIZE + SPACING) * 3, COLOR_BLACK);

    // Draw the bars
    util_gfx_fill_rect(OFFSET, OFFSET + BLOCKSIZE,
                       ((BLOCKSIZE + SPACING) * 3) - SPACING, SPACING, COLOR_WHITE);
    util_gfx_fill_rect(OFFSET, OFFSET + (BLOCKSIZE * 2) + SPACING,
                       ((BLOCKSIZE + SPACING) * 3) - SPACING, SPACING, COLOR_WHITE);

    util_gfx_fill_rect(OFFSET + BLOCKSIZE, OFFSET,
                       SPACING, ((BLOCKSIZE + SPACING) * 3) - SPACING, COLOR_WHITE);
    util_gfx_fill_rect(OFFSET + (BLOCKSIZE * 2) + SPACING, OFFSET,
                       SPACING, ((BLOCKSIZE + SPACING) * 3) - SPACING, COLOR_WHITE);

    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            util_gfx_fill_rect(OFFSET + (j * (BLOCKSIZE + SPACING)),
                               OFFSET + (i * (BLOCKSIZE + SPACING)),
                               BLOCKSIZE, BLOCKSIZE, COLOR_BLACK);
        }
    }

    for (int i = 0; i < 9; i++) {
        drawPlayer(i, board[i]);
    }


}


/**
 * Draw the player at a certain location.  Could use more math, but, eh, screw it.
 * @param location which square, 0-8
 * @param player X or O
 */
void drawPlayer(uint8_t location, PLAYER player) {

    uint8_t x = 0, y = 0;

    switch (location) {
        case 0:
            x = OFFSET + (0 * (BLOCKSIZE + SPACING));
            y = OFFSET + (0 * (BLOCKSIZE + SPACING));
            break;
        case 1:
            x = OFFSET + (1 * (BLOCKSIZE + SPACING));
            y = OFFSET + (0 * (BLOCKSIZE + SPACING));
            break;
        case 2:
            x = OFFSET + (2 * (BLOCKSIZE + SPACING));
            y = OFFSET + (0 * (BLOCKSIZE + SPACING));
            break;
        case 3:
            x = OFFSET + (0 * (BLOCKSIZE + SPACING));
            y = OFFSET + (1 * (BLOCKSIZE + SPACING));
            break;
        case 4:
            x = OFFSET + (1 * (BLOCKSIZE + SPACING));
            y = OFFSET + (1 * (BLOCKSIZE + SPACING));
            break;
        case 5:
            x = OFFSET + (2 * (BLOCKSIZE + SPACING));
            y = OFFSET + (1 * (BLOCKSIZE + SPACING));
            break;
        case 6:
            x = OFFSET + (0 * (BLOCKSIZE + SPACING));
            y = OFFSET + (2 * (BLOCKSIZE + SPACING));
            break;
        case 7:
            x = OFFSET + (1 * (BLOCKSIZE + SPACING));
            y = OFFSET + (2 * (BLOCKSIZE + SPACING));
            break;
        case 8:
            x = OFFSET + (2 * (BLOCKSIZE + SPACING));
            y = OFFSET + (2 * (BLOCKSIZE + SPACING));
            break;
        default:
            break;
    }

    util_gfx_fill_rect(x, y, BLOCKSIZE, BLOCKSIZE, COLOR_BLACK);
    if (player == player_x) {
        util_gfx_draw_raw_file("/GAMES/TTT/1.RAW",
                               x, y, BLOCKSIZE, BLOCKSIZE,
                               NULL, false, NULL);
    }
    if (player == player_o) {
        util_gfx_draw_raw_file("/GAMES/TTT/2.RAW",
                               x, y, BLOCKSIZE, BLOCKSIZE,
                               NULL, false, NULL);
    }


}

/**
 * Pause the game
 */
static void pauseGame(void) {

    util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_YELLOW);
	area_t pause_area = {25, 60, GFX_WIDTH, GFX_HEIGHT};
	util_gfx_cursor_area_set(pause_area);
	util_gfx_set_cursor(pause_area.xs, pause_area.ys);
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_BLACK);
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
            	if(getYN("QUIT NOW?"))
            		TicTacToeData.quitGame = true;
            }

            // Wait for button release
            while (getButton(false)) {}
        }
    }

    util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_BLACK);

}


/**
 * Show a banner of the end condition
 * @param state
 */
static void endGame(GAME_STATE state) {

    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_BLACK);

    // State is from the computer's viewpoint

    switch (state) {
        case state_draw:
            util_gfx_fill_rect(0, GFX_HEIGHT - 25, GFX_WIDTH, 25, COLOR_YELLOW);
            util_gfx_set_cursor(35, GFX_HEIGHT - 20);
            util_gfx_print("DRAW");
            updateScore(0);
            break;
        case state_win:
            util_gfx_fill_rect(0, GFX_HEIGHT - 25, GFX_WIDTH, 25, COLOR_RED);
            util_gfx_set_cursor(40, GFX_HEIGHT - 20);
            util_gfx_print("LOSE");
            updateScore(-10);
            break;
        case state_lose:
            util_gfx_fill_rect(0, GFX_HEIGHT - 25, GFX_WIDTH, 25, COLOR_GREEN);
            util_gfx_set_cursor(45, GFX_HEIGHT - 20);
            util_gfx_print("WIN");
            updateScore(10);
            break;
        default:
            break;

    }

    // Delay until a button is pressed
    while (!getButton(false)) {}
    if (getButton(false) == USER_BUTTON_B) {
        pauseGame();
    } else {
        while (getButton(false)) {}
    }

    util_gfx_fill_rect(0, GFX_HEIGHT - 25, GFX_WIDTH, 25, COLOR_BLACK);


}

/**
 * Draw box for if you want to go first
 */
static void drawGoYNOptions(const char* message) {

	area_t pause_area = {0, 0, GFX_WIDTH, GFX_HEIGHT};
	util_gfx_cursor_area_set(pause_area);
	//util_gfx_set_cursor(pause_area.xs, pause_area.ys);

    util_gfx_fill_rect(10, 30, GFX_WIDTH - 20, 55, COLOR_LIGHTGREY);
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_BLACK);
    util_gfx_set_cursor(12, 32);
    util_gfx_print(message);

    util_gfx_set_cursor(58, 50);
    util_gfx_print("Y");

    util_gfx_set_cursor(58, 67);
    util_gfx_print("N");

    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_cursor(70, 50);
    util_gfx_print("<");

}


/**
 * Get whether the player wants to go first or not
 * @return
 */
static bool getYN(const char* message) {

    bool selection = true;
    drawGoYNOptions(message);

    while (!TicTacToeData.quitGame) {

        switch (getButton(false)) {
            case USER_BUTTON_A:
                // Square selected
                util_gfx_fill_rect(10, 30, GFX_WIDTH - 20, 55, COLOR_BLACK);
                while (getButton(false) == USER_BUTTON_A) {}
                return selection;
            case USER_BUTTON_B:
                // Pause game
                while (getButton(false) == USER_BUTTON_B) {}
                selection = true;

                // Can't leave the game until it's unlocked
                if (WG_Data.state == wg_state_playing && !user.wargameUnlock) {
                    break;
                } else {
                    pauseGame();
                    drawGoYNOptions(message);
                }
                break;
            case USER_BUTTON_UP:
                // Move up
                util_gfx_set_color(COLOR_BLACK);
                util_gfx_set_cursor(70, 50);
                util_gfx_print("<");
                util_gfx_set_color(COLOR_LIGHTGREY);
                util_gfx_set_cursor(70, 67);
                util_gfx_print("<");
                selection = true;
                break;
            case USER_BUTTON_DOWN:
                // Move down
                util_gfx_set_color(COLOR_BLACK);
                util_gfx_set_cursor(70, 67);
                util_gfx_print("<");
                util_gfx_set_color(COLOR_LIGHTGREY);
                util_gfx_set_cursor(70, 50);
                util_gfx_print("<");
                selection = false;
                break;
            default:
                break;
        }

        nrf_delay_ms(25);

    }

    return selection;

}


/**
 * Get the current game state, if we have a win/lose, draw or in progress
 * @param board
 * @return
 */
static int gameState(const PLAYER board[9]) {
    int state;
    uint8_t chess = 0;

    // Check if the board is full
    bool isFull = true;
    for (uint8_t i = 0; i < 9; i++) {
        if (board[i] == player_none) {
            isFull = false;
            break;
        }
    }

    // Check if there is a win condition
    bool isWon = false;
    for (uint8_t i = 0; i < sizeof(winState) / sizeof(uint8_t[3]); i++) {
        chess = board[winState[i][0]];
        int j;
        for (j = 1; j < 3; j++) {
            if (board[winState[i][j]] != chess) {
                break;
            }
        }
        if (chess != player_none && j == 3) {
            isWon = true;
            break;
        }
    }


    if (isWon)
        // Figure out who won
        state = (chess == player_o ? state_win : state_lose);
    else {

        if (isFull)
            // Board is full without a win condition, it's a draw
            return state_draw;
        else {

            int finds[2] = {0};

            // See if there is somewhere we can go to win
            for (uint8_t i = 0; i < sizeof(winState) / sizeof(uint8_t[3]); i++) {
                bool findEmpty = false;
                chess = 0xFF;

                for (int j = 0; j < 3; j++) {
                    if (board[winState[i][j]] == player_none && !findEmpty) {
                        findEmpty = true;
                    } else {
                        chess &= board[winState[i][j]];
                    }
                }

                if ((chess == player_o || chess == player_x) && findEmpty) {
                    if (chess == player_o) {
                        finds[0]++;
                    } else {
                        finds[1]++;
                    }
                }
            }

            if (finds[0] > 1 && finds[1] < 1) {
                state = -state_connected;
            } else if (finds[0] < 1 && finds[1] > 1) {
                state = state_connected;
            } else {
                state = state_inProgress;
            }
        }
    }
    return state;
}

static void drawCompute(){
    util_gfx_fill_rect(0, GFX_HEIGHT - 25, GFX_WIDTH, 25, COLOR_BLUE);
    util_gfx_set_cursor(20, GFX_HEIGHT - 20);
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_BLACK);
    util_gfx_print("COMPUTE");
    nrf_delay_ms(1250);
}


/**
 * Compute the minimax algo
 * @param board
 * @return
 */

static int computeMove(PLAYER board[9]) {

    drawCompute();

    printf("Gameboard:%c, %c, %c\n", board[0], board[1], board[2]);
    printf("          %c, %c, %c\n", board[3], board[4], board[5]);
    printf("          %c, %c, %c\n", board[6], board[7], board[8]);

    int bestValue = state_lose;
    int bestPos = -1;
    for (int i = 0; i < 9; i++) {
        if (board[i] == player_none) {
            board[i] = player_o;
            int value = minmax(board, true);
            if (value < bestValue) {
                bestValue = value;
                bestPos = i;
            }
            board[i] = player_none;
        }
    }

    printf("AI Picks: %d\n", bestPos);

    util_gfx_fill_rect(0, GFX_HEIGHT - 25, GFX_WIDTH, 25, COLOR_BLACK);
    return bestPos;

}


/**
 * Determine if this is the best move or not
 * @param board
 * @param flag
 * @return
 */
static int minmax(PLAYER board[9], bool flag) {
    int positionValue = gameState(board);

    if (positionValue != state_inProgress) {
        return positionValue;
    }

    int bestValue = flag ? state_win : state_lose;

    for (int i = 0; i < 9; i++) {
        if (board[i] == player_none) {
            board[i] = flag ? player_x : player_o;
            int value = minmax(board, !flag);
            if (flag)
                bestValue = value > bestValue ? value : bestValue;
            else
                bestValue = value < bestValue ? value : bestValue;
            board[i] = player_none;
        }
    }
    return bestValue;
}

