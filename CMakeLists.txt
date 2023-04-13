cmake_minimum_required(VERSION 3.24)

project(bm_badge)
include(CheckCXXSymbolExists)
check_cxx_symbol_exists(std::filesystem::path::preferred_separator filesystem cxx17fs)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH};${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/cmake/)
# set(SDL2_DIR ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2/)
# set(SDL2_IMAGE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2_image/)

if(EMBEDDED_BUILD)
    include("${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/cmake/hw_sdk.cmake")
else()
    include("${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/cmake/shim_sdk.cmake")

    find_package(SDL2 MODULE REQUIRED)

    if(EMSCRIPTEN)

        set(LINK_DEFS
            -sASYNCIFY
            -sUSE_SDL=2
            -sUSE_SDL_IMAGE=2
            -sSDL2_IMAGE_FORMATS=png
            -sFORCE_FILESYSTEM=1
            -sASSERTIONS=1
            -sTOTAL_MEMORY=64MB
            -sEXPORTED_FUNCTIONS=_main,_EngineTriggerRomReload
            -sEXPORTED_RUNTIME_METHODS=callMain,ccall,cwrap
            -lidbfs.js
            -sDISABLE_DEPRECATED_FIND_EVENT_TARGET_BEHAVIOR
            -sERROR_ON_UNDEFINED_SYMBOLS=1
            -Wno-register
            --disable-nls
            -fsanitize=undefined
        )

        set_source_files_properties(${SOURCEFILES}
            PROPERTIES
            COMPILE_FLAGS "-fsanitize=undefined -fno-inline  -felide-constructors -fno-rtti -O3")

        string(JOIN " " USE_FLAGS ${LINK_DEFS})
        set(CMAKE_EXE_LINKER_FLAGS ${CMAKE_EXE_LINKER_FLAGS} ${USE_FLAGS})
        list(APPEND CXX_DEFINES ${LINK_DEFS})

    else()
        find_package(SDL2_image MODULE REQUIRED)
    endif()
endif()

# https://github.com/libsdl-org/SDL/releases/download/release-2.24.0/SDL2-devel-2.24.0-VC.zip
set(INCLUDEDIRS
    ${SDK_INCLUDES}
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/engine
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/cmixer
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/sdk/shim
    ${SDL2_INCLUDE_DIRS}
    ${SDL2_IMAGE_INCLUDE_DIRS}
)

set(SOURCEFILES
    ${SDK_SRCS}

    Software/GameEngine/src/main.cpp
    Software/GameEngine/src/main.h

    Software/GameEngine/src/engine/convert_endian.cpp
    Software/GameEngine/src/engine/convert_endian.h
    Software/GameEngine/src/engine/EngineAudio.cpp
    Software/GameEngine/src/engine/EngineAudio.h
    Software/GameEngine/src/engine/EngineInput.cpp
    Software/GameEngine/src/engine/EngineInput.h
    Software/GameEngine/src/engine/EnginePanic.cpp
    Software/GameEngine/src/engine/EnginePanic.h
    Software/GameEngine/src/engine/EngineROM.cpp
    Software/GameEngine/src/engine/EngineROM.h
    Software/GameEngine/src/engine/EngineSerial.cpp
    Software/GameEngine/src/engine/EngineSerial.h
    Software/GameEngine/src/engine/FrameBuffer.cpp
    Software/GameEngine/src/engine/FrameBuffer.h
    Software/GameEngine/src/engine/Header.h
    Software/GameEngine/src/engine/StringLoader.cpp
    Software/GameEngine/src/engine/StringLoader.h
    Software/GameEngine/src/engine/utility.cpp
    Software/GameEngine/src/engine/utility.h

    Software/GameEngine/src/games/mage/mage_animation.cpp
    Software/GameEngine/src/games/mage/mage_animation.h
    Software/GameEngine/src/games/mage/mage_camera.cpp
    Software/GameEngine/src/games/mage/mage_camera.h
    Software/GameEngine/src/games/mage/mage_color_palette.cpp
    Software/GameEngine/src/games/mage/mage_color_palette.h
    Software/GameEngine/src/games/mage/mage_command_control.cpp
    Software/GameEngine/src/games/mage/mage_command_control.h
    Software/GameEngine/src/games/mage/mage_defines.h
    Software/GameEngine/src/games/mage/mage_dialog_control.cpp
    Software/GameEngine/src/games/mage/mage_dialog_control.h
    Software/GameEngine/src/games/mage/mage_entity_type.cpp
    Software/GameEngine/src/games/mage/mage_entity_type.h
    Software/GameEngine/src/games/mage/mage_geometry.cpp
    Software/GameEngine/src/games/mage/mage_geometry.h
    Software/GameEngine/src/games/mage/mage_hex.cpp
    Software/GameEngine/src/games/mage/mage_hex.h
    Software/GameEngine/src/games/mage/mage_map.cpp
    Software/GameEngine/src/games/mage/mage_map.h
    Software/GameEngine/src/games/mage/mage_portrait.cpp
    Software/GameEngine/src/games/mage/mage_portrait.h
    Software/GameEngine/src/games/mage/mage_rom.cpp
    Software/GameEngine/src/games/mage/mage_rom.h
    Software/GameEngine/src/games/mage/mage_script_actions.cpp
    Software/GameEngine/src/games/mage/mage_script_actions.h
    Software/GameEngine/src/games/mage/mage_script_control.cpp
    Software/GameEngine/src/games/mage/mage_script_control.h
    Software/GameEngine/src/games/mage/mage_script_state.h
    Software/GameEngine/src/games/mage/mage_tileset.cpp
    Software/GameEngine/src/games/mage/mage_tileset.h
    Software/GameEngine/src/games/mage/mage.cpp
    Software/GameEngine/src/games/mage/mage.h
)

if(NOT EMBEDDED_BUILD)
    set(SOURCEFILES ${SOURCEFILES}
        Software/GameEngine/src/engine/EngineWindowFrame.cpp
        Software/GameEngine/src/engine/EngineWindowFrame.h
        
        Software/GameEngine/src/modules/cmixer/cmixer.cpp
        Software/GameEngine/src/modules/cmixer/cmixer.h
        Software/GameEngine/src/modules/drv_ili9341.cpp
        Software/GameEngine/src/modules/drv_ili9341.h
        Software/GameEngine/src/modules/sd.cpp
        Software/GameEngine/src/modules/sd.h
        Software/GameEngine/src/modules/ble.cpp
        Software/GameEngine/src/modules/ble.h
        Software/GameEngine/src/modules/adc.cpp
        Software/GameEngine/src/modules/adc.h
        Software/GameEngine/src/modules/uart.cpp
        Software/GameEngine/src/modules/uart.h
        Software/GameEngine/src/modules/led.cpp
        Software/GameEngine/src/modules/led.h
        Software/GameEngine/src/modules/i2c.cpp
        Software/GameEngine/src/modules/i2c.h
        Software/GameEngine/src/modules/mutex.cpp
        Software/GameEngine/src/modules/mutex.h
        Software/GameEngine/src/modules/keyboard.cpp
        Software/GameEngine/src/modules/keyboard.h
        Software/GameEngine/src/modules/qspi.cpp
        Software/GameEngine/src/modules/qspi.h
    )
endif()

if(WIN32)
    add_executable(bm_badge WIN32 ${SOURCEFILES})
else()
    add_executable(bm_badge ${SOURCEFILES})
endif()

target_include_directories(bm_badge PUBLIC ${INCLUDEDIRS})
target_compile_definitions(bm_badge PUBLIC ${COMPILEDEFS} ${SDK_COMPILEDEFS})

if (EMSCRIPTEN)
    target_link_libraries(bm_badge ${SDL2_LIBRARIES})
else()
    target_link_libraries(bm_badge ${SDL2_LIBRARIES} ${SDL2_IMAGE_LIBRARIES})
endif()

set(source "${CMAKE_CURRENT_SOURCE_DIR}/SD_Card/MAGE")
set(destination "$<TARGET_FILE_DIR:bm_badge>/MAGE")
add_custom_command(
    TARGET bm_badge POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E create_symlink ${source} ${destination}
    DEPENDS ${destination}
    COMMENT "symbolic link created: ${source} <==> ${destination}"
)

if(WIN32)
    add_custom_command(TARGET bm_badge POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2/lib/x86/SDL2.dll $<TARGET_FILE_DIR:bm_badge>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2_image/lib/x86/SDL2_image.dll $<TARGET_FILE_DIR:bm_badge>
        COMMAND_EXPAND_LISTS
    )
endif()
