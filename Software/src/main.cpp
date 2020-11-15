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

//this lets me test if the framebuffer is working:
void test_screen(){
	FrameBuffer *test_canvas;
	test_canvas = p_canvas();
	test_canvas->clearScreen(RGB(0,0,0));
	for(int i=0; i<20; i++){
		test_canvas->blt();
	}
}

//this will blink the LED next to a button, or turn off all LEDs when a joystick button is held down.
void test_keyboard(){
	ledsOff();
	bool led_brightness[ISSI_LED_COUNT];
	for(int i=0; i<ISSI_LED_COUNT; i++) {led_brightness[i] = false;}
	//need to keep updating in a loop for it to work:
	while(1){
		//get an updated key mask every loop:
		EngineHandleInput();
		if(EngineInput_Activated.mem0)   { ledSet(LED_MEM0,   (led_brightness[LED_MEM0]  = !led_brightness[LED_MEM0]   )? 0xff : 0x00);}
		if(EngineInput_Activated.mem1)   { ledSet(LED_MEM1,   (led_brightness[LED_MEM1]  = !led_brightness[LED_MEM1]   )? 0xff : 0x00);}
		if(EngineInput_Activated.mem2)   { ledSet(LED_MEM2,   (led_brightness[LED_MEM2]  = !led_brightness[LED_MEM2]   )? 0xff : 0x00);}
		if(EngineInput_Activated.mem3)   { ledSet(LED_MEM3,   (led_brightness[LED_MEM3]  = !led_brightness[LED_MEM3]   )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_128){ ledSet(LED_BIT128, (led_brightness[LED_BIT128]= !led_brightness[LED_BIT128] )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_64) { ledSet(LED_BIT64,  (led_brightness[LED_BIT64] = !led_brightness[LED_BIT64]  )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_32) { ledSet(LED_BIT32,  (led_brightness[LED_BIT32] = !led_brightness[LED_BIT32]  )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_16) { ledSet(LED_BIT16,  (led_brightness[LED_BIT16] = !led_brightness[LED_BIT16]  )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_8)  { ledSet(LED_BIT8,   (led_brightness[LED_BIT8]  = !led_brightness[LED_BIT8]   )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_4)  { ledSet(LED_BIT4,   (led_brightness[LED_BIT4]  = !led_brightness[LED_BIT4]   )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_2)  { ledSet(LED_BIT2,   (led_brightness[LED_BIT2]  = !led_brightness[LED_BIT2]   )? 0xff : 0x00);}
		if(EngineInput_Activated.bit_1)  { ledSet(LED_BIT1,   (led_brightness[LED_BIT1]  = !led_brightness[LED_BIT1]   )? 0xff : 0x00);}
		if(EngineInput_Activated.op_xor) { ledSet(LED_XOR,    (led_brightness[LED_XOR]   = !led_brightness[LED_XOR]    )? 0xff : 0x00);}
		if(EngineInput_Activated.op_add) { ledSet(LED_ADD,    (led_brightness[LED_ADD]   = !led_brightness[LED_ADD]    )? 0xff : 0x00);}
		if(EngineInput_Activated.op_sub) { ledSet(LED_SUB,    (led_brightness[LED_SUB]   = !led_brightness[LED_SUB]    )? 0xff : 0x00);}
		if(EngineInput_Activated.op_page){ ledSet(LED_PAGE,   (led_brightness[LED_PAGE]  = !led_brightness[LED_PAGE]   )? 0xff : 0x00);}
		if(EngineInput_Activated.hax)    { ledSet(LED_HAX,    (led_brightness[LED_HAX]   = !led_brightness[LED_HAX]    )? 0xff : 0x00);}
	}
}

















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

	//this just prints the screen black for a bit before continuing.
	//Feel free to delete the function once everything is working -Tim
	test_screen();

	//this tests button inputs by blinking LEDs. 
	//it's blocking, so comment it out when not actively testing.
	//Feel free to delete the function once everything is working -Tim
	test_keyboard();

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
