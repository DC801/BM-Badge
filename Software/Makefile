PROJECT_NAME     := dc27_badge
TARGETS          := dc27_badge
OUTPUT_DIRECTORY := _build
BOOTLOADER       := bootloader/_build/bootloader.hex

GNU_INSTALL_ROOT :=

SDK_ROOT := ../../nordic-sdk16.0
PROJ_DIR := $(CURDIR)
PYTHON3 := $(shell which python 2>/dev/null)
UF2CONV :=$(PROJ_DIR)/uf2conv.py
ifeq ($(OS),Windows_NT)
	NRFJPROG := C:/Program\ Files/Nordic\ Semiconductor/nrf-command-line-tools/bin/nrfjprog.exe
	MERGEHEX := C:/Program\ Files/Nordic\ Semiconductor/nrf-command-line-tools/bin/mergehex.exe
else
  UNAME_S := $(shell uname -s)
  ifeq ($(UNAME_S),Linux)
      NRFJPROG := /usr/bin/nrfjprog
      MERGEHEX := /usr/bin/mergehex
    endif
    ifeq ($(UNAME_S),Darwin)
        NRFJPROG := $(HOME)/dev/bin/nrfjprog/nrfjprog
        MERGEHEX := $(HOME)/dev/bin/mergehex/mergehex
    endif
endif

SOFTDEVICE       := $(SDK_ROOT)/components/softdevice/s140/hex/s140_nrf52_6.1.1_softdevice.hex
MBR              := $(SDK_ROOT)/components/softdevice/mbr/nrf52840/hexmbr_nrf52_2.4.1_mbr.hex

$(OUTPUT_DIRECTORY)/dc27_badge.out:
  LINKER_SCRIPT  := dc27_badge_gcc_nrf52.ld

PRETTY := 1
VERBOSE := 0

# Source files common to all targets
SRC_FILES += \
  $(SDK_ROOT)/components/boards/boards.c \
  $(SDK_ROOT)/components/ble/ble_advertising/ble_advertising.c \
  $(SDK_ROOT)/components/ble/ble_db_discovery/ble_db_discovery.c \
  $(SDK_ROOT)/components/ble/ble_services/ble_lbs/ble_lbs.c \
  $(SDK_ROOT)/components/ble/common/ble_advdata.c \
  $(SDK_ROOT)/components/ble/common/ble_conn_params.c \
  $(SDK_ROOT)/components/ble/common/ble_conn_state.c \
  $(SDK_ROOT)/components/ble/common/ble_srv_common.c \
  $(SDK_ROOT)/components/ble/nrf_ble_gatt/nrf_ble_gatt.c \
  $(SDK_ROOT)/components/ble/nrf_ble_qwr/nrf_ble_qwr.c \
  $(SDK_ROOT)/components/ble/peer_manager/gatt_cache_manager.c \
  $(SDK_ROOT)/components/ble/peer_manager/gatts_cache_manager.c \
  $(SDK_ROOT)/components/ble/peer_manager/id_manager.c \
  $(SDK_ROOT)/components/ble/peer_manager/peer_data_storage.c \
  $(SDK_ROOT)/components/ble/peer_manager/peer_database.c \
  $(SDK_ROOT)/components/ble/peer_manager/peer_id.c \
  $(SDK_ROOT)/components/ble/peer_manager/peer_manager.c \
  $(SDK_ROOT)/components/ble/peer_manager/pm_buffer.c \
  $(SDK_ROOT)/components/ble/peer_manager/security_dispatcher.c \
  $(SDK_ROOT)/components/ble/peer_manager/security_manager.c \
  $(SDK_ROOT)/components/ble/peer_manager/peer_manager.c \
  $(SDK_ROOT)/components/ble/nrf_ble_gatt/nrf_ble_gatt.c \
  $(SDK_ROOT)/components/ble/peer_manager/peer_manager.c \
  $(SDK_ROOT)/components/ble/nrf_ble_gatt/nrf_ble_gatt.c \
  \
  $(SDK_ROOT)/components/softdevice/common/nrf_sdh.c \
  $(SDK_ROOT)/components/softdevice/common/nrf_sdh_ble.c \
  $(SDK_ROOT)/components/softdevice/common/nrf_sdh_soc.c \
  \
  $(SDK_ROOT)/components/libraries/atomic/nrf_atomic.c \
  $(SDK_ROOT)/components/libraries/pwm/app_pwm.c \
  $(SDK_ROOT)/components/libraries/atomic_fifo/nrf_atfifo.c \
  $(SDK_ROOT)/components/libraries/atomic_flags/nrf_atflags.c \
  $(SDK_ROOT)/components/libraries/balloc/nrf_balloc.c \
  $(SDK_ROOT)/components/libraries/block_dev/sdc/nrf_block_dev_sdc.c \
  $(SDK_ROOT)/components/libraries/bsp/bsp.c \
  $(SDK_ROOT)/components/libraries/button/app_button.c \
  $(SDK_ROOT)/components/libraries/log/src/nrf_log_backend_rtt.c \
  $(SDK_ROOT)/components/libraries/log/src/nrf_log_backend_serial.c \
  $(SDK_ROOT)/components/libraries/log/src/nrf_log_backend_uart.c \
  $(SDK_ROOT)/components/libraries/log/src/nrf_log_default_backends.c \
  $(SDK_ROOT)/components/libraries/log/src/nrf_log_frontend.c \
  $(SDK_ROOT)/components/libraries/log/src/nrf_log_str_formatter.c \
  $(SDK_ROOT)/components/libraries/memobj/nrf_memobj.c \
  $(SDK_ROOT)/components/libraries/experimental_section_vars/nrf_section_iter.c \
  $(SDK_ROOT)/components/libraries/fds/fds.c \
  $(SDK_ROOT)/components/libraries/fifo/app_fifo.c \
  $(SDK_ROOT)/components/libraries/fstorage/nrf_fstorage.c \
  $(SDK_ROOT)/components/libraries/fstorage/nrf_fstorage_sd.c \
  $(SDK_ROOT)/components/libraries/hardfault/hardfault_implementation.c \
  $(SDK_ROOT)/components/libraries/pwr_mgmt/nrf_pwr_mgmt.c \
  $(SDK_ROOT)/components/libraries/queue/nrf_queue.c \
  $(SDK_ROOT)/components/libraries/ringbuf/nrf_ringbuf.c \
  $(SDK_ROOT)/components/libraries/sdcard/app_sdcard.c \
  $(SDK_ROOT)/components/libraries/scheduler/app_scheduler.c \
  $(SDK_ROOT)/components/libraries/strerror/nrf_strerror.c \
  $(SDK_ROOT)/components/libraries/timer/app_timer.c \
  $(SDK_ROOT)/components/libraries/uart/app_uart_fifo.c \
  $(SDK_ROOT)/components/libraries/uart/retarget.c \
  $(SDK_ROOT)/components/libraries/util/app_error.c \
  $(SDK_ROOT)/components/libraries/util/app_error_handler_gcc.c \
  $(SDK_ROOT)/components/libraries/util/app_error_weak.c \
  $(SDK_ROOT)/components/libraries/util/app_util_platform.c \
  $(SDK_ROOT)/components/libraries/util/nrf_assert.c \
  $(SDK_ROOT)/components/libraries/usbd/app_usbd.c \
  $(SDK_ROOT)/components/libraries/usbd/class/cdc/acm/app_usbd_cdc_acm.c \
  $(SDK_ROOT)/components/libraries/usbd/app_usbd_core.c \
  $(SDK_ROOT)/components/libraries/usbd/app_usbd_serial_num.c \
  $(SDK_ROOT)/components/libraries/usbd/app_usbd_string_desc.c \
  \
  $(SDK_ROOT)/external/fatfs/port/diskio_blkdev.c \
  $(SDK_ROOT)/external/fatfs/src/ff.c \
  $(SDK_ROOT)/external/fprintf/nrf_fprintf.c \
  $(SDK_ROOT)/external/fprintf/nrf_fprintf_format.c \
  $(SDK_ROOT)/external/segger_rtt/SEGGER_RTT.c \
  $(SDK_ROOT)/external/segger_rtt/SEGGER_RTT_printf.c \
  $(SDK_ROOT)/external/segger_rtt/SEGGER_RTT_Syscalls_GCC.c \
  \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_clock.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_ppi.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_spi.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_uart.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_rng.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_twi.c \
  $(SDK_ROOT)/integration/nrfx/legacy/nrf_drv_power.c \
  \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_clock.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_gpiote.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_ppi.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_rng.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_saadc.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_spi.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_spim.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_timer.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_uart.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_uarte.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_usbd.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_power.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_systick.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_twi.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/nrfx_twim.c \
  $(SDK_ROOT)/modules/nrfx/drivers/src/prs/nrfx_prs.c \
  \
  $(SDK_ROOT)/modules/nrfx/soc/nrfx_atomic.c \
  \
  $(SDK_ROOT)/modules/nrfx/mdk/gcc_startup_nrf52840.S \
  $(SDK_ROOT)/modules/nrfx/mdk/system_nrf52840.c \
  \
  $(PROJ_DIR)/utility.c \
  $(PROJ_DIR)/menu.c \
  $(PROJ_DIR)/user.c \
  $(PROJ_DIR)/nearby.c \
  $(PROJ_DIR)/extras.c \
  $(PROJ_DIR)/godmode.c \
  $(PROJ_DIR)/modules/drv_st7735.c \
  $(PROJ_DIR)/modules/gfx.c \
  $(PROJ_DIR)/modules/sd.c \
  $(PROJ_DIR)/modules/ble.c \
  $(PROJ_DIR)/modules/adc.c \
  $(PROJ_DIR)/modules/uart.c \
  $(PROJ_DIR)/modules/led.c \
  $(PROJ_DIR)/modules/i2c.c \
  $(PROJ_DIR)/modules/rc4.c \
  $(PROJ_DIR)/modules/usb.c \
  $(PROJ_DIR)/games/Space_Invaders.cpp \
  $(PROJ_DIR)/games/Snake.c \
  $(PROJ_DIR)/games/PipsTheET.c \
  $(PROJ_DIR)/games/Tic-Tac-Toe.c \
  $(PROJ_DIR)/games/Wargames.c \
  $(PROJ_DIR)/games/hcrn/Arcade.cpp \
  $(PROJ_DIR)/games/hcrn/Boss.cpp \
  $(PROJ_DIR)/games/hcrn/FrameBuffer.cpp \
  $(PROJ_DIR)/games/hcrn/GameEngine.cpp \
  $(PROJ_DIR)/games/hcrn/Pickup.cpp \
  $(PROJ_DIR)/games/hcrn/Laser.cpp \
  $(PROJ_DIR)/games/hcrn/Marine.cpp \
  $(PROJ_DIR)/games/hcrn/NPC.cpp \
  $(PROJ_DIR)/games/hcrn/Obstacle.cpp \
  $(PROJ_DIR)/games/hcrn/Overlays.cpp \
  $(PROJ_DIR)/games/hcrn/Player.cpp \
  $(PROJ_DIR)/games/hcrn/Projectile.cpp \
  $(PROJ_DIR)/games/hcrn/Robot.cpp \
  $(PROJ_DIR)/games/hcrn/Room.cpp \
  $(PROJ_DIR)/games/hcrn/Scout.cpp \
  $(PROJ_DIR)/games/hcrn/Spider.cpp \
  $(PROJ_DIR)/games/hcrn/Terminal.cpp \
  $(PROJ_DIR)/games/hcrn/TNT.cpp \
  $(PROJ_DIR)/games/hcrn/Turret.cpp \
  $(PROJ_DIR)/games/hcrn/Sprite.cpp \
  $(PROJ_DIR)/games/hcrn/Zombie.cpp \
  $(PROJ_DIR)/games/hcrn/hcrn.cpp \
  $(PROJ_DIR)/games/serial.c \
  $(PROJ_DIR)/main.c \
#   $(PROJ_DIR)/games/galaga/galaga.cpp \
#   $(PROJ_DIR)/games/galaga/Engine/GalagaGameEngine.cpp \
#   $(PROJ_DIR)/games/galaga/Objects/RenderedObjects.cpp \
#   $(PROJ_DIR)/games/galaga/Communication/CheckInput.cpp \
#   $(PROJ_DIR)/games/galaga/Communication/Actions/LeftClick.cpp \
#   $(PROJ_DIR)/games/galaga/Communication/Actions/RightClick.cpp \
#   $(PROJ_DIR)/games/galaga/Objects/ObjectActions/MoveableCharacter.cpp \
#   $(PROJ_DIR)/games/galaga/Objects/renderableObjects/AlienGroup.cpp \



#  $(PROJ_DIR)/games/galaga/galaga.cpp \
#  $(PROJ_DIR)/games/galaga/shot.cpp \

# Include folders common to all targets
INC_FOLDERS += \
  $(SDK_ROOT)/components \
  $(SDK_ROOT)/components/ble/ble_advertising \
  $(SDK_ROOT)/components/ble/ble_dtm \
  $(SDK_ROOT)/components/ble/ble_racp \
  $(SDK_ROOT)/components/ble/ble_services/ble_ancs_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_ans_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_bas \
  $(SDK_ROOT)/components/ble/ble_services/ble_bas_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_cscs \
  $(SDK_ROOT)/components/ble/ble_services/ble_cts_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_dfu \
  $(SDK_ROOT)/components/ble/ble_services/ble_dis \
  $(SDK_ROOT)/components/ble/ble_services/ble_gls \
  $(SDK_ROOT)/components/ble/ble_services/ble_hids \
  $(SDK_ROOT)/components/ble/ble_services/ble_hrs \
  $(SDK_ROOT)/components/ble/ble_services/ble_hrs_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_hts \
  $(SDK_ROOT)/components/ble/ble_services/ble_ias \
  $(SDK_ROOT)/components/ble/ble_services/ble_ias_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_lbs \
  $(SDK_ROOT)/components/ble/ble_services/ble_lbs_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_lls \
  $(SDK_ROOT)/components/ble/ble_services/ble_nus \
  $(SDK_ROOT)/components/ble/ble_services/ble_nus_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_rscs \
  $(SDK_ROOT)/components/ble/ble_services/ble_rscs_c \
  $(SDK_ROOT)/components/ble/ble_services/ble_tps \
  $(SDK_ROOT)/components/ble/common \
  $(SDK_ROOT)/components/ble/nrf_ble_gatt \
  $(SDK_ROOT)/components/ble/nrf_ble_qwr \
  $(SDK_ROOT)/components/ble/peer_manager \
  $(SDK_ROOT)/components/boards \
  $(SDK_ROOT)/components/libraries/atomic \
  $(SDK_ROOT)/components/libraries/atomic_fifo \
  $(SDK_ROOT)/components/libraries/atomic_flags \
  $(SDK_ROOT)/components/libraries/balloc \
  $(SDK_ROOT)/components/libraries/block_dev \
  $(SDK_ROOT)/components/libraries/block_dev/sdc \
  $(SDK_ROOT)/components/libraries/bootloader/ble_dfu \
  $(SDK_ROOT)/components/libraries/bsp \
  $(SDK_ROOT)/components/libraries/button \
  $(SDK_ROOT)/components/libraries/cli \
  $(SDK_ROOT)/components/libraries/crc16 \
  $(SDK_ROOT)/components/libraries/crc32 \
  $(SDK_ROOT)/components/libraries/crypto \
  $(SDK_ROOT)/components/libraries/csense \
  $(SDK_ROOT)/components/libraries/csense_drv \
  $(SDK_ROOT)/components/libraries/delay \
  $(SDK_ROOT)/components/libraries/ecc \
  $(SDK_ROOT)/components/libraries/log \
  $(SDK_ROOT)/components/libraries/log/src \
  $(SDK_ROOT)/components/libraries/memobj \
  $(SDK_ROOT)/components/libraries/mpu \
  $(SDK_ROOT)/components/libraries/ringbuf \
  $(SDK_ROOT)/components/libraries/experimental_section_vars \
  $(SDK_ROOT)/components/libraries/stack_guard \
  $(SDK_ROOT)/components/libraries/experimental_task_manager \
  $(SDK_ROOT)/components/libraries/fds \
  $(SDK_ROOT)/components/libraries/fifo \
  $(SDK_ROOT)/components/libraries/fstorage \
  $(SDK_ROOT)/components/libraries/gfx \
  $(SDK_ROOT)/components/libraries/gpiote \
  $(SDK_ROOT)/components/libraries/hardfault \
  $(SDK_ROOT)/components/libraries/hci \
  $(SDK_ROOT)/components/libraries/led_softblink \
  $(SDK_ROOT)/components/libraries/low_power_pwm \
  $(SDK_ROOT)/components/libraries/mem_manager \
  $(SDK_ROOT)/components/libraries/mutex \
  $(SDK_ROOT)/components/libraries/pwm \
  $(SDK_ROOT)/components/libraries/pwr_mgmt \
  $(SDK_ROOT)/components/libraries/queue \
  $(SDK_ROOT)/components/libraries/scheduler \
  $(SDK_ROOT)/components/libraries/sdcard \
  $(SDK_ROOT)/components/libraries/slip \
  $(SDK_ROOT)/components/libraries/sortlist \
  $(SDK_ROOT)/components/libraries/spi_mngr \
  $(SDK_ROOT)/components/libraries/strerror \
  $(SDK_ROOT)/components/libraries/timer \
  $(SDK_ROOT)/components/libraries/twi_mngr \
  $(SDK_ROOT)/components/libraries/twi_sensor \
  $(SDK_ROOT)/components/libraries/uart \
  $(SDK_ROOT)/components/libraries/usbd \
  $(SDK_ROOT)/components/libraries/usbd/class/audio \
  $(SDK_ROOT)/components/libraries/usbd/class/cdc \
  $(SDK_ROOT)/components/libraries/usbd/class/cdc/acm \
  $(SDK_ROOT)/components/libraries/usbd/class/hid \
  $(SDK_ROOT)/components/libraries/usbd/class/hid/generic \
  $(SDK_ROOT)/components/libraries/usbd/class/hid/kbd \
  $(SDK_ROOT)/components/libraries/usbd/class/hid/mouse \
  $(SDK_ROOT)/components/libraries/usbd/class/msc \
  $(SDK_ROOT)/components/libraries/util \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/ac_rec \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/ble_oob_advdata \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/ble_pair_lib \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/ble_pair_msg \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/common \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/ep_oob_rec \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/hs_rec \
  $(SDK_ROOT)/components/nfc/ndef/connection_handover/le_oob_rec \
  $(SDK_ROOT)/components/nfc/ndef/conn_hand_parser \
  $(SDK_ROOT)/components/nfc/ndef/conn_hand_parser/ac_rec_parser \
  $(SDK_ROOT)/components/nfc/ndef/conn_hand_parser/ble_oob_advdata_parser \
  $(SDK_ROOT)/components/nfc/ndef/conn_hand_parser/le_oob_rec_parser \
  $(SDK_ROOT)/components/nfc/ndef/generic/message \
  $(SDK_ROOT)/components/nfc/ndef/generic/record \
  $(SDK_ROOT)/components/nfc/ndef/launchapp \
  $(SDK_ROOT)/components/nfc/ndef/parser/message \
  $(SDK_ROOT)/components/nfc/ndef/parser/record \
  $(SDK_ROOT)/components/nfc/ndef/text \
  $(SDK_ROOT)/components/nfc/ndef/uri \
  $(SDK_ROOT)/components/nfc/t2t_lib \
  $(SDK_ROOT)/components/nfc/t2t_parser \
  $(SDK_ROOT)/components/nfc/t4t_lib \
  $(SDK_ROOT)/components/nfc/t4t_parser/apdu \
  $(SDK_ROOT)/components/nfc/t4t_parser/cc_file \
  $(SDK_ROOT)/components/nfc/t4t_parser/hl_detection_procedure \
  $(SDK_ROOT)/components/nfc/t4t_parser/tlv \
  $(SDK_ROOT)/components/softdevice/common \
  $(SDK_ROOT)/components/softdevice/s140/headers \
  $(SDK_ROOT)/components/softdevice/s140/headers/nrf52 \
  $(SDK_ROOT)/components/toolchain/cmsis/include \
  \
  $(SDK_ROOT)/external/protothreads \
  $(SDK_ROOT)/external/protothreads/pt-1.4/ \
  $(SDK_ROOT)/external/fatfs/port/ \
  $(SDK_ROOT)/external/fatfs/src \
  $(SDK_ROOT)/external/fprintf \
  $(SDK_ROOT)/external/segger_rtt \
  $(SDK_ROOT)/external/utf_converter \
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
  $(PROJ_DIR)/config \
  $(PROJ_DIR)/config/app \


# Libraries common to all targets
LIB_FILES +=

# Optimization flags
OPT = -O0 -g3 -DSTLVECTOR
# Uncomment the line below to enable link time optimization
#OPT += -flto


# C flags common to all targets
CFLAGS += $(OPT)
CFLAGS += -DBOARD_CUSTOM
CFLAGS += -DCONFIG_NFCT_PINS_AS_GPIOS
CFLAGS += -DFLOAT_ABI_HARD
CFLAGS += -DNRF52840_XXAA
CFLAGS += -DNRF_SD_BLE_API_VERSION=6
CFLAGS += -DS140
CFLAGS += -DDEBUG
CFLAGS += -DSOFTDEVICE_PRESENT
CFLAGS += -DSWI_DISABLE0
CFLAGS += -mcpu=cortex-m4
CFLAGS += -mthumb -mabi=aapcs
CFLAGS += -Wall -Werror -Wno-unused-variable -Wformat=0 -Wno-unused-local-typedefs -Wno-unused-function
CFLAGS += -mfloat-abi=hard -mfpu=fpv4-sp-d16
# keep every function in separate section, this allows linker to discard unused ones
CFLAGS += -ffunction-sections -fdata-sections -fno-strict-aliasing
CFLAGS += -fno-builtin --short-enums -Wno-unknown-pragmas

# C++ flags common to all targets
CXXFLAGS += $(OPT) -std=c++0x -felide-constructors -fno-exceptions -fno-rtti

# Assembler flags common to all targets
ASMFLAGS += -g3
ASMFLAGS += -mcpu=cortex-m4
ASMFLAGS += -mthumb -mabi=aapcs
ASMFLAGS += -mfloat-abi=hard -mfpu=fpv4-sp-d16
ASMFLAGS += -DBOARD_CUSTOM
ASMFLAGS += -DCONFIG_NFCT_PINS_AS_GPIOS
ASMFLAGS += -DFLOAT_ABI_HARD
ASMFLAGS += -DNRF52840_XXAA
ASMFLAGS += -DNRF_SD_BLE_API_VERSION=6
ASMFLAGS += -DS140
ASMFLAGS += -DSOFTDEVICE_PRESENT
ASMFLAGS += -DSWI_DISABLE0


# Linker flags
LDFLAGS += $(OPT)
LDFLAGS += -mthumb -mabi=aapcs -L$(SDK_ROOT)/modules/nrfx/mdk -T$(LINKER_SCRIPT)
LDFLAGS += -mcpu=cortex-m4
LDFLAGS += -mfloat-abi=hard -mfpu=fpv4-sp-d16
# let linker to dump unused sections
LDFLAGS += -Wl,--gc-sections
# use newlib in nano version
LDFLAGS += --specs=nano.specs

nrf52840_xxaa: CFLAGS += -D__HEAP_SIZE=16384
nrf52840_xxaa: CFLAGS += -D__STACK_SIZE=16384
nrf52840_xxaa: ASMFLAGS += -D__HEAP_SIZE=16384
nrf52840_xxaa: ASMFLAGS += -D__STACK_SIZE=16384

# Add standard libraries at the very end of the linker input, after all objects
# that may need symbols provided by these libraries.
LIB_FILES += -lc -lnosys -lm -lsupc++ -lstdc++

.PHONY: $(TARGETS) default all clean flash bootloader

# Default target - first one defined
default: dc27_badge

TEMPLATE_PATH := $(SDK_ROOT)/components/toolchain/gcc

include $(TEMPLATE_PATH)/Makefile.common

$(foreach target, $(TARGETS), $(call define_target, $(target)))

# Flash softdevice
flash_softdevice:
	@echo Flashing $(SOFTDEVICE)
	$(NRFJPROG) -f nrf52 --eraseall
	$(NRFJPROG) -f nrf52 --program $(SOFTDEVICE)
	$(NRFJPROG) -f nrf52 --reset

# Flash the program
flash: $(OUTPUT_DIRECTORY)/dc27_badge.hex
	@echo Flashing: $<
	$(NRFJPROG) --program $< -f nrf52 --sectorerase
	$(NRFJPROG) --reset -f nrf52

erase:
	$(NRFJPROG) --eraseall -f nrf52

recover:
	$(NRFJPROG) --recover -f nrf52

god: CFLAGS += -D GODMODE
god: dc27_badge
	@echo Compiling for GODMODE

debug: CFLAGS += -D DEBUGMODE
debug: dc27_badge
	@echo Compiling for DEBUGMODE

bootloader:
	@echo Building bootloader
	@cd bootloader && $(MAKE)

flash_bootloader:
	@echo Flashing bootloader
	@cd bootloader && $(MAKE) flash_bootloader

flash_mbr:
	@echo Flashing MBR
	@cd bootloader && $(MAKE) flash_mbr

merge_user: dc27_badge bootloader
	@echo Merging softdevice, bootloader and user hex
	@$(MERGEHEX) -m $(SOFTDEVICE) $(BOOTLOADER) $(OUTPUT_DIRECTORY)/dc27_badge.hex -o dc27_badge_merged_user.hex
	@$(SIZE) dc27_badge_merged_user.hex

flash_user: merge_user
	@echo Flashing: $<
	$(NRFJPROG) --program dc27_badge_merged_user.hex -f nrf52 --sectorerase
	$(NRFJPROG) --reset -f nrf52

merge_god: god bootloader
	@echo Merging softdevice, bootloader and user hex
	@$(MERGEHEX) -m $(SOFTDEVICE) $(BOOTLOADER) $(OUTPUT_DIRECTORY)/dc27_badge.hex -o dc27_badge_merged_god.hex
	@$(SIZE) dc27_badge_merged_user.hex

flash_god: merge_god
	@echo Flashing: $<
	$(NRFJPROG) --program dc27_badge_merged_god.hex -f nrf52 --sectorerase
	$(NRFJPROG) --reset -f nrf52

merge_debug: debug bootloader
	@echo Merging softdevice, bootloader and user hex
	@$(MERGEHEX) -m $(SOFTDEVICE) $(BOOTLOADER) $(OUTPUT_DIRECTORY)/dc27_badge.hex -o dc27_badge_merged_debug.hex
	@$(SIZE) dc27_badge_merged_user.hex

flash_debug: merge_debug
	@echo Flashing: $<
	$(NRFJPROG) --program dc27_badge_merged_debug.hex -f nrf52 --sectorerase
	$(NRFJPROG) --reset -f nrf52

uf2conv_debug: $(OUTPUT_DIRECTORY)/dc27_badge.hex
	@echo Building UF2 file: $<
	$(PYTHON3) $(UF2CONV) $< -c -f 0xADA52840 -o $(OUTPUT_DIRECTORY)/dc27_badge.uf2
	XCOPY C:\\Users\\labuser\\Desktop\\dc27-party-badge\\Software\\_build\\dc27_badge.uf2 E:\\

SDK_CONFIG_FILE := config/sdk_config.h
CMSIS_CONFIG_TOOL := $(SDK_ROOT)/external_tools/cmsisconfig/CMSIS_Configuration_Wizard.jar
sdk_config:
	java -jar $(CMSIS_CONFIG_TOOL) $(SDK_CONFIG_FILE)


