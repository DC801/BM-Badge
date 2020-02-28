PROJECT_NAME     := bootloader
TARGETS          := bootloader
OUTPUT_DIRECTORY := _build


GNU_INSTALL_ROOT :=

SDK_ROOT := ../../../nordic-sdk16.0
PROJ_DIR := $(CURDIR)
NRFJPROG := $(HOME)/dev/bin/nrfjprog/nrfjprog

$(OUTPUT_DIRECTORY)/bootloader.out: \
  LINKER_SCRIPT  := secure_bootloader_gcc_nrf52.ld

# Source files common to all targets
SRC_FILES += \
  $(SDK_ROOT)/components/boards/boards.c \
  $(SDK_ROOT)/components/drivers_ext/st7735/st7735.c \
  $(SDK_ROOT)/components/libraries/atomic/nrf_atomic.c \
  $(SDK_ROOT)/components/libraries/balloc/nrf_balloc.c \
  $(SDK_ROOT)/components/libraries/block_dev/sdc/nrf_block_dev_sdc.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/dfu-cc.pb.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_flash.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_handling_error.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_mbr.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_req_handler.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_settings.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_transport.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_utils.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_validation.c \
  $(SDK_ROOT)/components/libraries/bootloader/dfu/nrf_dfu_ver_validation.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader_app_start.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader_app_start_final.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader_dfu_timers.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader_fw_activation.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader_info.c \
  $(SDK_ROOT)/components/libraries/bootloader/nrf_bootloader_wdt.c \
  $(SDK_ROOT)/components/libraries/bootloader/serial_dfu/nrf_dfu_serial.c \
  $(SDK_ROOT)/components/libraries/bootloader/serial_dfu/nrf_dfu_serial_uart.c \
  $(SDK_ROOT)/components/libraries/crc32/crc32.c \
  $(SDK_ROOT)/components/libraries/crypto/backend/micro_ecc/micro_ecc_backend_ecc.c \
  $(SDK_ROOT)/components/libraries/crypto/backend/micro_ecc/micro_ecc_backend_ecdh.c \
  $(SDK_ROOT)/components/libraries/crypto/backend/micro_ecc/micro_ecc_backend_ecdsa.c \
  $(SDK_ROOT)/components/libraries/crypto/backend/nrf_sw/nrf_sw_backend_hash.c \
  $(SDK_ROOT)/components/libraries/crypto/nrf_crypto_ecc.c \
  $(SDK_ROOT)/components/libraries/crypto/nrf_crypto_ecdsa.c \
  $(SDK_ROOT)/components/libraries/crypto/nrf_crypto_hash.c \
  $(SDK_ROOT)/components/libraries/crypto/nrf_crypto_init.c \
  $(SDK_ROOT)/components/libraries/crypto/nrf_crypto_shared.c \
  $(SDK_ROOT)/components/libraries/fstorage/nrf_fstorage.c \
  $(SDK_ROOT)/components/libraries/fstorage/nrf_fstorage_nvmc.c \
  $(SDK_ROOT)/components/libraries/gfx/nrf_gfx.c \
  $(SDK_ROOT)/components/libraries/mem_manager/mem_manager.c \
  $(SDK_ROOT)/components/libraries/queue/nrf_queue.c \
  $(SDK_ROOT)/components/libraries/scheduler/app_scheduler.c \
  $(SDK_ROOT)/components/libraries/sdcard/app_sdcard.c \
  $(SDK_ROOT)/components/libraries/sha256/sha256.c \
  $(SDK_ROOT)/components/libraries/slip/slip.c \
  $(SDK_ROOT)/components/libraries/sortlist/nrf_sortlist.c \
  $(SDK_ROOT)/components/libraries/strerror/nrf_strerror.c \
  $(SDK_ROOT)/components/libraries/util/app_error_weak.c \
  $(SDK_ROOT)/components/libraries/util/app_util_platform.c \
  $(SDK_ROOT)/components/libraries/util/nrf_assert.c \
  \
  $(SDK_ROOT)/external/fatfs/port/diskio_blkdev.c \
  $(SDK_ROOT)/external/fatfs/src/ff.c \
  $(SDK_ROOT)/external/fprintf/nrf_fprintf.c \
  $(SDK_ROOT)/external/fprintf/nrf_fprintf_format.c \
  $(SDK_ROOT)/external/nano-pb/pb_common.c \
  $(SDK_ROOT)/external/nano-pb/pb_decode.c \
  $(SDK_ROOT)/external/thedotfactory_fonts/orkney24pts.c \
  $(SDK_ROOT)/external/thedotfactory_fonts/orkney8pts.c \
  \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_clock.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_spi.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_uart.c \
  \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_spi.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_spim.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_uart.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_uarte.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/prs/nrfx_prs.c \
  $(SDK_ROOT)/modules/nrfx/hal/nrf_nvmc.c \
  $(SDK_ROOT)/modules/nrfx/mdk/gcc_startup_nrf52840.S \
  $(SDK_ROOT)/modules/nrfx/mdk/system_nrf52840.c \
  \
  $(PROJ_DIR)/dfu_public_key.c \
  $(PROJ_DIR)/main.c \
  $(PROJ_DIR)/menu.c \
  $(PROJ_DIR)/tests.c \


# Include folders common to all targets
INC_FOLDERS += \
  $(SDK_ROOT)/components/boards \
  $(SDK_ROOT)/components/drivers_ext/st7735 \
  $(SDK_ROOT)/components/libraries/atomic \
  $(SDK_ROOT)/components/libraries/balloc \
  $(SDK_ROOT)/components/libraries/block_dev \
  $(SDK_ROOT)/components/libraries/block_dev/sdc \
  $(SDK_ROOT)/components/libraries/bootloader \
  $(SDK_ROOT)/components/libraries/bootloader/dfu \
  $(SDK_ROOT)/components/libraries/bootloader/serial_dfu \
  $(SDK_ROOT)/components/libraries/crc32 \
  $(SDK_ROOT)/components/libraries/crypto \
  $(SDK_ROOT)/components/libraries/crypto/backend/cc310 \
  $(SDK_ROOT)/components/libraries/crypto/backend/cc310_bl \
  $(SDK_ROOT)/components/libraries/crypto/backend/cifra \
  $(SDK_ROOT)/components/libraries/crypto/backend/mbedtls \
  $(SDK_ROOT)/components/libraries/crypto/backend/micro_ecc \
  $(SDK_ROOT)/components/libraries/crypto/backend/nrf_hw \
  $(SDK_ROOT)/components/libraries/crypto/backend/nrf_sw \
  $(SDK_ROOT)/components/libraries/crypto/backend/oberon \
  $(SDK_ROOT)/components/libraries/crypto/backend/optiga \
  $(SDK_ROOT)/components/libraries/delay \
  $(SDK_ROOT)/components/libraries/experimental_section_vars \
  $(SDK_ROOT)/components/libraries/fstorage \
  $(SDK_ROOT)/components/libraries/gfx \
  $(SDK_ROOT)/components/libraries/log \
  $(SDK_ROOT)/components/libraries/log/src \
  $(SDK_ROOT)/components/libraries/mem_manager \
  $(SDK_ROOT)/components/libraries/queue \
  $(SDK_ROOT)/components/libraries/scheduler \
  $(SDK_ROOT)/components/libraries/sdcard \
  $(SDK_ROOT)/components/libraries/sha256 \
  $(SDK_ROOT)/components/libraries/slip \
  $(SDK_ROOT)/components/libraries/sortlist \
  $(SDK_ROOT)/components/libraries/stack_info \
  $(SDK_ROOT)/components/libraries/strerror \
  $(SDK_ROOT)/components/libraries/timer \
  $(SDK_ROOT)/components/libraries/util \
  $(SDK_ROOT)/components/softdevice/s140/headers \
  $(SDK_ROOT)/components/softdevice/mbr/headers \
  $(SDK_ROOT)/components/toolchain/cmsis/include \
  \
  $(SDK_ROOT)/external/fatfs/port/ \
  $(SDK_ROOT)/external/fatfs/src \
  $(SDK_ROOT)/external/fprintf \
  $(SDK_ROOT)/external/micro-ecc/micro-ecc \
  $(SDK_ROOT)/external/nano-pb \
  $(SDK_ROOT)/external/protothreads \
  $(SDK_ROOT)/external/protothreads/pt-1.4/ \
  $(SDK_ROOT)/external/segger_rtt \
  $(SDK_ROOT)/external/thedotfactory_fonts \
  \
  $(SDK_ROOT)/integration/nrfx \
  $(SDK_ROOT)/integration/nrfx/legacy \
  \
  $(SDK_ROOT)/modules/nrfx \
  $(SDK_ROOT)/modules/nrfx/drivers/include \
  $(SDK_ROOT)/modules/nrfx/hal \
  $(SDK_ROOT)/modules/nrfx/mdk \
  \
  $(PROJ_DIR) \
  $(PROJ_DIR)/../config \
  $(PROJ_DIR)/../config/bootloader \


# Libraries common to all targets
LIB_FILES += \
  $(SDK_ROOT)/external/micro-ecc/nrf52hf_armgcc/armgcc/micro_ecc_lib_nrf52.a \

# Optimization flags
OPT = -Os -g3
# Uncomment the line below to enable link time optimization
#OPT += -flto

# C flags common to all targets
CFLAGS += $(OPT)
CFLAGS += -DBOARD_CUSTOM
CFLAGS += -DCONFIG_NFCT_PINS_AS_GPIOS
CFLAGS += -DFLOAT_ABI_HARD
CFLAGS += -DNRF52840_XXAA
CFLAGS += -DNRF_DFU_DEBUG_VERSION
CFLAGS += -DNRF_DFU_SETTINGS_VERSION=1
CFLAGS += -DSVC_INTERFACE_CALL_AS_NORMAL_FUNCTION
CFLAGS += -DuECC_ENABLE_VLI_API=0
CFLAGS += -DuECC_OPTIMIZATION_LEVEL=3
CFLAGS += -DuECC_SQUARE_FUNC=0
CFLAGS += -DuECC_SUPPORT_COMPRESSED_POINT=0
CFLAGS += -DuECC_VLI_NATIVE_LITTLE_ENDIAN=1
CFLAGS += -mcpu=cortex-m4
CFLAGS += -mthumb -mabi=aapcs
CFLAGS += -Wall -Werror -O3 -g3 -Wno-unused-variable -Wformat=0
CFLAGS += -mfloat-abi=hard -mfpu=fpv4-sp-d16
# keep every function in a separate section, this allows linker to discard unused ones
CFLAGS += -ffunction-sections -fdata-sections -fno-strict-aliasing
CFLAGS += -fno-builtin -fshort-enums -flto

# C++ flags common to all targets
CXXFLAGS += $(OPT)

# Assembler flags common to all targets
ASMFLAGS += -g3
ASMFLAGS += -mcpu=cortex-m4
ASMFLAGS += -mthumb -mabi=aapcs
ASMFLAGS += -mfloat-abi=hard -mfpu=fpv4-sp-d16
ASMFLAGS += -DBOARD_CUSTOM
ASMFLAGS += -DCONFIG_NFCT_PINS_AS_GPIOS
ASMFLAGS += -DFLOAT_ABI_HARD
ASMFLAGS += -DNRF52840_XXAA
ASMFLAGS += -DNRF_DFU_DEBUG_VERSION
ASMFLAGS += -DNRF_DFU_SETTINGS_VERSION=1
ASMFLAGS += -DSVC_INTERFACE_CALL_AS_NORMAL_FUNCTION
ASMFLAGS += -DuECC_ENABLE_VLI_API=0
ASMFLAGS += -DuECC_OPTIMIZATION_LEVEL=3
ASMFLAGS += -DuECC_SQUARE_FUNC=0
ASMFLAGS += -DuECC_SUPPORT_COMPRESSED_POINT=0
ASMFLAGS += -DuECC_VLI_NATIVE_LITTLE_ENDIAN=1

# Linker flags
LDFLAGS += $(OPT)
LDFLAGS += -mthumb -mabi=aapcs -L$(SDK_ROOT)/modules/nrfx/mdk -T$(LINKER_SCRIPT)
LDFLAGS += -mcpu=cortex-m4
LDFLAGS += -mfloat-abi=hard -mfpu=fpv4-sp-d16
# let linker dump unused sections
LDFLAGS += -Wl,--gc-sections
# use newlib in nano version
LDFLAGS += --specs=nano.specs

nrf52840_xxaa_mbr: CFLAGS += -D__HEAP_SIZE=0
nrf52840_xxaa_mbr: ASMFLAGS += -D__HEAP_SIZE=0

# Add standard libraries at the very end of the linker input, after all objects
# that may need symbols provided by these libraries.
LIB_FILES += -lc -lnosys -lm


.PHONY: default help

# Default target - first one defined
default: bootloader

# Print all targets that can be built
help:
	@echo following targets are available:
	@echo		bootloader
	@echo		flash_mbr
	@echo		sdk_config - starting external tool for editing sdk_config.h
	@echo		flash      - flashing binary

TEMPLATE_PATH := $(SDK_ROOT)/components/toolchain/gcc


include $(TEMPLATE_PATH)/Makefile.common

$(foreach target, $(TARGETS), $(call define_target, $(target)))

.PHONY: flash flash_mbr erase

# Flash the program
flash: $(OUTPUT_DIRECTORY)/bootloader.hex
	@echo Flashing: $<
	$(NRFJPROG) -f nrf52 --program $< --sectorerase
	$(NRFJPROG) -f nrf52 --reset

# Flash softdevice
flash_mbr:
	@echo Flashing: mbr_nrf52_2.2.2_mbr.hex
	$(NRFJPROG) -f nrf52 --program $(SDK_ROOT)/components/softdevice/mbr/nrf52840/hex/mbr_nrf52_2.3.0_mbr.hex --sectorerase
	$(NRFJPROG) -f nrf52 --reset

erase:
	$(NRFJPROG) -f nrf52 --eraseall

SDK_CONFIG_FILE := ./config/sdk_config.h
CMSIS_CONFIG_TOOL := $(SDK_ROOT)/external_tools/cmsisconfig/CMSIS_Configuration_Wizard.jar
sdk_config:
	java -jar $(CMSIS_CONFIG_TOOL) $(SDK_CONFIG_FILE)
