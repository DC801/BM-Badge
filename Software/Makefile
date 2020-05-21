ifeq ($(OS),Windows_NT)
    PRJ_ROOT ?= $(CURDIR)
	MKDIR := mkdir 2> NUL

    NRFJPROG := "C:/Program Files/Nordic Semiconductor/nrf-command-line-tools/bin/nrfjprog.exe"
    MERGEHEX := "C:/Program Files/Nordic Semiconductor/nrf-command-line-tools/bin/mergehex.exe"
else
    UNAME_S := $(shell uname -s)
	PRJ_ROOT ?= $(shell pwd)
	MKDIR := mkdir -p

    ifeq ($(UNAME_S),Linux)
        NRFJPROG := /usr/bin/nrfjprog
        MERGEHEX := /usr/bin/mergehex
    endif

    ifeq ($(UNAME_S),Darwin)
        NRFJPROG := $(PRJ_ROOT)/nrfjprog/nrfjprog
        MERGEHEX := $(PRJ_ROOT)/mergehex/mergehex
    endif
endif

SDK_ROOT ?= $(PRJ_ROOT)/../../nordic-sdk15.3.0
TARGET := $(PRJ_ROOT)/output/dc28_badge
BUILD_DIR ?= $(PRJ_ROOT)/build

UF2CONV :=$(PRJ_ROOT)/tools/uf2conv.py

SOFTDEVICE ?= $(SDK_ROOT)/components/softdevice/s140/hex/s140_nrf52_6.1.1_softdevice.hex

CONFIG_INCLUDE := -I$(PRJ_ROOT)/config

# Here we are providing SDK_TARGET as well as SDK_INCLUDES so we know wether to link against
#  the SDK library/headers, or the Desktop shim.
ifdef DESKTOP
include $(PRJ_ROOT)/sdk/shim.make
SDK_INCLUDES = -I$(PRJ_ROOT)/sdk/shim
else
include $(PRJ_ROOT)/sdk/sdk.make
endif

SDK_TARGET := $(PRJ_ROOT)/sdk/output/$(notdir $(SDK_TARGET))

# Defines used from this file:
#  SRC_ROOT:		Source file top-level directory for recipe glob matching
#  APP_INCLUDES:	List of all include directories (prefixed by -I)
#  LINKER_SCRIPT:	Path to the linker script
include $(PRJ_ROOT)/src/app.make

# Maintain directory tree, but place objects (and dependency files) in our source tree
APP_OBJS := $(subst $(SRC_ROOT), $(BUILD_DIR), $(addsuffix .o, $(basename $(APP_SRCS))))

# List all include directories
INCLUDES := $(CONFIG_INCLUDE) \
	$(APP_INCLUDES) \
	$(SDK_INCLUDES)

# Contains generic recipies, as well as all toolchain-related definitions
# Required definitions:
#  INCLUDES:		List of all include directories
#  BUILD_DIR:		Top-level build directory to place output object tree
#  SRC_ROOT:		Top-level source tree directory
#  LINKER_SCRIPT:	Used in LD_FLAGS when linking embedded binaries
include common.make

.PHONY: $(TARGET) flash flash-merged flash-dap erase recover merge uf2 clean cleanall sdk_config

# Generate a phony for $(TARGET) to build output files
$(TARGET): $(TARGET).out $(TARGET).hex $(TARGET).bin

# Ensure SDK is built
$(SDK_TARGET):
	@$(MAKE) -C sdk

# Link ELF
$(TARGET).out: $(APP_OBJS) $(SDK_TARGET)
	@echo "[ LD ] $(notdir $@)"

ifeq ($(OS),Windows_NT)
	@if not exist $(subst /,\,$(@D)) $(MKDIR) $(subst /,\,$(@D))
else
	@$(MKDIR) $(@D)
endif

	@$(CC) $(LDFLAGS) -Wl,-Map=$(@:.out=.map) -o "$@" $^ $(LD_LIBRARIES) $(SDK_TARGET)

ifndef DESKTOP
	@$(SIZE) $@
endif

# Flash hex file using nrfjprog
flash: $(TARGET).hex
	@echo Flashing: $<
	$(NRFJPROG) --program $< -f nrf52 --sectorerase
	$(NRFJPROG) --reset -f nrf52

# Flash merged hex file using nrfjprog
flash-merged: merge
	@echo Flashing: $(TARGET).merged.hex
	$(NRFJPROG) --program $(TARGET).merged.hex -f nrf52 --sectorerase
	$(NRFJPROG) --reset -f nrf52

# Flash an ELF binary using a CMSIS DAP capable programmer (Atmel ICE)
#  In all likelihood this will not work since the badge relies on the
#  Softdevice. However, the ELF will know what address to place the
#  firmware (which is after the Softdevice) from the linker script,
#  so if the softdevice exists it may not be overwritten by openocd.
flash-dap: $(TARGET).out
	@echo Flashing: $<
	openocd -f $(PRJ_ROOT)/tools/openocd.cfg -c "program $< verify reset exit"

erase:
	$(NRFJPROG) --eraseall -f nrf52

recover:
	$(NRFJPROG) --recover -f nrf52

merge: $(TARGET).hex
	@echo "Merging Application and Softdevice"
	$(MERGEHEX) -m $(SOFTDEVICE) $< -o $(TARGET).merged.hex
	@$(SIZE) $<

uf2: merge
	@echo "Generating UF2 image"
	@python $(UF2CONV) $(TARGET).merged.hex -c -f 0xADA52840 -o $(TARGET).uf2

clean:
	@rm -rf $(BUILD_DIR) $(TARGET).out $(TARGET).map $(TARGET).hex $(TARGET).bin $(TARGET).merged.hex $(TARGET).uf2

cleanall: clean
	@$(MAKE) -C sdk clean
	@$(MAKE) -C sdk clean DESKTOP=1

SDK_CONFIG_FILE := config/sdk_config.h
CMSIS_CONFIG_TOOL := $(SDK_ROOT)/external_tools/cmsisconfig/CMSIS_Configuration_Wizard.jar
sdk_config:
	java -jar $(CMSIS_CONFIG_TOOL) $(SDK_CONFIG_FILE)
