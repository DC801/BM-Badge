#ifndef ROOM_H
#define ROOM_H

#include "hcrn_common.h"
#include "FrameBuffer.h"
#include "Point.h"
#include "Rect.h"
#include <stdint.h>

#define TILES_WIDE	(WIDTH / TILE_SIZE)
#define TILES_HIGH	(HEIGHT / TILE_SIZE)
#define TILE_OFFSET_X	(SCREEN_WIDTH - (TILES_WIDE*TILE_SIZE))/2
#define TILE_OFFSET_Y	(SCREEN_HEIGHT - (TILES_HIGH*TILE_SIZE))/2

#define GWIDTH TILES_WIDE*TILE_SIZE
#define GHEIGHT TILES_HIGH*TILE_SIZE

#define WALL 	 48
#define WALKABLE 96


enum dude_id {
    NONE,
    DOOR_LR,
    DOOR_UD,
    TERMINAL,
    RUBBLE,
    COMPUTER,
    ENGINE,
    CORE_SPARK,
    LASER_UD,
    LASER_LR,
    SPIDER,
    TURRET,
    SCOUT,
    ROBOT,
    MARINE,
    ZOMBIE,
    HEALTHPACK,
    GUN,
    ROCKET,
    SHIELDS,
    UNUSED1,
    BOSS,
    TNT,
    ZOMBIE2,
    MR_ROBBOT,
    FURRY,
    HAK4KIDZ,
    DC801,
    DCZIA,
    PIRATE,
    ARCADE,
	DC801_duzzy,
	DC801_sirged,
	DC801_tux,
};


class Room {
public:
    Room();
	Room(uint8_t roomID, uint8_t state);
	~Room();

	void draw(FrameBuffer* canvas);

	bool isOpen(Rect r);
    bool isWalkable(Rect r);

	uint8_t getNextRoom(Direction dir);
    uint8_t getId();

    private:
        void makeDude(uint8_t i, dude_id id, uint8_t un, Point at);

		char tileset[256];
		uint8_t map[TILES_WIDE][TILES_HIGH];
		uint8_t exitcount, doorcount, spritecount;
		uint8_t neighbors[4];
        uint8_t id;
};

#endif //ROOM_H
