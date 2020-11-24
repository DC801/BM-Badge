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
}

//this lets me test if the framebuffer is working:
void test_screen(){
	FrameBuffer *test_canvas;
	test_canvas = p_canvas();
	test_canvas->clearScreen(COLOR_PURPLE);
	//util_gfx_draw_raw_file("hcrn/display.raw", 0, 0, 128, 128, NULL, true, NULL);
	test_canvas->blt();
	nrf_delay_ms(5000);
}

//this will blink the LED next to a button, or turn off all LEDs when a joystick button is held down.
void test_keyboard(){
	ledsOff();
	bool led_brightness[LED_COUNT];
	for(int i=0; i<LED_COUNT; i++) {led_brightness[i] = false;}
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
		nrf_delay_ms(16);
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

	// Timers
	app_timer_init();

#ifdef DC801_EMBEDDED

	//USB serial
	//usb_serial_init();

	//keyboard controls all hardware buttons on this badge
	keyboard_init();

	//this function will set up the NAU8810 chip to play sounds
	//speaker_init();

	// BLE
	//gap_params_init();
	//ble_stack_init();
	//scan_start();

	// Init the display
	ili9341_init();
	ili9341_start();
	util_gfx_init();

	if(!util_sd_init()){
		util_sd_error();
	}

	// Init the random number generator
	//nrf_drv_rng_init(NULL);

	// Setup the battery monitor
	//adc_configure();
	//adc_start();

	// Setup the UART
	//uart_init();

	// Setup I2C
	twi_master_init();

	//EEpwm_init();

	//const char* ble_name = "TheMage801"; // must be 10char
	//printf("advertising user: %s\n", ble_name);
	//advertising_setUser(ble_name);
	//ble_adv_start();
#endif

	// Setup LEDs
	ledInit();
	ledsOn();

	//morse isn't used on this badge yet...
	//morseInit();

	// Configure the systick
	//sysTickStart();

	// Boot! Boot! Boot!
	printf("Booted!\n");
	// printf goes to the RTT_Terminal.log after you've fired up debug.sh

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
