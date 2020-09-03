//
// Created by hamster on 8/3/18.
//

#include "common.h"
#include "extras.h"
#include "games/hcrn/FrameBuffer.h"

/**
 * Handle showing the DC groups
 */
void extraShowGroups(void){

    BADGE_GROUP curGroup = badge_none;
    bool showInfo = false;
    bool done = false;

    while(!done) {
        p_canvas()->clearScreen(COLOR_BLACK);
        // util_gfx_fill_screen(COLOR_BLACK);

        if(curGroup == badge_none){
            p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "GROUPS/TIPS.RAW");
            // util_gfx_draw_raw_file("/GROUPS/TIPS.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);
        }
        else{
            if(getBadgeIconFile(curGroup) != NULL) {
                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, getBadgeIconFile(curGroup));
                // util_gfx_draw_raw_file(getBadgeIconFile(curGroup), 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);
            }
            else{
                p_canvas()->drawImageFromFile(0, 0, WIDTH, HEIGHT, "GROUPS/MISSING.RAW");
                // util_gfx_draw_raw_file("/GROUPS/MISSING.RAW", 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, false, NULL);

                p_canvas()->fillRect(0, 0, WIDTH, 15, COLOR_BLACK);
                // util_gfx_fill_rect(0, 0, GFX_WIDTH, 15, COLOR_BLACK);

                char name[16];
                snprintf(name, 16, "%s", getBadgeGroupName(curGroup));

                bounds_t bounds = { 0 };
                p_canvas()->getTextBounds(VeraMono5pt7b, name, 0, 0, &bounds);

                p_canvas()->printMessage(name, VeraMono5pt7b, COLOR_WHITE, 64 - (bounds.width / 2), 2);
                // util_gfx_set_font(FONT_VERAMONO_5PT);
                // util_gfx_get_text_bounds(getBadgeGroupName(curGroup), 0, 0, &w, &h);
                // util_gfx_set_cursor(64 - (w / 2), 2);
                // util_gfx_print(name);
            }
        }

        if(showInfo){
            p_canvas()->fillRect(0, 0, WIDTH, 32, COLOR_BLUE);
            // util_gfx_fill_rect(0, 0, GFX_WIDTH, 32, COLOR_BLUE);

            // uint16_t w, h;
            char row[24];
            snprintf(row, 24, "%s", getBadgeGroupName(curGroup));

            bounds_t bounds = { 0 };
            p_canvas()->getTextBounds(VeraMono5pt7b, row, 0, 0, &bounds);

            p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 64 - (bounds.width / 2), 2);
            // util_gfx_set_font(FONT_VERAMONO_5PT);
            // util_gfx_get_text_bounds(row, 0, 0, &w, &h);
            // util_gfx_set_cursor(64 - (w / 2), 2);
            // util_gfx_print(row);

            snprintf(row, 24, "Appearance 0x%04X", getBadgeAppearance(curGroup));

            p_canvas()->getTextBounds(VeraMono5pt7b, row, 0, 0, &bounds);

            p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 64 - (bounds.width / 2), 12);
            // util_gfx_get_text_bounds(row, 0, 0, &w, &h);
            // util_gfx_set_cursor(64 - (w / 2), 12);
            // util_gfx_print(row);

            if(getBadgeContact(curGroup) != NULL)
            {
                snprintf(row, 24, "%s", getBadgeContact(curGroup));
            }
            else
            {
                snprintf(row, 24, "(No Contact Info)");
            }

            p_canvas()->getTextBounds(VeraMono5pt7b, row, 0, 0, &bounds);

            p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 64 - (bounds.width / 2), 22);
            // util_gfx_get_text_bounds(row, 0, 0, &w, &h);
            // util_gfx_set_cursor(64 - (w / 2), 22);
            // util_gfx_print(row);
        }


        bool waitForButton = true;

        while (waitForButton) {

            switch (getButton(false)) {
                case USER_BUTTON_A:
                    waitForButton = false;
                    // Show an info block?
                    showInfo = !showInfo;
                    while (getButton(false) == USER_BUTTON_A) { }
                    break;
                case USER_BUTTON_B:
                    waitForButton = false;
                    // Return
                    done = true;
                    while (getButton(false) == USER_BUTTON_B) { }
                    break;
                case USER_BUTTON_RIGHT:
                    if(curGroup == LAST_BADGE_GROUP){
                        curGroup = FIRST_BADGE_GROUP;
                    }
                    else{
                        // curGroup++;
                        int group = (curGroup);
                        group++;
                        curGroup = (BADGE_GROUP)group;
                    }
                    waitForButton = false;
                    while (getButton(false) == USER_BUTTON_RIGHT) {

                    }
                    break;
                case USER_BUTTON_LEFT:
                    if(curGroup == FIRST_BADGE_GROUP){
                        curGroup = LAST_BADGE_GROUP;
                    }
                    else{
                        // curGroup--;
                        int group = (curGroup);
                        group--;
                        curGroup = (BADGE_GROUP)group;
                    }
                    waitForButton = false;
                    while (getButton(false) == USER_BUTTON_LEFT) {

                    }
                    break;
                default:
                    break;
            }
            nrf_delay_ms(25);
        }
    }
}


/**
 * Handle showing the file browser
 */
void extraFunBrowser(void){

    // Update the menu list from the files
    char files[64][9];
    MENU fileMenu[64];
    uint8_t numFiles = 0;
    bool done = false;

    memset(files, 0, sizeof(files));
    memset(fileMenu, 0, sizeof(fileMenu));

    numFiles = getFiles(files, "/EXTRAS", 64);

    for(int i = 0; i < numFiles; i++)
    {
        fileMenu[i].name = files[i];
    }

    while(!done) {
        p_canvas()->clearScreen(COLOR_BLACK);
        // util_gfx_fill_screen(COLOR_BLACK);

        int getExtra = getMenuSelection(fileMenu, 6, ARRAY_SIZE(fileMenu), 6, 15000, false);

        if (getExtra != -1) {
            char filename[21];
            snprintf(filename, 21, "/EXTRAS/%s.RAW", files[getExtra]);

            uint8_t button = p_canvas()->drawLoopImageFromFile(0, 0, WIDTH, HEIGHT, filename);
            // uint8_t button = util_gfx_draw_raw_file(filename, 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, true, NULL);

            bool done = false;

            while(!done) {
                if (button == USER_BUTTON_RIGHT || button == USER_BUTTON_DOWN) {
                    while (getButton(false) == USER_BUTTON_RIGHT ||
                            getButton(false) == USER_BUTTON_DOWN) {}

                    button = USER_BUTTON_NONE;
                    getExtra++;
                    if (getExtra <= numFiles) {
                        snprintf(filename, 21, "/EXTRAS/%s.RAW", files[getExtra]);

                        button = p_canvas()->drawLoopImageFromFile(0, 0, WIDTH, HEIGHT, filename);
                        // button = util_gfx_draw_raw_file(filename, 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, true, NULL);
                    }
                }

                if (button == USER_BUTTON_LEFT || button == USER_BUTTON_UP) {
                    while (getButton(false) == USER_BUTTON_LEFT ||
                            getButton(false) == USER_BUTTON_UP) {}

                    button = USER_BUTTON_NONE;
                    if (getExtra > 0) {
                        getExtra--;
                        snprintf(filename, 21, "/EXTRAS/%s.RAW", files[getExtra]);

                        button = p_canvas()->drawLoopImageFromFile(0, 0, WIDTH, HEIGHT, filename);
                        // button = util_gfx_draw_raw_file(filename, 0, 0, GFX_WIDTH, GFX_HEIGHT, NULL, true, NULL);
                    }
                }

                if(button != USER_BUTTON_LEFT &&
                        button != USER_BUTTON_RIGHT &&
                        button != USER_BUTTON_UP &&
                        button != USER_BUTTON_DOWN){
                    done = true;
                }
            }
        }
        else{
            done = true;
        }

    }

}

/**
 * Handle showing the version data
 */
void extraVersion(void){
    p_canvas()->clearScreen(COLOR_BLACK);
    // util_gfx_fill_screen(COLOR_BLACK);

    char row[21];
    snprintf(row, 21, "HelgaOS v%s", VERSION);

    uint8_t height = p_canvas()->getFontHeight(VeraMono5pt7b);

    p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, 10);
    // util_gfx_set_font(FONT_VERAMONO_5PT);
    // util_gfx_set_cursor(2, 10);
    // util_gfx_print(row);

    snprintf(row, 21, "Nordic SDK%s", NORDICSDK);
    p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, 10 + ((height + 2) * 1));
    // util_gfx_set_cursor(2, 10 + ((util_gfx_font_height() + 2) * 1));
    // util_gfx_print(row);

    snprintf(row, 21, "SAO Spec %s", SAOSPEC);
    p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, 10 + ((height + 2) * 2));
    // util_gfx_set_cursor(2, 10 + ((util_gfx_font_height() + 2) * 2));
    // util_gfx_print(row);

    snprintf(row, 21, "%s %s", __DATE__, __TIME__);
    p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, 10 + ((height + 2) * 3));
    // util_gfx_set_cursor(2, 10 + ((util_gfx_font_height() + 2) * 3));
    // util_gfx_print(row);

    while(!getButton(false)){ }
    while(getButton(false)){ }

}
