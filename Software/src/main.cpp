/**
 *
 * @file main.c
 *
 * @date May 24, 2017
 * @author hamster
 *
 * @brief This is the entry point for the DC801 DC26 party badge
 *
 */

#include "main.h"
#include "games/mage/mage.h"
#include "FrameBuffer.h"

#include "test.h"

#ifdef DC801_DESKTOP

volatile sig_atomic_t application_quit = 0;

void sig_handler(int signo)
{
	if (signo == SIGINT)
	{
		printf("received SIGINT\n");
		application_quit = 1;
	}
}

#endif

#define XVAL(x) #x
#define VAL(x)  XVAL(x)

/*
#pragma message ("TIMER_ENABLED=" VAL(TIMER_ENABLED))
#pragma message ("TIMER1_ENABLED=" VAL(TIMER1_ENABLED))
#pragma message ("NRFX_TIMER_ENABLED=" VAL(NRFX_TIMER_ENABLED))
#pragma message ("NRFX_TIMER1_ENABLED=" VAL(NRFX_TIMER1_ENABLED))
*/


volatile bool partyMode = false;
volatile bool sheepMode = false;

APP_TIMER_DEF(standby_animation_timer_id);

static void standby_animation_timeout_handler(void *p_context) {
	UNUSED_PARAMETER(p_context);

	canvas.drawStop();
	// util_gfx_draw_raw_file_stop();
}

/**
 * Initialize the speaker
 */
static void speaker_init(void){
	// Setup the beeper later -Tim
	//nrf_gpio_cfg_output(SPEAKER);
}

/**
 * Initialize the logging backend for logging over JTAG
 */
static void log_init(void){
	ret_code_t err_code = NRF_LOG_INIT(NULL);
	APP_ERROR_CHECK(err_code);

	NRF_LOG_DEFAULT_BACKENDS_INIT();
}

/**
 * Handler to show the LEDs during bootup animation
 * @param frame
 * @param p_data
 */
static void bootCallback(uint8_t frame, void *p_data){
	ledOn((LEDID) (frame % ISSI_LED_COUNT));
}

/**
 * Handler to show the LED blink during party mode
 * @param frame
 * @param p_data
 */
static void partyCallback(uint8_t frame, void *p_data){

}

typedef enum {
	item_games,
	item_extras,
	item_credits,
	NUM_MENU_MAIN_ITEMS
} MENU_MAIN;


MENU mainMenu[NUM_MENU_MAIN_ITEMS] = {
		{ item_games, "Games" },
		{ item_extras, "Extras"},
		{ item_credits, "Credits" },
};

/**
 * @brief Main app
 * @return Not used
 */
int main(void){

	#ifdef DC801_DESKTOP

	signal(SIGINT, sig_handler);

	#endif

	// Setup the system
	log_init();
	keyboard_init();
	speaker_init();


	// Timers
	app_timer_init();
	usb_serial_init();

	// BLE
	//gap_params_init();
	ble_stack_init();
	scan_start();

#ifdef DC801_EMBEDDED
	// Init the display
	ili9341_init();
	ili9341_start();
	util_gfx_init();
#endif

	// Init the random number generator
	nrf_drv_rng_init(NULL);

	// Setup the battery monitor
	adc_configure();
	adc_start();

	// Setup the UART
	uart_init();

	// Setup I2C
	twi_master_init();

	// Setup LEDs
	ledInit();
	ledsOn();

	//morseInit();

	/*
	if(!util_sd_init()){
		util_sd_error();
	}
	*/

	// Boot! Boot! Boot!
	printf("Booted!\n");
	// printf goes to the RTT_Terminal.log after you've fired up debug.sh

	EEpwm_init();

	// Configure the systick
	sysTickStart();

	// Setup a timer for shutting down animations in standby
	app_timer_create(&standby_animation_timer_id, APP_TIMER_MODE_SINGLE_SHOT, standby_animation_timeout_handler);

	const char* ble_name = "TaSheep801"; // must be 10char
	printf("advertising user: %s\n", ble_name);
	advertising_setUser(ble_name);
	ble_adv_start();

#if defined(TEST) || defined(TEST_ALL)
	DC801_Test::Test();
	break;
#else
	MAGE();
#endif

#ifdef DC801_DESKTOP
	printf("Exiting gracefully...\n");
	return 0;
#endif

#ifdef DC801_EMBEDDED
	while (1)
	{
		// If we make it here - we shouldn't - but if, reset the badge
		NVIC_SystemReset();
	}
#endif
}
