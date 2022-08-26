cmake_minimum_required(VERSION 3.10)

project(game)
set(CMAKE_CXX_STANDARD 17)

add_subdirectory(../sdk/shim lib/sdk)


#https://github.com/libsdl-org/SDL/releases/download/release-2.24.0/SDL2-devel-2.24.0-VC.zip

find_package(SDL2 PATHS ${CMAKE_CURRENT_SOURCE_DIR}/modules/sdl2/cmake/ REQUIRED)
find_package(SDL2_image PATHS ${CMAKE_CURRENT_SOURCE_DIR}/modules/sdl2_image/cmake/ REQUIRED)


set(COMPILEDEFS
    DC801_DESKTOP=1
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

set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${SDL2_INCLUDE_DIRS}
    ${SDL2_IMAGE_INCLUDE_DIRS}
    ../
    ../sdk/shim
    engine/
)

set(SOURCEFILES
    main.cpp
    main.h
    utility.cpp
    utility.h

    engine/convert_endian.cpp
    engine/convert_endian.h
    engine/EngineAudio.cpp
    engine/EngineAudio.h
    engine/EngineInput.cpp
    engine/EngineInput.h
    engine/EnginePanic.cpp
    engine/EnginePanic.h
    engine/EngineROM.cpp
    engine/EngineROM.h
    engine/EngineSerial.cpp
    engine/EngineSerial.h
    engine/EngineWindowFrame.cpp
    engine/EngineWindowFrame.h
    engine/FrameBuffer.cpp
    engine/FrameBuffer.h

    games/mage/mage_animation.cpp
    games/mage/mage_animation.h
    games/mage/mage_color_palette.cpp
    games/mage/mage_color_palette.h
    games/mage/mage_command_control.cpp
    games/mage/mage_command_control.h
    games/mage/mage_defines.h
    games/mage/mage_dialog_control.cpp
    games/mage/mage_dialog_control.h
    games/mage/mage_entity_type.cpp
    games/mage/mage_entity_type.h
    games/mage/mage_game_control.cpp
    games/mage/mage_game_control.h
    games/mage/mage_geometry.cpp
    games/mage/mage_geometry.h
    games/mage/mage_header.cpp
    games/mage/mage_header.h
    games/mage/mage_hex.cpp
    games/mage/mage_hex.h
    games/mage/mage_map.cpp
    games/mage/mage_map.h
    games/mage/mage_portrait.cpp
    games/mage/mage_portrait.h
    games/mage/mage_script_actions.cpp
    games/mage/mage_script_actions.h
    games/mage/mage_script_control.cpp
    games/mage/mage_script_control.h
    games/mage/mage_tileset.cpp
    games/mage/mage_tileset.h
    games/mage/mage.cpp
    games/mage/mage.h

    modules/cmixer/cmixer.c
    modules/cmixer/cmixer.h
    modules/drv_ili9341.c
    modules/drv_ili9341.h
    modules/sd.c
    modules/sd.h
    modules/ble.c
    modules/ble.h
    modules/adc.c
    modules/adc.h
    modules/uart.c
    modules/uart.h
    modules/led.c
    modules/led.h
    modules/i2c.c
    modules/i2c.h
    modules/mutex.c
    modules/mutex.h
    modules/keyboard.c
    modules/keyboard.h
    modules/rc4.c
    modules/qspi.cpp
    modules/qspi.h
)

if(WIN32)
    add_executable(game WIN32 ${SOURCEFILES})

    target_link_libraries(game SDL2::SDL2main)

# Include a RC file for windows
# list(APPEND SRC_FILES ../sample.rc)
else()
    add_executable(game ${SOURCEFILES})
endif()

set_source_files_properties(${SOURCEFILES} PROPERTIES LANGUAGE CXX)
target_compile_definitions(game PUBLIC ${COMPILEDEFS})
target_include_directories(game PUBLIC ${INCLUDEDIRS})
target_link_libraries(game SDL2::SDL2 SDL2_image::SDL2_image sdk)

# add_custom_command(
#     TARGET game POST_BUILD
#     COMMAND
#     ${CMAKE_COMMAND} -E create_symlink "${CMAKE_CURRENT_SOURCE_DIR}/../../../SD_Card/MAGE/" "${RUNTIME_OUTPUT_DIRECTORY}/MAGE/"
#     VERBATIM
# )