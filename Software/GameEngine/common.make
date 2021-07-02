# Toolchain definitions
TOOLCHAIN ?= arm-none-eabi-
CC := $(TOOLCHAIN)gcc
AR := $(TOOLCHAIN)ar
OBJCOPY := $(TOOLCHAIN)objcopy

ifndef DESKTOP
	SIZE := $(TOOLCHAIN)size
endif

ifdef WEB
	CC := emcc
endif

# Optimization flags
OPT ?= -Os -g3

ifndef DESKTOP
# Hardware flags
# -mabi=aapcs -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16 -mthumb
DEVICE_FLAGS = -mabi=aapcs \
	-mcpu=cortex-m4 \
	-mfloat-abi=hard \
	-mfpu=fpv4-sp-d16 \
	-mthumb
endif

# Common flags
FLAGS = -DBOARD_CUSTOM \
	-DCONFIG_NFCT_PINS_AS_GPIOS \
	-DFLOAT_ABI_HARD \
	-DNRF52840_XXAA \
	-DNRF_SD_BLE_API_VERSION=6 \
	-DS140 \
	-DSOFTDEVICE_PRESENT \
	-DSWI_DISABLE0

ifdef DESKTOP
	ifeq ($(OS),Windows_NT)
		# Placeholder
	else
		FLAGS += $(shell pkg-config --cflags-only-other sdl2)
	endif
endif

# C flags common to all targets
CFLAGS = $(OPT) \
	$(FLAGS) \
	$(DEVICE_FLAGS) \
	-DDEBUG \
	-DSTLVECTOR \
	-Wall \
	-Wformat=0 \
	-Wno-unknown-pragmas \
	-Wno-unused-function \
	-Wno-unused-local-typedefs \
	-Wno-unused-variable \
	-fdata-sections \
	-ffunction-sections \
	-fno-builtin \
	-fno-strict-aliasing

ifndef DESKTOP
CFLAGS += -DDC801_EMBEDDED --short-enums

# C++ flags common to all targets
CXXFLAGS = -felide-constructors \
	-fno-exceptions \
	-fno-rtti \
	-Wno-register
else
CFLAGS += -DDC801_DESKTOP -fno-short-enums -D_DEFAULT_SOURCE
endif

CXXFLAGS += -Wno-register

# Assembler flags common to all targets
ASMFLAGS = -g3 \
	$(FLAGS) \
	$(DEVICE_FLAGS)

# Linker flags
LDFLAGS = $(OPT) \
	$(DEVICE_FLAGS) \
	-Wl,--gc-sections

ifndef DESKTOP
LDFLAGS += --specs=nano.specs \
	-L$(SDK_ROOT)/modules/nrfx/mdk \
	-T$(LINKER_SCRIPT)
endif

LD_LIBRARIES = -lc \
	-lm \
	-lstdc++

ifndef DESKTOP
	LD_LIBRARIES += -lnosys
else
	ifeq ($(OS),Windows_NT)
		# Placeholder
	else
		ifdef WEB
			LD_LIBRARIES += \
				-s USE_SDL=2 \
				-s USE_SDL_IMAGE=2 \
				-s SDL2_IMAGE_FORMATS='["png"]' \
				--embed-file ../../SD_Card@/ \
				-s DISABLE_DEPRECATED_FIND_EVENT_TARGET_BEHAVIOR
		else
			LD_LIBRARIES += $(shell pkg-config --libs SDL2_image)
		endif
	endif
endif

CFLAGS += -D__HEAP_SIZE=16384
CFLAGS += -D__STACK_SIZE=16384
ASMFLAGS += -D__HEAP_SIZE=16384
ASMFLAGS += -D__STACK_SIZE=16384

CFLAGS += $(TEST_DEFINES)

ifdef WEB
	CFLAGS += -s USE_SDL=2 -s USE_SDL_IMAGE=2 -s SDL2_IMAGE_FORMATS='["png"]'
endif

# GCC Dependency flags:
#  -MD:		Generate dependency tree for specified object as a side effect of compilation
#  -MP:		Add a phony target for generated dependency files.
#			This helps make track changes to header files
#  -MF:		Override default dependency file name
#  -MT:		Override default dependency graph configuration

# Make will automatically integrate these dependency files and only rebuild source files that are
#  newer than their dependency files. If a header file changes, make will scan the dependency tree
#  and rebuild anything in the dependency tree (usually almost everything)

# C files
$(BUILD_DIR)/%.o: $(SRC_ROOT)/%.c
	@echo "[ CC ] $(notdir $<)"

ifeq ($(OS),Windows_NT)
	@if not exist $(subst /,\,$(@D)) $(MKDIR) $(subst /,\,$(@D))
else
	@$(MKDIR) $(@D)
endif

	@$(CC) -x c -c \
		-std=c11 \
		$(CFLAGS) \
		$(WEB_SDL) \
		$(INCLUDES) \
		-MD -MP -MF "$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -o "$@" "$<" \

# C++ files
$(BUILD_DIR)/%.o: $(SRC_ROOT)/%.cpp
	@echo "[ CXX ] $(notdir $<)"

ifeq ($(OS),Windows_NT)
	@if not exist $(subst /,\,$(@D)) $(MKDIR) $(subst /,\,$(@D))
else
	@$(MKDIR) $(@D)
endif

	@$(CC) -x c++ -c -std=c++17 $(CFLAGS) $(CXXFLAGS) $(INCLUDES) -MD -MP -MF "$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -o "$@" "$<"

# ASM files
$(BUILD_DIR)/%.o: $(SRC_ROOT)/%.S
	@echo "[ AS ] $(notdir $<)"

ifeq ($(OS),Windows_NT)
	@if not exist $(subst /,\,$(@D)) $(MKDIR) $(subst /,\,$(@D))
else
	@$(MKDIR) $(@D)
endif

	@$(CC) -x assembler-with-cpp -c $(ASMFLAGS) -MD -MP -MF "$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -o "$@" "$<"

ifndef DESKTOP
# Intel format Hex files
$(PRJ_ROOT)/output/%.hex: $(PRJ_ROOT)/output/%.out
	@echo "[ HEX ] $(notdir $@)"
	@$(OBJCOPY) -O ihex "$<" "$@"
endif

# Output binary
$(PRJ_ROOT)/output/%.bin: $(PRJ_ROOT)/output/%.out
	@echo "[ BIN ] $(notdir $@)"
ifndef WEB
	@$(OBJCOPY) -O binary "$<" "$@"
endif

# ---------- Test ----------
# C++ files
$(BUILD_DIR)/%.o: $(TEST_ROOT)/%.cpp
	@echo "[ CXX ] $(notdir $<)"

ifeq ($(OS),Windows_NT)
	@if not exist $(subst /,\,$(@D)) $(MKDIR) $(subst /,\,$(@D))
else
	@$(MKDIR) $(@D)
endif

	@$(CC) -x c++ -c -std=c++17 $(CFLAGS) $(CXXFLAGS) $(INCLUDES) -MD -MP -MF "$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -o "$@" "$<"