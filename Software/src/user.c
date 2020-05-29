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
const char* getClanFile(CLAN clan){

    const char *retFile = NULL;

    for(size_t i = 0; i < NUM_CLANS; i++){
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
const char* getClanName(CLAN clan){

    const char *retName = NULL;

    for(size_t i = 0; i < NUM_CLANS; i++){
        if(clans[i].clan == clan){
            retName = clans[i].name;
        }
    }

    return retName;
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

