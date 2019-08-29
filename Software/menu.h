//
// Created by hamster on 7/18/18.
//

#ifndef DC27_BADGE_MENU_H
#define DC27_BADGE_MENU_H

#include "common.h"

typedef struct {
    uint8_t index;
    char *name;
} MENU;

int getMenuSelection(MENU *menu, uint16_t startRow, uint8_t numItems, uint8_t numRows, uint16_t timeout, bool updateHeader);
void drawCaret(uint16_t oldY, uint16_t newY);
int getChoice(void);
void updateBatteryIcon(uint8_t);
void drawScreenTemplate(void);

#endif //DC27_BADGE_MENU_H
