cmake_minimum_required(VERSION 3.10)

project(mageGame)

set(COMPILEDEFS
)

set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
)

set(SOURCEFILES
    mage_header.cpp
    mage_header.h
    mage_map.cpp
    mage_map.h
    mage_tileset.cpp
    mage_tileset.h
    mage_animation.cpp
    mage_animation.h
    mage_entity_type.cpp
    mage_entity_type.h
    mage_geometry.cpp
    mage_geometry.h
    mage_color_palette.cpp
    mage_color_palette.h
    mage_game_control.cpp
    mage_game_control.h
    mage_hex.cpp
    mage_hex.h
    mage_script_actions.cpp
    mage_script_actions.h
    mage_script_control.cpp
    mage_script_control.h
    mage_portrait.cpp
    mage_portrait.h
    mage_dialog_control.cpp
    mage_dialog_control.h
    mage_command_control.cpp
    mage_command_control.h
    mage.cpp
    mage.h
)

add_library(mageGame STATIC ${SOURCEFILES})
target_include_directories(mageGame PUBLIC ${INCLUDEDIRS})