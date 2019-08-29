/*
 * menu.h
 *
 *  Created on: Jul 12, 2018
 *      Author: hamster
 */

#ifndef BOOTLOADER_MENU_H_
#define BOOTLOADER_MENU_H_

typedef enum {
	MENU_MAIN,
	MENU_BUTTONS,
	MENU_SDCARD,
	MENU_LEDS,
	MENU_BEEPER,
	MENU_BOOTLOAD
} MENU;

void showMenu(MENU menu);


#endif /* BOOTLOADER_MENU_H_ */
