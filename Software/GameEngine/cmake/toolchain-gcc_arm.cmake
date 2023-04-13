# the name of the target operating system
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)

if (SDK_ROOT MATCHES "" AND DEFINED ENV{SDK_ROOT})
  set(SDK_ROOT "$ENV{SDK_ROOT}")
endif ()

# Compiler and linker flags
set(MCPU_FLAGS "-mthumb -mcpu=cortex-m4 -DDC801_EMBEDDED -DBOARD_CUSTOM -DCONFIG_NFCT_PINS_AS_GPIOS -DFLOAT_ABI_HARD -DNRF52840_XXAA -DNRF_SD_BLE_API_VERSION=6 -DS140 -DSOFTDEVICE_PRESENT -DSWI_DISABLE0 -DDEBUG -DSTLVECTOR")
set(VFP_FLAGS "-mfloat-abi=hard -mfpu=fpv4-sp-d16")
set(CMAKE_COMMON_FLAGS "${MCPU_FLAGS} ${VFP_FLAGS} -g3 -ffunction-sections -fdata-sections -fno-strict-aliasing -fno-builtin -fno-common -Wdouble-promotion -Wno-unused-parameter")

set(CMAKE_C_FLAGS_INIT "${CMAKE_COMMON_FLAGS}")
set(CMAKE_CXX_FLAGS_INIT "${CMAKE_COMMON_FLAGS}")
set(CMAKE_ASM_FLAGS_INIT "${CMAKE_COMMON_FLAGS}")
set(CMAKE_EXE_LINKER_FLAGS_INIT "${LD_FLAGS} --specs=nosys.specs -Wl,--gc-sections,-print-memory-usage")

set(CMAKE_C_FLAGS_DEBUG_INIT "-O0")
set(CMAKE_CXX_ASM_FLAGS_DEBUG_INIT "-O0")
set(CMAKE_ASM_FLAGS_DEBUG_INIT "")
set(CMAKE_EXE_LINKER_FLAGS_DEBUG_INIT "")

set(CMAKE_C_FLAGS_RELEASE_INIT "-Os -flto")
set(CMAKE_CXX_FLAGS_RELEASE_INIT "-Os -flto")
set(CMAKE_ASM_FLAGS_RELEASE_INIT "")
set(CMAKE_EXE_LINKER_FLAGS_RELEASE_INIT "-flto")

set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM BOTH)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY BOTH)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE BOTH)

function(create_hex executable)
  add_custom_command(
    TARGET ${executable}
    POST_BUILD
    COMMAND arm-none-eabi-objcopy -O ihex ${CMAKE_CURRENT_BINARY_DIR}/${executable}.elf ${CMAKE_CURRENT_BINARY_DIR}/${executable}.hex
    )
endfunction(create_hex)