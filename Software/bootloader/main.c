/**
 * Copyright (c) 2016 - 2018, Nordic Semiconductor ASA
 * 
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 * 
 * 3. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 * 
 * 4. This software, with or without modification, must only be used with a
 *    Nordic Semiconductor ASA integrated circuit.
 * 
 * 5. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 * 
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
 * OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 */
/** @file
 *
 * @defgroup bootloader_secure_ble main.c
 * @{
 * @ingroup dfu_bootloader_api
 * @brief Bootloader project main file for secure DFU.
 *
 */

#include "system.h"

nrf_gfx_point_t status = NRF_GFX_POINT(35, 85);
nrf_gfx_rect_t status_box = NRF_GFX_RECT(0, 80, 128, 40);

static void on_error(void){

	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
	nrf_gfx_print(p_lcd, &status, LCD_COLOR_RED, "Error - Rebooting", p_font, true);

	nrf_delay_ms(500);

    NVIC_SystemReset();
}


void app_error_handler(uint32_t error_code, uint32_t line_num, const uint8_t * p_file_name){
    on_error();
}


void app_error_fault_handler(uint32_t id, uint32_t pc, uint32_t info){
    on_error();
}


void app_error_handler_bare(uint32_t error_code){
    on_error();
}

/**
 * @brief Function notifies certain events in DFU process.
 */
static void dfu_observer(nrf_dfu_evt_type_t evt_type){

    switch (evt_type){
        case NRF_DFU_EVT_DFU_FAILED:
        	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
        	nrf_gfx_print(p_lcd, &status, LCD_COLOR_RED, "Failed", p_font, true);
        	break;
        case NRF_DFU_EVT_DFU_ABORTED:
        	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
        	nrf_gfx_print(p_lcd, &status, LCD_COLOR_RED, "Aborted", p_font, true);
        	break;
        case NRF_DFU_EVT_DFU_INITIALIZED:
        	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
        	nrf_gfx_print(p_lcd, &status, LCD_COLOR_WHITE, "Init", p_font, true);
        	nrf_gpio_pin_clear(LED_LEVEL_UP_0);
            break;
        case NRF_DFU_EVT_TRANSPORT_ACTIVATED:
        	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
        	nrf_gfx_print(p_lcd, &status, LCD_COLOR_YELLOW, "Send Data", p_font, true);
        	nrf_gpio_pin_clear(LED_LEVEL_UP_1);
            break;
        case NRF_DFU_EVT_DFU_STARTED:
        	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
        	nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Program", p_font, true);
        	nrf_gpio_pin_clear(LED_LEVEL_UP_2);
            break;
        case NRF_DFU_EVT_OBJECT_RECEIVED:
        	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
			nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Program...", p_font, true);
			nrf_gpio_pin_clear(LED_LEVEL_UP_3);
			break;
        default:
            break;
    }
}

void init(void){

	// Setup and turn off the LEDs
	nrf_gpio_cfg_output(LED_LEVEL_UP_0);
	nrf_gpio_cfg_output(LED_LEVEL_UP_1);
	nrf_gpio_cfg_output(LED_LEVEL_UP_2);
	nrf_gpio_cfg_output(LED_LEVEL_UP_3);
	nrf_gpio_cfg_output(LED_POWER_UP_0);
	nrf_gpio_cfg_output(LED_POWER_UP_1);
	nrf_gpio_cfg_output(LED_POWER_UP_2);
	nrf_gpio_cfg_output(LED_POWER_UP_3);

	nrf_gpio_pin_set(LED_LEVEL_UP_0);
	nrf_gpio_pin_set(LED_LEVEL_UP_1);
	nrf_gpio_pin_set(LED_LEVEL_UP_2);
	nrf_gpio_pin_set(LED_LEVEL_UP_3);
	nrf_gpio_pin_set(LED_POWER_UP_0);
	nrf_gpio_pin_set(LED_POWER_UP_1);
	nrf_gpio_pin_set(LED_POWER_UP_2);
	nrf_gpio_pin_set(LED_POWER_UP_3);

    // LCD - Reset first
    nrf_gpio_cfg_output(LCD_RESET);
    nrf_gpio_pin_set(LCD_RESET);
    nrf_delay_ms(10);
    nrf_gpio_pin_clear(LCD_RESET);
    nrf_delay_ms(10);
    nrf_gpio_pin_set(LCD_RESET);

    // Setup the backlight and turn it on
    nrf_gpio_cfg_output(LCD_LIGHT);
    nrf_gpio_pin_clear(LCD_LIGHT);

    // Init the screen
    nrf_gfx_init(p_lcd);

    // Screen is upside down on the badge
    nrf_gfx_rotation_set(p_lcd, NRF_LCD_ROTATE_180);

	// Fill the screen with black
	nrf_gfx_screen_fill(p_lcd, LCD_COLOR_BLACK);

	// Setup the buttons
	nrf_gpio_cfg_input(USER_BUTTON_UP, NRF_GPIO_PIN_NOPULL);
	nrf_gpio_cfg_input(USER_BUTTON_DOWN, NRF_GPIO_PIN_NOPULL);
	nrf_gpio_cfg_input(USER_BUTTON_LEFT, NRF_GPIO_PIN_NOPULL);
	nrf_gpio_cfg_input(USER_BUTTON_RIGHT, NRF_GPIO_PIN_NOPULL);
	nrf_gpio_cfg_input(USER_BUTTON_A, NRF_GPIO_PIN_NOPULL);
	nrf_gpio_cfg_input(USER_BUTTON_B, NRF_GPIO_PIN_NOPULL);

	// Setup the beeper
	nrf_gpio_cfg_output(SPEAKER);
}


/**@brief Function for application main entry. */
int main(void){

	nrf_gpio_cfg_input(USER_BUTTON_A, NRF_GPIO_PIN_NOPULL);

    uint32_t ret_val;

    // Protect MBR and bootloader code from being overwritten.
    ret_val = nrf_bootloader_flash_protect(0, MBR_SIZE, false);
    APP_ERROR_CHECK(ret_val);
    ret_val = nrf_bootloader_flash_protect(BOOTLOADER_START_ADDR, BOOTLOADER_SIZE, false);
    APP_ERROR_CHECK(ret_val);


    // Should we enter the test/load menu?
	if(nrf_gpio_pin_read(USER_BUTTON_A) == BUTTON_PRESSED){

		// Setup the rest of the hardware
		init();

	    nrf_gfx_point_t banner = NRF_GFX_POINT(45, 0);
	    nrf_gfx_print(p_lcd, &banner, LCD_COLOR_WHITE, "DC801", p_font, true);

	    // Show the main menu
	    showMenu(MENU_MAIN);

	    // Wait until the button is released
	    while(nrf_gpio_pin_read(USER_BUTTON_A) == BUTTON_PRESSED);
	    nrf_delay_ms(100);

	    while(true){
	    	nrf_gpio_pin_set(LED_LEVEL_UP_0);
	    	if(nrf_gpio_pin_read(USER_BUTTON_UP) == BUTTON_PRESSED){
	    		// Button test
	    		while(nrf_gpio_pin_read(USER_BUTTON_UP) == BUTTON_PRESSED);
	    		showMenu(MENU_BUTTONS);
	    		testButtons();
	    		showMenu(MENU_MAIN);
	    	}
	    	if(nrf_gpio_pin_read(USER_BUTTON_DOWN) == BUTTON_PRESSED){
	    		// Bootload
	    		showMenu(MENU_BOOTLOAD);
	    	    ret_val = nrf_bootloader_init(dfu_observer);
	    	    APP_ERROR_CHECK(ret_val);
	    		nrf_gpio_pin_set(LED_LEVEL_UP_0);
	    		nrf_gpio_pin_set(LED_LEVEL_UP_1);
	    		nrf_gpio_pin_set(LED_LEVEL_UP_2);
	    		nrf_gpio_pin_set(LED_LEVEL_UP_3);
	    	    showMenu(MENU_MAIN);
	    	}
	    	if(nrf_gpio_pin_read(USER_BUTTON_LEFT) == BUTTON_PRESSED){
	    		// LED test
	    		while(nrf_gpio_pin_read(USER_BUTTON_LEFT) == BUTTON_PRESSED);
	    		showMenu(MENU_LEDS);
	    		testLEDs();
	    		showMenu(MENU_MAIN);
	    	}
	    	if(nrf_gpio_pin_read(USER_BUTTON_RIGHT) == BUTTON_PRESSED){
	    		// SD card
	    	    while(nrf_gpio_pin_read(USER_BUTTON_RIGHT) == BUTTON_PRESSED);
	    	    showMenu(MENU_SDCARD);
	    	    testSDCard();
	    	    showMenu(MENU_MAIN);
	    	}
	    	if(nrf_gpio_pin_read(USER_BUTTON_A) == BUTTON_PRESSED){
	    		// Beeper
	    	    while(nrf_gpio_pin_read(USER_BUTTON_A) == BUTTON_PRESSED);
	    	    showMenu(MENU_BEEPER);
	    	    testBeeper();
	    	    showMenu(MENU_MAIN);
	    	}
	    }
	}

    // Test/Load not selected, try to start the main app
    nrf_bootloader_app_start();

    nrf_gpio_pin_clear(LED_POWER_UP_0);

}




/**
 * @}
 */
