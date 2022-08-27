cmake_minimum_required(VERSION 3.24)

project(BM-Badge)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED)

option(DESKTOP_BUILD "Build an executable for the desktop" TRUE)

set(COMPILEDEFS
    $<IF:$<STREQUAL:BIG_ENDIAN,${CMAKE_CXX_BYTE_ORDER}>,IS_BIG_ENDIAN=1,IS_LITTLE_ENDIAN=1>
    BOARD_CUSTOM=1
    CONFIG_NFCT_PINS_AS_GPIOS=1
    FLOAT_ABI_HARD=1
    NRF52840_XXAA=1
    NRF_SD_BLE_API_VERSION=6=1
    S140=1
    SOFTDEVICE_PRESENT=1
    SWI_DISABLE0=1
)

set(SOURCEFILES
    Software/GameEngine/src/main.cpp
    Software/GameEngine/src/main.h
)

if(${DESKTOP_BUILD})
    list(APPEND COMPILEDEFS
        DC801_DESKTOP=1
    )
elseif()
endif()

find_package(SDL2 PATHS Software/GameEngine/src/modules/sdl2/ REQUIRED)
find_package(SDL2_image PATHS Software/GameEngine/src/modules/sdl2_image/ REQUIRED)

add_subdirectory(Software/GameEngine/sdk/shim sdk)
add_subdirectory(Software/GameEngine/src game)

if(WIN32)
    add_executable(BM-Badge WIN32 ${SOURCEFILES})
# Include a RC file for windows
# list(APPEND SRC_FILES ../sample.rc)
else()
    add_executable(BM-Badge ${SOURCEFILES})
endif()

target_compile_definitions(sdk PUBLIC ${COMPILEDEFS})
target_compile_definitions(game PUBLIC ${COMPILEDEFS})
target_compile_definitions(BM-Badge PUBLIC ${COMPILEDEFS})



target_link_libraries(BM-Badge SDL2::SDL2main sdk game)

add_custom_command(
    TARGET BM-Badge POST_BUILD
    COMMAND
    ${CMAKE_COMMAND} -E create_symlink "${CMAKE_CURRENT_SOURCE_DIR}/SD_Card/MAGE/" "${RUNTIME_OUTPUT_DIRECTORY}/MAGE/"
)
