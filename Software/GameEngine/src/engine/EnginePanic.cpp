#include <string>
#include <filesystem>

#include "EnginePanic.h"
#include "EngineInput.h"
#include "EngineSerial.h"

#include "fonts/Monaco9.h"

#ifdef DC801_EMBEDDED
#include "nrf52840.h"
#else
#include "shim_timer.h"
#endif

void panic_print(const char *msg, int x, int y)
{
	// Write to the screen
	/*frameBuffer->printMessage(
		msg,
		Monaco9,
		COLOR_WHITE,
		x,
		y
	);*/

#ifndef DC801_EMBEDDED
	// On desktop, write to stderr as well
	fprintf(stderr, "%s", msg);
#endif
}

void EnginePanic(const char *filename, int lineno, const char *format, ...)
{
	// BSOD background
	//frameBuffer->clearScreen(COLOR_BSOD);

	// y advance value from text
	const uint8_t yAdvance = Monaco9.yAdvance;

	// Starting point for text
	// Frame size (x, y):
	//   (45, 0)
	//   (DrawWidth - 45, DrawHeight - (yAdvance * 2))
	const int x = 45;
	int y = 0;

#ifndef DC801_EMBEDDED
	// Print Banner, File Name, Line Number	
	const char* file = filename;
#else
	const char *file = "There is no file...";
#endif

	panic_print("\n",x,y);
	y += yAdvance;
	panic_print("---------- DC801 Badge Panic ----------\n",x,y);
	y += yAdvance;
	panic_print("File: \n",x,y);
	y += yAdvance;
	panic_print(file, x, y);
	y += yAdvance;
	panic_print("Line: <tbd>\n", x, y);
	y += yAdvance;
	panic_print("\n",x,y);
	y += yAdvance;
	panic_print("Error Details:\n",x,y);
	y += yAdvance;

	// Print reboot message
	panic_print("\n", x,y);
	y += yAdvance;
	panic_print("\n", x,y);
	y += yAdvance;

#ifdef DC801_EMBEDDED
	panic_print("Press Right Joystick to Reboot...\n", x, y);
#else
	panic_print("Press Right Joystick to Exit...\n", x, y);
#endif
	y += yAdvance;
	panic_print("---------- DC801 Badge Panic ----------\n\n", x,y);
	y += yAdvance;

	// Push BSOD to screen
	//frameBuffer->blt();

	//while (EngineInput_Buttons.rjoy_center == false)
	//{
	//	// Update EngineInput_Buttons
	//	inputHandler->HandleKeyboard();

	//	EngineHandleSerialInput();

	//	// If we manually exit
	//	if (inputHandler->EngineIsRunning() == false)
	//	{
	//		break;
	//	}

	//#ifndef DC801_EMBEDDED
	//	frameBuffer->blt(); // Keep the window frame updated

	//	if (application_quit != 0)
	//	{
	//		break;
	//	}
	//#endif

	//	// Sleep
	//	nrf_delay_ms(50);
	//}


#ifdef DC801_EMBEDDED
	// On the badge, we issue a software reset and begin again
	while (1)
	{
		NVIC_SystemReset();
	}
#else
	// On the desktop we exit, since reloading isn't an option
	exit(1);
#endif
}
