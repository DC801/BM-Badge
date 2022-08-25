
#include "EngineAudio.h"
#include "FrameBuffer.h"
#include "EngineInput.h"
#include "sd.h"

#include "../../../fonts/Monaco9.h"

namespace DC801_Test
{
	const char *prefix = "AUDIO/townTheme";

	const char *bitrate[] =
	{
		"",
		"-8000",
		"-11025",
		"-16000",
		"-22050",
		"-32000",
		"-44100",
	};

	const int nfiles = 7;
	const char *extension = ".wav";

	void drawMenu(int selection)
	{
		char filename[28];

		canvas.clearScreen(COLOR_BLACK);

		// y advance value from text
		const uint8_t yAdvance = Monaco9.yAdvance;

		int x = 30;
		int y = yAdvance;

		for (int i = 0; i < nfiles; i++)
		{
			char selector[2] = {0};

			if (selection == i)
			{
				selector[0] = '>';
			}
			else
			{
				selector[0] = ' ';
			}

			snprintf(filename, 28, "%s%s%s%s", selector, prefix, bitrate[i], extension);
			filename[27] = 0;

			canvas.printMessage(
				filename,
				Monaco9,
				COLOR_WHITE,
				x,
				y
			);

			y += yAdvance;
		}

		y = HEIGHT - (yAdvance * 2);

		canvas.printMessage(
			"Select an audio file to play...",
			Monaco9,
			COLOR_WHITE,
			x,
			y
		);
	}

	bool TestAudio()
	{
		int selection = 0;
		bool playing = false;
		int playIndex = 0;
		int count = 0;

		while (buttons.rjoy_center == false)
		{
			drawMenu(selection);

			if (playing == true)
			{
				if (count < 4)
				{
					const uint8_t yAdvance = Monaco9.yAdvance;

					canvas.printMessage(
						"***",
						Monaco9,
						COLOR_WHITE,
						5,
						yAdvance + (playIndex * yAdvance) + 1
					);
				}

				count += 1;

				if (count >= 8)
				{
					count = 0;
				}
			}

			canvas.blt(); // Keep the window frame updated

			// Update EngineInput_Buttons
			EngineHandleKeyboardInput();

			if (buttons.ljoy_down == true)
			{
				selection += 1;
				if (selection >= 7) selection = 0;
			}

			if (buttons.ljoy_up == true)
			{
				selection -= 1;
				if (selection < 0) selection = 6;
			}

			if (buttons.ljoy_center == true)
			{
				playIndex = selection;
				playing = !playing;

				if (playing == true)
				{
					char filename[27];

					snprintf(filename, 27, "%s%s%s", prefix, bitrate[playIndex], extension);
					filename[26] = 0;

					audio.loop(filename, 0.5);
				}
				else
				{
					audio.stop_loop();
				}
			}

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

		return false;
	}

#ifndef TEST_ALL
	bool Test()
	{
		return TestAudio();
	}
#endif
};
