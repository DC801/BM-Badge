/*
 * menu.c
 *
 *  Created on: Jul 12, 2018
 *      Author: hamster
 */

#include "system.h"


static void mainMenu(void){

    nrf_gfx_point_t banner2 = NRF_GFX_POINT(30, 12);
    nrf_gfx_print(p_lcd, &banner2, LCD_COLOR_WHITE, "Test Menu", p_font, true);

    // Present the menu
    nrf_gfx_point_t item = NRF_GFX_POINT(10, 30);
    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE,  "Up      Buttons", p_font, true);

    item.x = 10, item.y = 42;
    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "Down   Bootload", p_font, true);

    item.x = 10, item.y = 54;
    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "Left    LEDs", p_font, true);

    item.x = 10, item.y = 66;
    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "Right   SDCard", p_font, true);

    item.x = 10, item.y = 78;
    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "A       Beeper", p_font, true);

}

static void ledMenu(void){

    nrf_gfx_point_t banner = NRF_GFX_POINT(32, 12);
    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "LED test", p_font, true);

}

static void buttonMenu(void){

    nrf_gfx_point_t banner = NRF_GFX_POINT(26, 12);
    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "Button test", p_font, true);

}

static void sdcardMenu(void){

    nrf_gfx_point_t banner = NRF_GFX_POINT(26, 12);
    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "SDCard test", p_font, true);

}

static void beeperMenu(void){

    nrf_gfx_point_t banner = NRF_GFX_POINT(26, 12);
    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "Beeper test", p_font, true);

}

static void bootloadMenu(void){

    nrf_gfx_point_t banner = NRF_GFX_POINT(32, 12);
    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "Bootload", p_font, true);

}

void showMenu(MENU menu){

	// Clear the screen
	nrf_gfx_screen_fill(p_lcd, LCD_COLOR_BLACK);

    nrf_gfx_point_t banner = NRF_GFX_POINT(45, 0);
    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "DC801", p_font, true);

	switch(menu){
		case MENU_MAIN:
			mainMenu();
			break;
		case MENU_BUTTONS:
			buttonMenu();
			break;
		case MENU_SDCARD:
			sdcardMenu();
			break;
		case MENU_LEDS:
			ledMenu();
			break;
		case MENU_BEEPER:
			beeperMenu();
			break;
		case MENU_BOOTLOAD:
			bootloadMenu();
			break;
	}

}

