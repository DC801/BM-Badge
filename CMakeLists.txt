cmake_minimum_required(VERSION 3.24)

if (WIN32)
enable_language(C CXX ASM_MASM)
else()
enable_language(C CXX ASM)
endif()

project(bm_badge)

include(CheckCXXSymbolExists)
check_cxx_symbol_exists(std::filesystem::path::preferred_separator filesystem cxx17fs)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH};${CMAKE_CURRENT_SOURCE_DIR}/cmake/)
set(SDL2_DIR ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2/)
set(SDL2_IMAGE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2_image/)

if(EMBEDDED_BUILD)
    include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/hw_sdk.cmake")
else()

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

        set_source_files_properties(${SOURCEFILES} PROPERTIES COMPILE_FLAGS "-fsanitize=undefined -fno-inline -felide-constructors -fno-rtti -O3")

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

    Software/GameEngine/src/engine/EngineAudio.cpp
    Software/GameEngine/src/engine/EngineAudio.h
    Software/GameEngine/src/engine/EngineInput.cpp
    Software/GameEngine/src/engine/EngineInput.h
    Software/GameEngine/src/engine/EnginePanic.cpp
    Software/GameEngine/src/engine/EnginePanic.h
    Software/GameEngine/src/engine/EngineROM.h
    Software/GameEngine/src/engine/EngineSerial.cpp
    Software/GameEngine/src/engine/EngineSerial.h
    Software/GameEngine/src/engine/FrameBuffer.cpp
    Software/GameEngine/src/engine/FrameBuffer.h
    Software/GameEngine/src/engine/StringLoader.cpp
    Software/GameEngine/src/engine/StringLoader.h
    Software/GameEngine/src/engine/utility.cpp
    Software/GameEngine/src/engine/utility.h

    
    
    Software/GameEngine/src/games/mage/mage_app_timers.cpp
    Software/GameEngine/src/games/mage/mage_app_timers.h
    Software/GameEngine/src/games/mage/mage_camera.cpp
    Software/GameEngine/src/games/mage/mage_camera.h
    Software/GameEngine/src/games/mage/mage_color_palette.cpp
    Software/GameEngine/src/games/mage/mage_color_palette.h
    Software/GameEngine/src/games/mage/mage_command_control.cpp
    Software/GameEngine/src/games/mage/mage_command_control.h
    Software/GameEngine/src/games/mage/mage_defines.h
    Software/GameEngine/src/games/mage/mage_dialog_control.cpp
    Software/GameEngine/src/games/mage/mage_dialog_control.h
    Software/GameEngine/src/games/mage/mage_entity.cpp
    Software/GameEngine/src/games/mage/mage_entity.h
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
    
    
    Software/GameEngine/src/games/mage/mage.cpp
    Software/GameEngine/src/games/mage/mage.h
        
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
    
        Software/GameEngine/src/modules/cmixer/cmixer.h
        Software/GameEngine/src/modules/drv_ili9341.h
        Software/GameEngine/src/modules/sd.h
        Software/GameEngine/src/modules/uart.h
        Software/GameEngine/src/modules/led.h
        Software/GameEngine/src/modules/mutex.h
        Software/GameEngine/src/modules/keyboard.h
        Software/GameEngine/src/modules/qspi.h
        Software/GameEngine/src/modules/usb.h
        
        Software/GameEngine/src/modules/cmixer/cmixer.cpp
        Software/GameEngine/src/modules/drv_ili9341.cpp
        Software/GameEngine/src/modules/sd.cpp
        Software/GameEngine/src/modules/uart.cpp
        Software/GameEngine/src/modules/led.cpp
        Software/GameEngine/src/modules/mutex.cpp
        Software/GameEngine/src/modules/keyboard.cpp
        Software/GameEngine/src/modules/qspi.cpp
        Software/GameEngine/src/modules/usb.cpp
)

if(NOT EMBEDDED_BUILD)
    set(SOURCEFILES ${SOURCEFILES}
        Software/GameEngine/src/engine/DesktopWindowOutput.cpp
        Software/GameEngine/src/engine/DesktopWindowOutput.h
    )
endif()

if(WIN32)
    add_executable(${CMAKE_PROJECT_NAME} WIN32 ${SOURCEFILES})
else()
    add_executable(${CMAKE_PROJECT_NAME} ${SOURCEFILES})
endif()

target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ${INCLUDEDIRS})
target_compile_definitions(${CMAKE_PROJECT_NAME} PUBLIC ${COMPILEDEFS} ${SDK_COMPILEDEFS})

if(EMBEDDED_BUILD)
    #set_source_files_properties(${SDK_ROOT}/modules/nrfx/mdk/gcc_startup_nrf52840.S PROPERTY LANGUAGE C)
    set_target_properties(${CMAKE_PROJECT_NAME} PROPERTIES LINK_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/badge_gcc_nrf52.ld)
endif()

if (EMSCRIPTEN)
    target_link_libraries(${CMAKE_PROJECT_NAME} ${SDL2_LIBRARIES})
else()
    target_link_libraries(${CMAKE_PROJECT_NAME} ${SDL2_LIBRARIES} ${SDL2_IMAGE_LIBRARIES})
endif()

set(source "${CMAKE_CURRENT_SOURCE_DIR}/SD_Card/MAGE")
set(destination "$<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/MAGE")
add_custom_command(
    TARGET ${CMAKE_PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E create_symlink ${source} ${destination}
    DEPENDS ${destination}
    COMMENT "symbolic link created: ${source} <==> ${destination}"
)

if(EMBEDDED_BUILD)
    # convert binary to hex file without softdevice
    add_custom_command(
        TARGET ${CMAKE_PROJECT_NAME} POST_BUILD
        COMMAND arm-none-eabi-objcopy -O ihex $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME} $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}_nosd.hex
        DEPENDS $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}
        COMMENT "Generating ${CMAKE_PROJECT_NAME}_nosd.hex"
    )

    # merge in softdevice
    add_custom_command(
        TARGET ${CMAKE_PROJECT_NAME} POST_BUILD
        COMMAND 
        mergehex -m ${SDK_ROOT}/components/softdevice/s140/hex/s140_nrf52_7.2.0_softdevice.hex $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}_nosd.hex -o $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}.hex
        DEPENDS $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}_nosd.hex
        COMMENT "Merging ${CMAKE_PROJECT_NAME}_nosd.hex into  ${CMAKE_PROJECT_NAME}.hex"
    )

    # convert to UF2
    add_custom_command(
        TARGET ${CMAKE_PROJECT_NAME} POST_BUILD
        COMMAND 
        python3 ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/tools/uf2conv.py $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}.hex -c -f 0xADA52840 -o $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}.UF2
        DEPENDS $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>/${CMAKE_PROJECT_NAME}.hex
        COMMENT "Converting ${CMAKE_PROJECT_NAME}.hex into UF2"
    )
endif()

if(WIN32)
    add_custom_command(TARGET ${CMAKE_PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2/lib/x86/SDL2.dll $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/sdl2_image/lib/x86/SDL2_image.dll $<TARGET_FILE_DIR:${CMAKE_PROJECT_NAME}>
        COMMAND_EXPAND_LISTS
    )
endif()
