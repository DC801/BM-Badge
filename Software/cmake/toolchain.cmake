include(CMakeForceCompiler)

# This is necessary to stop cmake from trying to run automated tests
#  otherwise it will throw errors like missing symbol '_exit',
#  which is apparently a bug
if("${CMAKE_VERSION}" VERSION_GREATER 3.6.0)
	set(CMAKE_C_COMPILER   "arm-none-eabi-gcc")
	set(CMAKE_CXX_COMPILER "arm-none-eabi-g++")
	# without these cmake tries to compile/link a test and fails on _exit
	# this _was_ suppressed by the now deprecated FORCE versions
	set(CMAKE_C_COMPILER_WORKS   1)
	set(CMAKE_CXX_COMPILER_WORKS 1)
else()
	# the _force_ macro's are deprecated as of 3.6
	CMAKE_FORCE_C_COMPILER(arm-none-eabi-gcc GNU)
	CMAKE_FORCE_CXX_COMPILER(arm-none-eabi-g++ GNU)
endif()

set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR none)
SET(CMAKE_SYSTEM_VERSION 1)
SET(CMAKE_CROSSCOMPILING 1)

# Use -DSYSROOT=/path/to/arm-none-eabi when calling cmake
#  if sysroot not located in /usr
if (NOT DEFINED SYSROOT)
    set(CMAKE_SYSROOT /usr/arm-none-eabi)
endif()

# Use -DSYSROOT_TOOLS=/path/to/arm-none-eabi-gcc when calling cmake
#  if gcc isn't located or symlinked to /usr/bin/arm-none-eabi-*
if (NOT DEFINED SYSROOT_TOOLS)
    set(SYSROOT_TOOLS /usr/bin)
endif()

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

add_compile_options(
        -O3
        -g3
        -mcpu=cortex-m4
        -mthumb
        -mabi=aapcs
        -Wall
        -Wextra
		-Wno-unused-parameter
		-Wno-expansion-to-defined
        -mfloat-abi=hard
        -mfpu=fpv4-sp-d16
        -ffunction-sections
        -fdata-sections
        -fno-strict-aliasing
        -fno-builtin
        -fshort-enums
)

add_link_options(
        -O3
        -g3
        -mthumb
        -mabi=aapcs
        -mcpu=cortex-m4
        -mfloat-abi=hard
        -mfpu=fpv4-sp-d16
        -Wl,--gc-sections
        --specs=nano.specs
)

set(CMAKE_C_STANDARD_LIBRARIES_INIT "-lc -lnosys -lm")
set(CMAKE_C_COMPILER ${SYSROOT_TOOLS}/arm-none-eabi-gcc)
set(CMAKE_CXX_STANDARD_LIBRARIES_INIT "-lsupc++ -lstdc++")
set(CMAKE_CXX_COMPILER ${SYSROOT_TOOLS}/arm-none-eabi-g++)
set(CMAKE_AR ${SYSROOT_TOOLS}/arm-none-eabi-ar)

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
