cmake_minimum_required(VERSION 3.22)

project(sdk)

find_package(SDL2 PATHS ../../src/modules/sdl2/ REQUIRED)

set(COMPILEDEFS
    DC801_DESKTOP=1
    $<IF:$<STREQUAL:BIG_ENDIAN,${CMAKE_CXX_BYTE_ORDER}>,IS_BIG_ENDIAN=1,IS_LITTLE_ENDIAN=1>
)

set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${SDL2_INCLUDE_DIRS}
    ../../
    ../../src
    ../../src/modules/cmixer
    ../../src/engine
)

set(SOURCEFILES
    sdk_shim.c
    sdk_shim.h
    shim_adc.c
    shim_adc.h
    shim_audio.cpp
    shim_ble.c
    shim_ble.h
    shim_err.c
    shim_err.h
    shim_filesystem.c
    shim_filesystem.h
    shim_gpio.c
    shim_gpio.h
    shim_i2c.c
    shim_i2c.h
    shim_pwm.c
    shim_pwm.h
    shim_rng.c
    shim_rng.h
    shim_serial.c
    shim_serial.h
    shim_st7735.c
    shim_timer.cpp
    shim_timer.h
)

set_source_files_properties(${SOURCEFILES} PROPERTIES LANGUAGE CXX)
add_library(sdk STATIC ${SOURCEFILES})
target_compile_definitions(sdk PUBLIC ${COMPILEDEFS})
target_include_directories(sdk PUBLIC ${INCLUDEDIRS})
