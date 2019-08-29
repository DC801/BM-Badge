#include "Room.h"
#include "maptiles.h"
#include "GameEngine.h"
#include "Turret.h"
#include "Scout.h"
#include "Pickup.h"
#include "Robot.h"
#include "Laser.h"
#include "Obstacle.h"
#include "Marine.h"
#include "Spider.h"
#include "Sprite.h"
#include "Zombie.h"
#include "NPC.h"
#include "Arcade.h"
#include "Terminal.h"
#include "Boss.h"
#include "TNT.h"

Room::Room() : id(0) {
}

Room::Room(uint8_t roomID, uint8_t states) : id(roomID) {
    FIL fd;
    FRESULT result = f_open(&fd, "HCRN/level2.dat", FA_READ | FA_OPEN_EXISTING);
    if (result == FR_OK) {
        UINT bytesread=0;
        uint8_t dummy[8];
        
        f_lseek(&fd, 12 + (TILES_WIDE * TILES_HIGH + 44)*roomID);
        f_read(&fd, neighbors, 4, &bytesread);
        f_read(&fd, dummy, 8, &bytesread); //skip flags and loc
        f_read(&fd, map, TILES_WIDE * TILES_HIGH, &bytesread);
        for (int i=0; i<8; ++i) {
            uint8_t oinfo[4];
            f_read(&fd, oinfo, 4, &bytesread);
            if (!(states & (1<<i))) {
                makeDude(i, (dude_id)oinfo[0], oinfo[1], Point(oinfo[2], oinfo[3]));
            }
        }
        f_close(&fd);
    }
    else {
        printf("Can't find level.dat\n");
        memset(map, 256, TILES_WIDE * TILES_HIGH);
    }
}

Room::~Room(){
    
}

void Room::draw(FrameBuffer* canvas) {
    for (int x=0; x< TILES_WIDE; ++x)
        for (int y=0; y<TILES_HIGH; ++y) {
            const int mapwidth=12;
            int fx = TILE_SIZE*(map[x][y] % mapwidth);
            int fy = TILE_SIZE*(map[x][y] / mapwidth);
            canvas->drawImage(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE, tile12_raw, fx, fy, mapwidth*TILE_SIZE);
        }
    canvas->fillRect(TILE_SIZE*TILES_WIDE, 0, WIDTH - (TILE_SIZE*TILES_WIDE), HEIGHT, 0);
    canvas->fillRect(0, TILE_SIZE*TILES_HIGH, WIDTH, HEIGHT - (TILE_SIZE*TILES_HIGH), 0);
}

bool Room::isOpen(Rect r) {
    if ((r.x < 0) || (r.y < 0) || (r.x+r.w > TILE_SIZE*TILES_WIDE) || (r.y+r.h > TILE_SIZE*TILES_HIGH))
        return false;
    Point p1 = Point(r.x, r.y)/TILE_SIZE;
    Point p2 = Point(r.x+r.w, r.y)/TILE_SIZE;
    Point p3 = Point(r.x, r.y+r.h)/TILE_SIZE;
    Point p4 = Point(r.x+r.w, r.y+r.h)/TILE_SIZE;
    
    if ((map[p1.x][p1.y] < WALL) || (map[p2.x][p2.y] < WALL) ||
        (map[p3.x][p3.y] < WALL) || (map[p4.x][p4.y] < WALL))
        return false;
    
    if (game.isBlocked(r))
        return false;
    
    return true;
}

bool Room::isWalkable(Rect r) {
    if ((r.x < 0) || (r.y < 0) || (r.x+r.w > TILE_SIZE*TILES_WIDE) || (r.y+r.h > TILE_SIZE*TILES_HIGH))
        return false;
    Point p1 = Point(r.x, r.y)/TILE_SIZE;
    Point p2 = Point(r.x+r.w, r.y)/TILE_SIZE;
    Point p3 = Point(r.x, r.y+r.h)/TILE_SIZE;
    Point p4 = Point(r.x+r.w, r.y+r.h)/TILE_SIZE;
    
    if ((map[p1.x][p1.y] < WALKABLE) || (map[p2.x][p2.y] < WALKABLE) ||
        (map[p3.x][p3.y] < WALKABLE) || (map[p4.x][p4.y] < WALKABLE))
        return false;
    
    if (game.isBlocked(r))
        return false;
    
    return true;
}

uint8_t Room::getId() {
    return id;
}

uint8_t Room::getNextRoom(Direction dir) {
    return neighbors[dir];
}


void Room::makeDude(uint8_t i, dude_id id, uint8_t flags, Point at) {
    GameObject *obj;
    if (flags && (!game.isTaskComplete((Checkpoint)(flags-1)))) {
        obj = new Dummy();
    }
    else {
        switch (id) {
            case TURRET:
                obj = new Turret(at);
                break;
            case ROBOT:
                obj = new Robot(at);
                break;
            case SCOUT:
                obj = new Scout(at);
                break;
            case LASER_LR:
                obj = new Laser(at, LEFT);
                break;
            case LASER_UD:
                obj = new Laser(at, UP);
                break;
            case HEALTHPACK:
            case GUN:
            case ROCKET:
                obj = new Pickup(at, id);
                break;
            case DOOR_LR:
            case DOOR_UD:
            case RUBBLE:
                if (this->id == 53)
                    at.y-=TILE_SIZE;
                if (this->id == 50)
                    at.x-=TILE_SIZE;
                obj = new Obstacle(at, id);
                break;
            case COMPUTER:
            case CORE_SPARK:
            case SHIELDS:
            case ENGINE:
                obj = new Sprite(at, id);
                break;
            case MARINE:
                obj = new Marine(at);
                break;
            case ZOMBIE:
            case ZOMBIE2:
                obj = new Zombie(at);
                break;
            case SPIDER:
                obj = new Spider(at);
                break;
            case BOSS:
                obj = new Boss(at);
                break;
            case TNT:
                obj = new Tnt(at);
                break;
            case TERMINAL:
                obj = new Terminal(at);
                break;
            case MR_ROBBOT:
            case FURRY:
            case HAK4KIDZ:
            case DC801:
            case DCZIA:
            case PIRATE:
                obj = new NPC(at, id);
                break;
            case ARCADE:
                obj = new Arcade(at);
                break;
            default:
                return;
        }
    }
    game.addObject(obj, i);
}
