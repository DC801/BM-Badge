//
//  NPC.cpp
//  DC801

//  Created by DC801 for DEFCON27.
//

#include "NPC.h"
#include "sprites_raw.h"

NPC::NPC(Point at, int Type) : frame(0), type(Type) {
    life=100;
    position = at;
    blocking = true;

    switch (type) {
        case MR_ROBBOT:
            avatar = "HCRN/bender.bmp";
            group = badge_andnxor;
            bitmask = B_BENDER;
            y = TILE_SIZE*0;
            goodmsg = "Why hello you fine\nlooking robot!\n\nCome on in!";
            badmsg = "I ain't moving for \nanybody but myself!";
            break;
        case FURRY:
            avatar = "HCRN/furry.bmp";
            group = badge_dcfurs;
            bitmask = B_FURRY;
            y = TILE_SIZE*1;
            goodmsg = "I see you have a\nfellow furry, Boop him\non the nose once for\nme.";
            badmsg = "zzzzzz...\n(he appears to\nbe sleeping)";
            break;
        case HAK4KIDZ: // TODO: switch to netik code
            avatar = "HCRN/tinker.bmp";
            group = badge_ides;
            bitmask = B_KIDZ;
            y = TILE_SIZE*2;
            goodmsg = "You diffused the bomb";
            badmsg = "This bomb looks too\ncomplicated. Go around.";
            break;
        case DC801:
            avatar = "HCRN/sheep.bmp";
            group = badge_dc801;
            bitmask = B_DC801;
            y = TILE_SIZE*3;
            goodmsg = "Heard ready, let's do\nthis!";
            badmsg = "Error 801\nNot enough sheep";
            break;
        case DC801_duzzy:
            avatar = "HCRN/sheep.bmp";
            group = badge_none;
            //bitmask = B_DC801;
            y = TILE_SIZE*3;
            goodmsg = "Error 801\nNot enough sheep";
            badmsg = "No clone!";
            break;
		case DC801_sirged:
			avatar = "HCRN/sheep.bmp";
			group = badge_none;
			//bitmask = B_DC801;
			y = TILE_SIZE*3;
			goodmsg = "Error 801\nNot enough sheep";
			badmsg = "Saftey Third!";
			break;
        case DCZIA:
            avatar = "HCRN/rcross.bmp";
            group = badge_dczia;
            bitmask = B_DCZIA;
            y = TILE_SIZE*4;
            goodmsg = "Access granted";
            badmsg = "Invalid Identity";
            break;
        case PIRATE:
            avatar = "HCRN/skull.bmp";
            group = badge_pirates;
            bitmask = B_PIRATE;
            y = TILE_SIZE*5;
            goodmsg = "bla bla bla!";
            badmsg = "Argh?!?";
            break;
        default:
            avatar = NULL;
            group = badge_none;
            y = TILE_SIZE*0;
            goodmsg = "";
            badmsg = "";
            break;
    }
}

NPC::~NPC() {
}

void NPC::draw(FrameBuffer* canvas) {
    int x=0;

    if ((frame % 25) == 0)
        x = TILE_SIZE;

    canvas->drawImage(position.x, position.y, TILE_SIZE, TILE_SIZE, ble_raw, x, y, TILE_SIZE*2, BGCOLOR);

    frame++;
}

Rect NPC::getBoundingbox() {
    return Rect(position+Point(1,1), position+Point(11,11));
}

bool NPC::think(Room *room) {
    if (type == DCZIA)
        return true;
    if (game.isTaskComplete(bitmask))
        return false;
    return true;
}


void NPC::collide(GameObject *other) {

}

void NPC::takeDamage(int d) {

}

void NPC::interact(FrameBuffer* canvas) {
    BADGE_ADV badges[NUM_BADGES_TO_STORE];
    uint8_t blen = getBadges(badges);

    bool found = false;
    for (int i=0; i<blen; ++i) {
        if (badges[i].group == group) {
            found = true;
            break;
        }
    }

    game.DrawDialogBackground(avatar, st7735_color565(30, 30, 200), st7735_color565(180, 180, 180), st7735_color565(90, 90, 90));
    game.Scanning(found);
    if (found) {
        game.ShowDialog(goodmsg, avatar, false);
        game.completeTask(bitmask);
    }
    else {
        game.ShowDialog(badmsg, avatar, false);
    }
    game.saveGame();
}
