ifeq ($(OS),Windows_NT)
    PRJ_ROOT ?= $(CURDIR)
	MKDIR := mkdir 2> NUL
else
	PRJ_ROOT ?= $(shell pwd)
	MKDIR := mkdir -p
endif


SDK_ROOT ?= $(PRJ_ROOT)/../../../nordic-sdk15.3.0
BUILD_DIR ?= $(PRJ_ROOT)/build

CONFIG_INCLUDE := -I$(PRJ_ROOT)/../config

# To build the Desktop shim, pass DESKTOP=1 to make

# Defines used from these files:
#  SDK_TARGET:		Library to build (libnordic-sdk.a | libnordic-shim.a)
#  SRC_ROOT:		Source file top-level directory for recipe glob matching
#  SDK_INCLUDES:	List of all include directories (prefixed by -I)
ifdef DESKTOP
include shim.make
else
include sdk.make
endif

# Maintain directory tree, but place objects (and dependency files) in our source tree
SDK_OBJS := $(subst $(SRC_ROOT), $(BUILD_DIR), $(addsuffix .o, $(basename $(SDK_SRCS))))

# List all include directories
INCLUDES := $(CONFIG_INCLUDE) \
	$(SDK_INCLUDES)

# Contains generic recipies, as well as all toolchain-related definitions
# Required definitions:
#  INCLUDES:		List of all include directories
#  BUILD_DIR:		Top-level build directory to place output object tree
#  SRC_ROOT:		Top-level source tree directory
#  LINKER_SCRIPT:	Used in LD_FLAGS when linking embedded binaries
include ../common.make

.PHONY: clean

$(SDK_TARGET): $(SDK_OBJS)
	@echo "[ AR ] $(notdir $@)"

ifeq ($(OS),Windows_NT)
	@if not exist $(subst /,\,$(@D)) $(MKDIR) $(subst /,\,$(@D))
else
	@$(MKDIR) $(@D)
endif

	@$(AR) -rcs "$@" $^

clean:
	@rm -rf $(BUILD_DIR) $(SDK_TARGET)