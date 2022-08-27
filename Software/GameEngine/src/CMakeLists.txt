cmake_minimum_required(VERSION 3.24)

project(game)

#https://github.com/libsdl-org/SDL/releases/download/release-2.24.0/SDL2-devel-2.24.0-VC.zip

find_package(SDL2 PATHS ${CMAKE_CURRENT_SOURCE_DIR}/modules/sdl2/ REQUIRED)
find_package(SDL2_image PATHS ${CMAKE_CURRENT_SOURCE_DIR}/modules/sdl2_image/ REQUIRED)

set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${SDL2_INCLUDE_DIRS}
    ${SDL2_IMAGE_INCLUDE_DIRS}
    ../
    ../sdk/shim
    engine/
)

set(SOURCEFILES
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

    modules/cmixer/cmixer.cpp
    modules/cmixer/cmixer.h
    modules/drv_ili9341.cpp
    modules/drv_ili9341.h
    modules/sd.cpp
    modules/sd.h
    modules/ble.cpp
    modules/ble.h
    modules/adc.cpp
    modules/adc.h
    modules/uart.cpp
    modules/uart.h
    modules/led.cpp
    modules/led.h
    modules/i2c.cpp
    modules/i2c.h
    modules/mutex.cpp
    modules/mutex.h
    modules/keyboard.cpp
    modules/keyboard.h
    modules/rc4.cpp
    modules/qspi.cpp
    modules/qspi.h
)

add_library(game STATIC)

target_sources(game PRIVATE ${SOURCEFILES})
target_include_directories(game PUBLIC ${INCLUDEDIRS})
target_link_libraries(game SDL2::SDL2 SDL2_image::SDL2_image sdk)