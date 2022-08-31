cmake_minimum_required(VERSION 3.24)

project(bm_badge)
set(CMAKE_CXX_STANDARD 17)

option(DC801_EMBEDDED_BUILD "Build an executable for the physical device" OFF)

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

include(CheckCXXSymbolExists)
check_cxx_symbol_exists(std::filesystem::path::preferred_separator filesystem cxx17fs)

if(WIN32)
    add_executable(bm_badge WIN32 ${SOURCEFILES})
else()
    add_executable(bm_badge ${SOURCEFILES})
endif()

add_subdirectory(Software/GameEngine/sdk/shim sdk)
add_subdirectory(Software/GameEngine/src game)

if(EMBEDDED_BUILD)
    list(APPEND COMPILEDEFS
        DC801_EMBEDDED=1
    )
endif()

if(EMSCRIPTEN)
    set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)

    find_package(SDL2 REQUIRED)

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
        -felide-constructors
        -fno-rtti
        -Wno-register
        --disable-nls
        -fsanitize=undefined
        -fno-inline
        -gseparate-dwarf=bm_badge.debug.wasm
        -O3
    )

    string(JOIN " " USE_FLAGS ${LINK_DEFS})
    set(CMAKE_EXE_LINKER_FLAGS ${CMAKE_EXE_LINKER_FLAGS} ${USE_FLAGS})
    list(APPEND CXX_DEFINES ${LINK_DEFS})
    set(CMAKE_EXECUTABLE_SUFFIX .html)
else()
    find_package(SDL2 PATHS ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules REQUIRED)
    find_package(SDL2_image PATHS ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules REQUIRED)
endif()

# https://github.com/libsdl-org/SDL/releases/download/release-2.24.0/SDL2-devel-2.24.0-VC.zip
set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/engine
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/src/modules/cmixer
    ${CMAKE_CURRENT_SOURCE_DIR}/Software/GameEngine/sdk/shim
)
target_include_directories(game PUBLIC ${INCLUDEDIRS})
target_include_directories(sdk PUBLIC ${INCLUDEDIRS})
target_include_directories(bm_badge PUBLIC ${INCLUDEDIRS})

target_compile_definitions(game PUBLIC ${COMPILEDEFS})
target_compile_definitions(sdk PUBLIC ${COMPILEDEFS})
target_compile_definitions(bm_badge PUBLIC ${COMPILEDEFS})

if (EMSCRIPTEN)
    target_link_libraries(bm_badge ${SDL2_LIBRARIES} sdk game)
else()
    target_link_libraries(bm_badge ${SDL2_LIBRARIES} SDL2_image::SDL2_image sdk game)
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
    add_custom_command(
        TARGET bm_badge POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        $<TARGET_RUNTIME_DLLS:bm_badge> $<TARGET_FILE_DIR:bm_badge>
        COMMAND_EXPAND_LISTS
    )
endif()
