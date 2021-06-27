#include <string>

#include "common.h"
#include "main.h"
#include "EnginePanic.h"

#include "FrameBuffer.h"
#include "../../../fonts/Monaco9.h"

#ifdef DC801_EMBEDDED
#include "nrf52840.h"
#endif

std::string extract_filename(const char * fullpath) {
	const char * filepart = fullpath;
	while(*fullpath) {
		if(*fullpath == '/') {
			filepart = fullpath + 1;
		}
		fullpath += 1;
  	}
	return std::string(filepart);
}

void panic_print(const char *msg, int x, int y)
{
	// Write to the screen
	canvas.printMessage(
		msg,
		Monaco9,
		COLOR_WHITE,
		x,
		y
	);

#ifdef DC801_DESKTOP
	// On desktop, write to stderr as well
	fprintf(stderr, msg);
#endif
}

void EnginePanic(const char *filename, int lineno, const char *format, ...)
{
	// BSOD background
	canvas.clearScreen(COLOR_BSOD);

	// String buffer
	char panic_message[401];

	// y advance value from text
	const uint8_t yAdvance = Monaco9.yAdvance;

	// Starting point for text
	// Frame size (x, y):
	//   (45, 0)
	//   (WIDTH - 45, HEIGHT - (yAdvance * 2))
	const int x = 45;
	int y = 0;

#ifdef DC801_DESKTOP
	// Print Banner, File Name, Line Number
	std::string path = extract_filename(filename);
	const char *file = path.c_str();
#else
	const char *file = "There is no file...";
#endif

	const char *header = "\n"
						 "---------- DC801 Badge Panic ----------\n"
						 "File: %s\n"
						 "Line: %d\n"
						 "\n"
						 "Error Details:\n";

	snprintf(panic_message, sizeof(panic_message), header, file, lineno);
	panic_message[sizeof(panic_message) - 1] = 0;	// Null terminate
	panic_print(panic_message, x, y);
	y += yAdvance * 6;

	// Print Message
	va_list args;
	va_start(args, format);
	vsnprintf(panic_message, sizeof(panic_message), format, args);
	panic_message[sizeof(panic_message) - 1] = 0;	// Null terminate
	panic_print(panic_message, x, y);

	y = HEIGHT - (yAdvance * 6);

	// Print reboot message
	const char *reboot = "\n"
						 "\n"
						 "Press Right Joystick to %s...\n"
						 "---------- DC801 Badge Panic ----------\n\n";

#ifdef DC801_DESKTOP
	snprintf(panic_message, sizeof(panic_message), reboot, "Exit");
#endif

#ifdef DC801_EMBEDDED
	snprintf(panic_message, sizeof(panic_message), reboot, "Reboot");
#endif
	panic_message[sizeof(panic_message) - 1] = 0;	// Null terminate
	panic_print(panic_message, x, y);

	// Push BSOD to screen
	canvas.blt();

	while (EngineInput_Buttons.rjoy_center == false)
	{
		// Update EngineInput_Buttons
		EngineHandleInput();

		// If we manually exit
		if (EngineIsRunning() == false)
		{
			break;
		}

	#ifdef DC801_DESKTOP
		canvas.blt(); // Keep the window frame updated

		if (application_quit != 0)
		{
			break;
		}
	#endif

		// Sleep
		nrf_delay_ms(50);
	}

#ifdef DC801_DESKTOP
	// On the desktop we exit, since reloading isn't an option
	exit(1);
#endif

#ifdef DC801_EMBEDDED
	// On the badge, we issue a software reset and begin again
	while (1)
	{
		NVIC_SystemReset();
	}
#endif
}
