/*
 * @file utility.c
 *
 * @date Jul 24, 2017
 * @author hamster
 *
 *  Utility functions
 *
 */

#include "common.h"

#define EE_R1 3900
#define EE_R2 10000
#define EE_R3 15000
#define EE_R4 4999
#define EE_TOTR (EE_R1 + EE_R2 + EE_R3 + EE_R4)
#define EE_VOLT(X) (getVccMillivolts() * (X) / EE_TOTR)

APP_PWM_INSTANCE(PWM1,1);
APP_TIMER_DEF(morseID);
volatile static uint32_t systick = 0;
bool morse_running = false;

/**
 * Start the local time reference
 * It's seeded at bootup from the user storage, if it exists
 * @param time
 */
void sysTickStart(void){
    systick = 0;
    app_timer_create(&sysTickID, APP_TIMER_MODE_REPEATED, sysTickHandler);
    app_timer_start(sysTickID, APP_TIMER_TICKS(1000), NULL);
}

/**
 * @return number of seconds since we started counting time
 */
uint32_t getSystick(void){
    return systick;
}

/**
 * Every second, update the systick handler
 * @param p_context
 */
void sysTickHandler(void * p_context){
    systick++;
}


//SOS RCVED BK MANY HOSTILES BK PLS TRNSMIT CODE 801801 WHEN RDY 4 SUPORT FN
//...  ---  ...      .-.  -.-.  ...-  .  -..      -...  -.-      --  .-  -.  -.--      ....  ---  ...  -  ..  .-..  .  ...      -...  -.-      .--.  .-..  ...      -  .-.  -.  ...  --  ..  -      -.-.  ---  -..  .      ---..  -----  .----  ---..  -----  .----      .--  ....  .  -.      .-.  -..  -.--      ....-      ...  ..-  .--.  ---  .-.  -      ..-.  -.
const uint8_t morseMessage[] = {1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
uint16_t morseIdx =0;

uint8_t ls;
void morseTickHandler(void * p_context) {
    uint8_t s = morseMessage[morseIdx];

    if (s != ls){
        if (s)
            ledOn(LED_SIGNAL);
        else
            ledOff(LED_SIGNAL);
    }
    ls=s;

    morseIdx = ((morseIdx+1) % sizeof(morseMessage));
}

void morseInit(void ) {
    app_timer_create(&morseID, APP_TIMER_MODE_REPEATED, morseTickHandler);
}

void morseStart(void) {
    morseIdx=0;
    ls = 2;
    app_timer_start(morseID, APP_TIMER_TICKS(80), NULL);  //15WPM
    morse_running = true;
}

void morseStop(void) {
    app_timer_stop(morseID);
    ledOff(LED_SIGNAL);
    morse_running = false;
}

bool morseGetRunning(void){
	return morse_running;
}

/**
 * @brief Determine if a button is being pressed.
 * @param waitForLongPress true if we want to wait to see if a button is long pressed
 * @return Button pressed, with long press mask if long pressed
 *
 * Buttons are debounced for a few milliseconds
 * Buttons held down for longer than the defined long press duration are sent
 * as a long press button
 */
uint8_t getButton(bool waitForLongPress){

	int longPress = 0;
	int button = 0;

	if(isButtonDown(USER_BUTTON_UP)){
		// Debounce
		nrf_delay_ms(BUTTON_DEBOUNCE_MS);
		if(isButtonDown(USER_BUTTON_UP)) {
            button = USER_BUTTON_UP;
            if (waitForLongPress){
                while (isButtonDown(USER_BUTTON_UP)) {
                    nrf_delay_ms(1);
                    longPress++;
                    if (longPress > BUTTON_LONG_PRESS_MS) {
                        break;
                    }
                }
            }
		}
	}
	if(isButtonDown(USER_BUTTON_DOWN)){
		// Debounce
		nrf_delay_ms(BUTTON_DEBOUNCE_MS);
		if(isButtonDown(USER_BUTTON_DOWN)){
			button = USER_BUTTON_DOWN;
            if (waitForLongPress) {
                while (isButtonDown(USER_BUTTON_DOWN)) {
                    nrf_delay_ms(1);
                    longPress++;
                    if (longPress > BUTTON_LONG_PRESS_MS) {
                        break;
                    }
                }
            }
		}
	}
	if(isButtonDown(USER_BUTTON_LEFT)){
		// Debounce
		nrf_delay_ms(BUTTON_DEBOUNCE_MS);
		if(isButtonDown(USER_BUTTON_LEFT)){
			button = USER_BUTTON_LEFT;
            if (waitForLongPress) {
                while (isButtonDown(USER_BUTTON_LEFT)) {
                    nrf_delay_ms(1);
                    longPress++;
                    if (longPress > BUTTON_LONG_PRESS_MS) {
                        break;
                    }
                }
            }
		}
	}
	if(isButtonDown(USER_BUTTON_RIGHT)){
		// Debounce
		nrf_delay_ms(BUTTON_DEBOUNCE_MS);
		if(isButtonDown(USER_BUTTON_RIGHT)){
			button = USER_BUTTON_RIGHT;
            if (waitForLongPress) {
                while (isButtonDown(USER_BUTTON_RIGHT)) {
                    nrf_delay_ms(1);
                    longPress++;
                    if (longPress > BUTTON_LONG_PRESS_MS) {
                        break;
                    }
                }
            }
		}
	}
	if(isButtonDown(USER_BUTTON_A)){
		// Debounce
		nrf_delay_ms(BUTTON_DEBOUNCE_MS);
		if(isButtonDown(USER_BUTTON_A)){
			button = USER_BUTTON_A;
            if (waitForLongPress) {
                while (isButtonDown(USER_BUTTON_A)) {
                    nrf_delay_ms(1);
                    longPress++;
                    if (longPress > BUTTON_LONG_PRESS_MS) {
                        break;
                    }
                }
            }
		}
	}
	if(isButtonDown(USER_BUTTON_B)){
		// Debounce
		nrf_delay_ms(BUTTON_DEBOUNCE_MS);
		if(isButtonDown(USER_BUTTON_B)){
			button = USER_BUTTON_B;
            if (waitForLongPress) {
                while (isButtonDown(USER_BUTTON_B)) {
                    nrf_delay_ms(1);
                    longPress++;
                    if (longPress > BUTTON_LONG_PRESS_MS) {
                        break;
                    }
                }
            }
		}
	}


	if(longPress > BUTTON_LONG_PRESS_MS){
		button |= LONG_PRESS_MASK;
	}

	return button;

}


/**
 * @brief Detects if a button is being held down
 * @param button Is this button pressed down?
 * @return true if button is pressed down
 */
bool isButtonDown(int button){
#ifdef DC801_EMBEDDED
	if(nrf_gpio_pin_read(button) == BUTTON_PRESSED){
		return true;
	}
#endif

#ifdef DC801_DESKTOP
    const uint8_t *keys = SDL_GetKeyboardState(NULL);

    switch (button)
    {
        case USER_BUTTON_UP:
            if (keys[SDL_SCANCODE_UP]) {
                return true;
            }

            break;
        case USER_BUTTON_DOWN:
            if (keys[SDL_SCANCODE_DOWN]) {
                return true;
            }

            break;
        case USER_BUTTON_LEFT:
            if (keys[SDL_SCANCODE_LEFT]) {
                return true;
            }

            break;
        case USER_BUTTON_RIGHT:
            if (keys[SDL_SCANCODE_RIGHT]) {
                return true;
            }

            break;
        case USER_BUTTON_A:
            if (keys[SDL_SCANCODE_A]) {
                return true;
            }

            break;
        case USER_BUTTON_B:
            if (keys[SDL_SCANCODE_S]) {
                return true;
            }

            break;
    }
#endif

	return false;
}


/**
 * @brief Pause the program until a button has been pressed and released
 * @param button Wait on this button
 */
void pauseUntilPress(int button){

	while(true){
        #ifdef DC801_DESKTOP
            if (application_quit != 0)
            {
                break;
            }
        #endif

		if(nrf_gpio_pin_read(button) == BUTTON_PRESSED){
			// Debounce
			nrf_delay_ms(button);
			if(nrf_gpio_pin_read(button) == BUTTON_PRESSED){
				while(nrf_gpio_pin_read(button) == BUTTON_PRESSED);
				return;
			}
		}
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

	for(long i = 0; i < counter; i++){
		nrf_gpio_pin_write(SPEAKER, 1);
		nrf_delay_us(delay * 1000);
		nrf_gpio_pin_write(SPEAKER, 0);
		nrf_delay_us(delay * 1000);
	}

}


/**
 * Get a string from the user
 * @param retString
 * @param chars
 * @param showScroll
 */
void getString(char *retString, uint8_t chars, bool showScroll) {

	uint8_t curIndex = 0;
	char string[32];
	char pre;
	char post;
	int16_t xPos = util_gfx_cursor_x_get(), yPos = util_gfx_cursor_y_get();
	bool done = false;

	memcpy(string, retString, chars);

	do {

        if (string[curIndex] == 0) {
            string[curIndex] = ' ';
        }

        pre = string[curIndex] - 1;
        if (pre < FIRST_ALLOWED_CHAR) {
            pre = LAST_ALLOWED_CHAR;
        }
        post = string[curIndex] + 1;
        if (post > LAST_ALLOWED_CHAR) {
            post = FIRST_ALLOWED_CHAR;
        }


        if (showScroll) {
            util_gfx_fill_rect(xPos, yPos - 3, util_gfx_font_width() * chars + util_gfx_font_width(), util_gfx_font_height() * 3, COLOR_BLACK);

            util_gfx_set_cursor(xPos + (util_gfx_font_width() * curIndex), yPos);
            util_gfx_print_char(pre);
            util_gfx_set_cursor(xPos, yPos + util_gfx_font_height());
            util_gfx_print(string);
            util_gfx_draw_line(
                    xPos + (util_gfx_font_width() * curIndex),
                    yPos + (util_gfx_font_height() * 2) - 4,
                    xPos + (util_gfx_font_width() * curIndex) + util_gfx_font_width(),
                    yPos + (util_gfx_font_height() * 2) - 4,
                    COLOR_RED);
            util_gfx_set_cursor(xPos + (util_gfx_font_width() * curIndex), yPos + (util_gfx_font_height() * 2));
            util_gfx_print_char(post);
        }
        else{
            util_gfx_fill_rect(xPos, yPos - 3, util_gfx_font_width() * chars, util_gfx_font_height(), COLOR_BLACK);

            util_gfx_set_cursor(xPos + (util_gfx_font_width() * curIndex), yPos);
            util_gfx_print(string);
            util_gfx_draw_line(xPos, yPos + util_gfx_font_height(), xPos + util_gfx_font_width(), yPos + util_gfx_font_height(), COLOR_RED);
        }


		bool waitForButton = true;

		while (waitForButton) {

			switch (getButton(false)) {
                case USER_BUTTON_A:
                    done = true;
                    waitForButton = false;
                    while (getButton(false) == USER_BUTTON_A) {

                    }
                    break;
                case USER_BUTTON_B:
                    done = true;
                    waitForButton = false;
                    while (getButton(false) == USER_BUTTON_B) {

                    }
                    break;
                case USER_BUTTON_UP:
                    string[curIndex]++;
                    if (string[curIndex] > LAST_ALLOWED_CHAR) {
                        string[curIndex] = FIRST_ALLOWED_CHAR;
                    }
                    waitForButton = false;
                    nrf_delay_ms(100);
                    break;
                case USER_BUTTON_DOWN:
                    string[curIndex]--;
                    if (string[curIndex] < FIRST_ALLOWED_CHAR) {
                        string[curIndex] = LAST_ALLOWED_CHAR;
                    }
                    waitForButton = false;
                    nrf_delay_ms(100);
                    break;
                case USER_BUTTON_RIGHT:
                    if (string[curIndex] != ' ') {
                        if (curIndex < chars - 1) {
                            curIndex++;
                        }
                    }
					waitForButton = false;
					while (getButton(false) == USER_BUTTON_RIGHT) {

					}
					break;
				case USER_BUTTON_LEFT:
					if (curIndex > 0) {
						curIndex--;
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

	} while (!done);

	memcpy(retString, string, chars);

}

/**
 * Set the level up LEDs
 * @param level
 */
void setLevelLEDs(LEVEL level) {

    switch (level) {
        default:
        case LEVEL0:
            nrf_gpio_pin_set(LED_LEVEL_UP_0);
            nrf_gpio_pin_set(LED_LEVEL_UP_1);
            nrf_gpio_pin_set(LED_LEVEL_UP_2);
            nrf_gpio_pin_set(LED_LEVEL_UP_3);
            break;
        case LEVEL1:
            nrf_gpio_pin_clear(LED_LEVEL_UP_0);
            nrf_gpio_pin_set(LED_LEVEL_UP_1);
            nrf_gpio_pin_set(LED_LEVEL_UP_2);
            nrf_gpio_pin_set(LED_LEVEL_UP_3);
            break;
        case LEVEL2:
            nrf_gpio_pin_clear(LED_LEVEL_UP_0);
            nrf_gpio_pin_clear(LED_LEVEL_UP_1);
            nrf_gpio_pin_set(LED_LEVEL_UP_2);
            nrf_gpio_pin_set(LED_LEVEL_UP_3);
            break;
        case LEVEL3:
            nrf_gpio_pin_clear(LED_LEVEL_UP_0);
            nrf_gpio_pin_clear(LED_LEVEL_UP_1);
            nrf_gpio_pin_clear(LED_LEVEL_UP_2);
            nrf_gpio_pin_set(LED_LEVEL_UP_3);
            break;
        case LEVEL4:
            nrf_gpio_pin_clear(LED_LEVEL_UP_0);
            nrf_gpio_pin_clear(LED_LEVEL_UP_1);
            nrf_gpio_pin_clear(LED_LEVEL_UP_2);
            nrf_gpio_pin_clear(LED_LEVEL_UP_3);
            break;
    }
}

/**
 * Set the power up LEDs
 * @param powerUp
 */
void setPowerUpLEDs(POWERUP powerUp){

    switch (powerUp) {
        default:
        case POWERUP_0:
            nrf_gpio_pin_set(LED_POWER_UP_0);
            nrf_gpio_pin_set(LED_POWER_UP_1);
            nrf_gpio_pin_set(LED_POWER_UP_2);
            nrf_gpio_pin_set(LED_POWER_UP_3);
            break;
        case POWERUP_1:
            nrf_gpio_pin_clear(LED_POWER_UP_0);
            nrf_gpio_pin_set(LED_POWER_UP_1);
            nrf_gpio_pin_set(LED_POWER_UP_2);
            nrf_gpio_pin_set(LED_POWER_UP_3);
            break;
        case POWERUP_2:
            nrf_gpio_pin_clear(LED_POWER_UP_0);
            nrf_gpio_pin_clear(LED_POWER_UP_1);
            nrf_gpio_pin_set(LED_POWER_UP_2);
            nrf_gpio_pin_set(LED_POWER_UP_3);
            break;
        case POWERUP_3:
            nrf_gpio_pin_clear(LED_POWER_UP_0);
            nrf_gpio_pin_clear(LED_POWER_UP_1);
            nrf_gpio_pin_clear(LED_POWER_UP_2);
            nrf_gpio_pin_set(LED_POWER_UP_3);
            break;
        case POWERUP_4:
            nrf_gpio_pin_clear(LED_POWER_UP_0);
            nrf_gpio_pin_clear(LED_POWER_UP_1);
            nrf_gpio_pin_clear(LED_POWER_UP_2);
            nrf_gpio_pin_clear(LED_POWER_UP_3);
            break;
    }
}

#ifdef DC801_EMBEDDED
/**
 * Get a list of files on a path
 * @param files
 * @param path
 * @param fileMax
 * @return
 */
uint8_t getFiles(char files[][9], char *path, uint8_t fileMax){

    FRESULT ff_result;
    DIR dir;
    FILINFO fno;

    ff_result = f_opendir(&dir, path);
    if (ff_result) {
        printf("Can't open extras\n");
        return 0;
    }

    uint8_t counter = 0;
    for (uint8_t i = 0; i < fileMax; i++) {
        ff_result = f_readdir(&dir, &fno);                   /* Read a directory item */
        if (ff_result != FR_OK || fno.fname[0] == 0) {
            break;  /* Break on error or end of dir */
        }
        if ((fno.fattrib & AM_DIR)) {
            // Ignore subdirs
        }
        else{
            char *ext = strrchr(fno.fname, '.') + 1;
            if (strcmp(ext, "RAW") == 0){
                // Add the file
                memcpy(&files[counter++], fno.fname, ext - fno.fname - 1);
            }
        }
    }
    f_closedir(&dir);

    return counter;
}
#endif

#ifdef DC801_DESKTOP
/**
 * Get a list of files on a path
 * @param files
 * @param path
 * @param fileMax
 * @return
 */
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wuninitialized"
#pragma GCC diagnostic ignored "-Wmaybe-uninitialized"
uint8_t getFiles(char files[][9], char *path, uint8_t fileMax){

    FRESULT ff_result;
    DIR *dir;
    FILINFO *fno;

    ff_result = f_opendir(dir, path);
    if (ff_result) {
        printf("Can't open extras\n");
        return 0;
    }

    uint8_t counter = 0;
    for (uint8_t i = 0; i < fileMax; i++) {
        ff_result = f_readdir(dir, fno);                   /* Read a directory item */
        if (ff_result != FR_OK || fno->fname[0] == 0) {
            break;  /* Break on error or end of dir */
        }
        if ((fno->fattrib & AM_DIR)) {
            // Ignore subdirs
        }
        else{
            char *ext = strrchr(fno->fname, '.') + 1;
            if (strcmp(ext, "RAW") == 0){
                // Add the file
                memcpy(&files[counter++], fno->fname, ext - fno->fname - 1);
            }
        }
    }
    f_closedir(dir);

    return counter;
}
#pragma GCC diagnostic pop
#endif

/**
 * Calculate the CRC on a chunk of memory
 * @param data
 * @param len
 * @return
 */
uint16_t calcCRC(uint8_t *data, uint8_t len, const uint16_t POLYNOM){
    uint16_t crc;
    uint8_t aux = 0;

    crc = 0x0000;

    while (aux < len){
        crc = crc16(crc, data[aux], POLYNOM);
        aux++;
    }

    return (crc);
}

/**
 * Calculate the crc16 of a value
 * @param crcValue
 * @param newByte
 * @return
 */
uint16_t crc16(uint16_t crcValue, uint8_t newByte, const uint16_t POLYNOM){
    uint8_t i;

    for (i = 0; i < 8; i++) {

        if (((crcValue & 0x8000) >> 8) ^ (newByte & 0x80)){
            crcValue = (crcValue << 1)  ^ POLYNOM;
        }else{
            crcValue = (crcValue << 1);
        }

        newByte <<= 1;
    }

    return crcValue;
}

#define OVERFLOW ((uint32_t)(0xFFFFFFFF/32.768))

uint32_t millis_elapsed(uint32_t currentMillis, uint32_t previousMillis)
{
    if(currentMillis < previousMillis) return(currentMillis + OVERFLOW + 1 - previousMillis);
    return(currentMillis - previousMillis);
}

uint32_t millis(void)
{
    return(app_timer_cnt_get() / 32.768);
}

void EEpwm_init() {
    app_pwm_config_t pwm1_cfg = APP_PWM_DEFAULT_CONFIG_1CH(5000L, 11);
    APP_ERROR_CHECK(app_pwm_init(&PWM1,&pwm1_cfg,NULL));
    app_pwm_enable(&PWM1);
}


void EEpwm_set(int r)
{
    r = r%101;
    app_pwm_channel_duty_set(&PWM1, 0, 100-r);
}

void EEget_milliVolts(int r, int *v1, int *v2, int *v3) {
    *v1 = EE_VOLT(EE_R4) * r / 100;
    *v2 = EE_VOLT(EE_R3 +EE_R4) * r / 100;
    *v3 = EE_VOLT(EE_R2 + EE_R3 + EE_R4) * r / 100;
}

//Turns hex 0x2305 to 2305
uint32_t hex2dec(uint32_t v) {
    uint32_t val = 0;
    const int tens[] = {1, 10, 100, 1000, 10000, 100000, 1000000, 10000000};
    for (int i=0; i<8; ++i)
        val += ((v >> (i*4)) & 0xF) * tens[i];
    return val;
}
