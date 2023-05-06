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

#if __cplusplus > 199711L
#define register      // Deprecated in C++11.
#endif  // #if __cplusplus > 199711L

#include "main.h"
#include "games/mage/mage.h"
#include "games/mage/mage_rom.h"
#include "FrameBuffer.h"
#include "EnginePanic.h"
#include "fonts/Monaco9.h"
#include "utility.h"

#include <modules/drv_ili9341.h>
#include <modules/keyboard.h>
#include <modules/sd.h>
#include <modules/usb.h>

#include <shim_adc.h>
#include <shim_ble.h>
#include <shim_err.h>
#include <shim_i2c.h>
#include <shim_serial.h>
#include <shim_rng.h>
#include <shim_timer.h>
#include <sdk_shim.h>

#ifdef DC801_EMBEDDED

#include "qspi.h"

#else

#include <SDL.h>
#include "EngineWindowFrame.h"
#include <time.h>

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
	NRF_LOG_ERROR("Error Logging enabled.");
	NRF_LOG_INFO("Debug Logging enabled.");
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
	
	static auto inputHandler = std::make_shared<EngineInput>();
	static auto frameBuffer = std::make_shared<FrameBuffer>();

#ifdef DC801_EMBEDDED

	// Init the display
	ili9341_init();
	ili9341_start();
	
	//Init the SD Card
	if(!util_sd_init()){
		//util_sd_error();
		debug_print("No SD card present on boot.");
	}

	//USB serial
	usb_serial_init();

	// Setup I2C
	twi_master_init();

	// Setup the UART
	//uart_init();

	//keyboard controls all hardware buttons on this badge
	keyboard_init();

	//QSPI ROM Chip
	static auto qspiControl = QSPI{};

	qspiControl.HandleROMUpdate(inputHandler, frameBuffer);

	//this function will set up the NAU8810 chip to play sounds
	//speaker_init();

	// BLE
	//gap_params_init();
	//ble_stack_init();
	//scan_start();


	// Init the random number generator
	//nrf_drv_rng_init(NULL);

	// Setup the battery monitor
	//adc_configure();
	//adc_start();


	//EEpwm_init();

	const char* ble_name = "TheMage801"; // must be 10char
	debug_print("advertising user: %s", ble_name);
	//advertising_setUser(ble_name);
	//ble_adv_start();

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
	debug_print("Booted!\nCreating and started game...\n");

	static auto audioPlayer = std::make_shared<AudioPlayer>();

	//auto& currentSave = ROM()->ResetCurrentSave(0);//scenarioDataCRC32);

	auto game = std::make_unique<MageGameEngine>(audioPlayer, inputHandler, frameBuffer);
#if defined(TEST) || defined(TEST_ALL)
	DC801_Test::Test();
	break;
#else
	game->Run();
#endif


// If we make it here - we shouldn't - but if, reset the badge/exit
#ifdef DC801_EMBEDDED
	while (1)
	{
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
