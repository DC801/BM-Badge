set(TARGET_PLATFORM "NRF51" CACHE STRING "Target platform")
set(SDK_ROOT        ""      CACHE PATH "SDK root folder")
set (SDK_INCLUDES CACHE STRING "")

set(SDK_COMPILEDEFS
	DC801_EMBEDDED=0
)

set(SDK_SRCS CACHE
	Software/GameEngine/sdk/shim/sdk_shim.cpp
	Software/GameEngine/sdk/shim/sdk_shim.h
	Software/GameEngine/sdk/shim/shim_adc.cpp
	Software/GameEngine/sdk/shim/shim_adc.h
	Software/GameEngine/sdk/shim/shim_audio.cpp
	Software/GameEngine/sdk/shim/shim_ble.cpp
	Software/GameEngine/sdk/shim/shim_ble.h
	Software/GameEngine/sdk/shim/shim_err.cpp
	Software/GameEngine/sdk/shim/shim_err.h
	Software/GameEngine/sdk/shim/shim_gpio.cpp
	Software/GameEngine/sdk/shim/shim_gpio.h
	Software/GameEngine/sdk/shim/shim_i2c.cpp
	Software/GameEngine/sdk/shim/shim_i2c.h
	Software/GameEngine/sdk/shim/shim_pwm.cpp
	Software/GameEngine/sdk/shim/shim_pwm.h
	Software/GameEngine/sdk/shim/shim_rng.cpp
	Software/GameEngine/sdk/shim/shim_rng.h
	Software/GameEngine/sdk/shim/shim_serial.cpp
	Software/GameEngine/sdk/shim/shim_serial.h
	Software/GameEngine/sdk/shim/shim_st7735.cpp
	Software/GameEngine/sdk/shim/shim_timer.h
	Software/GameEngine/sdk/shim/shim_timer.cpp
)
