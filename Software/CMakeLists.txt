cmake_minimum_required(VERSION 3.13)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake/")

set(PROJ_DIR ${CMAKE_CURRENT_LIST_DIR})

if (DEFINED BOOTLOADER)
    set(FLAVOR "EMBEDDED")
endif(DEFINED BOOTLOADER)

if (NOT DEFINED FLAVOR)
    if (DEFINED ENV{DC801_EMBEDDED})
        set(FLAVOR "EMBEDDED")
    else(DEFINED ENV{DC801_EMBEDDED})
        set(FLAVOR "DESKTOP")
    endif (DEFINED ENV{DC801_EMBEDDED})
endif (NOT DEFINED FLAVOR)

if(FLAVOR STREQUAL "EMBEDDED")
    set(TARGET_IS_EMBEDDED TRUE)
    set(VALID_TARGET TRUE)
    set(CMAKE_TOOLCHAIN_FILE ${PROJ_DIR}/cmake/toolchain.cmake)
endif(FLAVOR STREQUAL "EMBEDDED")

if(FLAVOR STREQUAL "DESKTOP")
    set(TARGET_IS_DESKTOP TRUE)
    set(VALID_TARGET TRUE)
endif(FLAVOR STREQUAL "DESKTOP")

message(STATUS "FLAVOR: ${FLAVOR}")

if (NOT DEFINED VALID_TARGET)
    message(FATAL_ERROR "You must specify a valid build target. EMBEDDED or DESKTOP by calling:\n\tcmake -DFLAVOR=[flavor].")
endif (NOT DEFINED VALID_TARGET)

project(dc27_badge C CXX)

set(SDK_ROOT ${PROJ_DIR}/../../nordic-sdk16.0)

# Include the nordic-sdk library for embedded targets
if(TARGET_IS_EMBEDDED)
    include(${PROJ_DIR}/sdk/sdk-includes.cmake)

    add_definitions(
        -DBOARD_CUSTOM
        -DCONFIG_NFCT_PINS_AS_GPIOS
        -DFLOAT_ABI_HARD
        -DNRF52840_XXAA
        -DNRF_DFU_DEBUG_VERSION
        -DNRF_DFU_SETTINGS_VERSION=1
        -DSVC_INTERFACE_CALL_AS_NORMAL_FUNCTION
        -DuECC_ENABLE_VLI_API=0
        -DuECC_OPTIMIZATION_LEVEL=3
        -DuECC_SQUARE_FUNC=0
        -DuECC_SUPPORT_COMPRESSED_POINT=0
        -DuECC_VLI_NATIVE_LITTLE_ENDIAN=1
    )

    # Define stack sizes and linker scripts if necessary
    if(NOT DEFINED BOOTLOADER)
        # App
        add_definitions(
            -D__HEAP_SIZE=16384
            -D__STACK_SIZE=16384
        )

        set(LINKER_SCRIPT ${PROJ_DIR}/app/badge_gcc_nrf52.ld)
        set(SDK_LIB ${PROJ_DIR}/sdk/output/app/libnordic-sdk.a)
        set(CONFIG_INCLUDE ${PROJ_DIR}/config/app)
    else(NOT DEFINED BOOTLOADER)
        # Bootloader
        add_definitions(
            -D__HEAP_SIZE=0
            -D__STACK_SIZE=0
        )

        set(LINKER_SCRIPT ${PROJ_DIR}/bootloader/secure_bootloader_gcc_nrf52.ld)
        set(SDK_LIB ${PROJ_DIR}/sdk/output/bootloader/libnordic-sdk.a)
        set(CONFIG_INCLUDE ${PROJ_DIR}/config/bootloader)
    endif(NOT DEFINED BOOTLOADER)
else()
    file(GLOB SHIM_SOURCES
        "${PROJ_DIR}/sdk/shim/*.c"
    )

    list(APPEND INCLUDES
        "${PROJ_DIR}/config"
        "${PROJ_DIR}"
    )
endif(TARGET_IS_EMBEDDED)



# Add linker script flags for embedded
if(TARGET_IS_EMBEDDED)
    add_link_options(
        -L${SDK_ROOT}/modules/nrfx/mdk
        -T${LINKER_SCRIPT}
    )
endif(TARGET_IS_EMBEDDED)

# Include source tree
if(DEFINED BOOTLOADER)
    file(GLOB SOURCES ${PROJ_DIR}/bootloader/*.c)
    list(APPEND INCLUDES ${PROJ_DIR}/bootloader)
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/output/bootloader)
else(DEFINED BOOTLOADER)
    file(GLOB SOURCES
        ${PROJ_DIR}/app/*.c
        ${PROJ_DIR}/games/*.c
        ${PROJ_DIR}/games/*.cpp
        ${PROJ_DIR}/games/hcrn/*.cpp
        ${PROJ_DIR}/modules/*.c
    )

    list(APPEND INCLUDES
        ${PROJ_DIR}/app
        ${PROJ_DIR}/games
        ${PROJ_DIR}/games/hcrn
        ${PROJ_DIR}/modules
    )

    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/output/app)
endif(DEFINED BOOTLOADER)

if(TARGET_IS_EMBEDDED)
    add_definitions(-DDC801_EMBEDDED)
endif(TARGET_IS_EMBEDDED)
if(TARGET_IS_DESKTOP)
    add_definitions(-DDC801_DESKTOP)
endif(TARGET_IS_DESKTOP)

add_compile_options(
    -Wno-unused-function
    -Wno-unused-variable
)

set(SHIM_INCLUDE ${PROJ_DIR}/sdk/shim)

add_executable(dc27_badge ${SOURCES} ${SHIM_SOURCES})
target_link_libraries(dc27_badge ${SDK_LIB})
target_include_directories(dc27_badge PUBLIC ${SDK_INCLUDES} ${INCLUDES} ${CONFIG_INCLUDE} ${SHIM_INCLUDE})
