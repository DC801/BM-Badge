cmake_minimum_required(VERSION 3.24)

project(sdkshim)

find_package(SDL2 PATHS ../../src/modules/sdl2/ REQUIRED)

set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${SDL2_INCLUDE_DIRS}
    ../../
    ../../src
    ../../src/modules/cmixer
    ../../src/engine
)

set(SOURCEFILES
    sdk_shim.cpp
    sdk_shim.h
    shim_adc.cpp
    shim_adc.h
    shim_audio.cpp
    shim_ble.cpp
    shim_ble.h
    shim_err.cpp
    shim_err.h
    shim_filesystem.cpp
    shim_filesystem.h
    shim_gpio.cpp
    shim_gpio.h
    shim_i2c.cpp
    shim_i2c.h
    shim_pwm.cpp
    shim_pwm.h
    shim_rng.cpp
    shim_rng.h
    shim_serial.cpp
    shim_serial.h
    shim_st7735.cpp
    shim_timer.cpp
    shim_timer.h
)

add_library(sdk STATIC)
target_sources(sdk PUBLIC ${SOURCEFILES})
target_include_directories(sdk PUBLIC ${INCLUDEDIRS})
