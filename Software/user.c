//
// Created by hamster on 7/19/18.
//

#include "common.h"
#include "user.h"


CLAN_STRUCT clans[] = {
    { CLAN_MARVWASHERE,     "#marvwashere",     "CLANS/marv.raw" },
    { CLAN_HELGA,           "helga",            "CLANS/helga.raw" },
    { CLAN_801LABS,         "801labs",          "CLANS/801labs.raw" },
    { CLAN_THETRANSISTOR,   "thetransistor",    "CLANS/transist.raw" },
    { CLAN_RAM,             "ram",              "CLANS/ram.raw" },
    { CLAN_BADGELIFE,       "#badgelife",       "CLANS/badgelif.raw" },
};

#define NUM_CLANS ARRAY_SIZE(clans)

#define USERFILE_SIZE   32

static int scoreTempModifier = 0;
USER user;

/**
 * Try to load the user data struct, or create a new one
 */
void loadUser(void){

    uint8_t userFile[USERFILE_SIZE];

    uint32_t size = util_sd_file_size("USER.SIT");
    if(size == USERFILE_SIZE){
        // OK, the user is on the disk, try to load it
        if(util_sd_load_file("USER.SIT", userFile, USERFILE_SIZE) == FR_OK) {
            // User data is loaded!

            uint16_t oldCRC = (userFile[USERFILE_SIZE - 2] << 8) | userFile[USERFILE_SIZE - 1];
            userFile[USERFILE_SIZE - 2] = 0;
            userFile[USERFILE_SIZE - 1] = 0;

            uint16_t newCRC = calcCRC(userFile, USERFILE_SIZE, CRC_SEED_DC26);

            if(newCRC == oldCRC){
                // It passes!
                // Copy the data into the user struct
                memcpy((uint8_t *)&user, userFile, sizeof(USER));
                return;
            }
        }
        else{
            printf("Failed to load the user from SD card\n");
        }
    }
    else{
        printf("Userfile: wanted %d got %d\n", sizeof(USER), size);
    }

    // No user data, create a blank one
    memset(&user, 0, sizeof(user));

}

/**
 * Store the user data struct out to disk
 */
void storeUser(void){

    uint8_t userFile[USERFILE_SIZE];
    memset(userFile, 0, USERFILE_SIZE);

    user.configured = true;
    memcpy(userFile, (uint8_t *)&user, sizeof(USER));

    uint16_t crc = calcCRC(userFile, USERFILE_SIZE, CRC_SEED_DC26);
    userFile[USERFILE_SIZE - 2] = (crc >> 8) & 0xFF;
    userFile[USERFILE_SIZE - 1] = crc & 0xFF;

    util_sd_store_file("USER.SIT", userFile, USERFILE_SIZE);

}

/**
 * Lookup the clan file for a given clan name
 * @param clan we want to lookup
 * @return filename
 */
char* getClanFile(CLAN clan){

    char *retFile = NULL;

    for(int i = 0; i < NUM_CLANS; i++){
        if(clans[i].clan == clan){
            retFile = clans[i].filename;
        }
    }

    return retFile;
}

/**
 * Lookup the clan name string for a given clan name
 * @param clan we want to lookup
 * @return filename
 */
char* getClanName(CLAN clan){

    char *retName = NULL;

    for(int i = 0; i < NUM_CLANS; i++){
        if(clans[i].clan == clan){
            retName = clans[i].name;
        }
    }

    return retName;
}

/**
 * Configure the username and clan
 */
void userConfigure(void){

    bool gotName = false;

    do{
        util_gfx_fill_screen(COLOR_BLACK);
        util_gfx_set_cursor(28, 5);
        util_gfx_print("Username?\n    10 chars");

        util_gfx_set_cursor(22, 95);
        util_gfx_print("< > to move");

        util_gfx_set_cursor(30, 110);
        util_gfx_print("A to save");

        util_gfx_set_cursor(15, 40);

        getString(user.name, 10, true);

        // Trim spaces from the end
        for (int i = 10; i >= 0; i--) {
            if (user.name[i] == ' ') {
                user.name[i] = '\0';
            }
        }

        // Did the user enter something?
        if (user.name[0] != '\0') {
            gotName = true;
        }

    } while(!gotName);

    while(getButton(false) == USER_BUTTON_A){
        // Wait until released
    }




    CLAN curClan = user.clan;
    bool gotClan = false;

    do {
        util_gfx_fill_screen(COLOR_BLACK);

        util_gfx_draw_raw_file(getClanFile(curClan), 0, 29, GFX_WIDTH, 100, NULL, false, NULL);

        util_gfx_fill_rect(0, 0, GFX_WIDTH, 28, COLOR_BLACK);

        util_gfx_set_cursor(22, 5);
        util_gfx_print("<  Clan  >");
        uint16_t w, h;
        util_gfx_get_text_bounds(getClanName(curClan), 0, 0, &w, &h);
        util_gfx_set_cursor(64 - (w / 2), 20);
        util_gfx_print(getClanName(curClan));

        bool waitForButton = true;

        while (waitForButton) {

            switch (getButton(false)) {
                case USER_BUTTON_A:
                    waitForButton = false;
                    gotClan = true;
                    while (getButton(false) == USER_BUTTON_A) {

                    }
                    break;
                case USER_BUTTON_B:
                    waitForButton = false;
                    gotClan = true;
                    while (getButton(false) == USER_BUTTON_B) {

                    }
                    break;
                case USER_BUTTON_RIGHT:
                    if (curClan == CLAN_BADGELIFE) {
                        curClan = CLAN_MARVWASHERE;
                    }
                    else{
                        curClan++;
                    }
                    waitForButton = false;
                    while (getButton(false) == USER_BUTTON_RIGHT) {

                    }
                    break;
                case USER_BUTTON_LEFT:
                    if (curClan == CLAN_MARVWASHERE){
                        curClan = CLAN_BADGELIFE;
                    }
                    else{
                        curClan--;
                    }
                    waitForButton = false;
                    while (getButton(false) == USER_BUTTON_LEFT) {

                    }
                    break;
                default:
                    break;
            }

            nrf_delay_ms(1);
        }

    } while(!gotClan);

    user.clan = curClan;

    while(getButton(false) == USER_BUTTON_A){
        // Wait until released
    }

    util_gfx_fill_screen(COLOR_BLACK);
    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_BLUE);
    util_gfx_set_cursor(15, 0);
    util_gfx_print("Power Up!");

    util_gfx_set_font(FONT_MONO55_8PT);
    util_gfx_set_color(COLOR_WHITE);
    util_gfx_set_cursor(25, 40);
    util_gfx_print("Good luck,");

    uint16_t w, h;
    util_gfx_get_text_bounds(user.name, 0, 0, &w, &h);
    util_gfx_set_cursor(64 - (w / 2), 57);
    util_gfx_print(user.name);

    util_gfx_set_cursor(50, 80);
    util_gfx_print("Clan");

    util_gfx_get_text_bounds(getClanName(user.clan), 0, 0, &w, &h);
    util_gfx_set_cursor(64 - (w / 2), 94);
    util_gfx_print(getClanName(user.clan));


    while(getButton(false) != USER_BUTTON_A){
        // Wait until pressed
    }
    while(getButton(false) == USER_BUTTON_A){
        // Wait until released
    }

    storeUser();

    advertising_setUser(user.name);
    advertising_setClan(user.clan);
    ble_adv_start();
}


/**
 * @return Get the temp score modifier, in percent
 */
int getTempScoreModifier(void){
    return scoreTempModifier;
}

/**
 * Set the temp score modifier
 * @param modifier value
 */
void setTempScoreModifier(int modifier){
    scoreTempModifier = modifier;
}

/**
 * Add to the temp score modifier
 * @param modifier
 */
void addTempScoreModifier(int modifier){
    scoreTempModifier += modifier;
}

/**
 * @return Get the total score modifier, in percent
 */
int getTotalScoreModifier(void){

    int modifier = user.modifier + scoreTempModifier;
    if(modifier > 999){
        modifier = 999;
    }
    if(modifier < -999){
        modifier = -999;
    }

    return modifier;
}

