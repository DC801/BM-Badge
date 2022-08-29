cmake_minimum_required(VERSION 3.24)

project(game)
add_library(game STATIC)

# https://github.com/libsdl-org/SDL/releases/download/release-2.24.0/SDL2-devel-2.24.0-VC.zip

set(SOURCEFILES
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
    engine/FrameBuffer.cpp
    engine/FrameBuffer.h
    engine/EngineWindowFrame.cpp
    engine/EngineWindowFrame.h
    engine/utility.cpp
    engine/utility.h

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

target_sources(game PUBLIC ${SOURCEFILES})