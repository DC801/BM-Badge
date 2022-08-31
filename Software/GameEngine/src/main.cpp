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

#include <SDL.h>

#include "main.h"
#include "games/mage/mage.h"
#include "FrameBuffer.h"
#include "EnginePanic.h"
#include "fonts/Monaco9.h"
#include "sdk/shim/shim_err.h"
#include "sdk/shim/shim_timer.h"
#include "utility.h"

#ifdef DC801_EMBEDDED
//only init QSPI if we're in embedded mode:
#include "qspi.h"
QSPI qspiControl;

#else
#include <time.h>
#include "EngineWindowFrame.h"
volatile sig_atomic_t application_quit = 0;

void sig_handler(int signo)
{
	if (signo == SIGINT)
	{
		debug_print("received SIGINT\n");
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

/**
 * Initialize the speaker
 */
static void speaker_init(void){
	// Setup the nau8810 later -Tim
	//nrf_gpio_cfg_output(SPEAKER);
}

/**
 * Initialize the logging backend for logging over JTAG
 */
static void log_init(void){
	ret_code_t err_code = NRF_LOG_INIT(NULL);
	APP_ERROR_CHECK(err_code);
	NRF_LOG_DEFAULT_BACKENDS_INIT();
	NRF_LOG_INFO("--------------SYSTEM REBOOTED--------------");
	NRF_LOG_ERROR("Error Logging to hardware UART enabled.");
	NRF_LOG_INFO("Debug Logging to hardware UART enabled.");
}

/**
 * Initialize the QSPI ROM object
 */
static void rom_init(void){
	#ifdef DC801_EMBEDDED
	if(!qspiControl.init()){
		ENGINE_PANIC("Failed to init qspiControl.");
	}
	#endif
}

/**
 * @brief Main app
 * @return Not used
 */
int main(int argc, char* argv[]) {

#if !defined(EMSCRIPTEN) && !defined(DC801_EMBEDDED)
	
	signal(SIGINT, sig_handler);

#endif

	// Setup the system
	log_init();

	// Timers
	app_timer_init();

#ifdef DC801_EMBEDDED

	//USB serial
	usb_serial_init();

	//keyboard controls all hardware buttons on this badge
	keyboard_init();

	//this function will set up the NAU8810 chip to play sounds
	//speaker_init();

	// BLE
	//gap_params_init();
	ble_stack_init();
	scan_start();

	// Init the display
	ili9341_init();
	ili9341_start();
	util_gfx_init();

	//Init the SD Card
	if(!util_sd_init()){
		//util_sd_error();
		debug_print("No SD card present on boot.");
	}

	//QSPI ROM Chip
	rom_init();

	// Init the random number generator
	nrf_drv_rng_init(NULL);

	// Setup the battery monitor
	//adc_configure();
	//adc_start();

	// Setup the UART
	//uart_init();

	// Setup I2C
	twi_master_init();

	//EEpwm_init();

	const char* ble_name = "TheMage801"; // must be 10char
	debug_print("advertising user: %s", ble_name);
	advertising_setUser(ble_name);
	ble_adv_start();

	// Setup LEDs
	ledInit();
	ledsOff();
#endif

	setUpRandomSeed();

	//morse isn't used on this badge yet...
	//morseInit();

	// Configure the systick
	sysTickStart();

	// Boot! Boot! Boot!
	debug_print("Booted!\n");
	// printf goes to the RTT_Terminal.log after you've fired up debug.sh

#if defined(TEST) || defined(TEST_ALL)
	DC801_Test::Test();
	break;
#else
	MAGE();
#endif


#ifdef DC801_EMBEDDED
	while (1)
	{
		// If we make it here - we shouldn't - but if, reset the badge
		NVIC_SystemReset();
	}
#else
	debug_print("Exiting gracefully...\n");
	SDL_Quit();
	return 0;
#endif

}

void setUpRandomSeed() {
#ifdef DC801_EMBEDDED
	//Set random seed with something from nordic sdk,
	//so as long as nrf_drv_rng_init() has been run,
	//this is actually pretty random, probably.
	uint32_t seed = (
		(nrf_rng_random_value_get() <<  0) +
		(nrf_rng_random_value_get() <<  8) +
		(nrf_rng_random_value_get() << 16) +
		(nrf_rng_random_value_get() << 24)
	);
#else
	//Set random seed with number of seconds since
	//unix epoc so two desktops launched the same
	//second get the same rng, and that totally
	//doesn't matter. Good enough for a simple
	//dice roll for scripts.
	uint32_t seed = time(NULL);
#endif //DC801_DESKTOP
	srand(seed);
}
