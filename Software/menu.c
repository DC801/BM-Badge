//
// Created by hamster on 7/18/18.
//

#include "common.h"

/**
 * Draw the menu items
 * Beware, there's no real check if your start row is beyond the end of the number of items
 * @param menu items
 * @param startY start position
 * @param numItems how many rows
 * @param startRow which row offset to start
 */
static void drawMenu(MENU *menu, uint16_t startY, uint8_t numItems, uint8_t startRow){
    uint8_t spacing = util_gfx_font_height() - 5;

    util_gfx_fill_rect(0, startY, GFX_WIDTH, spacing * numItems, COLOR_BLACK);
    for(int i = 0; i < numItems; i++){
        util_gfx_set_cursor(15, startY);
        util_gfx_print(menu[i + startRow].name);
        startY = startY + spacing;
    }
}

/**
 * Convince the user to select a menu item or timeout
 * @param menu menu items to display
 * @param startY start position
 * @param numItems how many items total in menu
 * @param numRows number of rows to show
 * @param timeout should we give up after a certain time?
 * @param updateTemplate Should we keep the top bar updated?
 * @return
 */
int getMenuSelection(MENU *menu, uint16_t startY, uint8_t numItems, uint8_t numRows, uint16_t timeout, bool updateTemplate){

    uint8_t oldBatteryPercent = 0;
    uint32_t oldScore = 0;
    int oldModifier = 0;
    uint8_t selected = 0;
    uint8_t cursor = 0;
    uint16_t counter = 0;
    uint8_t startRow = 0;

    if(numItems < numRows){
        numRows = numItems;
    }

    if(updateTemplate) {
        drawScreenTemplate();
        updateBatteryIcon(getBatteryPercent());
    }

    util_gfx_set_font(FONT_COMPUTER_12PT);
    util_gfx_set_color(COLOR_WHITE);

    drawMenu(menu, startY, numRows, 0);

    uint8_t spacing = util_gfx_font_height() - 5;

    drawCaret(startY, startY);

    while(true){

        switch(getButton(false)){
            case USER_BUTTON_UP:
                // Are we at the top of the list of items?
                if(selected > 0){
                    // Do we need to scroll up?
                    if(cursor == 0){
                        // Need to scroll
                        drawMenu(menu, startY, numRows, --startRow);
                        drawCaret((cursor * spacing) + startY, (cursor * spacing) + startY);
                    }
                    else {
                        // No scroll, just move up
                        drawCaret((cursor * spacing) + startY, ((cursor - 1) * spacing) + startY);
                        cursor--;
                    }
                    selected--;
                }
                while(getButton(false) == USER_BUTTON_UP);
                counter = 0;
                break;
            case USER_BUTTON_DOWN:
                // Are we at the bottom of the list of items?
                if(selected < numItems - 1){
                    // Do we need to scroll down?
                    if(cursor == numRows - 1){
                        // Need to scroll
                        drawMenu(menu, startY, numRows, ++startRow);
                        drawCaret((cursor * spacing) + startY, (cursor * spacing) + startY);
                    }
                    else {
                        // No scroll, just move down
                        drawCaret((cursor * spacing) + startY, ((cursor + 1) * spacing) + startY);
                        cursor++;
                    }
                    selected++;
                }
                while(getButton(false) == USER_BUTTON_DOWN);
                counter = 0;
                break;
            case USER_BUTTON_A:
                while(getButton(false) == USER_BUTTON_A);
                return selected;
            case USER_BUTTON_B:
                while(getButton(false) == USER_BUTTON_B);
                return -1;
            default:
                break;
        }

        if(timeout > 0) {
            counter += 20;
            if (counter >= timeout) {
                return -1;
            }
        }
        nrf_delay_ms(20);

        if(updateTemplate) {

            if(oldModifier != getTotalScoreModifier() || oldScore != user.score){
                oldModifier = getTotalScoreModifier();

                if(oldScore != user.score){
                    // Save the user data, can't do this in the interrupt
                    storeUser();
                }
                oldScore = user.score;

                drawScreenTemplate();
            }

            if (getBatteryPercent() != oldBatteryPercent) {
                oldBatteryPercent = getBatteryPercent();
                updateBatteryIcon(oldBatteryPercent);
            }
        }

    }

}


/**
 * Update the battery icon based on the battery percentage
 * @param percent
 */
void updateBatteryIcon(uint8_t percent){

    util_gfx_fill_rect(GFX_WIDTH - 20, 0, 20, 12, COLOR_BLACK);

    switch(percent){
        case 255:
            util_gfx_draw_raw_file("SYSTEM/AC.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
        case 100:
            util_gfx_draw_raw_file("SYSTEM/BAT100.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
        case 75:
            util_gfx_draw_raw_file("SYSTEM/BAT75.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
        case 50:
            util_gfx_draw_raw_file("SYSTEM/BAT50.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
        case 25:
            util_gfx_draw_raw_file("SYSTEM/BAT25.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
        case 1:
            util_gfx_draw_raw_file("SYSTEM/BATOUT.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
        default:
        case 0:
            util_gfx_draw_raw_file("SYSTEM/BATINIT.RAW", GFX_WIDTH - 20, 0, 20, 12, NULL, false, NULL);
            break;
    }
}


/**
 * Draw a caret at the start of the y value given
 * @param y where to start the row
 */
void drawCaret(uint16_t oldY, uint16_t newY){

    //uint16_t oldColor = util_gfx_color_get();
    util_gfx_set_font(FONT_COMPUTER_12PT);

    util_gfx_set_color(COLOR_BLACK);
    util_gfx_set_cursor(0, oldY);
    util_gfx_print(">");


    util_gfx_set_color(COLOR_GREENYELLOW);
    util_gfx_set_cursor(0, newY);
    util_gfx_print(">");

    util_gfx_set_color(COLOR_WHITE);
    //util_gfx_set_color(oldColor);

}

/**
 * Draw the screen template, for the top of the screen
 */
void drawScreenTemplate(void){
    // Setup the main screen
    //util_gfx_fill_screen(COLOR_BLACK);
    util_gfx_fill_rect(0, 0, GFX_WIDTH, 25, COLOR_BLACK);
    util_gfx_cursor_area_reset();

    // Show the username
    util_gfx_set_font(FONT_MONO55_8PT);
    util_gfx_set_color(COLOR_WHITE);

    uint16_t w, h;
    /*util_gfx_get_text_bounds(user.name, 0, 0, &w, &h);
    util_gfx_set_cursor(64 - (w / 2), 2);
    util_gfx_print(user.name);

    util_gfx_get_text_bounds(getClanName(user.clan), 0, 0, &w, &h);
    util_gfx_set_cursor(64 - (w / 2), 15);
    util_gfx_print(getClanName(user.clan));*/

    util_gfx_set_font(FONT_GAMEPLAY_5PT);
    util_gfx_set_color(COLOR_BLUE);
    util_gfx_set_cursor(2, 2);

    char score[11];
    snprintf(score, 11, "%u", user.score);
    util_gfx_print(score);

    util_gfx_draw_line(0, 15, GFX_WIDTH, 15, COLOR_WHITE);
}


