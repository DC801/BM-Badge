#include "common.h"
#include "FrameBuffer.h"
#include "EngineROM.h"

#include "../../../fonts/Monaco9.h"

namespace DC801_Test
{
	void printMessage(const char *message, int y)
	{
		canvas.printMessage(
			message,
			Monaco9,
			COLOR_WHITE,
			20,
			y
		);

		canvas.blt();

	#ifdef DC801_DESKTOP
		debug_print("%s\n", message);
	#endif
	}

	bool TestMemory()
	{
		const uint8_t magic[] = ENGINE_ROM_MAGIC_STRING;
		const int magicLen = 8;
		bool failed = false;

		canvas.clearScreen(COLOR_BLACK);

		// y advance value from text
		const uint8_t yAdvance = Monaco9.yAdvance;
		int y = 10;

		printMessage("Initializing memory", y);
		EngineROM_Init();

		y += yAdvance;
		
		if (EngineROM_Magic(magic, magicLen) != true)
		{
			printMessage("Checking to see ROM exists... Not found", y);
		}
		else
		{
			printMessage("Checking to see ROM exists... Found", y);
		}

		y += yAdvance;

		if (EngineROM_Write(0, magicLen, magic) != magicLen)
		{
			printMessage("Writing magic header... Failed", y);
			failed = true;
			goto test_end;
		}
		else
		{
			printMessage("Writing magic header... Passed", y);
		}

		y += yAdvance;

		if (EngineROM_Magic(magic, magicLen) != true)
		{
			printMessage("Verifying magic header... Failed", y);
			failed = true;
			goto test_end;
		}
		else
		{
			printMessage("Verifying magic header... Passed", y);
		}
		
		y += yAdvance;

		printMessage("Uninitializing memory", y);
		EngineROM_Deinit();

	test_end:
		y += yAdvance * 2;

		if (failed)
		{
			printMessage("Test failed", y);
		}
		else
		{
			printMessage("Test passed", y);
		}

		y = HEIGHT - (yAdvance * 2);

		printMessage("Press Right Joystick to exit", y);

		while (buttons.rjoy_center == false)
		{
			canvas.blt(); // Keep the window frame updated

			// Update EngineInput_Buttons
			EngineHandleKeyboardInput();

			// If we manually exit
			if (EngineIsRunning() == false)
			{
				break;
			}

		#ifdef DC801_DESKTOP
			if (application_quit != 0)
			{
				break;
			}
		#endif

			// Sleep
			nrf_delay_ms(100);
		}

		return !failed;
	}

#ifndef TEST_ALL
	bool Test()
	{
		return TestMemory();
	}
#endif
}