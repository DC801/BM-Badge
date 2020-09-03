//
// Created by hamster on 8/2/18.
//

#include "common.h"
#include "nearby.h"
#include "engine/FrameBuffer.h"

#define BLOCK_HEIGHT 50
#define MAX_ROWS    2

static BADGE_ADV badges[NUM_BADGES_TO_STORE];
static uint8_t numBadges = 0;

/**
 * Draw a caret at the start of the y value given
 * @param y where to start the row
 */
static void drawMarker(uint16_t oldY, uint16_t newY){

    p_canvas()->drawVerticalLine(WIDTH - 1, oldY + 3, oldY + BLOCK_HEIGHT - 8, COLOR_BLACK);
    p_canvas()->drawVerticalLine(0, oldY + 3, oldY + BLOCK_HEIGHT - 8, COLOR_BLACK);

    // util_gfx_draw_line(GFX_WIDTH - 1, oldY + 3, GFX_WIDTH - 1, oldY + BLOCK_HEIGHT - 8, COLOR_BLACK);
    // util_gfx_draw_line(0, oldY + 3, 0, oldY + BLOCK_HEIGHT - 8, COLOR_BLACK);

    p_canvas()->drawVerticalLine(WIDTH - 1, newY + 3, newY + BLOCK_HEIGHT - 8, COLOR_LIGHTBLUE);
    p_canvas()->drawVerticalLine(0, newY + 3, newY + BLOCK_HEIGHT - 8, COLOR_LIGHTBLUE);

    // util_gfx_draw_line(GFX_WIDTH - 1, newY + 3, GFX_WIDTH - 1, newY + BLOCK_HEIGHT - 8, COLOR_LIGHTBLUE);
    // util_gfx_draw_line(0, newY + 3, 0, newY + BLOCK_HEIGHT - 8, COLOR_LIGHTBLUE);

}

/**
 * Draw a few rows of nearby
 * @param menu
 * @param startY
 * @param numItems
 * @param startRow
 */
static void drawItems(BADGE_ADV *badge, uint8_t numItems, uint8_t startRow){
//TODO: turn this to a module
    char row[25];

    p_canvas()->fillRect(0, 15, WIDTH, HEIGHT - 15, COLOR_BLACK);
    //util_gfx_fill_rect(0, 15, GFX_WIDTH, GFX_HEIGHT - 15, COLOR_BLACK);

    for(int i = 0; i < numItems; i++){

        // Line at the top
        p_canvas()->drawHorizontalLine(10, (BLOCK_HEIGHT * i) + 17, WIDTH - 10, COLOR_WHITE);
        // util_gfx_draw_line(10, (BLOCK_HEIGHT * i) + 17, GFX_WIDTH - 10, (BLOCK_HEIGHT * i) + 17, COLOR_WHITE);

        // First row
        snprintf(row, 25, "%d %02X%02X%02X%02X%02X%02X DC%d", i + startRow + 1,
                badge[i + startRow].mac[0], badge[i + startRow].mac[1], badge[i + startRow].mac[2],
                badge[i + startRow].mac[3], badge[i + startRow].mac[4], badge[i + startRow].mac[5],
                getBadgeYear(badge[i + startRow].year));

        p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, (BLOCK_HEIGHT * i) + 20);
        // util_gfx_set_cursor(2, (BLOCK_HEIGHT * i) + 20);
        // util_gfx_set_font(FONT_VERAMONO_5PT);
        // util_gfx_print(row);

        // Second row
        snprintf(row, 25, "%s", badge[i + startRow].name);
        p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, (BLOCK_HEIGHT * i) + 30);
        // util_gfx_set_cursor(2, (BLOCK_HEIGHT * i) + 30);
        // util_gfx_print(row);

        snprintf(row, 25, "% 4ddB", badge[i + startRow].rssi);
        p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 83, (BLOCK_HEIGHT * i) + 30);
        // util_gfx_set_cursor(83, (BLOCK_HEIGHT * i) + 30);
        // util_gfx_print(row);

        // Third row
        snprintf(row, 25, "%s", getBadgeGroupName(badge[i + startRow].group));
        p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, (BLOCK_HEIGHT * i) + 40);
        // util_gfx_set_cursor(2, (BLOCK_HEIGHT * i) + 40);
        // util_gfx_print(row);

        snprintf(row, 25, "%04X", badge[i + startRow].appearance);
        p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 95, (BLOCK_HEIGHT * i) + 40);
        // util_gfx_set_cursor(95, (BLOCK_HEIGHT * i) + 40);
        // util_gfx_print(row);

        // 4th row
        memset(row, 0, sizeof(row));
        if(badge[i + startRow].year == badgeYear_26 || badge[i + startRow].year == SWAP(badgeYear_26)) {
            if (badge[i + startRow].group == badge_dc801 || badge[i + startRow].group == SWAP(badge_dc801)) {
                // Show the score

                uint8_t scoreBytes[4];
                scoreBytes[0] = badge[i + startRow].data[1];
                scoreBytes[1] = badge[i + startRow].data[6];
                scoreBytes[2] = badge[i + startRow].data[4];
                scoreBytes[3] = badge[i + startRow].data[2];

                // check the CRC on the received score
                uint16_t crc = (badge[i + startRow].data[3] << 8) | badge[i + startRow].data[5];

                uint32_t score = 0;
                if(calcCRC(scoreBytes, 4, CRC_SEED_DC26) == crc) {

                    score = (scoreBytes[3] << 24) |
                            (scoreBytes[2] << 16) |
                            (scoreBytes[1] << 8) |
                            (scoreBytes[0]);
                }

                snprintf(row, 25, "Score %u", score);
            }
            if (badge[i + startRow].group == badge_dcfurs || badge[i + startRow].group == SWAP(badge_dcfurs)) {
                if (badge[i + startRow].data[0] == 0x35) {
                    snprintf(row, 25, "Has Rabies - RUN!");
                } else {
                    snprintf(row, 25, "Friendly");
                }
            }
        }

        if(badge[i + startRow].year == badgeYear_27 || badge[i + startRow].year == SWAP(badgeYear_27)) {
            if (badge[i + startRow].group == badge_dc801 || badge[i + startRow].group == SWAP(badge_dc801)) {
                // Show the score

                uint8_t scoreBytes[4];
                scoreBytes[0] = badge[i + startRow].data[1];
                scoreBytes[1] = badge[i + startRow].data[6];
                scoreBytes[2] = badge[i + startRow].data[4];
                scoreBytes[3] = badge[i + startRow].data[2];

                // check the CRC on the received score
                uint16_t crc = (badge[i + startRow].data[3] << 8) | badge[i + startRow].data[5];

                uint32_t score = 0;
                if(calcCRC(scoreBytes, 4, CRC_SEED_DC27) == crc) {

                    score = (scoreBytes[3] << 24) |
                            (scoreBytes[2] << 16) |
                            (scoreBytes[1] << 8) |
                            (scoreBytes[0]);
                }

                snprintf(row, 25, "Level %u", score);
            }
        }

        p_canvas()->printMessage(row, VeraMono5pt7b, COLOR_WHITE, 2, (BLOCK_HEIGHT * i) + 50);
        // util_gfx_set_cursor(2, (BLOCK_HEIGHT * i) + 50);
        // util_gfx_print(row);
    }
}

/**
 * Draw the nearby items
 */
void drawNearby(void){

    numBadges = getBadges(&badges[0]);

    // Setup the main screen
    p_canvas()->clearScreen(COLOR_BLACK);
    // util_gfx_fill_screen(COLOR_BLACK);

    char header[15];
    if(numBadges == 1){
        snprintf(header, 15, "I see 1 badge");
    }
    else {
        snprintf(header, 15, "I see %u badges", numBadges);
    }

    // uint16_t w, h;
    area_t nearby_area = {0,0, 128, 128};
    bounds_t bounds = { 0, 0 };

    // Show header
    p_canvas()->getTextBounds(VeraMono5pt7b, header, 0, 0, &nearby_area, &bounds);
    p_canvas()->printMessage(header, VeraMono5pt7b, COLOR_WHITE, 64 - (bounds.width / 2), 0);
    // util_gfx_set_font(FONT_VERAMONO_5PT);
    // util_gfx_set_color(COLOR_WHITE);
    // util_gfx_cursor_area_set(nearby_area);
    // util_gfx_get_text_bounds(header, 0, 0, &w, &h);
    // util_gfx_set_cursor(64 - (w / 2), 0);
    // util_gfx_print(header);

    drawItems(badges, MIN(numBadges, MAX_ROWS), 0);
}

/**
 * Draw the nearby menu
 */
void nearby(void){

    bool keepWaiting = true;

    uint8_t selected = 0;
    uint8_t cursor = 0;
    uint8_t startRow = 0;

    drawNearby();
    if(numBadges > 0) {
        drawMarker(15, 15);
    }

    while(keepWaiting) {
        switch (getButton(false)) {
            case USER_BUTTON_UP:
                // Are we at the top of the list of items?
                if(selected > 0){
                    // Do we need to scroll up?
                    if(cursor == 0){
                        // Need to scroll
                        drawItems(badges, MIN(numBadges, MAX_ROWS), --startRow);
                        drawMarker((cursor * BLOCK_HEIGHT) + 15, (cursor * BLOCK_HEIGHT) + 15);
                    }
                    else {
                        // No scroll, just move up
                        drawMarker((cursor * BLOCK_HEIGHT) + 15, ((cursor - 1) * BLOCK_HEIGHT) + 15);
                        cursor--;
                    }
                    selected--;
                }
                while(getButton(false) == USER_BUTTON_UP);
                break;
            case USER_BUTTON_DOWN:
                if(selected < numBadges - 1){
                    // Do we need to scroll down?
                    if(cursor == 1){
                        // Need to scroll
                        drawItems(badges, MIN(numBadges, MAX_ROWS), ++startRow);
                        drawMarker((cursor * BLOCK_HEIGHT) + 15, (cursor * BLOCK_HEIGHT) + 15);
                    }
                    else {
                        // No scroll, just move down
                        drawMarker((cursor * BLOCK_HEIGHT) + 15, ((cursor + 1) * BLOCK_HEIGHT) + 15);
                        cursor++;
                    }
                    selected++;
                }
                while(getButton(false) == USER_BUTTON_DOWN);
                break;
            case USER_BUTTON_B:
                keepWaiting = false;
                break;
            case USER_BUTTON_A:
                selected = 0;
                cursor = 0;
                startRow = 0;
                drawNearby();
                if(numBadges > 0) {
                    drawMarker(15, 15);
                }
                break;
            default:
                break;
        }

        nrf_delay_ms(25);
    }

    while(getButton(false) == USER_BUTTON_B){ }

}

int getNumDC801Badges(){
	int numDC801 = 0;
	int badgenumbers = getBadges(&badges[0]);
    for(int i = 0; i < badgenumbers; i++){
        if (badges[i].group == badge_dc801 || badges[i].group == SWAP(badge_dc801))
        	numDC801 += 1;
    }
    return numDC801;
}
