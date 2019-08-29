//
// Created by hamster on 8/6/18.
//
// Handles godmode commands
//

#define GM

#include "common.h"
#include "godmode.h"

/**
 * Determine if a badge is in godmode or not
 * @param badge
 * @return boolean, godmode
 */
bool isInGodMode(BADGE_ADV badge) {

    // Byte 7 is the clan name
    if (badge.data[7] == CLAN_ADMIN && badge.data[0] == 0x23) {
        // OK, it's claiming to be in godmode
        return true;
    }

    return false;
}

/**
 * Determine the command from a given broadcast
 * @param badge data
 * @return the command present
 */
GODMODE_COMMAND getGodModeCommand(BADGE_ADV badge) {

    // First byte needs to be something other than 0
    // Second byte is the command, defaulting to sheep mode
    // Other bytes are ignored as a command

    if (badge.data[1] == 0) {
        return gm_command_none;
    }
    if (badge.data[2] == 0x45) {
        return gm_command_addscoremodifier;
    }
    if (badge.data[2] == 0x54) {
        return gm_command_addscore;
    }
    if (badge.data[2] == 0x25) {
        return gm_command_party;
    }
    if (badge.data[2] == 0xFE) {
        return gm_command_beep;
    } else {
        return gm_command_sheep;
    }

}

/**
 * Get the commanded modifier
 * @param badge data
 * @return the modifier
 */
int getGodModeModifier(BADGE_ADV badge) {

    int retVal = (int) (badge.data[3] | (badge.data[4] << 8) | (badge.data[5] << 16) | (badge.data[6] << 24));

    return retVal;

}

#ifndef GODMODE

/**
 * For non-godmode builds
 */
void godMode(void) {

    // No godmode for you!

}

#else

typedef enum {
    gm_sheep,
    gm_party,
    gm_beep,
    gm_score,
    gm_modifier,
    NUM_MENU_GODMODE_ITEMS
} MENU_GODMODE;


MENU godmodeMenu[NUM_MENU_GODMODE_ITEMS] = {
        {gm_sheep,    "Sheep"},
        {gm_party,    "Party"},
        {gm_beep,     "Beep"},
        {gm_score,    "Score"},
        {gm_modifier, "Modifier"}
};

typedef enum {
    gm_score_n1000,
    gm_score_n100,
    gm_score_n10,
    gm_score_10,
    gm_score_100,
    gm_score_1000,
    NUM_MENU_GODMODESCORE_ITEMS
} MENU_GODMODESCORE;


MENU godmodeMenuScore[NUM_MENU_GODMODESCORE_ITEMS] = {
        {gm_score_n1000, "-1000"},
        {gm_score_n100,  "-100"},
        {gm_score_n10,   "-10"},
        {gm_score_10,    "10"},
        {gm_score_100,   "100"},
        {gm_score_1000,  "1000"}
};

typedef enum {
    gm_mod_n500,
    gm_mod_n100,
    gm_mod_n10,
    gm_mod_10,
    gm_mod_100,
    gm_mod_500,
    NUM_MENU_GODMODEMODIFIER_ITEMS
} MENU_GODMODEMODIFIER;


MENU godmodeMenuMod[NUM_MENU_GODMODEMODIFIER_ITEMS] = {
        {gm_mod_n500, "-500"},
        {gm_mod_n100, "-100"},
        {gm_mod_n10,  "-10"},
        {gm_mod_10,   "10"},
        {gm_mod_100,  "100"},
        {gm_mod_500,  "500"}
};


/**
 * Handle the godmode menu options
 */
void godMode(void) {

    bool doCommand = true;

    // Display the godmode menu

    int item = getMenuSelection(godmodeMenu, 50, ARRAY_SIZE(godmodeMenu), 4, 15000, true);

    switch (item) {

        case gm_sheep:
            doGodmode(gm_command_sheep, 0);
            break;
        case gm_party:
            doGodmode(gm_command_party, 0);
            break;
        case gm_beep:
            doGodmode(gm_command_beep, 0);
            break;
        case gm_score: {
            int score = getMenuSelection(godmodeMenuScore, 50, ARRAY_SIZE(godmodeMenuScore), 4, 15000, true);

            int retScore = 0;
            switch (score) {
                case gm_score_n1000:
                    retScore = -1000;
                    break;
                case gm_score_n100:
                    retScore = -100;
                    break;
                case gm_score_n10:
                    retScore = -10;
                    break;
                case gm_score_10:
                    retScore = 10;
                    break;
                case gm_score_100:
                    retScore = 100;
                    break;
                case gm_score_1000:
                    retScore = 1000;
                    break;
                default:
                    doCommand = false;
                    break;
            }
            doGodmode(gm_command_addscore, retScore);
        }
            break;
        case gm_modifier: {
            int modifier = getMenuSelection(godmodeMenuMod, 50, ARRAY_SIZE(godmodeMenuMod), 4, 15000, true);

            int retScore = 0;
            switch (modifier) {
                case gm_mod_n500:
                    retScore = -500;
                    break;
                case gm_mod_n100:
                    retScore = -100;
                    break;
                case gm_mod_n10:
                    retScore = -10;
                    break;
                case gm_mod_10:
                    retScore = 10;
                    break;
                case gm_mod_100:
                    retScore = 100;
                    break;
                case gm_mod_500:
                    retScore = 500;
                    break;
                default:
                    doCommand = false;
                    break;
            }

            doGodmode(gm_command_addscoremodifier, retScore);
        }
            break;
        default:
            doCommand = false;
            break;

    }

    if (doCommand) {

        util_gfx_fill_rect(0, 50, GFX_WIDTH, 35, COLOR_YELLOW);
        util_gfx_set_font(FONT_COMPUTER_12PT);
        util_gfx_set_color(COLOR_BLACK);
        util_gfx_set_cursor(15, 60);
        util_gfx_print("COMMAND");

        //for(int i = 0; i < (30000 / 15); i++){
        // Transmit the command until another button is pressed
        while (!getButton(false)) {
            nrf_delay_ms(15);
            if (getButton(false)) {
                while (getButton(false)) {}
                break;
            }
        }

    }

    // Restore the old advertisement
    advertising_setClan(user.clan);
    advertising_setScore(user.score);

}

/**
 * Set the advertising data to the godmode command
 * @param command
 * @param data
 */
void doGodmode(GODMODE_COMMAND command, int data) {

    switch (command) {
        case gm_command_addscoremodifier:
            break;
        case gm_command_addscore:
            break;
        default:
            break;
    }

    advertising_setGodCommand(command, data);

}

#endif
