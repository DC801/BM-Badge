/*
 * tests.c
 *
 *  Created on: Jul 13, 2018
 *      Author: hamster
 */

#include "system.h"

#define SDC_SCK_PIN     (28)        ///< SDC serial clock (SCK) pin.
#define SDC_MOSI_PIN    (29)        ///< SDC serial data in (DI) pin.
#define SDC_MISO_PIN    (27)        ///< SDC serial data out (DO) pin.
#define SDC_CS_PIN      (30)   		///< SDC chip select (CS) pin.

/**
 * @brief  SDC block device definition
 * */

NRF_BLOCK_DEV_SDC_DEFINE(
		m_block_dev_sdc,
		NRF_BLOCK_DEV_SDC_CONFIG(
				SDC_SECTOR_SIZE,
				APP_SDCARD_CONFIG(SDC_MOSI_PIN, SDC_MISO_PIN, SDC_SCK_PIN, SDC_CS_PIN) ),
		NFR_BLOCK_DEV_INFO_CONFIG("Nordic", "SDC", "1.00"));


/**
 * Test the LEDs by lighting each up
 */
void testLEDs(void){

	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
	nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Level Up", p_font, true);

	nrf_gpio_pin_clear(LED_LEVEL_UP_0);
	nrf_delay_ms(200);
	nrf_gpio_pin_clear(LED_LEVEL_UP_1);
	nrf_delay_ms(200);
	nrf_gpio_pin_clear(LED_LEVEL_UP_2);
	nrf_delay_ms(200);
	nrf_gpio_pin_clear(LED_LEVEL_UP_3);
	nrf_delay_ms(200);

	nrf_gpio_pin_set(LED_LEVEL_UP_0);
	nrf_gpio_pin_set(LED_LEVEL_UP_1);
	nrf_gpio_pin_set(LED_LEVEL_UP_2);
	nrf_gpio_pin_set(LED_LEVEL_UP_3);
	nrf_delay_ms(200);

	nrf_gpio_pin_clear(LED_LEVEL_UP_0);
	nrf_gpio_pin_clear(LED_LEVEL_UP_1);
	nrf_gpio_pin_clear(LED_LEVEL_UP_2);
	nrf_gpio_pin_clear(LED_LEVEL_UP_3);
	nrf_delay_ms(200);

	nrf_gpio_pin_set(LED_LEVEL_UP_0);
	nrf_gpio_pin_set(LED_LEVEL_UP_1);
	nrf_gpio_pin_set(LED_LEVEL_UP_2);
	nrf_gpio_pin_set(LED_LEVEL_UP_3);
	nrf_delay_ms(200);

	nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
	nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Power Up", p_font, true);

	nrf_gpio_pin_clear(LED_POWER_UP_0);
	nrf_delay_ms(200);
	nrf_gpio_pin_clear(LED_POWER_UP_1);
	nrf_delay_ms(200);
	nrf_gpio_pin_clear(LED_POWER_UP_2);
	nrf_delay_ms(200);
	nrf_gpio_pin_clear(LED_POWER_UP_3);
	nrf_delay_ms(200);

	nrf_gpio_pin_set(LED_POWER_UP_0);
	nrf_gpio_pin_set(LED_POWER_UP_1);
	nrf_gpio_pin_set(LED_POWER_UP_2);
	nrf_gpio_pin_set(LED_POWER_UP_3);
	nrf_delay_ms(200);

	nrf_gpio_pin_clear(LED_POWER_UP_0);
	nrf_gpio_pin_clear(LED_POWER_UP_1);
	nrf_gpio_pin_clear(LED_POWER_UP_2);
	nrf_gpio_pin_clear(LED_POWER_UP_3);
	nrf_delay_ms(200);

	nrf_gpio_pin_set(LED_POWER_UP_0);
	nrf_gpio_pin_set(LED_POWER_UP_1);
	nrf_gpio_pin_set(LED_POWER_UP_2);
	nrf_gpio_pin_set(LED_POWER_UP_3);
	nrf_delay_ms(200);

}

void testButtons(void){

    nrf_gfx_point_t item = NRF_GFX_POINT(10, 30);
    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE,  "Press a button", p_font, true);

    bool waiting = true;
    uint16_t counter = 0;
    while(waiting){
    	// Scan for buttons
    	if(nrf_gpio_pin_read(USER_BUTTON_UP) == BUTTON_PRESSED){
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Up", p_font, true);
    		while(nrf_gpio_pin_read(USER_BUTTON_UP) == BUTTON_PRESSED);
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		counter = 0;
    	}
    	if(nrf_gpio_pin_read(USER_BUTTON_DOWN) == BUTTON_PRESSED){
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Down", p_font, true);
    		while(nrf_gpio_pin_read(USER_BUTTON_DOWN) == BUTTON_PRESSED);
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		counter = 0;
    	}
    	if(nrf_gpio_pin_read(USER_BUTTON_RIGHT) == BUTTON_PRESSED){
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Right", p_font, true);
    		while(nrf_gpio_pin_read(USER_BUTTON_RIGHT) == BUTTON_PRESSED);
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		counter = 0;
    	}
    	if(nrf_gpio_pin_read(USER_BUTTON_LEFT) == BUTTON_PRESSED){
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "Left", p_font, true);
    		while(nrf_gpio_pin_read(USER_BUTTON_LEFT) == BUTTON_PRESSED);
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		counter = 0;
    	}
    	if(nrf_gpio_pin_read(USER_BUTTON_A) == BUTTON_PRESSED){
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "A", p_font, true);
    		while(nrf_gpio_pin_read(USER_BUTTON_A) == BUTTON_PRESSED);
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		counter = 0;
    	}
    	if(nrf_gpio_pin_read(USER_BUTTON_B) == BUTTON_PRESSED){
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		nrf_gfx_print(p_lcd, &status, LCD_COLOR_GREEN, "B", p_font, true);
    		while(nrf_gpio_pin_read(USER_BUTTON_B) == BUTTON_PRESSED);
    		nrf_gfx_rect_draw(p_lcd, &status_box, 1, LCD_COLOR_BLACK, true);
    		counter = 0;
    	}

    	nrf_delay_ms(1);
    	counter++;

    	if(counter > 2500){
    		waiting = false;
    	}
    }

}


void testSDCard(void){

	FRESULT ff_result;
	DSTATUS disk_state = STA_NOINIT;
	FATFS m_fs;
	nrf_gfx_point_t item = NRF_GFX_POINT(10, 30);

	// Initialize FATFS disk I/O interface by providing the block device.
	static diskio_blkdev_t drives[] = {
	DISKIO_BLOCKDEV_CONFIG(NRF_BLOCKDEV_BASE_ADDR(m_block_dev_sdc, block_dev), NULL)
			};

	diskio_blockdev_register(drives, ARRAY_SIZE(drives));


	for (uint32_t retries = 3; retries && disk_state; --retries) {
		disk_state = disk_initialize(0);
	}

	if (disk_state) {
	    nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE,  "Init Failed", p_font, true);
	    item.x = 26, item.y = 85;
	    nrf_gfx_print(p_lcd, &item, LCD_COLOR_RED, "SDCard Fail", p_font, true);
	    nrf_delay_ms(500);
		return;
	}
	nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE,  "Initialized!", p_font, true);
	nrf_delay_ms(500);


//	uint32_t blocks_per_mb = (1024uL * 1024uL) / m_block_dev_sdc.block_dev.p_ops->geometry(&m_block_dev_sdc.block_dev)->blk_size;
//	uint32_t capacity = m_block_dev_sdc.block_dev.p_ops->geometry(&m_block_dev_sdc.block_dev)->blk_count / blocks_per_mb;
//	UNUSED_VARIABLE(capacity);

	item.x = 10, item.y = 45;
	ff_result = f_mount(&m_fs, "", 1);
	if (ff_result) {
		nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "Mount failed", p_font, true);
		item.x = 26, item.y = 85;
		nrf_gfx_print(p_lcd, &item, LCD_COLOR_RED, "SDCard Fail", p_font, true);
		nrf_delay_ms(500);
		return;
	}
	nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "Mounted!", p_font, true);
	nrf_delay_ms(500);

	//Check version metadata
	item.x = 10, item.y = 60;
	char version_data[32];
	FRESULT result = util_sd_load_file("VERSION", (uint8_t *) version_data, 32);
	if (result != FR_OK) {
		nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "No version file", p_font, true);
		item.x = 26, item.y = 85;
		nrf_gfx_print(p_lcd, &item, LCD_COLOR_RED, "SDCard Fail", p_font, true);
		nrf_delay_ms(500);
		return;
	}
	nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, "Version:", p_font, true);
	item.x = 80, item.y = 60;
	char version[11];
	memcpy(&version, version_data + 8, 2);
	version[10] = 0;
	nrf_gfx_print(p_lcd, &item, LCD_COLOR_WHITE, version, p_font, true);
	nrf_delay_ms(500);

	item.x = 26, item.y = 85;
	nrf_gfx_print(p_lcd, &item, LCD_COLOR_GREEN, "SDCard Pass", p_font, true);

	nrf_delay_ms(2500);
}


FRESULT util_sd_load_file(char *path, uint8_t *p_buffer, uint32_t count) {
	FIL file;

	FRESULT result = f_open(&file, path, FA_READ | FA_OPEN_EXISTING);
	if (result != FR_OK) {
		return result;
	}

	UINT bytesread = 0;
	result = f_read(&file, p_buffer, count, &bytesread);

	f_close(&file);
	return result;
}


void testBeeper(void){

    for(int i = 0; i < 50; i++){
            beep(25, 600 + (i * 10));
    }

    for(int i = 50; i > 0; i--){
            beep(25, 600 + (i * 10));
    }

}

/**
 * @brief Beeps the speaker for a duration at a certain frequency
 * @param duration How long to beep
 * @param frequency Tone freq in hz
 *
 * @note Busy waits, frequency might not be exact, might sound uneven if the softdevice needs to do BLE things
 */
void beep(int duration, int frequency){

        // Figure out how many beeps
        float period = 1000 / (float)frequency;
        long counter = period * duration;
        float delay = period / 2;

        //printf("Duration: %d Freq: %d Period: %f Count: %ld Delay: %f\n", duration, frequency, period, counter, delay);

        for(long i = 0; i < counter; i++){
                nrf_gpio_pin_write(SPEAKER, 1);
                nrf_delay_us(delay * 1000);
                nrf_gpio_pin_write(SPEAKER, 0);
                nrf_delay_us(delay * 1000);
        }

}



