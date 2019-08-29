
#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
	normal,
	hcrn_level1,
	hcrn_level2,
	hcrn_normal,
} gameType;

typedef struct {
	int score;
	int level;
	bool win;
} invadersScore ;

invadersScore SpaceInvaders(gameType type, bool bonusLife, int extraLevels);
#ifdef __cplusplus
}
#endif

