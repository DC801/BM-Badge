//
// Created by hamster on 8/4/18.
//

typedef enum {
    player_none = '-',
    player_x    = 'x',
    player_o    = 'o'
} PLAYER;

// Win conditions
static const uint8_t winState[][3] = {
        { 0, 1, 2 },
        { 3, 4, 5 },
        { 6, 7, 8 },
        { 0, 3, 6 },
        { 1, 4, 7 },
        { 2, 5, 8 },
        { 0, 4, 8 },
        { 2, 4, 6 }
};

typedef enum {
    state_lose          = 100,
    state_draw          = 0,
    state_inProgress    = 1,
    state_connected     = 50,
    state_win           = -100
} GAME_STATE;

#define OFFSET      30
#define BLOCKSIZE   20
#define SPACING     4

int TicTacToe(void);
static void updateScore(int points);
static void drawBoard(PLAYER board[9]);
static void pauseGame(void);
static bool getYN(const char* message);
void drawPlayer(uint8_t location, PLAYER player);

static void drawCompute();
static int computeMove(PLAYER board[9]);
static int minmax(PLAYER board[9], bool flag);
static int gameState(const PLAYER board[9]);
static void endGame(GAME_STATE state);
static void drawGoYNOptions(const char* message);
