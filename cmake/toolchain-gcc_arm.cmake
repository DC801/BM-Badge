# the name of the target operating system
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)

if (SDK_ROOT MATCHES "" AND DEFINED ENV{SDK_ROOT})
  set(SDK_ROOT "$ENV{SDK_ROOT}")
endif ()

# Compiler and linker flags
set(DEFINE_FLAGS "-DDC801_EMBEDDED -DBOARD_CUSTOM -DCONFIG_NFCT_PINS_AS_GPIOS -DFLOAT_ABI_HARD -DNRF52840_XXAA -DNRF_SD_BLE_API_VERSION=6 -DS140 -DSOFTDEVICE_PRESENT -DSWI_DISABLE0 -DSTLVECTOR")
set(MCPU_FLAGS "-mthumb -mcpu=cortex-m4 -march=armv7e-m -D__HEAP_SIZE=16384 -D__STACK_SIZE=16384")
set(MFPU_FLAGS "-mfloat-abi=hard -mfpu=fpv4-sp-d16")
set(CMAKE_COMMON_FLAGS "-ffunction-sections -fdata-sections -fno-strict-aliasing -fno-builtin -fno-common -Wdouble-promotion -Wno-unused-parameter")

set(CMAKE_C_FLAGS_INIT "${CMAKE_COMMON_FLAGS} ${DEFINE_FLAGS} ${MCPU_FLAGS} ${MFPU_FLAGS} -D_DEFAULT_SOURCE")
set(CMAKE_CXX_FLAGS_INIT "${CMAKE_COMMON_FLAGS} ${DEFINE_FLAGS} ${MCPU_FLAGS} ${MFPU_FLAGS} -felide-constructors -fno-rtti -Wno-register")
set(CMAKE_ASM_FLAGS_INIT "${CMAKE_COMMON_FLAGS} ${MCPU_FLAGS} ${MFPU_FLAGS}")
set(CMAKE_EXE_LINKER_FLAGS_INIT "${LD_FLAGS} -lc -lm -lstdc++ -lnosys -specs=nano.specs -Wl,--gc-sections,-print-memory-usage -L${SDK_ROOT}/modules/nrfx/mdk -T${CMAKE_CURRENT_LIST_DIR}/../Software/GameEngine/badge_gcc_nrf52.ld")

set(CMAKE_C_FLAGS_DEBUG_INIT "-Os -DDEBUG=1 -g3")
set(CMAKE_CXX_FLAGS_DEBUG_INIT "-Os -g3 -DDEBUG=1")
set(CMAKE_CXX_ASM_FLAGS_DEBUG_INIT "-Os -g3")
set(CMAKE_ASM_FLAGS_DEBUG_INIT "-g3")
set(CMAKE_EXE_LINKER_FLAGS_DEBUG_INIT "-g3")

set(CMAKE_C_FLAGS_RELEASE_INIT "-Os -flto")
set(CMAKE_CXX_FLAGS_RELEASE_INIT "-Os -flto")
set(CMAKE_ASM_FLAGS_RELEASE_INIT "")
set(CMAKE_EXE_LINKER_FLAGS_RELEASE_INIT "-flto")

set(CMAKE_TRY_COMPILE_TARGET_TYPE EXECUTABLE)

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM BOTH)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY BOTH)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE BOTH)