#include "common.h"
#include "EngineInput.h"
#include "FrameBuffer.h"
#include "test_internal.h"

namespace DC801_Test
{
#ifdef TEST_ALL
	void testPause()
	{
		for (int i = 0; i < 10; i++)
		{
			canvas.blt(); // Keep the window frame updated

			// Update EngineInput_Buttons
			EngineHandleInput();
			
			nrf_delay_ms(50);
		}
	}

	bool Test()
	{
		if (TestAudio() != true) return false;
		testPause();
		if (TestMemory() != true) return false;

		return true;
	}
#endif
};
